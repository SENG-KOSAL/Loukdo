"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BranchOption } from "@/components/catalog/CategoryFormDialog"
import { money, type ProductOption, type PurchaseOrderRow, type VendorOption } from "./shared"

type Line = { key: number; productId: string; quantity: string; unitCost: string }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchaseOrder?: PurchaseOrderRow | null
  branches: BranchOption[]
  lockedBranchId?: string
  vendors: VendorOption[]
  products: ProductOption[]
  onSubmit: (data: Record<string, unknown>) => Promise<void>
}

let lineKey = 0
const newLine = (): Line => ({ key: ++lineKey, productId: "", quantity: "1", unitCost: "" })

const selectClass = "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"

export function PurchaseOrderFormDialog({ open, onOpenChange, purchaseOrder, branches, lockedBranchId, vendors, products, onSubmit }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const isEditing = Boolean(purchaseOrder)

  const [branchId, setBranchId] = useState(lockedBranchId ?? "")
  const [vendorId, setVendorId] = useState("")
  const [expectedDate, setExpectedDate] = useState("")
  const [tax, setTax] = useState("0")
  const [shipping, setShipping] = useState("0")
  const [notes, setNotes] = useState("")
  const [lines, setLines] = useState<Line[]>([newLine()])

  useEffect(() => {
    if (!open) return
    setError("")
    if (purchaseOrder) {
      setBranchId(purchaseOrder.branchId)
      setVendorId(purchaseOrder.vendorId)
      setExpectedDate(purchaseOrder.expectedDate ? purchaseOrder.expectedDate.slice(0, 10) : "")
      setTax(String(Number(purchaseOrder.tax)))
      setShipping(String(Number(purchaseOrder.shipping)))
      setNotes(purchaseOrder.notes ?? "")
      setLines(purchaseOrder.items.map((i) => ({
        key: ++lineKey,
        productId: i.productId,
        quantity: String(i.quantity),
        unitCost: String(Number(i.unitCost)),
      })))
    } else {
      setBranchId(lockedBranchId ?? "")
      setVendorId("")
      setExpectedDate("")
      setTax("0")
      setShipping("0")
      setNotes("")
      setLines([newLine()])
    }
  }, [open, purchaseOrder, lockedBranchId])

  const branchVendors = useMemo(
    () => vendors.filter((v) => v.branchId === branchId && (v.active || v.id === purchaseOrder?.vendorId)),
    [vendors, branchId, purchaseOrder],
  )
  const branchProducts = useMemo(
    () => products.filter((p) => p.branchId === branchId && p.active),
    [products, branchId],
  )

  const subtotal = lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitCost) || 0), 0)
  const total = subtotal + (Number(tax) || 0) + (Number(shipping) || 0)

  function updateLine(key: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  function pickProduct(key: number, productId: string) {
    const product = branchProducts.find((p) => p.id === productId)
    const line = lines.find((l) => l.key === key)
    // Pre-fill the unit cost from the product's cost, unless the user already typed one.
    const prefill = product && (!line?.unitCost || Number(line.unitCost) === 0) ? { unitCost: String(Number(product.cost)) } : {}
    updateLine(key, { productId, ...prefill })
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError("")

    const items = lines
      .filter((l) => l.productId)
      .map((l) => ({ productId: l.productId, quantity: Number(l.quantity), unitCost: Number(l.unitCost || 0) }))
    if (items.length === 0) { setError("Add at least one item"); return }
    if (items.some((i) => !Number.isInteger(i.quantity) || i.quantity < 1)) { setError("Quantities must be whole numbers of 1 or more"); return }

    setSaving(true)
    try {
      const data: Record<string, unknown> = {
        expectedDate: expectedDate || null,
        tax: Number(tax || 0),
        shipping: Number(shipping || 0),
        notes: notes || null,
        items,
      }
      if (!isEditing) {
        data.vendorId = vendorId
        data.branchId = branchId || null
      } else if (vendorId !== purchaseOrder?.vendorId) {
        data.vendorId = vendorId
      }
      await onSubmit(data)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save purchase order")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Edit ${purchaseOrder?.poNumber}` : "New purchase order"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Draft purchase orders can be edited until they are marked as ordered." : "Saved as a draft. Mark it as ordered when you send it to the vendor."}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-3" onSubmit={submit}>
          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="grid gap-3 sm:grid-cols-3">
            {!isEditing && !lockedBranchId && (
              <div className="grid gap-1.5">
                <Label htmlFor="po-branch">Branch</Label>
                <select
                  id="po-branch"
                  className={selectClass}
                  value={branchId}
                  onChange={(e) => { setBranchId(e.target.value); setVendorId(""); setLines([newLine()]) }}
                  required
                >
                  <option value="">Select a branch</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                </select>
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="po-vendor">Vendor</Label>
              <select id="po-vendor" className={selectClass} value={vendorId} onChange={(e) => setVendorId(e.target.value)} required disabled={!branchId}>
                <option value="">{branchId ? "Select a vendor" : "Select a branch first"}</option>
                {branchVendors.map((v) => <option key={v.id} value={v.id}>{v.name}{v.active ? "" : " (inactive)"}</option>)}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="po-expected">Expected date</Label>
              <Input id="po-expected" type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setLines((prev) => [...prev, newLine()])} disabled={!branchId}>
                <Plus className="size-3.5" /> Add item
              </Button>
            </div>
            <div className="grid gap-2">
              {lines.map((line) => {
                const lineTotal = (Number(line.quantity) || 0) * (Number(line.unitCost) || 0)
                return (
                  <div key={line.key} className="grid grid-cols-[1fr_5rem_6rem_5rem_2rem] items-center gap-2">
                    <select className={selectClass} value={line.productId} onChange={(e) => pickProduct(line.key, e.target.value)} disabled={!branchId}>
                      <option value="">{branchId ? "Select a product" : "Select a branch first"}</option>
                      {branchProducts.map((p) => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</option>)}
                    </select>
                    <Input type="number" min="1" step="1" aria-label="Quantity" value={line.quantity} onChange={(e) => updateLine(line.key, { quantity: e.target.value })} />
                    <Input type="number" min="0" step="0.01" aria-label="Unit cost" placeholder="Unit cost" value={line.unitCost} onChange={(e) => updateLine(line.key, { unitCost: e.target.value })} />
                    <span className="text-right text-sm text-muted-foreground">{money(lineTotal)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== line.key) : prev))}
                      disabled={lines.length === 1}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_8rem_8rem]">
            <div className="grid gap-1.5">
              <Label htmlFor="po-notes">Notes</Label>
              <Input id="po-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="po-tax">Tax</Label>
              <Input id="po-tax" type="number" min="0" step="0.01" value={tax} onChange={(e) => setTax(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="po-shipping">Shipping</Label>
              <Input id="po-shipping" type="number" min="0" step="0.01" value={shipping} onChange={(e) => setShipping(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-6 text-sm">
            <span className="text-muted-foreground">Subtotal: <span className="font-medium text-foreground">{money(subtotal)}</span></span>
            <span className="text-muted-foreground">Total: <span className="font-semibold text-foreground">{money(total)}</span></span>
          </div>

          <DialogFooter className="mt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : isEditing ? "Save changes" : "Create draft"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
