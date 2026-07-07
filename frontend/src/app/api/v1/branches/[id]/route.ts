import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import { getAllBranches, getBranch, deleteBranch, duplicateBranch } from "@loukdo/backend/services/branch"
import type { Session } from "next-auth"

function isAdmin(session: Session | null): boolean {
  const user = session?.user as { role?: string } | undefined
  return !!user && user.role === "ADMIN"
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const branch = await getBranch(id)
  if (!branch) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(branch)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await deleteBranch(id)
  return NextResponse.json({ success: true })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  if (!body.name || !body.adminUsername || !body.adminPassword) {
    return NextResponse.json({ error: "name, adminUsername, and adminPassword are required" }, { status: 400 })
  }

  try {
    const result = await duplicateBranch(id, body)
    return NextResponse.json(result, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to duplicate branch"
    return NextResponse.json({ error: message }, { status: 409 })
  }
}
