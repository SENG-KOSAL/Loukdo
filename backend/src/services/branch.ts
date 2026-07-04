import prisma from "./prisma"
import { createBranchAdmin } from "./user"

export async function getAllBranches() {
  return prisma.branch.findMany({
    include: { users: { where: { role: "ADMIN" }, select: { username: true, email: true } } },
    orderBy: { createdAt: "desc" },
  })
}

function generateCode(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 20) || `br-${Date.now()}`
}

export async function createBranch(data: {
  name: string
  code?: string
  url?: string
  adminUsername?: string
  adminPassword?: string
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED"
}) {
  const { adminUsername, adminPassword, ...branchData } = data
  const branch = await prisma.branch.create({
    data: { ...branchData, code: branchData.code || generateCode(branchData.name) },
  })

  let admin = null
  if (adminUsername && adminPassword) {
    admin = await createBranchAdmin({
      branchId: branch.id,
      username: adminUsername,
      password: adminPassword,
    })
  }

  return { ...branch, adminPassword: adminPassword ?? null, adminUsername: admin?.username ?? null }
}

export async function deleteBranch(id: string) {
  await prisma.sale.deleteMany({ where: { branchId: id } })
  await prisma.user.deleteMany({ where: { branchId: id } })
  await prisma.branch.delete({ where: { id } })
}

export async function getBranch(id: string) {
  return prisma.branch.findUnique({
    where: { id },
    include: { users: { select: { username: true, email: true, role: true } } },
  })
}

export async function duplicateBranch(id: string, data: { name: string; adminUsername: string; adminPassword: string }) {
  const original = await prisma.branch.findUnique({ where: { id } })
  if (!original) throw new Error("Branch not found")

  return createBranch({
    name: data.name,
    url: original.url ?? undefined,
    status: original.status,
    adminUsername: data.adminUsername,
    adminPassword: data.adminPassword,
  })
}
