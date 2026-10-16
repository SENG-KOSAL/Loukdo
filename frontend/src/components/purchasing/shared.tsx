"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type PurchaseOrderStatus = "DRAFT" | "ORDERED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED"

export type PurchaseOrderItemRow = {
  id: string
  quantity: number
  receivedQuantity: number
  unitCost: number | string
  total: number | string
  productId: string
  product: { id: string; name: string; sku: string | null }
}

export type PurchaseOrderRow = {
  id: string
  poNumber: string
  status: PurchaseOrderStatus
  orderDate: string
  expectedDate: string | null
  receivedAt: string | null
  subtotal: number | string
  tax: number | string
  shipping: number | string
  total: number | string
  notes: string | null
  vendorId: string
  vendor: { id: string; name: string; code: string | null }
  branchId: string
  branch?: { id: string; name: string; code: string }
  items: PurchaseOrderItemRow[]
}

export type VendorOption = { id: string; name: string; active: boolean; branchId: string }
export type ProductOption = { id: string; name: string; sku: string | null; cost: number | string; active: boolean; branchId: string }

export type StockMovementType = "PURCHASE_RECEIPT" | "PURCHASE_ORDER_STATUS"
export type StockMovementStatus = "PENDING" | "COMPLETED" | "CANCELLED" | "REVERSED"

export type StockMovementRow = {
  id: string
  type: StockMovementType
  status: StockMovementStatus
  quantity: number
  quantityBefore: number
  quantityAfter: number
  note: string | null
  productId: string
  product: { id: string; name: string; sku: string | null }
  purchaseOrderId: string | null
  purchaseOrder: { id: string; poNumber: string } | null
  branchId: string
  branch: { id: string; name: string; code: string }
  createdById: string | null
  createdBy: { id: string; name: string; username: string } | null
  createdAt: string
}

const statusLabels: Record<PurchaseOrderStatus, string> = {
  DRAFT: "Draft",
  ORDERED: "Ordered",
  PARTIALLY_RECEIVED: "Partially received",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
}

export function PurchaseOrderStatusBadge({ status }: { status: PurchaseOrderStatus }) {
  const variant =
    status === "DRAFT" ? "outline"
    : status === "ORDERED" ? "default"
    : status === "CANCELLED" ? "destructive"
    : "secondary"
  return (
    <Badge variant={variant} className={cn(status === "RECEIVED" && "text-emerald-700 dark:text-emerald-400")}>
      {statusLabels[status]}
    </Badge>
  )
}

const stockMovementStatusLabels: Record<StockMovementStatus, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REVERSED: "Reversed",
}

export function StockMovementStatusBadge({ status }: { status: StockMovementStatus }) {
  const variant =
    status === "PENDING" ? "outline"
    : status === "CANCELLED" ? "destructive"
    : status === "REVERSED" ? "secondary"
    : "default"
  return <Badge variant={variant}>{stockMovementStatusLabels[status]}</Badge>
}

export const money = (n: number | string) => `$${Number(n).toFixed(2)}`

export const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString() : "—")
