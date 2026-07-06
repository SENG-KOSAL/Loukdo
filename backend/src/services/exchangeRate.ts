const MEF_API_URL = "https://data.mef.gov.kh/api/v1/realtime-api/exchange-rate"

export interface ExchangeRate {
  id: number
  validDate: string
  currencyId: string
  currency: string
  symbol: string
  unit: number
  bid: number
  ask: number
  average: number
}

interface MefRateItem {
  id: number
  valid_date: string
  created_at: string
  currency_id: string
  currency: string
  symbol: string
  unit: number
  bid: number
  ask: number
  average: number
}

export async function getAllRates(): Promise<ExchangeRate[]> {
  const res = await fetch(MEF_API_URL)

  if (!res.ok) {
    throw new Error(`MEF API returned ${res.status}: ${res.statusText}`)
  }

  const json = (await res.json()) as { data?: MefRateItem[] }
  const data = json.data

  if (!Array.isArray(data)) {
    throw new Error("Unexpected response format from MEF API")
  }

  return data.map(mapRateItem)
}

export async function getRateByCurrency(currencyId: string): Promise<ExchangeRate | null> {
  const url = `${MEF_API_URL}?currency_id=${encodeURIComponent(currencyId)}`
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`MEF API returned ${res.status}: ${res.statusText}`)
  }

  const json = (await res.json()) as { data?: MefRateItem }
  const data = json.data

  if (!data || !data.currency_id) return null

  return mapRateItem(data)
}

function mapRateItem(item: MefRateItem): ExchangeRate {
  return {
    id: item.id,
    validDate: item.valid_date,
    currencyId: item.currency_id,
    currency: item.currency,
    symbol: item.symbol,
    unit: item.unit,
    bid: item.bid,
    ask: item.ask,
    average: item.average,
  }
}
