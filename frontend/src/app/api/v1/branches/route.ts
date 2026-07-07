import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import prisma from "@loukdo/backend/services/prisma"
import { getAllBranches, createBranch, getBranch } from "@loukdo/backend/services/branch"
import { createBranchSchema } from "@loukdo/backend/validators"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  // Public: branch lookup by code (used by branch login page before auth)
  if (code) {
    const branch = await prisma.branch.findUnique({ where: { code } })
    if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 })
    return NextResponse.json(branch)
  }

  // Protected: listing all branches requires ADMIN role
  const session = await auth()
  const user = session?.user as { role?: string } | undefined
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const branches = await getAllBranches()
  return NextResponse.json(branches)
}

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user as { role?: string } | undefined
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createBranchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  try {
    const result = await createBranch(parsed.data)
    return NextResponse.json(result, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create branch"
    return NextResponse.json({ error: message }, { status: 409 })
  }
}
