"use client"

import { useCallback, useEffect, useState } from "react"
import { Truck, Plus, Pencil, Trash2, RefreshCw, Store } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient } from "@/lib/api-client"
import { usePermissions } from "@/hooks/usePermissions"
import type { BranchOption } from "@/components/catalog/CategoryFormDialog"
import { VendorFormDialog, type EditableVendor } from "./VendorFormDialog"

type VendorRow = EditableVendor & {
  branch?: BranchOption
  _count?: { purchaseOrders: number }
}

type Props = { mode: "admin" } | { mode: "branch"; branchCode: string }

export function VendorsPanel(props: Props) {
  const isAdmin = props.mode === "admin"
  const branchCode = props.mode === "branch" ? props.branchCode : null

  const [vendors, setVendors] = useState<VendorRow[]>([])
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [branch, setBranch] = useState<BranchOption | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EditableVendor | null>(null)
  const { can, loading: permLoading } = usePermissions()
  const canManage = isAdmin || can("vendors.manage")

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      setVendors(await apiClient<VendorRow[]>("/v1/vendors"))
      if (branchCode) setBranch(await apiClient<BranchOption>(`/v1/branches?code=${branchCode}`))
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load vendors") }
    finally { setLoading(false) }
  }, [branchCode])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (isAdmin) apiClient<BranchOption[]>("/v1/branches").then(setBranches).catch(() => {})
  }, [isAdmin])

  async function save(data: Record<string, unknown>) {
    await apiClient(`/v1/vendors${editing ? `/${editing.id}` : ""}`, { method: editing ? "PATCH" : "POST", body: JSON.stringify(data) })
    await load()
  }
  async function remove(v: VendorRow) {
    if (!window.confirm(`Delete "${v.name}"? This cannot be undone.`)) return
    try { await apiClient(`/v1/vendors/${v.id}`, { method: "DELETE" }); await load() }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to delete vendor") }
  }

  const noAccess = !isAdmin && !permLoading && !can("vendors.manage")

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Vendors</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin ? "Suppliers across all branches." : "Suppliers you buy stock from for this branch."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={load} disabled={loading}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /></Button>
          {canManage && <Button onClick={() => { setEditing(null); setDialogOpen(true) }}><Plus className="size-4" /> Add vendor</Button>}
        </div>
      </div>

      {noAccess && (
        <p className="mb-4 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
          You don&apos;t have permission to manage vendors. Ask a super admin to grant it in Settings.
        </p>
      )}
      {error && !noAccess && <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-sm text-muted-foreground">Loading vendors…</div>
        ) : vendors.length === 0 ? (
          <EmptyState title="No vendors yet" description="Add a vendor to start creating purchase orders." icon={<Truck className="size-12 text-muted-foreground/30" />} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                {isAdmin && <TableHead>Branch</TableHead>}
                <TableHead>Contact</TableHead>
                <TableHead>Payment terms</TableHead>
                <TableHead>POs</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <p className="font-medium">{v.name}</p>
                    {v.code && <p className="text-xs text-muted-foreground">Code: {v.code}</p>}
                  </TableCell>
                  {isAdmin && (
                    <TableCell><span className="flex items-center gap-1.5 text-sm"><Store className="size-3.5 text-muted-foreground" />{v.branch?.name ?? "—"}</span></TableCell>
                  )}
                  <TableCell className="text-sm">
                    {v.contactName && <p>{v.contactName}</p>}
                    {v.phone && <p className="text-xs text-muted-foreground">{v.phone}</p>}
                    {v.email && <p className="text-xs text-muted-foreground">{v.email}</p>}
                    {!v.contactName && !v.phone && !v.email && "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{v.paymentTerms || "—"}</TableCell>
                  <TableCell className="text-sm">{v._count?.purchaseOrders ?? 0}</TableCell>
                  <TableCell><Badge variant={v.active ? "secondary" : "outline"}>{v.active ? "Active" : "Inactive"}</Badge></TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(v); setDialogOpen(true) }}><Pencil className="size-4" /></Button>
                      <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => remove(v)}><Trash2 className="size-4" /></Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {(isAdmin || branch) && (
        <VendorFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          vendor={editing}
          branches={isAdmin ? branches : branch ? [branch] : []}
          lockedBranchId={branch?.id}
          onSubmit={save}
        />
      )}
    </>
  )
}
