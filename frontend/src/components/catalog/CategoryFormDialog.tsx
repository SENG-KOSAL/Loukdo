"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type BranchOption = { id: string; name: string; code: string }

export type EditableCategory = {
  id: string
  name: string
  desc: string | null
  active: boolean
  branchId: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: EditableCategory | null
  branches: BranchOption[]
  lockedBranchId?: string
  onSubmit: (data: Record<string, unknown>) => Promise<void>
}

export function CategoryFormDialog({ open, onOpenChange, category, branches, lockedBranchId, onSubmit }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const isEditing = Boolean(category)
  const [form, setForm] = useState({ name: "", desc: "", active: true, branchId: lockedBranchId ?? "" })

  useEffect(() => {
    if (!open) return
    setError("")
    setForm({
      name: category?.name ?? "",
      desc: category?.desc ?? "",
      active: category?.active ?? true,
      branchId: lockedBranchId ?? category?.branchId ?? "",
    })
  }, [open, category, lockedBranchId])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError("")
    try {
      const data: Record<string, unknown> = { name: form.name, desc: form.desc || null, active: form.active }
      if (!isEditing) data.branchId = form.branchId || null
      await onSubmit(data)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save category")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit category" : "Add category"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update this category's details." : "Create a category to organize products."}
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-3" onSubmit={submit}>
          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <div className="grid gap-1.5">
            <Label htmlFor="cat-name">Name</Label>
            <Input id="cat-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cat-desc">Description</Label>
            <Input id="cat-desc" value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} />
          </div>
          {!isEditing && !lockedBranchId && (
            <div className="grid gap-1.5">
              <Label htmlFor="cat-branch">Branch</Label>
              <select
                id="cat-branch"
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
            Active (visible in POS and product lists)
          </label>
          <DialogFooter className="mt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : isEditing ? "Save changes" : "Create category"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
