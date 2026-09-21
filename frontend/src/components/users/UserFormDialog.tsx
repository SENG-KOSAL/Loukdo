"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type UserRole = "SUPER_ADMIN" | "BRANCH_ADMIN" | "MANAGER" | "CASHIER"

export type EditableUser = {
  id: string
  name: string | null
  username: string
  email: string
  role: UserRole
  branchId: string | null
}

export type BranchOption = { id: string; name: string; code: string }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: EditableUser | null
  branches: BranchOption[]
  allowedRoles: UserRole[]
  lockedBranchId?: string
  onSubmit: (data: Record<string, string | null>) => Promise<void>
}

const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  BRANCH_ADMIN: "Branch Admin",
  MANAGER: "Manager",
  CASHIER: "Cashier",
}

export function UserFormDialog({ open, onOpenChange, user, branches, allowedRoles, lockedBranchId, onSubmit }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const isEditing = Boolean(user)
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "", role: allowedRoles[0], branchId: lockedBranchId ?? "" })

  useEffect(() => {
    if (!open) return
    setError("")
    setForm({
      name: user?.name ?? "",
      username: user?.username ?? "",
      email: user?.email ?? "",
      password: "",
      role: user?.role && allowedRoles.includes(user.role) ? user.role : allowedRoles[0],
      branchId: lockedBranchId ?? user?.branchId ?? "",
    })
  }, [open, user, allowedRoles, lockedBranchId])

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError("")
    try {
      const data: Record<string, string | null> = { ...form, branchId: form.branchId || null }
      if (isEditing && !data.password) delete data.password
      await onSubmit(data)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save user")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit user" : "Add user"}</DialogTitle>
          <DialogDescription>{isEditing ? "Update this staff member's details and access." : "Create a staff account and choose its access level."}</DialogDescription>
        </DialogHeader>
        <form className="grid gap-3" onSubmit={submit}>
          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <div className="grid gap-1.5"><Label htmlFor="user-name">Name</Label><Input id="user-name" value={form.name} onChange={(e) => update("name", e.target.value)} required /></div>
          <div className="grid gap-1.5"><Label htmlFor="user-username">Username</Label><Input id="user-username" value={form.username} onChange={(e) => update("username", e.target.value)} required /></div>
          <div className="grid gap-1.5"><Label htmlFor="user-email">Email</Label><Input id="user-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required /></div>
          <div className="grid gap-1.5"><Label htmlFor="user-password">{isEditing ? "New password (optional)" : "Password"}</Label><Input id="user-password" type="password" minLength={6} value={form.password} onChange={(e) => update("password", e.target.value)} required={!isEditing} /></div>
          <div className="grid gap-1.5"><Label htmlFor="user-role">Role</Label><select id="user-role" className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm" value={form.role} onChange={(e) => update("role", e.target.value)}>{allowedRoles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></div>
          <div className="grid gap-1.5"><Label htmlFor="user-branch">Branch</Label><select id="user-branch" className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm disabled:opacity-60" value={form.branchId} onChange={(e) => update("branchId", e.target.value)} disabled={Boolean(lockedBranchId)} required={form.role !== "SUPER_ADMIN"}>{!lockedBranchId && <option value="">No branch (super admin only)</option>}{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>)}</select></div>
          <DialogFooter className="mt-1"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving..." : isEditing ? "Save changes" : "Create user"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
