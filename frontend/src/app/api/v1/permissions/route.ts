import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import { getPermissionMatrix, setRolePermissions, PERMISSIONS } from "@loukdo/backend/services/permissions"
import { updateRolePermissionsSchema } from "@loukdo/backend/validators"
import { hasRole, ROLES, type AccessUser } from "@loukdo/backend/services/access"

function actor(sessionUser: AccessUser | undefined) {
  if (!sessionUser?.id || !sessionUser.role) return null
  return sessionUser
}

/**
 * @swagger
 * /api/v1/permissions:
 *   get:
 *     tags: [Permissions]
 *     summary: Get the full role → permission matrix
 *     description: SUPER_ADMIN only. Returns the list of permissions and the current allow/deny matrix for every role.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Permission catalog and matrix
 *       403:
 *         description: Forbidden
 */
export async function GET() {
  const session = await auth()
  const sessionUser = actor(session?.user as AccessUser | undefined)
  if (!hasRole(sessionUser, ROLES.SUPER_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const matrix = await getPermissionMatrix()
  return NextResponse.json({ permissions: PERMISSIONS, matrix })
}

/**
 * @swagger
 * /api/v1/permissions:
 *   patch:
 *     tags: [Permissions]
 *     summary: Update permissions for a single role
 *     description: SUPER_ADMIN only. SUPER_ADMIN's own permissions can never be changed.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Updated matrix
 *       403:
 *         description: Forbidden
 */
export async function PATCH(request: Request) {
  const session = await auth()
  const sessionUser = actor(session?.user as AccessUser | undefined)
  if (!hasRole(sessionUser, ROLES.SUPER_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const parsed = updateRolePermissionsSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })

  const validKeys = new Set(PERMISSIONS.map((p) => p.key))
  const filtered = Object.fromEntries(
    Object.entries(parsed.data.permissions).filter(([key]) => validKeys.has(key as (typeof PERMISSIONS)[number]["key"])),
  )

  try {
    const matrix = await setRolePermissions(parsed.data.role, filtered)
    return NextResponse.json({ permissions: PERMISSIONS, matrix })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update permissions"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
