import prisma from "./prisma"
import { ROLES } from "./access"
import type { Role } from "../generated/prisma"

export const PERMISSIONS = [
  { key: "branches.manage", label: "Manage branches", description: "Create, edit, and delete branches (store locations)" },
  { key: "users.manage", label: "Manage users", description: "Create, edit, and delete staff accounts" },
  { key: "products.manage", label: "Manage products", description: "Create, edit, and delete products" },
  { key: "categories.manage", label: "Manage categories", description: "Create, edit, and delete categories" },
  { key: "inventory.manage", label: "Adjust inventory", description: "Adjust stock quantities and low-stock thresholds" },
  { key: "sales.view", label: "View sales", description: "View sales history and reports" },
  { key: "pos.access", label: "Access POS", description: "Use the point-of-sale checkout screen" },
  { key: "settings.manage", label: "Manage settings", description: "Change system settings and role permissions" },
] as const

export type PermissionKey = (typeof PERMISSIONS)[number]["key"]

const ALL_ROLES: Role[] = [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.MANAGER, ROLES.CASHIER]

// Sensible defaults, used whenever no explicit override exists in the database.
// SUPER_ADMIN is always fully permitted and cannot be restricted.
export const DEFAULT_PERMISSIONS: Record<Role, Record<PermissionKey, boolean>> = {
  SUPER_ADMIN: {
    "branches.manage": true, "users.manage": true, "products.manage": true,
    "categories.manage": true, "inventory.manage": true, "sales.view": true,
    "pos.access": true, "settings.manage": true,
  },
  BRANCH_ADMIN: {
    "branches.manage": false, "users.manage": true, "products.manage": true,
    "categories.manage": true, "inventory.manage": true, "sales.view": true,
    "pos.access": true, "settings.manage": false,
  },
  MANAGER: {
    "branches.manage": false, "users.manage": false, "products.manage": true,
    "categories.manage": true, "inventory.manage": true, "sales.view": true,
    "pos.access": true, "settings.manage": false,
  },
  CASHIER: {
    "branches.manage": false, "users.manage": false, "products.manage": false,
    "categories.manage": false, "inventory.manage": false, "sales.view": false,
    "pos.access": true, "settings.manage": false,
  },
}

export async function getPermissionMatrix(): Promise<Record<Role, Record<PermissionKey, boolean>>> {
  const overrides = await prisma.rolePermission.findMany()
  const matrix = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)) as typeof DEFAULT_PERMISSIONS

  for (const row of overrides) {
    if (row.role === ROLES.SUPER_ADMIN) continue // never restrict super admin
    if (matrix[row.role] && row.permission in matrix[row.role]) {
      matrix[row.role][row.permission as PermissionKey] = row.allowed
    }
  }
  return matrix
}

export async function setRolePermissions(role: Role, permissions: Partial<Record<PermissionKey, boolean>>) {
  if (role === ROLES.SUPER_ADMIN) {
    throw new Error("Super admin permissions cannot be changed")
  }
  await prisma.$transaction(
    Object.entries(permissions).map(([permission, allowed]) =>
      prisma.rolePermission.upsert({
        where: { role_permission: { role, permission } },
        create: { role, permission, allowed: Boolean(allowed) },
        update: { allowed: Boolean(allowed) },
      }),
    ),
  )
  return getPermissionMatrix()
}

export async function can(role: string | undefined, permission: PermissionKey): Promise<boolean> {
  if (!role || !ALL_ROLES.includes(role as Role)) return false
  if (role === ROLES.SUPER_ADMIN) return true
  const matrix = await getPermissionMatrix()
  return matrix[role as Role]?.[permission] ?? false
}
