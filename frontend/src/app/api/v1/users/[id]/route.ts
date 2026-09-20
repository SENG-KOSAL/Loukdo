import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import { deleteUser, findUserById, updateUser } from "@loukdo/backend/services/user"
import { updateUserSchema } from "@loukdo/backend/validators"
import { hasRole, ROLES, type AccessUser } from "@loukdo/backend/services/access"
import { can } from "@loukdo/backend/services/permissions"

function canManage(user: AccessUser | undefined): Promise<boolean> {
  return can(user?.role, "users.manage")
}

function canManageTarget(actor: AccessUser, target: { branchId: string | null }, role: string, branchId: string | null | undefined) {
  if (hasRole(actor, ROLES.SUPER_ADMIN)) return role === ROLES.SUPER_ADMIN || Boolean(branchId)
  const permitted = [ROLES.BRANCH_ADMIN, ROLES.MANAGER, ROLES.CASHIER]
  return actor.role === ROLES.BRANCH_ADMIN && Boolean(actor.branchId) && target.branchId === actor.branchId && branchId === actor.branchId && permitted.includes(role as typeof ROLES.BRANCH_ADMIN)
}

function sanitize<T extends { password: string }>(user: T) {
  const { password: _password, ...safeUser } = user
  return safeUser
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const actor = session?.user as AccessUser | undefined
  if (!actor?.id || !(await canManage(actor))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const target = await findUserById(id)
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })
  if (id === actor.id) return NextResponse.json({ error: "You cannot edit your own account here" }, { status: 400 })

  const parsed = updateUserSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  const role = parsed.data.role ?? target.role
  const branchId = parsed.data.branchId === undefined ? target.branchId : parsed.data.branchId
  if (!canManageTarget(actor, target, role, branchId)) return NextResponse.json({ error: "You cannot modify that user, role, or branch" }, { status: 403 })

  try {
    return NextResponse.json(sanitize(await updateUser(id, parsed.data)))
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code
    return NextResponse.json({ error: code === "P2002" ? "Username or email is already in use" : "Failed to update user" }, { status: code === "P2002" ? 409 : 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const actor = session?.user as AccessUser | undefined
  if (!actor?.id || !(await canManage(actor))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const target = await findUserById(id)
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })
  if (id === actor.id) return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 })
  if (!canManageTarget(actor, target, target.role, target.branchId)) return NextResponse.json({ error: "You cannot delete that user" }, { status: 403 })
  await deleteUser(id)
  return NextResponse.json({ success: true })
}
