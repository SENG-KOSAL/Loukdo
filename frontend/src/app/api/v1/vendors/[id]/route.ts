import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import { deleteVendor, findVendorById, updateVendor } from "@loukdo/backend/services/vendor"
import { updateVendorSchema } from "@loukdo/backend/validators"
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
 * /api/v1/vendors/{id}:
 *   patch:
 *     tags: [Vendors]
 *     summary: Update a vendor
 *     description: Requires the `vendors.manage` permission and access to the vendor's branch.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Vendor updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Vendor not found
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const sessionUser = actor(session?.user as AccessUser | undefined)
  if (!sessionUser || !(await can(sessionUser.role, "vendors.manage"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const target = await findVendorById(id)
  if (!target) return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
  if (!canTouch(sessionUser, target.branchId)) return NextResponse.json({ error: "You cannot modify this vendor" }, { status: 403 })

  const parsed = updateVendorSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })

  try {
    return NextResponse.json(await updateVendor(id, parsed.data))
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code
    return NextResponse.json(
      { error: code === "P2002" ? "A vendor with this name already exists in this branch" : "Failed to update vendor" },
      { status: code === "P2002" ? 409 : 500 },
    )
  }
}

/**
 * @swagger
 * /api/v1/vendors/{id}:
 *   delete:
 *     tags: [Vendors]
 *     summary: Delete a vendor
 *     description: Vendors with purchase orders cannot be deleted; deactivate them instead.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Vendor deleted
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Vendor has purchase orders
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const sessionUser = actor(session?.user as AccessUser | undefined)
  if (!sessionUser || !(await can(sessionUser.role, "vendors.manage"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const target = await findVendorById(id)
  if (!target) return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
  if (!canTouch(sessionUser, target.branchId)) return NextResponse.json({ error: "You cannot delete this vendor" }, { status: 403 })

  try {
    await deleteVendor(id)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete vendor"
    return NextResponse.json({ error: message }, { status: 409 })
  }
}
