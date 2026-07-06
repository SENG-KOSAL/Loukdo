import { NextResponse } from "next/server"
import { auth } from "@/app/api/v1/auth/[...nextauth]/auth"
import { getAllRates, getRateByCurrency } from "@loukdo/backend/services/exchangeRate"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const currency = searchParams.get("currency")

    if (currency) {
      const rate = await getRateByCurrency(currency.toUpperCase())
      if (!rate) {
        return NextResponse.json({ error: `Currency '${currency}' not found` }, { status: 404 })
      }
      return NextResponse.json(rate)
    }

    const rates = await getAllRates()
    return NextResponse.json(rates)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch exchange rates"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
