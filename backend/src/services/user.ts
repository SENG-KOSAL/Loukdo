import prisma from "./prisma"
import { hash } from "./password"

export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } })
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } })
}

export async function updateUserPassword(id: string, newPassword: string) {
  return prisma.user.update({
    where: { id },
    data: { password: hash(newPassword) },
  })
}

export async function createBranchAdmin(data: {
  branchId: string
  username: string
  password: string
}) {
  return prisma.user.create({
    data: {
      username: data.username,
      email: `${data.username}@${data.branchId.slice(0, 8)}.local`,
      password: hash(data.password),
      role: "BRANCH_ADMIN",
      branchId: data.branchId,
    },
  })
}

export async function getUsersByBranch(branchId: string) {
  return prisma.user.findMany({ where: { branchId } })
}

export async function getAllUsers() {
  return prisma.user.findMany({
    include: { branch: { select: { id: true, name: true, code: true } } },
    orderBy: { createdAt: "desc" },
  })
}
