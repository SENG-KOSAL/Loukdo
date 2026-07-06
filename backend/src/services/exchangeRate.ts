const NBC_API_URL = "https://www.nbc.gov.kh/api/exRate.php"

interface CacheEntry {
  data: ExchangeRate[]
  date: string
  slot: "9AM" | "3PM"
}

let cache: CacheEntry | null = null

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayKey(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function currentSlot(): { date: string; slot: "9AM" | "3PM" } | null {
  const hour = new Date().getHours()
  const today = todayKey()

  if (hour >= 15) return { date: today, slot: "3PM" }
  if (hour >= 9) return { date: today, slot: "9AM" }
  return { date: yesterdayKey(), slot: "3PM" }
}

function isCacheValid(): boolean {
  if (!cache) return false
  const needed = currentSlot()
  if (!needed) return false
  return cache.date === needed.date && cache.slot === needed.slot
}

function setCache(data: ExchangeRate[]): void {
  const needed = currentSlot()
  if (!needed) return
  cache = { data, date: needed.date, slot: needed.slot }
}

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
  if (isCacheValid()) {
    return cache!.data
  }

  const res = await fetch(NBC_API_URL)

  if (!res.ok) {
    if (cache) return cache.data
    throw new Error(`NBC API returned ${res.status}: ${res.statusText}`)
  }

  const xml = await res.text()
  const items = parseNbcXml(xml)
  const result = items.map((item, idx) => ({ id: idx + 1, ...item }))

  setCache(result)
  return result
}

export async function getRateByCurrency(currencyId: string): Promise<ExchangeRate | null> {
  const all = await getAllRates()
  return all.find((r) => r.currencyId === currencyId.toUpperCase()) ?? null
}
