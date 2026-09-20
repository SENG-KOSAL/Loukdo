import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import { createUser, getAllUsers, getUsersByBranch } from "@loukdo/backend/services/user"
import { createUserSchema } from "@loukdo/backend/validators"
import { hasRole, ROLES, type AccessUser } from "@loukdo/backend/services/access"
import { can } from "@loukdo/backend/services/permissions"

function actor(sessionUser: AccessUser | undefined) {
  if (!sessionUser?.id || !sessionUser.role) return null
  return sessionUser
}

async function canManageUsers(user: AccessUser | null): Promise<boolean> {
  return can(user?.role, "users.manage")
}

function canAssign(user: AccessUser, role: string, branchId: string | null | undefined): boolean {
  if (hasRole(user, ROLES.SUPER_ADMIN)) return role === ROLES.SUPER_ADMIN || Boolean(branchId)
  return user.role === ROLES.BRANCH_ADMIN &&
    Boolean(user.branchId) &&
    branchId === user.branchId &&
    [ROLES.BRANCH_ADMIN, ROLES.MANAGER, ROLES.CASHIER].includes(role as typeof ROLES.BRANCH_ADMIN)
}

function sanitize<T extends { password: string }>(user: T) {
  const { password: _password, ...safeUser } = user
  return safeUser
}

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
  const sessionUser = actor(session?.user as AccessUser | undefined)

  if (!(await canManageUsers(sessionUser))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (!hasRole(sessionUser, ROLES.SUPER_ADMIN) && !sessionUser?.branchId) {
    return NextResponse.json({ error: "Branch administrator has no branch assignment" }, { status: 403 })
  }

  const users = hasRole(sessionUser, ROLES.SUPER_ADMIN)
    ? await getAllUsers()
    : await getUsersByBranch(sessionUser!.branchId!)
  return NextResponse.json(users.map(sanitize))
}

export async function POST(request: Request) {
  const session = await auth()
  const sessionUser = actor(session?.user as AccessUser | undefined)
  if (!(await canManageUsers(sessionUser))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const parsed = createUserSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  if (!canAssign(sessionUser!, parsed.data.role, parsed.data.branchId)) {
    return NextResponse.json({ error: "You cannot assign that role or branch" }, { status: 403 })
  }

  try {
    return NextResponse.json(sanitize(await createUser(parsed.data)), { status: 201 })
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code
    return NextResponse.json({ error: code === "P2002" ? "Username or email is already in use" : "Failed to create user" }, { status: code === "P2002" ? 409 : 500 })
  }
}
