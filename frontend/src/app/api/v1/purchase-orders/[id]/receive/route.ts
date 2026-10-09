import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import { findPurchaseOrderById, PurchaseOrderError, receivePurchaseOrder } from "@loukdo/backend/services/purchaseOrder"
import { receivePurchaseOrderSchema } from "@loukdo/backend/validators"
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
 * /api/v1/purchase-orders/{id}/receive:
 *   post:
 *     tags: [Purchase Orders]
 *     summary: Receive stock against a purchase order
 *     description: >
 *       Body `{ "items": [{ "itemId": "...", "quantity": 5 }], "note": "optional" }`.
 *       Increases branch inventory, records a PURCHASE_RECEIPT stock movement per line,
 *       and sets the PO to PARTIALLY_RECEIVED or RECEIVED. Cannot receive more than ordered.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Stock received, updated purchase order returned
 *       409:
 *         description: Purchase order is not in a receivable state, or quantity exceeds what is still expected
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const sessionUser = actor(session?.user as AccessUser | undefined)
  if (!sessionUser || !(await can(sessionUser.role, "purchaseOrders.manage"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const target = await findPurchaseOrderById(id)
  if (!target) return NextResponse.json({ error: "Purchase order not found" }, { status: 404 })
  if (!canTouch(sessionUser, target.branchId)) return NextResponse.json({ error: "You cannot receive stock for this purchase order" }, { status: 403 })

  const parsed = receivePurchaseOrderSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })

  try {
    return NextResponse.json(await receivePurchaseOrder(id, { ...parsed.data, userId: sessionUser.id }))
  } catch (error: unknown) {
    if (error instanceof PurchaseOrderError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: "Failed to receive stock" }, { status: 500 })
  }
}
