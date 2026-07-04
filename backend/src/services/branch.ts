import prisma from "./prisma"

export async function getAllBranches() {
  return prisma.branch.findMany({ orderBy: { createdAt: "desc" } })
}

export async function createBranch(data: { name: string; address?: string; phone?: string; code: string }) {
  return prisma.branch.create({ data })
}
