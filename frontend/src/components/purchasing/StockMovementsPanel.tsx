"use client"

import { useCallback, useEffect, useState } from "react"
import { ClipboardList, RefreshCw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient } from "@/lib/api-client"
import { usePermissions } from "@/hooks/usePermissions"
import { formatDate, StockMovementRow, StockMovementStatusBadge } from "./shared"

type Props = { mode: "admin" } | { mode: "branch"; branchCode: string }

export function StockMovementsPanel(props: Props) {
  const isAdmin = props.mode === "admin"
  const [movements, setMovements] = useState<StockMovementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const { can, loading: permLoading } = usePermissions()
  const canManage = isAdmin || can("purchaseOrders.manage")
  const noAccess = !isAdmin && !permLoading && !can("purchaseOrders.manage")

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      setMovements(await apiClient<StockMovementRow[]>("/v1/stock-movements"))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stock movements")
    }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Stock movements</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin ? "Stock movement history across all branches." : "Stock movement history for this branch."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={load} disabled={loading}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /></Button>
          {canManage && <Button onClick={load}><ClipboardList className="size-4" /> Refresh</Button>}
        </div>
      </div>

      {noAccess && (
        <p className="mb-4 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
          You don&apos;t have permission to view stock movements. Ask a super admin to grant it in Settings.
        </p>
      )}
      {error && !noAccess && <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-sm text-muted-foreground">Loading stock movements…</div>
        ) : movements.length === 0 ? (
          <EmptyState title="No stock movements yet" description="Stock movements are recorded as purchase orders are pending, completed, cancelled, or reversed." icon={<ClipboardList className="size-12 text-muted-foreground/30" />} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>PO Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Qty Before</TableHead>
                <TableHead>Qty After</TableHead>
                <TableHead>Diff</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead className="text-right">Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((mov) => (
                <TableRow key={mov.id}>
                  <TableCell>
                    <p className="font-medium">{formatDate(mov.createdAt)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(mov.createdAt).toLocaleTimeString()}</p>
                  </TableCell>
                  <TableCell className="text-sm">
                    <p className="font-medium truncate">{mov.product.name}</p>
                    {mov.product.sku && <p className="text-xs text-muted-foreground">SKU: {mov.product.sku}</p>}
                  </TableCell>
                  <TableCell className="text-sm">{mov.purchaseOrder?.poNumber ?? "-"}</TableCell>
                  <TableCell>
                    <StockMovementStatusBadge status={mov.status} />
                  </TableCell>
                  <TableCell className="text-sm text-right">{mov.quantityBefore}</TableCell>
                  <TableCell className="text-sm text-right">{mov.quantityAfter}</TableCell>
                  <TableCell className="text-sm text-right font-medium">
                    {mov.quantityAfter - mov.quantityBefore}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{mov.branch?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{mov.branch?.code ?? ""}</p>
                  </TableCell>
                  <TableCell className="text-sm truncate">{mov.note ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  )
}