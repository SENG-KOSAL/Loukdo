"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Users, UserPlus, Pencil, Trash2, RefreshCw } from "lucide-react"
import BranchLayout from "@/components/layouts/BranchLayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient } from "@/lib/api-client"
import { usePermissions } from "@/hooks/usePermissions"
import { UserFormDialog, type BranchOption, type EditableUser, type UserRole } from "@/components/users/UserFormDialog"

type StaffUser = EditableUser & { createdAt: string; branch: BranchOption | null }
const labels: Record<UserRole, string> = { SUPER_ADMIN: "Super Admin", BRANCH_ADMIN: "Branch Admin", MANAGER: "Manager", CASHIER: "Cashier" }

export default function BranchUsersPage() {
  const params = useParams()
  const branchCode = params.code as string
  const [branch, setBranch] = useState<BranchOption | null>(null)
  const [staff, setStaff] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EditableUser | null>(null)
  const { can, error: permError } = usePermissions()
  const canManage = can("users.manage")

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const [branchData, users] = await Promise.all([apiClient<BranchOption>(`/v1/branches?code=${branchCode}`), apiClient<StaffUser[]>("/v1/users")])
      setBranch(branchData); setStaff(users.filter((user) => user.branchId === branchData.id))
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load staff") }
    finally { setLoading(false) }
  }, [branchCode])
  useEffect(() => { if (canManage) load(); else setLoading(false) }, [canManage, load])

  async function save(data: Record<string, string | null>) {
    await apiClient(`/v1/users${editing ? `/${editing.id}` : ""}`, { method: editing ? "PATCH" : "POST", body: JSON.stringify(data) })
    await load()
  }
  async function remove(user: StaffUser) {
    if (!window.confirm(`Delete ${user.name || user.username}? This cannot be undone.`)) return
    try { await apiClient(`/v1/users/${user.id}`, { method: "DELETE" }); await load() }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to delete user") }
  }

  return (
    <BranchLayout>
      <div className="mb-6 flex items-center justify-between gap-3"><div><h1 className="text-2xl font-bold tracking-tight">Staff Management</h1><p className="mt-1 text-sm text-muted-foreground">Manage staff for this branch only.</p></div>{canManage && <div className="flex gap-2"><Button variant="outline" size="icon" onClick={load} disabled={loading}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /></Button><Button onClick={() => { setEditing(null); setDialogOpen(true) }}><UserPlus className="size-4" /> Add staff</Button></div>}</div>
      {error && <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {permError && <p className="mb-4 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">Couldn&apos;t verify your permissions ({permError}) — showing view-only. Refresh to try again.</p>}
      {!canManage ? <EmptyState title="Staff management is restricted" description="Only a branch administrator can manage staff accounts." icon={<Users className="size-12 text-muted-foreground/30" />} /> : <Card className="overflow-hidden">{loading ? <div className="p-8 text-sm text-muted-foreground">Loading staff…</div> : staff.length === 0 ? <EmptyState title="No staff users" description="Create a cashier, manager, or branch admin for this branch." icon={<Users className="size-12 text-muted-foreground/30" />} /> : <Table><TableHeader><TableRow><TableHead>Staff member</TableHead><TableHead>Role</TableHead><TableHead>Joined</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{staff.map((user) => <TableRow key={user.id}><TableCell><p className="font-medium">{user.name || user.username}</p><p className="text-xs text-muted-foreground">{user.email}</p></TableCell><TableCell><Badge variant={user.role === "BRANCH_ADMIN" ? "secondary" : "outline"}>{labels[user.role]}</Badge></TableCell><TableCell className="text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon-sm" onClick={() => { setEditing(user); setDialogOpen(true) }}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => remove(user)}><Trash2 className="size-4" /></Button></TableCell></TableRow>)}</TableBody></Table>}</Card>}
      {branch && <UserFormDialog open={dialogOpen} onOpenChange={setDialogOpen} user={editing} branches={[branch]} lockedBranchId={branch.id} allowedRoles={["BRANCH_ADMIN", "MANAGER", "CASHIER"]} onSubmit={save} />}
    </BranchLayout>
  )
}
