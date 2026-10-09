import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import {
  deletePurchaseOrder,
  findPurchaseOrderById,
  PurchaseOrderError,
  updatePurchaseOrder,
} from "@loukdo/backend/services/purchaseOrder"
import { updatePurchaseOrderSchema } from "@loukdo/backend/validators"
import { hasRole, ROLES, type AccessUser } from "@loukdo/backend/services/access"
import { can } from "@loukdo/backend/services/permissions"

function actor(sessionUser: AccessUser | undefined) {
  if (!sessionUser?.id || !sessionUser.role) return null
  return sessionUser
}

function canTouch(user: AccessUser, targetBranchId: string): boolean {
  if (hasRole(user, ROLES.SUPER_ADMIN)) return true
  return Boolean(user.branchId) && user.branchId === targetBranchId
}

/**
 * @swagger
 * /api/v1/purchase-orders/{id}:
 *   get:
 *     tags: [Purchase Orders]
 *     summary: Get one purchase order
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Purchase order with vendor, items and branch
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const sessionUser = actor(session?.user as AccessUser | undefined)
  if (!sessionUser || !(await can(sessionUser.role, "purchaseOrders.manage"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const target = await findPurchaseOrderById(id)
  if (!target) return NextResponse.json({ error: "Purchase order not found" }, { status: 404 })
  if (!canTouch(sessionUser, target.branchId)) return NextResponse.json({ error: "You cannot view this purchase order" }, { status: 403 })

  return NextResponse.json(target)
}

/**
 * @swagger
 * /api/v1/purchase-orders/{id}:
 *   patch:
 *     tags: [Purchase Orders]
 *     summary: Edit a draft purchase order
 *     description: Only DRAFT purchase orders can be edited.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Purchase order updated
 *       409:
 *         description: Purchase order is not a draft
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const sessionUser = actor(session?.user as AccessUser | undefined)
  if (!sessionUser || !(await can(sessionUser.role, "purchaseOrders.manage"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const target = await findPurchaseOrderById(id)
  if (!target) return NextResponse.json({ error: "Purchase order not found" }, { status: 404 })
  if (!canTouch(sessionUser, target.branchId)) return NextResponse.json({ error: "You cannot modify this purchase order" }, { status: 403 })

  const parsed = updatePurchaseOrderSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })

  try {
    return NextResponse.json(await updatePurchaseOrder(id, parsed.data))
  } catch (error: unknown) {
    if (error instanceof PurchaseOrderError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: "Failed to update purchase order" }, { status: 500 })
  }
}

/**
 * @swagger
 * /api/v1/purchase-orders/{id}:
 *   delete:
 *     tags: [Purchase Orders]
 *     summary: Delete a draft purchase order
 *     description: Only DRAFT purchase orders can be deleted. Cancel ordered ones instead.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Purchase order deleted
 *       409:
 *         description: Purchase order is not a draft
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const sessionUser = actor(session?.user as AccessUser | undefined)
  if (!sessionUser || !(await can(sessionUser.role, "purchaseOrders.manage"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const target = await findPurchaseOrderById(id)
  if (!target) return NextResponse.json({ error: "Purchase order not found" }, { status: 404 })
  if (!canTouch(sessionUser, target.branchId)) return NextResponse.json({ error: "You cannot delete this purchase order" }, { status: 403 })

  try {
    await deletePurchaseOrder(id)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof PurchaseOrderError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: "Failed to delete purchase order" }, { status: 500 })
  }
}
