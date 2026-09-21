"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type EditableInventory = {
  id: string
  quantity: number
  minStock: number
  product: { id: string; name: string; sku: string | null }
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: EditableInventory | null
  onSubmit: (data: Record<string, unknown>) => Promise<void>
}

export function InventoryAdjustDialog({ open, onOpenChange, item, onSubmit }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [mode, setMode] = useState<"set" | "adjust">("adjust")
  const [quantity, setQuantity] = useState("0")
  const [adjustBy, setAdjustBy] = useState("0")
  const [minStock, setMinStock] = useState("0")

  useEffect(() => {
    if (!open || !item) return
    setError("")
    setMode("adjust")
    setQuantity(String(item.quantity))
    setAdjustBy("0")
    setMinStock(String(item.minStock))
  }, [open, item])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError("")
    try {
      const data: Record<string, unknown> =
        mode === "adjust"
          ? { adjustBy: Number(adjustBy || 0), minStock: Number(minStock) }
          : { quantity: Number(quantity), minStock: Number(minStock) }
      await onSubmit(data)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update stock")
    } finally {
      setSaving(false)
    }
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>{item.product.name}{item.product.sku ? ` · ${item.product.sku}` : ""}</DialogDescription>
        </DialogHeader>
        <form className="grid gap-3" onSubmit={submit}>
          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 rounded-lg bg-muted p-1 text-sm">
            <button type="button" onClick={() => setMode("adjust")} className={`flex-1 rounded-md py-1.5 ${mode === "adjust" ? "bg-background shadow" : "text-muted-foreground"}`}>+/- Adjust</button>
            <button type="button" onClick={() => setMode("set")} className={`flex-1 rounded-md py-1.5 ${mode === "set" ? "bg-background shadow" : "text-muted-foreground"}`}>Set exact</button>
          </div>

          {mode === "adjust" ? (
            <div className="grid gap-1.5">
              <Label htmlFor="inv-adjust">Change quantity by</Label>
              <Input id="inv-adjust" type="number" value={adjustBy} onChange={(e) => setAdjustBy(e.target.value)} placeholder="e.g. -5 or 20" />
              <p className="text-xs text-muted-foreground">Current: {item.quantity}. Negative removes stock, positive restocks.</p>
            </div>
          ) : (
            <div className="grid gap-1.5">
              <Label htmlFor="inv-qty">New quantity</Label>
              <Input id="inv-qty" type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="inv-minstock">Minimum stock alert</Label>
            <Input id="inv-minstock" type="number" min="0" value={minStock} onChange={(e) => setMinStock(e.target.value)} />
          </div>

          <DialogFooter className="mt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Update stock"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
