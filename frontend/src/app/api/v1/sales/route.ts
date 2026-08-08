import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import { getSalesByBranch, createSale } from "@loukdo/backend/services/sale"
import { hasAnyRole, requireBranch, ROLES } from "@loukdo/backend/services/access"

export async function GET() {
  const session = await auth()
  const user = session?.user as { role?: string; branchId?: string } | null

  if (!hasAnyRole(user, ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.MANAGER, ROLES.CASHIER)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const branchId = requireBranch(user)
  if (!branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const sales = await getSalesByBranch(branchId)
  return NextResponse.json(sales)
}

export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user as { role?: string; branchId?: string } | null

  if (!hasAnyRole(user, ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN, ROLES.MANAGER, ROLES.CASHIER)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const branchId = requireBranch(user)
  if (!branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { total } = await request.json()
  const sale = await createSale({ branchId, total })
  return NextResponse.json(sale, { status: 201 })
}