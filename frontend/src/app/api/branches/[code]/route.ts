import { NextResponse } from "next/server"
import prisma from "@loukdo/backend/services/prisma"

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const branch = await prisma.branch.findUnique({ where: { code } })
  if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 })
  return NextResponse.json(branch)
}
