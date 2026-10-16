import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import {
  createPurchaseOrder,
  getAllPurchaseOrders,
  getPurchaseOrdersByBranch,
  PurchaseOrderError,
} from "@loukdo/backend/services/purchaseOrder"
import { createPurchaseOrderSchema } from "@loukdo/backend/validators"
import { hasRole, ROLES, type AccessUser } from "@loukdo/backend/services/access"
import { can } from "@loukdo/backend/services/permissions"

function actor(sessionUser: AccessUser | undefined) {
  if (!sessionUser?.id || !sessionUser.role) return null
  return sessionUser
}

/**
 * @swagger
 * /api/v1/purchase-orders:
 *   get:
 *     tags: [Purchase Orders]
 *     summary: List purchase orders (own branch, or all branches for SUPER_ADMIN)
 *     description: Requires the `purchaseOrders.manage` permission.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of purchase orders with vendor and items
 *       403:
 *         description: Forbidden
 */
export async function GET() {
  const session = await auth()
  const sessionUser = actor(session?.user as AccessUser | undefined)
  if (!sessionUser) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!(await can(sessionUser.role, "purchaseOrders.manage"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (hasRole(sessionUser, ROLES.SUPER_ADMIN)) {
    return NextResponse.json(await getAllPurchaseOrders())
  }
  if (!sessionUser.branchId) {
    return NextResponse.json({ error: "No branch assignment" }, { status: 403 })
  }
  return NextResponse.json(await getPurchaseOrdersByBranch(sessionUser.branchId))
}

/**
 * @swagger
 * /api/v1/purchase-orders:
 *   post:
 *     tags: [Purchase Orders]
 *     summary: Create a draft purchase order
 *     description: Requires the `purchaseOrders.manage` permission. SUPER_ADMIN must pass `branchId`. The vendor and all products must belong to the same branch.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       201:
 *         description: Purchase order created (status DRAFT)
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
export async function POST(request: Request) {
  const session = await auth()
  const sessionUser = actor(session?.user as AccessUser | undefined)
  if (!sessionUser || !(await can(sessionUser.role, "purchaseOrders.manage"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const parsed = createPurchaseOrderSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })

  const isSuperAdmin = hasRole(sessionUser, ROLES.SUPER_ADMIN)
  const branchId = isSuperAdmin ? parsed.data.branchId : sessionUser.branchId
  if (!branchId) {
    return NextResponse.json({ error: isSuperAdmin ? "A branch is required" : "No branch assignment" }, { status: 400 })
  }

  try {
    const po = await createPurchaseOrder({ ...parsed.data, branchId, createdById: sessionUser.id })
    return NextResponse.json(po, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof PurchaseOrderError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: "Failed to create purchase order" }, { status: 500 })
  }
}
