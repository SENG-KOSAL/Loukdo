import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import { getSalesByBranch, createSale, SaleError } from "@loukdo/backend/services/sale"
import { hasAnyRole, hasRole, requireBranch, ROLES } from "@loukdo/backend/services/access"

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
 *     summary: Create a sale and deduct the sold items from stock
 *     description: Creates a sale scoped to the authenticated user's branch. Prices are read from the catalog, and stock is deducted atomically; the whole sale is rejected (409) if any item is short. SUPER_ADMIN may pass branchId to sell for a specific branch. Requires SUPER_ADMIN, BRANCH_ADMIN, MANAGER, or CASHIER role.
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
 *       400:
 *         description: Invalid items, or a product is not available in the branch
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
 *       409:
 *         description: Not enough stock for one of the items
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

  const body = await request.json().catch(() => null)

  // Only a SUPER_ADMIN may choose the branch; everyone else always sells in their own branch.
  const branchId = hasRole(user, ROLES.SUPER_ADMIN)
    ? (typeof body?.branchId === "string" && body.branchId) || requireBranch(user)
    : requireBranch(user)
  if (!branchId) {
    return NextResponse.json(
      { error: hasRole(user, ROLES.SUPER_ADMIN) ? "Choose a branch to sell for" : "Forbidden" },
      { status: hasRole(user, ROLES.SUPER_ADMIN) ? 400 : 403 },
    )
  }

  const rawItems: unknown = body?.items
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 200) {
    return NextResponse.json({ error: "Add at least one item to the sale" }, { status: 400 })
  }
  const items = rawItems.map((i) => ({ productId: (i as { productId?: unknown })?.productId, quantity: (i as { quantity?: unknown })?.quantity }))
  const valid = items.every(
    (i) => typeof i.productId === "string" && i.productId && Number.isInteger(i.quantity) && (i.quantity as number) > 0 && (i.quantity as number) <= 100000,
  )
  if (!valid) {
    return NextResponse.json({ error: "Each item needs a productId and a whole-number quantity above 0" }, { status: 400 })
  }

  try {
    const sale = await createSale({ branchId, items: items as { productId: string; quantity: number }[] })
    return NextResponse.json(sale, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof SaleError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("POST /api/v1/sales failed", error)
    return NextResponse.json({ error: "Failed to complete the sale" }, { status: 500 })
  }
}