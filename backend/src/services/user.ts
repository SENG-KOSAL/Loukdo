import prisma from "./prisma"
import { hash } from "./password"

export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } })
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
