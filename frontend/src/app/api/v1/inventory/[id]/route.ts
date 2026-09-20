import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import { findInventoryById, updateInventory } from "@loukdo/backend/services/inventory"
import { updateInventorySchema } from "@loukdo/backend/validators"
import { hasAnyRole, hasRole, ROLES, type AccessUser } from "@loukdo/backend/services/access"

function actor(sessionUser: AccessUser | undefined) {
  if (!sessionUser?.id || !sessionUser.role) return null
  return sessionUser
}

function canManageCatalog(user: AccessUser | null): boolean {
  return hasAnyRole(user, ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.MANAGER)
}

function canTouch(user: AccessUser, targetBranchId: string): boolean {
  if (hasRole(user, ROLES.SUPER_ADMIN)) return true
  return Boolean(user.branchId) && user.branchId === targetBranchId
}

/**
 * @swagger
 * /api/v1/inventory/{id}:
 *   patch:
 *     tags: [Inventory]
 *     summary: Adjust stock quantity or minimum stock threshold
 *     description: Pass either an absolute `quantity`/`minStock`, or a relative `adjustBy` (e.g. -5 to remove 5 units, +20 to restock).
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Inventory updated
 *       403:
 *         description: Forbidden
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const sessionUser = actor(session?.user as AccessUser | undefined)
  if (!canManageCatalog(sessionUser)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const target = await findInventoryById(id)
  if (!target) return NextResponse.json({ error: "Inventory record not found" }, { status: 404 })
  if (!canTouch(sessionUser!, target.branchId)) return NextResponse.json({ error: "You cannot modify this inventory record" }, { status: 403 })

  const parsed = updateInventorySchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })

  try {
    return NextResponse.json(await updateInventory(id, parsed.data))
  } catch {
    return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 })
  }
}
