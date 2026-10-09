"use client"

import { useEffect, useState } from "react"
import { PackageCheck, Pencil, Send, Trash2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient } from "@/lib/api-client"
import { formatDate, money, PurchaseOrderStatusBadge, StockMovementStatusBadge, type PurchaseOrderRow, type StockMovementStatus } from "./shared"

type Movement = {
  id: string
  status: StockMovementStatus
  quantity: number
  quantityBefore: number
  quantityAfter: number
  note: string | null
  createdAt: string
  product: { id: string; name: string }
  createdBy: { id: string; name: string | null; username: string } | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchaseOrder: PurchaseOrderRow | null
  canManage: boolean
  showBranch?: boolean
  onEdit: (po: PurchaseOrderRow) => void
  onDelete: (po: PurchaseOrderRow) => void
  onMarkOrdered: (po: PurchaseOrderRow) => void
  onCancel: (po: PurchaseOrderRow) => void
  onReceive: (po: PurchaseOrderRow) => void
}

export function PurchaseOrderDetailDialog({ open, onOpenChange, purchaseOrder: po, canManage, showBranch, onEdit, onDelete, onMarkOrdered, onCancel, onReceive }: Props) {
  const [movements, setMovements] = useState<Movement[]>([])

  const receivedTotal = po?.items.reduce((sum, i) => sum + i.receivedQuantity, 0) ?? 0

  useEffect(() => {
    if (!open || !po) return
    let cancelled = false
    apiClient<Movement[]>(`/v1/stock-movements?purchaseOrderId=${po.id}`)
      .then((rows) => { if (!cancelled) setMovements(rows) })
      .catch(() => { if (!cancelled) setMovements([]) })
    return () => { cancelled = true }
  }, [open, po?.id, po?.status, receivedTotal]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!po) return null

  const canReceive = po.status === "ORDERED" || po.status === "PARTIALLY_RECEIVED"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{po.poNumber} <PurchaseOrderStatusBadge status={po.status} /></DialogTitle>
          <DialogDescription>
            {po.vendor.name}{showBranch && po.branch ? ` · ${po.branch.name}` : ""} · Ordered {formatDate(po.orderDate)}
            {po.expectedDate ? ` · Expected ${formatDate(po.expectedDate)}` : ""}
            {po.receivedAt ? ` · Received ${formatDate(po.receivedAt)}` : ""}
          </DialogDescription>
        </DialogHeader>

        {canManage && (
          <div className="flex flex-wrap gap-2">
            {po.status === "DRAFT" && (
              <>
                <Button size="sm" onClick={() => onMarkOrdered(po)}><Send className="size-3.5" /> Mark as ordered</Button>
                <Button size="sm" variant="outline" onClick={() => onEdit(po)}><Pencil className="size-3.5" /> Edit</Button>
              </>
            )}
            {canReceive && <Button size="sm" onClick={() => onReceive(po)}><PackageCheck className="size-3.5" /> Receive stock</Button>}
            {(po.status === "DRAFT" || po.status === "ORDERED") && (
              <Button size="sm" variant="outline" onClick={() => onCancel(po)}><XCircle className="size-3.5" /> Cancel order</Button>
            )}
            {po.status === "DRAFT" && (
              <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => onDelete(po)}><Trash2 className="size-3.5" /> Delete</Button>
            )}
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Ordered</TableHead>
              <TableHead className="text-right">Received</TableHead>
              <TableHead className="text-right">Unit cost</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {po.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <p className="font-medium">{item.product.name}</p>
                  {item.product.sku && <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>}
                </TableCell>
                <TableCell className="text-right text-sm">{item.quantity}</TableCell>
                <TableCell className="text-right text-sm">{item.receivedQuantity}</TableCell>
                <TableCell className="text-right text-sm">{money(item.unitCost)}</TableCell>
                <TableCell className="text-right text-sm font-medium">{money(item.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="ml-auto grid w-full max-w-xs gap-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{money(po.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{money(po.tax)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{money(po.shipping)}</span></div>
          <div className="flex justify-between border-t pt-1 font-semibold"><span>Total</span><span>{money(po.total)}</span></div>
        </div>

        {po.notes && <p className="rounded-md bg-muted px-3 py-2 text-sm"><span className="font-medium">Notes: </span>{po.notes}</p>}

        <div className="grid gap-2">
          <h3 className="text-sm font-semibold">Stock movements</h3>
          {movements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stock has been received yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm">
                      {new Date(m.createdAt).toLocaleString()}
                      {m.note && <p className="text-xs text-muted-foreground">{m.note}</p>}
                    </TableCell>
                    <TableCell className="text-sm">{m.product.name}</TableCell>
                    <TableCell><StockMovementStatusBadge status={m.status} /></TableCell>
                    <TableCell className="text-right text-sm font-medium text-emerald-700 dark:text-emerald-400">+{m.quantity}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{m.quantityBefore} → {m.quantityAfter}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.createdBy?.name || m.createdBy?.username || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
