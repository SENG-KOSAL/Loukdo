import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import { getAllUsers } from "@loukdo/backend/services/user"
import { hasRole, ROLES, type AccessUser } from "@loukdo/backend/services/access"

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags: [Users]
 *     summary: List every user across all branches
 *     description: Returns all users (branch admins, managers, cashiers, super admins) with their branch. SUPER_ADMIN only.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Forbidden - requires SUPER_ADMIN role
 */
export async function GET() {
  const session = await auth()
  const sessionUser = session?.user as AccessUser | undefined

  if (!hasRole(sessionUser ?? null, ROLES.SUPER_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const users = await getAllUsers()
  const sanitized = users.map(({ password: _password, ...user }) => user)
  return NextResponse.json(sanitized)
}
