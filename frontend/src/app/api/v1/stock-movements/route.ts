import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import { getAllStockMovements, getStockMovementsByBranch } from "@loukdo/backend/services/stockMovement"
import { hasRole, ROLES, type AccessUser } from "@loukdo/backend/services/access"
import { can } from "@loukdo/backend/services/permissions"

function actor(sessionUser: AccessUser | undefined) {
  if (!sessionUser?.id || !sessionUser.role) return null
  return sessionUser
}

/**
 * @swagger
 * /api/v1/stock-movements:
 *   get:
 *     tags: [Stock Movements]
 *     summary: List stock movements (own branch, or all branches for SUPER_ADMIN)
 *     description: Read-only purchase-order stock history, including pending, completed, cancelled, and reversed entries. Requires the `purchaseOrders.manage` permission. Optional query params `productId`, `purchaseOrderId`, `limit` (max 500).
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of stock movements, newest first
 *       403:
 *         description: Forbidden
 */
export async function GET(request: Request) {
  const session = await auth()
  const sessionUser = actor(session?.user as AccessUser | undefined)
  if (!sessionUser) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!(await can(sessionUser.role, "purchaseOrders.manage"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get("limit"))
  const filter = {
    productId: searchParams.get("productId") || undefined,
    purchaseOrderId: searchParams.get("purchaseOrderId") || undefined,
    limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
  }

  if (hasRole(sessionUser, ROLES.SUPER_ADMIN)) {
    return NextResponse.json(await getAllStockMovements(filter))
  }
  if (!sessionUser.branchId) {
    return NextResponse.json({ error: "No branch assignment" }, { status: 403 })
  }
  return NextResponse.json(await getStockMovementsByBranch(sessionUser.branchId, filter))
}
