import prisma from "./prisma"

export async function getAllBranches() {
  return prisma.branch.findMany({ orderBy: { createdAt: "desc" } })
}

export async function createBranch(data: {
  name: string
  code: string
  url?: string
  adminName?: string
  adminEmail?: string
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED"
}) {
  return prisma.branch.create({ data })
}
