import type { Role } from "../generated/prisma"

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN" as Role,
  BRANCH_ADMIN: "BRANCH_ADMIN" as Role,
  MANAGER: "MANAGER" as Role,
  CASHIER: "CASHIER" as Role,
} as const

const ROLE_LEVEL: Record<Role, number> = {
  SUPER_ADMIN: 4,
  BRANCH_ADMIN: 3,
  MANAGER: 2,
  CASHIER: 1,
}

export interface AccessUser {
  id?: string
  role?: string
  branchId?: string
}

export function hasRole(user: AccessUser | null | undefined, role: Role): boolean {
  return user?.role === role
}

export function hasAnyRole(user: AccessUser | null | undefined, ...roles: Role[]): boolean {
  if (!user?.role) return false
  return roles.includes(user.role as Role)
}

export function hasMinRole(user: AccessUser | null | undefined, minRole: Role): boolean {
  if (!user?.role) return false
  const level = ROLE_LEVEL[user.role as Role]
  if (!level) return false
  return level >= ROLE_LEVEL[minRole]
}

export function requireBranch(user: AccessUser | null | undefined): string | null {
  if (!user?.branchId) return null
  return user.branchId
}

export function canAccessBranch(user: AccessUser | null | undefined, targetBranchId: string): boolean {
  if (!user) return false
  if (user.role === ROLES.SUPER_ADMIN) return true
  return user.branchId === targetBranchId
}
