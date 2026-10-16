import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import { findPurchaseOrderById, PurchaseOrderError, setPurchaseOrderStatus } from "@loukdo/backend/services/purchaseOrder"
import { updatePurchaseOrderStatusSchema } from "@loukdo/backend/validators"
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
 * /api/v1/purchase-orders/{id}/status:
 *   post:
 *     tags: [Purchase Orders]
 *     summary: Mark a purchase order as ORDERED or CANCELLED
 *     description: >
 *       DRAFT to ORDERED records PENDING stock movements. DRAFT or ORDERED to
 *       CANCELLED records CANCELLED stock movements. Body accepts ORDERED or CANCELLED.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Status updated
 *       409:
 *         description: Invalid status change
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
  if (!canTouch(sessionUser, target.branchId)) return NextResponse.json({ error: "You cannot modify this purchase order" }, { status: 403 })

  const parsed = updatePurchaseOrderStatusSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })

  try {
    return NextResponse.json(await setPurchaseOrderStatus(id, parsed.data.status, sessionUser.id))
  } catch (error: unknown) {
    if (error instanceof PurchaseOrderError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: "Failed to update purchase order status" }, { status: 500 })
  }
}
