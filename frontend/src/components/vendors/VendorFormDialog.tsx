"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BranchOption } from "@/components/catalog/CategoryFormDialog"

export type EditableVendor = {
  id: string
  name: string
  code: string | null
  contactName: string | null
  email: string | null
  phone: string | null
  address: string | null
  paymentTerms: string | null
  notes: string | null
  active: boolean
  branchId: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendor?: EditableVendor | null
  branches: BranchOption[]
  lockedBranchId?: string
  onSubmit: (data: Record<string, unknown>) => Promise<void>
}

export function VendorFormDialog({ open, onOpenChange, vendor, branches, lockedBranchId, onSubmit }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const isEditing = Boolean(vendor)
  const [form, setForm] = useState({
    name: "", code: "", contactName: "", email: "", phone: "", address: "",
    paymentTerms: "", notes: "", active: true, branchId: lockedBranchId ?? "",
  })

  useEffect(() => {
    if (!open) return
    setError("")
    setForm({
      name: vendor?.name ?? "",
      code: vendor?.code ?? "",
      contactName: vendor?.contactName ?? "",
      email: vendor?.email ?? "",
      phone: vendor?.phone ?? "",
      address: vendor?.address ?? "",
      paymentTerms: vendor?.paymentTerms ?? "",
      notes: vendor?.notes ?? "",
      active: vendor?.active ?? true,
      branchId: lockedBranchId ?? vendor?.branchId ?? "",
    })
  }, [open, vendor, lockedBranchId])

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError("")
    try {
      const data: Record<string, unknown> = {
        name: form.name,
        code: form.code || null,
        contactName: form.contactName || null,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        paymentTerms: form.paymentTerms || null,
        notes: form.notes || null,
        active: form.active,
      }
      if (!isEditing) data.branchId = form.branchId || null
      await onSubmit(data)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save vendor")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit vendor" : "Add vendor"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update this vendor's details." : "Add a supplier you buy stock from."}
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-3" onSubmit={submit}>
          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="vendor-name">Name</Label>
              <Input id="vendor-name" value={form.name} onChange={set("name")} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="vendor-code">Code</Label>
              <Input id="vendor-code" value={form.code} onChange={set("code")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="vendor-contact">Contact person</Label>
              <Input id="vendor-contact" value={form.contactName} onChange={set("contactName")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="vendor-phone">Phone</Label>
              <Input id="vendor-phone" value={form.phone} onChange={set("phone")} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="vendor-email">Email</Label>
            <Input id="vendor-email" type="email" value={form.email} onChange={set("email")} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="vendor-address">Address</Label>
            <Input id="vendor-address" value={form.address} onChange={set("address")} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="vendor-terms">Payment terms</Label>
            <Input id="vendor-terms" placeholder="e.g. Net 30" value={form.paymentTerms} onChange={set("paymentTerms")} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="vendor-notes">Notes</Label>
            <Input id="vendor-notes" value={form.notes} onChange={set("notes")} />
          </div>

          {!isEditing && !lockedBranchId && (
            <div className="grid gap-1.5">
              <Label htmlFor="vendor-branch">Branch</Label>
              <select
                id="vendor-branch"
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

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="size-4 rounded border-input"
            />
            Active (can be used on new purchase orders)
          </label>

          <DialogFooter className="mt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : isEditing ? "Save changes" : "Create vendor"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
