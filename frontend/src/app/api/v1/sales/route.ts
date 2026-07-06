import { NextResponse } from "next/server"
import { auth } from "@/app/api/v1/auth/[...nextauth]/auth"
import { getSalesByBranch, createSale } from "@loukdo/backend/services/sale"

export async function GET() {
  const session = await auth()
  if (!session?.user?.branchId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sales = await getSalesByBranch(session.user.branchId)
  return NextResponse.json(sales)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.branchId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { total } = await request.json()
  const sale = await createSale({ branchId: session.user.branchId, total })
  return NextResponse.json(sale, { status: 201 })
}
