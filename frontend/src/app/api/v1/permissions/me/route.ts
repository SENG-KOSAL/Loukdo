import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import { getPermissionMatrix, PERMISSIONS } from "@loukdo/backend/services/permissions"
import { type AccessUser } from "@loukdo/backend/services/access"

/**
 * @swagger
 * /api/v1/permissions/me:
 *   get:
 *     tags: [Permissions]
 *     summary: Get the effective permissions for the signed-in user's role
 *     description: >-
 *       Any authenticated user can call this to know what they're allowed to do.
 *       Used by the frontend to show/hide "Add", "Edit", "Delete" actions in sync
 *       with whatever the super admin has configured in Settings > Role Permissions.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Effective permission flags for the caller's role
 *       401:
 *         description: Not authenticated
 */
export async function GET() {
  const session = await auth()
  const sessionUser = session?.user as AccessUser | undefined

  if (!sessionUser?.id || !sessionUser.role) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const matrix = await getPermissionMatrix()
  const role = sessionUser.role as keyof typeof matrix
  const permissions = matrix[role] ?? Object.fromEntries(PERMISSIONS.map((p) => [p.key, false]))

  return NextResponse.json({ role: sessionUser.role, permissions })
}
