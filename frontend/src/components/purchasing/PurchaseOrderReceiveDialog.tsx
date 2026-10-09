"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { PurchaseOrderRow } from "./shared"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchaseOrder: PurchaseOrderRow | null
  onSubmit: (data: Record<string, unknown>) => Promise<void>
}

export function PurchaseOrderReceiveDialog({ open, onOpenChange, purchaseOrder, onSubmit }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [note, setNote] = useState("")

  useEffect(() => {
    if (!open) return
    setError("")
    setQuantities({})
    setNote("")
  }, [open, purchaseOrder])

  const receivable = (purchaseOrder?.items ?? []).filter((i) => i.quantity - i.receivedQuantity > 0)

  function fillRemaining() {
    setQuantities(Object.fromEntries(receivable.map((i) => [i.id, String(i.quantity - i.receivedQuantity)])))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError("")

    const items: { itemId: string; quantity: number }[] = []
    for (const item of receivable) {
      const qty = Number(quantities[item.id] || 0)
      if (!qty) continue
      const remaining = item.quantity - item.receivedQuantity
      if (!Number.isInteger(qty) || qty < 1 || qty > remaining) {
        setError(`"${item.product.name}": enter a whole number between 1 and ${remaining}`)
        return
      }
      items.push({ itemId: item.id, quantity: qty })
    }
    if (items.length === 0) { setError("Enter a received quantity for at least one item"); return }

    setSaving(true)
    try {
      await onSubmit({ items, note: note || null })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not receive stock")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Receive stock{purchaseOrder ? ` — ${purchaseOrder.poNumber}` : ""}</DialogTitle>
          <DialogDescription>
            Enter how many units arrived. Inventory is increased and a stock movement is recorded for each line. You can receive the rest later.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-3" onSubmit={submit}>
          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="grid gap-2">
            <div className="grid grid-cols-[1fr_5rem_5rem_6rem] gap-2 text-xs font-medium text-muted-foreground">
              <span>Product</span><span className="text-right">Ordered</span><span className="text-right">Received</span><span className="text-right">Receive now</span>
            </div>
            {receivable.map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_5rem_5rem_6rem] items-center gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.product.name}</p>
                  {item.product.sku && <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>}
                </div>
                <span className="text-right text-sm">{item.quantity}</span>
                <span className="text-right text-sm text-muted-foreground">{item.receivedQuantity}</span>
                <Input
                  type="number"
                  min="0"
                  max={item.quantity - item.receivedQuantity}
                  step="1"
                  aria-label={`Receive ${item.product.name}`}
                  value={quantities[item.id] ?? ""}
                  onChange={(e) => setQuantities((q) => ({ ...q, [item.id]: e.target.value }))}
                />
              </div>
            ))}
            {receivable.length === 0 && <p className="text-sm text-muted-foreground">Everything on this order has been received.</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="receive-note">Note (optional)</Label>
            <Input id="receive-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Delivery note #123" />
          </div>

          <DialogFooter className="mt-1">
            <Button type="button" variant="outline" onClick={fillRemaining} disabled={receivable.length === 0}>Fill remaining</Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || receivable.length === 0}>{saving ? "Receiving..." : "Receive stock"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
