"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BranchOption } from "./CategoryFormDialog"

export type CategoryOption = { id: string; name: string }

export type EditableProduct = {
  id: string
  name: string
  description: string | null
  price: number | string
  cost: number | string
  sku: string | null
  barcode: string | null
  taxable: boolean
  active: boolean
  categoryId: string | null
  branchId: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: EditableProduct | null
  branches: BranchOption[]
  categories: CategoryOption[]
  lockedBranchId?: string
  onSubmit: (data: Record<string, unknown>) => Promise<void>
}

const emptyForm = {
  name: "", description: "", price: "", cost: "", sku: "", barcode: "",
  taxable: true, active: true, categoryId: "", branchId: "",
  initialQuantity: "0", minStock: "0",
}

export function ProductFormDialog({ open, onOpenChange, product, branches, categories, lockedBranchId, onSubmit }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const isEditing = Boolean(product)
  const [form, setForm] = useState({ ...emptyForm, branchId: lockedBranchId ?? "" })

  useEffect(() => {
    if (!open) return
    setError("")
    setForm({
      name: product?.name ?? "",
      description: product?.description ?? "",
      price: product ? String(product.price) : "",
      cost: product ? String(product.cost) : "0",
      sku: product?.sku ?? "",
      barcode: product?.barcode ?? "",
      taxable: product?.taxable ?? true,
      active: product?.active ?? true,
      categoryId: product?.categoryId ?? "",
      branchId: lockedBranchId ?? product?.branchId ?? "",
      initialQuantity: "0",
      minStock: "0",
    })
  }, [open, product, lockedBranchId])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError("")
    try {
      const data: Record<string, unknown> = {
        name: form.name,
        description: form.description || null,
        price: Number(form.price),
        cost: Number(form.cost || 0),
        sku: form.sku || null,
        barcode: form.barcode || null,
        taxable: form.taxable,
        active: form.active,
        categoryId: form.categoryId || null,
      }
      if (!isEditing) {
        data.branchId = form.branchId || null
        data.initialQuantity = Number(form.initialQuantity || 0)
        data.minStock = Number(form.minStock || 0)
      }
      await onSubmit(data)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save product")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit product" : "Add product"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update this product's details." : "Create a product for the catalog."}
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-3" onSubmit={submit}>
          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="grid gap-1.5">
            <Label htmlFor="prod-name">Name</Label>
            <Input id="prod-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="prod-desc">Description</Label>
            <Input id="prod-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="prod-price">Price</Label>
              <Input id="prod-price" type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="prod-cost">Cost</Label>
              <Input id="prod-cost" type="number" step="0.01" min="0" value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="prod-sku">SKU</Label>
              <Input id="prod-sku" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="prod-barcode">Barcode</Label>
              <Input id="prod-barcode" value={form.barcode} onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="prod-category">Category</Label>
            <select
              id="prod-category"
              className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {!isEditing && !lockedBranchId && (
            <div className="grid gap-1.5">
              <Label htmlFor="prod-branch">Branch</Label>
              <select
                id="prod-branch"
                className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={form.branchId}
                onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
                required
              >
                <option value="">Select a branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                ))}
              </select>
            </div>
          )}

          {!isEditing && (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="prod-qty">Initial stock</Label>
                <Input id="prod-qty" type="number" min="0" value={form.initialQuantity} onChange={(e) => setForm((f) => ({ ...f, initialQuantity: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="prod-minstock">Min stock alert</Label>
                <Input id="prod-minstock" type="number" min="0" value={form.minStock} onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))} />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.taxable} onChange={(e) => setForm((f) => ({ ...f, taxable: e.target.checked }))} className="size-4 rounded border-input" />
              Taxable
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="size-4 rounded border-input" />
              Active
            </label>
          </div>

          <DialogFooter className="mt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : isEditing ? "Save changes" : "Create product"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
