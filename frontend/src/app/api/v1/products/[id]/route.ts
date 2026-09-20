import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import { deleteProduct, findProductById, updateProduct } from "@loukdo/backend/services/product"
import { updateProductSchema } from "@loukdo/backend/validators"
import { hasAnyRole, hasRole, ROLES, type AccessUser } from "@loukdo/backend/services/access"

function actor(sessionUser: AccessUser | undefined) {
  if (!sessionUser?.id || !sessionUser.role) return null
  return sessionUser
}

function canManageCatalog(user: AccessUser | null): boolean {
  return hasAnyRole(user, ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.MANAGER)
}

function canTouch(user: AccessUser, targetBranchId: string): boolean {
  if (hasRole(user, ROLES.SUPER_ADMIN)) return true
  return Boolean(user.branchId) && user.branchId === targetBranchId
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const sessionUser = actor(session?.user as AccessUser | undefined)
  if (!canManageCatalog(sessionUser)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const target = await findProductById(id)
  if (!target) return NextResponse.json({ error: "Product not found" }, { status: 404 })
  if (!canTouch(sessionUser!, target.branchId)) return NextResponse.json({ error: "You cannot modify this product" }, { status: 403 })

  const parsed = updateProductSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })

  try {
    return NextResponse.json(await updateProduct(id, parsed.data))
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code
    return NextResponse.json({ error: code === "P2002" ? "A product with this SKU already exists in this branch" : "Failed to update product" }, { status: code === "P2002" ? 409 : 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const sessionUser = actor(session?.user as AccessUser | undefined)
  if (!canManageCatalog(sessionUser)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const target = await findProductById(id)
  if (!target) return NextResponse.json({ error: "Product not found" }, { status: 404 })
  if (!canTouch(sessionUser!, target.branchId)) return NextResponse.json({ error: "You cannot delete this product" }, { status: 403 })

  try {
    await deleteProduct(id)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete product"
    return NextResponse.json({ error: message }, { status: 409 })
  }
}
