"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react"
import { Check, Minus, Plus, RefreshCw, Search, ShoppingCart, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { apiClient } from "@/lib/api-client"
import { cn } from "@/lib/utils"

type BranchInfo = { id: string; name: string; code: string }

type PosProduct = {
  id: string
  name: string
  sku: string | null
  barcode: string | null
  price: string | number
  active: boolean
  category: { id: string; name: string } | null
  inventory: { id: string; quantity: number; minStock: number } | null
  /** Only present when the API returns products for several branches (super admin). */
  branch?: BranchInfo
}

type CartLine = { productId: string; quantity: number }
type SaleResponse = { receiptNo: string | null; total: string | number; items: { quantity: number }[] }
type Receipt = { receiptNo: string | null; total: number; items: number; change: number | null }

const money = (n: number) => `$${n.toFixed(2)}`
const round2 = (n: number) => Math.round(n * 100) / 100
const stockOf = (p: PosProduct) => p.inventory?.quantity ?? 0

type Props = {
  /** "branch" = /branch/[code]/pos, "admin" = /dashboard/admin/pos (can pick a branch). */
  mode: "branch" | "admin"
  branchCode?: string
}

export function POSTerminal({ mode, branchCode }: Props) {
  const [products, setProducts] = useState<PosProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [categoryId, setCategoryId] = useState("all")
  const [cart, setCart] = useState<CartLine[]>([])
  const [cash, setCash] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [pickedBranchId, setPickedBranchId] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true)
    try {
      setProducts(await apiClient<PosProduct[]>("/v1/products"))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products")
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  // ---- Branch scope -------------------------------------------------------
  const branches = useMemo(() => {
    const seen = new Map<string, BranchInfo>()
    products.forEach((p) => { if (p.branch) seen.set(p.branch.id, p.branch) })
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [products])
  const multiBranch = branches.length > 0
  const activeBranch = multiBranch
    ? mode === "branch"
      ? branches.find((b) => b.code === branchCode)
      : branches.find((b) => b.id === pickedBranchId) ?? branches[0]
    : undefined

  const branchProducts = useMemo(
    () => products.filter((p) => p.active && (!multiBranch || p.branch?.id === activeBranch?.id)),
    [products, multiBranch, activeBranch?.id],
  )

  // ---- Catalog filters ----------------------------------------------------
  const categories = useMemo(() => {
    const seen = new Map<string, string>()
    branchProducts.forEach((p) => { if (p.category) seen.set(p.category.id, p.category.name) })
    return [...seen.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [branchProducts])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return branchProducts.filter((p) => {
      if (categoryId !== "all" && p.category?.id !== categoryId) return false
      if (!q) return true
      return [p.name, p.sku, p.barcode].some((v) => v?.toLowerCase().includes(q))
    })
  }, [branchProducts, categoryId, query])

  // ---- Cart ---------------------------------------------------------------
  const byId = useMemo(() => new Map(branchProducts.map((p) => [p.id, p])), [branchProducts])
  const lines = useMemo(
    () =>
      cart.flatMap((l) => {
        const product = byId.get(l.productId)
        if (!product) return []
        const quantity = Math.min(l.quantity, stockOf(product))
        return quantity > 0 ? [{ product, quantity }] : []
      }),
    [cart, byId],
  )
  const inCart = (id: string) => lines.find((l) => l.product.id === id)?.quantity ?? 0
  const itemCount = lines.reduce((n, l) => n + l.quantity, 0)
  const total = round2(lines.reduce((sum, l) => sum + Number(l.product.price) * l.quantity, 0))

  const cashNum = cash.trim() === "" ? null : Number(cash)
  const cashShort = cashNum !== null && (Number.isNaN(cashNum) || cashNum < total)
  const change = cashNum !== null && !Number.isNaN(cashNum) && cashNum >= total ? round2(cashNum - total) : null

  function add(p: PosProduct) {
    setReceipt(null)
    setCart((prev) => {
      const stock = stockOf(p)
      const found = prev.find((l) => l.productId === p.id)
      if (!found) return stock > 0 ? [...prev, { productId: p.id, quantity: 1 }] : prev
      if (found.quantity >= stock) return prev
      return prev.map((l) => (l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l))
    })
  }

  function setQty(p: PosProduct, qty: number) {
    setCart((prev) =>
      qty < 1
        ? prev.filter((l) => l.productId !== p.id)
        : prev.map((l) => (l.productId === p.id ? { ...l, quantity: Math.min(qty, stockOf(p)) } : l)),
    )
  }

  function clearSale() {
    setCart([])
    setCash("")
    setError("")
  }

  function switchBranch(id: string) {
    setPickedBranchId(id)
    setCategoryId("all")
    setQuery("")
    clearSale()
    setReceipt(null)
  }

  function onSearchKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return
    const q = query.trim().toLowerCase()
    if (!q) return
    // A barcode scanner types the code and presses Enter, so an exact SKU/barcode adds straight to the cart.
    const exact = branchProducts.find((p) => p.barcode?.toLowerCase() === q || p.sku?.toLowerCase() === q)
    const match = exact ?? (filtered.length === 1 ? filtered[0] : undefined)
    if (match && stockOf(match) > 0) {
      add(match)
      setQuery("")
    }
  }

  async function checkout() {
    if (lines.length === 0 || submitting) return
    setSubmitting(true)
    setError("")
    try {
      const sale = await apiClient<SaleResponse>("/v1/sales", {
        method: "POST",
        body: JSON.stringify({
          items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
          ...(multiBranch && activeBranch ? { branchId: activeBranch.id } : {}),
        }),
      })
      setReceipt({
        receiptNo: sale.receiptNo,
        total: Number(sale.total),
        items: sale.items.reduce((n, i) => n + i.quantity, 0),
        change,
      })
      setCart([])
      setCash("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete the sale")
    } finally {
      setSubmitting(false)
      // Re-read stock either way, so the grid shows what was deducted (or what is really left).
      load(false)
    }
  }

  function startNewSale() {
    setReceipt(null)
    searchRef.current?.focus()
  }

  const subtitle =
    mode === "branch"
      ? activeBranch?.name ?? "Process customer transactions"
      : activeBranch
        ? `Selling for ${activeBranch.name}`
        : "Process transactions from the admin console"

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Point of sale</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {mode === "admin" && branches.length > 1 && (
            <select
              aria-label="Branch"
              value={activeBranch?.id ?? ""}
              onChange={(e) => switchBranch(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
          <Button variant="outline" size="icon" aria-label="Refresh stock" onClick={() => { setError(""); load() }} disabled={loading}>
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {error && <p role="alert" className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Catalog */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKey}
              placeholder="Search by name, SKU or scan a barcode"
              aria-label="Search products"
              className="h-10 pl-9"
              autoFocus
            />
          </div>

          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Categories">
              {[{ id: "all", name: "All" }, ...categories].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={categoryId === c.id}
                  onClick={() => setCategoryId(c.id)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-sm transition-colors",
                    categoryId === c.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          ) : branchProducts.length === 0 ? (
            <EmptyState
              title="Nothing to sell yet"
              description="Add active products with stock in Products, then they will show up here."
              icon={<ShoppingCart className="size-10 text-muted-foreground/40" />}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No matching products"
              description="Try a different name, SKU or category."
              icon={<Search className="size-10 text-muted-foreground/40" />}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => {
                const stock = stockOf(p)
                const out = stock <= 0
                const low = !out && p.inventory ? stock <= p.inventory.minStock : false
                const count = inCart(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => add(p)}
                    disabled={out}
                    className={cn(
                      "relative flex min-h-28 flex-col justify-between gap-3 rounded-xl border bg-card p-3 text-left transition-colors",
                      "hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-card",
                      count > 0 && "border-primary ring-1 ring-primary",
                    )}
                  >
                    {count > 0 && (
                      <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {count}
                      </span>
                    )}
                    <div className={cn(count > 0 && "pr-7")}>
                      <p className="line-clamp-2 font-medium leading-snug">{p.name}</p>
                      {p.sku && <p className="mt-0.5 text-xs text-muted-foreground">{p.sku}</p>}
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <span className="text-base font-semibold tabular-nums">{money(Number(p.price))}</span>
                      {out ? (
                        <Badge variant="outline">Out of stock</Badge>
                      ) : low ? (
                        <Badge variant="destructive">{stock} left</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">{stock} in stock</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Cart */}
        <Card className="p-0 lg:sticky lg:top-4">
          {receipt && lines.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="size-6" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">Sale complete</h2>
              {receipt.receiptNo && <p className="mt-1 text-sm text-muted-foreground">Receipt {receipt.receiptNo}</p>}
              <p className="mt-5 text-3xl font-bold tabular-nums">{money(receipt.total)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{receipt.items} {receipt.items === 1 ? "item" : "items"}</p>
              {receipt.change !== null && receipt.change > 0 && (
                <p className="mt-4 rounded-md bg-muted px-3 py-2 text-sm">
                  Change due <span className="font-semibold tabular-nums">{money(receipt.change)}</span>
                </p>
              )}
              <Button className="mt-6 w-full" onClick={startNewSale}>New sale</Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h2 className="text-sm font-semibold">
                  Current sale{itemCount > 0 && <span className="ml-2 font-normal text-muted-foreground">{itemCount} {itemCount === 1 ? "item" : "items"}</span>}
                </h2>
                {lines.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearSale} disabled={submitting}>Clear</Button>
                )}
              </div>

              {lines.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <ShoppingCart className="mx-auto size-10 text-muted-foreground/30" />
                  <p className="mt-3 text-sm font-medium">No items yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Select a product to start a sale.</p>
                </div>
              ) : (
                <ul className="max-h-[44vh] divide-y overflow-y-auto">
                  {lines.map(({ product, quantity }) => (
                    <li key={product.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">{money(Number(product.price))} each</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon-sm" aria-label={`Remove one ${product.name}`} onClick={() => setQty(product, quantity - 1)}>
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="w-7 text-center text-sm font-medium tabular-nums" aria-live="polite">{quantity}</span>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          aria-label={`Add one ${product.name}`}
                          onClick={() => setQty(product, quantity + 1)}
                          disabled={quantity >= stockOf(product)}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                      <p className="w-16 text-right text-sm font-semibold tabular-nums">{money(Number(product.price) * quantity)}</p>
                      <Button variant="ghost" size="icon-sm" aria-label={`Remove ${product.name}`} onClick={() => setQty(product, 0)}>
                        <X className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-3 border-t px-4 py-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-2xl font-bold tabular-nums">{money(total)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="pos-cash" className="shrink-0 text-sm text-muted-foreground">Cash received</label>
                  <Input
                    id="pos-cash"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={cash}
                    onChange={(e) => setCash(e.target.value)}
                    placeholder="0.00"
                    disabled={lines.length === 0 || submitting}
                    className="h-9 text-right tabular-nums"
                  />
                  <Button variant="outline" size="sm" onClick={() => setCash(total.toFixed(2))} disabled={lines.length === 0 || submitting}>
                    Exact
                  </Button>
                </div>
                {cashNum !== null && lines.length > 0 && (
                  <p className={cn("text-right text-sm tabular-nums", cashShort ? "text-destructive" : "text-muted-foreground")}>
                    {cashShort
                      ? `Short by ${money(round2(total - (Number.isNaN(cashNum) ? 0 : cashNum)))}`
                      : `Change due ${money(change ?? 0)}`}
                  </p>
                )}

                <Button
                  size="lg"
                  className="h-11 w-full text-base"
                  onClick={checkout}
                  disabled={lines.length === 0 || submitting || (cashNum !== null && cashShort)}
                >
                  {submitting ? "Processing…" : lines.length === 0 ? "Charge" : `Charge ${money(total)}`}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  )
}
