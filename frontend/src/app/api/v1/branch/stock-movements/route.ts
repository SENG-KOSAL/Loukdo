import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import { getStockMovementsByBranch } from "@loukdo/backend/services/stockMovement"
import { hasRole, ROLES, type AccessUser } from "@loukdo/backend/services/access"
import { can } from "@loukdo/backend/services/permissions"

function actor(sessionUser: AccessUser | undefined) {
  if (!sessionUser?.id || !sessionUser.role) return null
  return sessionUser
}

/**
 * @swagger
 * /api/v1/branch/stock-movements:
 *   get:
 *     tags: [Stock Movements]
 *     summary: List stock movements for the authenticated user's branch
 *     description: Read-only purchase-order stock history for the authenticated branch user only. Super admins must use the all-branches endpoint. Optional query params `productId`, `purchaseOrderId`, `limit` (max 500).
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Branch stock movements, newest first
 *       403:
 *         description: Forbidden
 */
export async function GET(request: Request) {
  const session = await auth()
  const sessionUser = actor(session?.user as AccessUser | undefined)
  if (!sessionUser) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (hasRole(sessionUser, ROLES.SUPER_ADMIN)) {
    return NextResponse.json({ error: "Use the super-admin stock movements endpoint" }, { status: 403 })
  }
  if (!(await can(sessionUser.role, "purchaseOrders.manage"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (!sessionUser.branchId) {
    return NextResponse.json({ error: "No branch assignment" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get("limit"))
  const filter = {
    productId: searchParams.get("productId") || undefined,
    purchaseOrderId: searchParams.get("purchaseOrderId") || undefined,
    limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
  }

  return NextResponse.json(await getStockMovementsByBranch(sessionUser.branchId, filter))
}
