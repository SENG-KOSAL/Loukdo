const NBC_API_URL = "https://www.nbc.gov.kh/api/exRate.php"

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

function currencyName(symbol: string): string {
  const names: Record<string, string> = {
    USD: "United States Dollar",
    EUR: "Euro",
    GBP: "British Pound",
    JPY: "Japanese Yen",
    CNY: "Chinese Yuan",
    THB: "Thai Baht",
    AUD: "Australian Dollar",
    CAD: "Canadian Dollar",
    CHF: "Swiss Franc",
    HKD: "Hong Kong Dollar",
    KRW: "South Korean Won",
    SGD: "Singapore Dollar",
    MYR: "Malaysian Ringgit",
    IDR: "Indonesian Rupiah",
    PHP: "Philippine Peso",
    VND: "Vietnamese Dong",
    LAK: "Lao Kip",
    MMK: "Myanmar Kyat",
    SDR: "Special Drawing Rights",
  }
  return names[symbol] || symbol
}

function parseNbcXml(xml: string): Omit<ExchangeRate, "id">[] {
  const items: Omit<ExchangeRate, "id">[] = []
  const exRegex = /<ex>([\s\S]*?)<\/ex>/g
  let counter = 0
  let match: RegExpExecArray | null

  while ((match = exRegex.exec(xml)) !== null) {
    const block = match[1]
    const getVal = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
      return m ? m[1].trim() : ""
    }

    const key = getVal("key")
    const [currencyId] = key.split("/")
    const date = getVal("date")
    const unit = parseInt(getVal("unit") || "1", 10)

    if (!key || !date) continue

    items.push({
      validDate: date,
      currencyId,
      currency: currencyName(currencyId),
      symbol: key,
      unit,
      bid: parseFloat(getVal("bid") || "0"),
      ask: parseFloat(getVal("ask") || "0"),
      average: parseFloat(getVal("average") || "0"),
    })
    counter++
  }

  return items
}

export async function getAllRates(): Promise<ExchangeRate[]> {
  const res = await fetch(NBC_API_URL)

  if (!res.ok) {
    throw new Error(`NBC API returned ${res.status}: ${res.statusText}`)
  }

  const xml = await res.text()
  const items = parseNbcXml(xml)

  return items.map((item, idx) => ({ id: idx + 1, ...item }))
}

export async function getRateByCurrency(currencyId: string): Promise<ExchangeRate | null> {
  const all = await getAllRates()
  return all.find((r) => r.currencyId === currencyId.toUpperCase()) ?? null
}
