"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Copy, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import { apiClient } from "@/lib/api-client"
import { cn } from "@/lib/utils"

interface Branch {
  id: string
  name: string
  code: string
  url: string | null
  adminName: string | null
  adminEmail: string | null
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
  users: { username: string; email: string }[]
  createdAt: string
  updatedAt: string
}

interface CreateResult {
  id: string
  name: string
  code: string
  url: string | null
  status: string
  adminPassword: string | null
  adminUsername: string | null
}

const statusLabel: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
}

const statusBadge: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 hover:bg-green-100",
  INACTIVE: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  SUSPENDED: "bg-red-100 text-red-800 hover:bg-red-100",
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [open, setOpen] = useState(false)
  const [credentials, setCredentials] = useState<CreateResult | null>(null)
  const [detail, setDetail] = useState<Branch | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null)
  const [duplicateTarget, setDuplicateTarget] = useState<Branch | null>(null)
  const [form, setForm] = useState({
    name: "", code: "", url: "", adminUsername: "", adminPassword: "", status: "ACTIVE",
  })
  const [dupForm, setDupForm] = useState({ name: "", adminUsername: "", adminPassword: "" })
  const [error, setError] = useState("")

  const slug = (s: string, max: number) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, max) || ""

  const updateName = (name: string) => {
    setForm((prev) => ({ ...prev, name, url: slug(name, 30), code: slug(name, 20) }))
  }

  const fetchBranches = useCallback(async () => {
    try {
      const data = await apiClient<Branch[]>("/branches")
      setBranches(data)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchBranches()
  }, [fetchBranches])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await apiClient(`/branches/${deleteTarget.id}`, { method: "DELETE" })
      setDeleteTarget(null)
      setDetail(null)
      await fetchBranches()
    } catch {
      setError("Failed to delete branch")
    }
  }

  const handleDuplicate = async () => {
    if (!duplicateTarget) return
    setError("")
    try {
      const result = await apiClient<CreateResult>(`/branches/${duplicateTarget.id}`, {
        method: "POST",
        body: JSON.stringify(dupForm),
      })
      setDuplicateTarget(null)
      setDupForm({ name: "", adminUsername: "", adminPassword: "" })
      setCredentials(result)
      await fetchBranches()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate branch")
    }
  }

  const openDuplicate = (b: Branch) => {
    setDuplicateTarget(b)
    setDupForm({ name: `${b.name} (copy)`, adminUsername: "", adminPassword: "" })
  }

  const handleCreate = async () => {
    setError("")
    try {
      const result = await apiClient<CreateResult>("/branches", {
        method: "POST",
        body: JSON.stringify(form),
      })
      setOpen(false)
      setCredentials(result)
      setForm({ name: "", code: "", url: "", adminUsername: "", adminPassword: "", status: "ACTIVE" })
      await fetchBranches()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create branch")
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Branches</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Branch
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Login URL</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No branches yet.
                </TableCell>
              </TableRow>
            ) : (
              branches.map((b) => (
                <TableRow
                  key={b.id}
                  className="cursor-pointer"
                  onClick={() => setDetail(b)}
                >
                  <TableCell className="font-mono text-xs">{b.code}</TableCell>
                  <TableCell>{b.name}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">
                      /branch/{b.code}/login
                    </span>
                  </TableCell>
                  <TableCell>
                    {b.users.length > 0
                      ? b.users.map((u) => u.username).join(", ")
                      : b.adminName || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("font-normal", statusBadge[b.status])}>
                      {statusLabel[b.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost" size="icon"
                      onClick={(e) => { e.stopPropagation(); openDuplicate(b) }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(b) }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Branch</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Branch Name <span className="text-destructive">*</span></Label>
              <Input id="name" value={form.name} onChange={(e) => updateName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Branch Code</Label>
              <Input id="code" value={form.code} readOnly className="bg-muted" />
              <p className="text-xs text-muted-foreground">Auto-generated from branch name</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL / Subdomain</Label>
              <Input id="url" value={form.url} readOnly className="bg-muted" />
              <p className="text-xs text-muted-foreground">Auto-generated from branch name</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminUsername">Admin Username <span className="text-destructive">*</span></Label>
              <Input id="adminUsername" value={form.adminUsername}
                onChange={(e) => setForm({ ...form, adminUsername: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminPassword">Admin Password <span className="text-destructive">*</span></Label>
              <Input id="adminPassword" type="password" value={form.adminPassword}
                onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={form.status ?? "ACTIVE"} onValueChange={(v) => setForm({ ...form, status: v ?? "ACTIVE" })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}
              disabled={!form.name || !form.adminUsername || !form.adminPassword}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog open={!!credentials} onOpenChange={(o) => { if (!o) setCredentials(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Branch Created</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="font-semibold text-lg">{credentials?.name}</p>
            <p className="text-sm">
              Login URL: <span className="font-mono font-semibold">/branch/{credentials?.code}/login</span>
            </p>
            {credentials?.adminUsername && (
              <div className="rounded-md border bg-muted/50 p-3 space-y-1 text-sm">
                <p className="font-medium">Admin Credentials</p>
                <p>Username: <span className="font-semibold">{credentials.adminUsername}</span></p>
                <p>Password: <span className="font-semibold">{credentials.adminPassword}</span></p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setCredentials(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Branch</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete <span className="font-semibold">{deleteTarget?.name}</span>?</p>
          <p className="text-sm text-destructive">
            This will also remove all users and sales data for this branch.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Dialog */}
      <Dialog open={!!duplicateTarget} onOpenChange={(o) => { if (!o) setDuplicateTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Branch</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="dup-name">Branch Name <span className="text-destructive">*</span></Label>
              <Input id="dup-name" value={dupForm.name}
                onChange={(e) => setDupForm({ ...dupForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dup-username">Admin Username <span className="text-destructive">*</span></Label>
              <Input id="dup-username" value={dupForm.adminUsername}
                onChange={(e) => setDupForm({ ...dupForm, adminUsername: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dup-password">Admin Password <span className="text-destructive">*</span></Label>
              <Input id="dup-password" type="password" value={dupForm.adminPassword}
                onChange={(e) => setDupForm({ ...dupForm, adminPassword: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateTarget(null)}>Cancel</Button>
            <Button onClick={handleDuplicate}
              disabled={!dupForm.name || !dupForm.adminUsername || !dupForm.adminPassword}>
              Duplicate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Branch Details</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">{detail.name}</p>
                <Badge className={cn("font-normal", statusBadge[detail.status])}>
                  {statusLabel[detail.status]}
                </Badge>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Branch Info</p>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Code:</span> {detail.code}</p>
                  <p><span className="font-medium">URL:</span> {detail.url || "-"}</p>
                  <p><span className="font-medium">Login:</span> /branch/{detail.code}/login</p>
                  <p><span className="font-medium">Created:</span> {new Date(detail.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Admin Account</p>
                {detail.users.length > 0 ? (
                  detail.users.map((u) => (
                    <div key={u.username} className="text-sm space-y-1">
                      <p><span className="font-medium">Username:</span> {u.username}</p>
                      <p><span className="font-medium">Email:</span> {u.email}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No admin created yet</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetail(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
