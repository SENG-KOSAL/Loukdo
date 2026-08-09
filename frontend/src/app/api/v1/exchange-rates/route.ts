import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/auth"
import { getAllRates, getRateByCurrency } from "@loukdo/backend/services/exchangeRate"

/**
 * @swagger
 * /api/v1/exchange-rates:
 *   get:
 *     tags: [Exchange Rates]
 *     summary: Get NBC Cambodia exchange rates
 *     description: Returns live exchange rates from the National Bank of Cambodia. Pass `?currency=` (e.g. `USD`) to get a single rate. Requires authentication.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: currency
 *         in: query
 *         required: false
 *         description: Currency id to filter a single rate (e.g. USD, EUR, THB)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of rates, or a single rate when `currency` is provided
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/ExchangeRate'
 *                 - $ref: '#/components/schemas/ExchangeRate'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Currency not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       502:
 *         description: Failed to fetch rates from the NBC API
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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