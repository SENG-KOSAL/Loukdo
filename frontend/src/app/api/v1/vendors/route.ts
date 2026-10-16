import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import { createVendor, getAllVendors, getVendorsByBranch } from "@loukdo/backend/services/vendor"
import { createVendorSchema } from "@loukdo/backend/validators"
import { hasRole, ROLES, type AccessUser } from "@loukdo/backend/services/access"
import { can } from "@loukdo/backend/services/permissions"

function actor(sessionUser: AccessUser | undefined) {
  if (!sessionUser?.id || !sessionUser.role) return null
  return sessionUser
}

/**
 * @swagger
 * /api/v1/vendors:
 *   get:
 *     tags: [Vendors]
 *     summary: List vendors (own branch, or all branches for SUPER_ADMIN)
 *     description: Requires the `vendors.manage` permission.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of vendors
 *       403:
 *         description: Forbidden
 */
export async function GET() {
  const session = await auth()
  const sessionUser = actor(session?.user as AccessUser | undefined)
  if (!sessionUser) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (!(await can(sessionUser.role, "vendors.manage"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (hasRole(sessionUser, ROLES.SUPER_ADMIN)) {
    return NextResponse.json(await getAllVendors())
  }
  if (!sessionUser.branchId) {
    return NextResponse.json({ error: "No branch assignment" }, { status: 403 })
  }
  return NextResponse.json(await getVendorsByBranch(sessionUser.branchId))
}

/**
 * @swagger
 * /api/v1/vendors:
 *   post:
 *     tags: [Vendors]
 *     summary: Create a vendor
 *     description: Requires the `vendors.manage` permission. SUPER_ADMIN must pass `branchId`; other users create in their own branch.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       201:
 *         description: Vendor created
 *       403:
 *         description: Forbidden
 *       409:
 *         description: A vendor with this name already exists in the branch
 */
export async function POST(request: Request) {
  const session = await auth()
  const sessionUser = actor(session?.user as AccessUser | undefined)
  if (!sessionUser || !(await can(sessionUser.role, "vendors.manage"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const parsed = createVendorSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })

  const isSuperAdmin = hasRole(sessionUser, ROLES.SUPER_ADMIN)
  const branchId = isSuperAdmin ? parsed.data.branchId : sessionUser.branchId

  if (!branchId) {
    return NextResponse.json({ error: isSuperAdmin ? "A branch is required" : "No branch assignment" }, { status: 400 })
  }

  try {
    const vendor = await createVendor({ ...parsed.data, branchId })
    return NextResponse.json(vendor, { status: 201 })
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code
    return NextResponse.json(
      { error: code === "P2002" ? "A vendor with this name already exists in this branch" : "Failed to create vendor" },
      { status: code === "P2002" ? 409 : 500 },
    )
  }
}
