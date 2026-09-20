import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import { getAllInventory, getInventoryByBranch } from "@loukdo/backend/services/inventory"
import { hasRole, ROLES, type AccessUser } from "@loukdo/backend/services/access"

function actor(sessionUser: AccessUser | undefined) {
  if (!sessionUser?.id || !sessionUser.role) return null
  return sessionUser
}

/**
 * @swagger
 * /api/v1/inventory:
 *   get:
 *     tags: [Inventory]
 *     summary: List stock levels (own branch, or all branches for SUPER_ADMIN)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of inventory items
 *       401:
 *         description: Not authenticated
 */
export async function GET() {
  const session = await auth()
  const sessionUser = actor(session?.user as AccessUser | undefined)
  if (!sessionUser) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  if (hasRole(sessionUser, ROLES.SUPER_ADMIN)) {
    return NextResponse.json(await getAllInventory())
  }
  if (!sessionUser.branchId) {
    return NextResponse.json({ error: "No branch assignment" }, { status: 403 })
  }
  return NextResponse.json(await getInventoryByBranch(sessionUser.branchId))
}
