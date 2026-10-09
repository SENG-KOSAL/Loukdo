"use client"

import { useCallback, useEffect, useState } from "react"
import { ClipboardList, Plus, RefreshCw, Store } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient } from "@/lib/api-client"
import { usePermissions } from "@/hooks/usePermissions"
import type { BranchOption } from "@/components/catalog/CategoryFormDialog"
import { PurchaseOrderFormDialog } from "./PurchaseOrderFormDialog"
import { PurchaseOrderReceiveDialog } from "./PurchaseOrderReceiveDialog"
import { PurchaseOrderDetailDialog } from "./PurchaseOrderDetailDialog"
import { formatDate, money, PurchaseOrderStatusBadge, type ProductOption, type PurchaseOrderRow, type VendorOption } from "./shared"

type Props = { mode: "admin" } | { mode: "branch"; branchCode: string }

export function PurchaseOrdersPanel(props: Props) {
  const isAdmin = props.mode === "admin"
  const branchCode = props.mode === "branch" ? props.branchCode : null

  const [orders, setOrders] = useState<PurchaseOrderRow[]>([])
  const [vendors, setVendors] = useState<VendorOption[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [branch, setBranch] = useState<BranchOption | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PurchaseOrderRow | null>(null)
  const [receiveOpen, setReceiveOpen] = useState(false)

  const { can, loading: permLoading } = usePermissions()
  const canManage = isAdmin || can("purchaseOrders.manage")
  const noAccess = !isAdmin && !permLoading && !can("purchaseOrders.manage")
  const selected = orders.find((o) => o.id === selectedId) ?? null

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      setOrders(await apiClient<PurchaseOrderRow[]>("/v1/purchase-orders"))
      if (branchCode) setBranch(await apiClient<BranchOption>(`/v1/branches?code=${branchCode}`))
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load purchase orders") }
    finally { setLoading(false) }
  }, [branchCode])
  useEffect(() => { load() }, [load])

  // Options for the create/edit form. Failures here are non-fatal (the form just shows empty lists).
  useEffect(() => {
    apiClient<VendorOption[]>("/v1/vendors").then(setVendors).catch(() => {})
    apiClient<ProductOption[]>("/v1/products").then(setProducts).catch(() => {})
    if (isAdmin) apiClient<BranchOption[]>("/v1/branches").then(setBranches).catch(() => {})
  }, [isAdmin])

  async function save(data: Record<string, unknown>) {
    await apiClient(`/v1/purchase-orders${editing ? `/${editing.id}` : ""}`, { method: editing ? "PATCH" : "POST", body: JSON.stringify(data) })
    await load()
  }

  async function changeStatus(po: PurchaseOrderRow, status: "ORDERED" | "CANCELLED") {
    const message = status === "ORDERED"
      ? `Mark ${po.poNumber} as ordered? It can no longer be edited.`
      : `Cancel ${po.poNumber}? This cannot be undone.`
    if (!window.confirm(message)) return
    try {
      await apiClient(`/v1/purchase-orders/${po.id}/status`, { method: "POST", body: JSON.stringify({ status }) })
      await load()
    } catch (err) { window.alert(err instanceof Error ? err.message : "Failed to update status") }
  }

  async function remove(po: PurchaseOrderRow) {
    if (!window.confirm(`Delete draft ${po.poNumber}? This cannot be undone.`)) return
    try {
      await apiClient(`/v1/purchase-orders/${po.id}`, { method: "DELETE" })
      setDetailOpen(false)
      await load()
    } catch (err) { window.alert(err instanceof Error ? err.message : "Failed to delete purchase order") }
  }

  async function receive(data: Record<string, unknown>) {
    if (!selected) return
    await apiClient(`/v1/purchase-orders/${selected.id}/receive`, { method: "POST", body: JSON.stringify(data) })
    await load()
    setDetailOpen(true)
  }

  function openDetail(po: PurchaseOrderRow) { setSelectedId(po.id); setDetailOpen(true) }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Purchase orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin ? "Stock orders across all branches." : "Order stock from vendors and receive it into inventory."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={load} disabled={loading}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /></Button>
          {canManage && <Button onClick={() => { setEditing(null); setFormOpen(true) }}><Plus className="size-4" /> New purchase order</Button>}
        </div>
      </div>

      {noAccess && (
        <p className="mb-4 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
          You don&apos;t have permission to manage purchase orders. Ask a super admin to grant it in Settings.
        </p>
      )}
      {error && !noAccess && <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-sm text-muted-foreground">Loading purchase orders…</div>
        ) : orders.length === 0 ? (
          <EmptyState title="No purchase orders yet" description="Create a purchase order to order stock from a vendor." icon={<ClipboardList className="size-12 text-muted-foreground/30" />} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO number</TableHead>
                <TableHead>Vendor</TableHead>
                {isAdmin && <TableHead>Branch</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell>
                    <p className="font-medium">{po.poNumber}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(po.orderDate)}</p>
                  </TableCell>
                  <TableCell className="text-sm">{po.vendor.name}</TableCell>
                  {isAdmin && (
                    <TableCell><span className="flex items-center gap-1.5 text-sm"><Store className="size-3.5 text-muted-foreground" />{po.branch?.name ?? "—"}</span></TableCell>
                  )}
                  <TableCell><PurchaseOrderStatusBadge status={po.status} /></TableCell>
                  <TableCell className="text-sm">{po.items.length}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(po.expectedDate)}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{money(po.total)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => openDetail(po)}>View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <PurchaseOrderDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        purchaseOrder={selected}
        canManage={canManage}
        showBranch={isAdmin}
        onEdit={(po) => { setDetailOpen(false); setEditing(po); setFormOpen(true) }}
        onDelete={remove}
        onMarkOrdered={(po) => changeStatus(po, "ORDERED")}
        onCancel={(po) => changeStatus(po, "CANCELLED")}
        onReceive={() => { setDetailOpen(false); setReceiveOpen(true) }}
      />

      {(isAdmin || branch) && (
        <PurchaseOrderFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          purchaseOrder={editing}
          branches={isAdmin ? branches : branch ? [branch] : []}
          lockedBranchId={branch?.id}
          vendors={vendors}
          products={products}
          onSubmit={save}
        />
      )}

      <PurchaseOrderReceiveDialog
        open={receiveOpen}
        onOpenChange={setReceiveOpen}
        purchaseOrder={selected}
        onSubmit={receive}
      />
    </>
  )
}
