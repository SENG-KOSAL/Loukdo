import prisma from "./prisma"
import { hash } from "./password"
import type { Role } from "../generated/prisma"

export type UserInput = {
  name?: string | null
  username: string
  email: string
  password: string
  role: Role
  branchId?: string | null
}

export type UserUpdateInput = {
  name?: string | null
  username?: string
  email?: string
  password?: string
  role?: Role
  branchId?: string | null
}

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
  return prisma.user.findMany({
    where: { branchId },
    include: { branch: { select: { id: true, name: true, code: true } } },
    orderBy: { createdAt: "desc" },
  })
}

export async function getAllUsers() {
  return prisma.user.findMany({
    include: { branch: { select: { id: true, name: true, code: true } } },
    orderBy: { createdAt: "desc" },
  })
}

export async function createUser(data: UserInput) {
  return prisma.user.create({
    data: {
      ...data,
      name: data.name || null,
      branchId: data.branchId || null,
      password: hash(data.password),
    },
    include: { branch: { select: { id: true, name: true, code: true } } },
  })
}

export async function updateUser(id: string, data: UserUpdateInput) {
  const { password, ...fields } = data
  return prisma.user.update({
    where: { id },
    data: {
      ...fields,
      ...(password ? { password: hash(password) } : {}),
    },
    include: { branch: { select: { id: true, name: true, code: true } } },
  })
}

export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } })
}
