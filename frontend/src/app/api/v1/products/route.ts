import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import { createProduct, getAllProducts, getProductsByBranch } from "@loukdo/backend/services/product"
import { createProductSchema } from "@loukdo/backend/validators"
import { hasAnyRole, hasRole, ROLES, type AccessUser } from "@loukdo/backend/services/access"

function actor(sessionUser: AccessUser | undefined) {
  if (!sessionUser?.id || !sessionUser.role) return null
  return sessionUser
}

function canManageCatalog(user: AccessUser | null): boolean {
  return hasAnyRole(user, ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.MANAGER)
}

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     tags: [Products]
 *     summary: List products (own branch, or all branches for SUPER_ADMIN)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of products
 *       403:
 *         description: Forbidden
 */
export async function GET() {
  const session = await auth()
  const sessionUser = actor(session?.user as AccessUser | undefined)
  if (!sessionUser) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  if (hasRole(sessionUser, ROLES.SUPER_ADMIN)) {
    return NextResponse.json(await getAllProducts())
  }
  if (!sessionUser.branchId) {
    return NextResponse.json({ error: "No branch assignment" }, { status: 403 })
  }
  return NextResponse.json(await getProductsByBranch(sessionUser.branchId))
}

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     tags: [Products]
 *     summary: Create a product
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       201:
 *         description: Product created
 *       403:
 *         description: Forbidden
 */
export async function POST(request: Request) {
  const session = await auth()
  const sessionUser = actor(session?.user as AccessUser | undefined)
  if (!canManageCatalog(sessionUser)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const parsed = createProductSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })

  const isSuperAdmin = hasRole(sessionUser, ROLES.SUPER_ADMIN)
  const branchId = isSuperAdmin ? parsed.data.branchId : sessionUser!.branchId

  if (!branchId) {
    return NextResponse.json({ error: isSuperAdmin ? "A branch is required" : "No branch assignment" }, { status: 400 })
  }

  try {
    const product = await createProduct({ ...parsed.data, branchId })
    return NextResponse.json(product, { status: 201 })
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code
    return NextResponse.json({ error: code === "P2002" ? "A product with this SKU already exists in this branch" : "Failed to create product" }, { status: code === "P2002" ? 409 : 500 })
  }
}
