import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import { getSalesByBranch, createSale } from "@loukdo/backend/services/sale"
import { hasAnyRole, requireBranch, ROLES } from "@loukdo/backend/services/access"

/**
 * @swagger
 * /api/v1/sales:
 *   get:
 *     tags: [Sales]
 *     summary: List sales for the current branch
 *     description: Returns sales scoped to the authenticated user's branch. Requires SUPER_ADMIN, BRANCH_ADMIN, MANAGER, or CASHIER role.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of sales
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Sale'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user has no branch assigned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
  const session = await auth()
  const user = session?.user as { role?: string; branchId?: string } | null

  if (!hasAnyRole(user, ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.MANAGER, ROLES.CASHIER)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const branchId = requireBranch(user)
  if (!branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const sales = await getSalesByBranch(branchId)
  return NextResponse.json(sales)
}

/**
 * @swagger
 * /api/v1/sales:
 *   post:
 *     tags: [Sales]
 *     summary: Create a sale for the current branch
 *     description: Creates a sale scoped to the authenticated user's branch. Requires SUPER_ADMIN, BRANCH_ADMIN, MANAGER, or CASHIER role.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSaleInput'
 *     responses:
 *       201:
 *         description: Sale created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sale'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user has no branch assigned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user as { role?: string; branchId?: string } | null

  if (!hasAnyRole(user, ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.MANAGER, ROLES.CASHIER)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const branchId = requireBranch(user)
  if (!branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { total } = await request.json()
  const sale = await createSale({ branchId, total })
  return NextResponse.json(sale, { status: 201 })
}