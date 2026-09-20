import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import { createCategory, getAllCategories, getCategoriesByBranch } from "@loukdo/backend/services/category"
import { createCategorySchema } from "@loukdo/backend/validators"
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
 * /api/v1/categories:
 *   get:
 *     tags: [Categories]
 *     summary: List categories (own branch, or all branches for SUPER_ADMIN)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 *       403:
 *         description: Forbidden
 */
export async function GET() {
  const session = await auth()
  const sessionUser = actor(session?.user as AccessUser | undefined)
  if (!sessionUser) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  if (hasRole(sessionUser, ROLES.SUPER_ADMIN)) {
    return NextResponse.json(await getAllCategories())
  }
  if (!sessionUser.branchId) {
    return NextResponse.json({ error: "No branch assignment" }, { status: 403 })
  }
  return NextResponse.json(await getCategoriesByBranch(sessionUser.branchId))
}

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create a category
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       201:
 *         description: Category created
 *       403:
 *         description: Forbidden
 */
export async function POST(request: Request) {
  const session = await auth()
  const sessionUser = actor(session?.user as AccessUser | undefined)
  if (!canManageCatalog(sessionUser)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const parsed = createCategorySchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })

  const isSuperAdmin = hasRole(sessionUser, ROLES.SUPER_ADMIN)
  const branchId = isSuperAdmin ? parsed.data.branchId : sessionUser!.branchId

  if (!branchId) {
    return NextResponse.json({ error: isSuperAdmin ? "A branch is required" : "No branch assignment" }, { status: 400 })
  }

  try {
    const category = await createCategory({ ...parsed.data, branchId })
    return NextResponse.json(category, { status: 201 })
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code
    return NextResponse.json({ error: code === "P2002" ? "A category with this name already exists" : "Failed to create category" }, { status: code === "P2002" ? 409 : 500 })
  }
}
