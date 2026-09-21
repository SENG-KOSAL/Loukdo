"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Boxes, RefreshCw, PackageSearch } from "lucide-react"
import BranchLayout from "@/components/layouts/BranchLayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient } from "@/lib/api-client"
import { usePermissions } from "@/hooks/usePermissions"
import { InventoryAdjustDialog, type EditableInventory } from "@/components/catalog/InventoryAdjustDialog"

export default function BranchInventoryPage() {
  const params = useParams()
  const branchCode = params.code as string
  const [items, setItems] = useState<EditableInventory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EditableInventory | null>(null)
  const { can, error: permError } = usePermissions()
  const canManage = can("inventory.manage")

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      setItems(await apiClient<EditableInventory[]>("/v1/inventory"))
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load inventory") }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load, branchCode])

  async function save(data: Record<string, unknown>) {
    if (!editing) return
    await apiClient(`/v1/inventory/${editing.id}`, { method: "PATCH", body: JSON.stringify(data) })
    await load()
  }

  const lowStock = items.filter((i) => i.quantity <= i.minStock)

  return (
    <BranchLayout>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stock levels for this branch. {lowStock.length > 0 && `${lowStock.length} item${lowStock.length > 1 ? "s" : ""} low on stock.`}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={load} disabled={loading}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /></Button>
      </div>

      {error && <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {permError && (
        <p className="mb-4 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
          Couldn&apos;t verify your permissions ({permError}) — showing view-only. Refresh to try again.
        </p>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-sm text-muted-foreground">Loading inventory…</div>
        ) : items.length === 0 ? (
          <EmptyState title="No inventory data" description="Add products to start tracking stock." icon={<Boxes className="size-12 text-muted-foreground/30" />} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Product</TableHead><TableHead>Quantity</TableHead><TableHead>Min. stock</TableHead><TableHead>Status</TableHead>{canManage && <TableHead className="text-right">Actions</TableHead>}</TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium">{item.product.name}</p>
                    {item.product.sku && <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{item.quantity}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.minStock}</TableCell>
                  <TableCell>
                    <Badge variant={item.quantity <= item.minStock ? "destructive" : "secondary"}>
                      {item.quantity <= item.minStock ? "Low stock" : "In stock"}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => { setEditing(item); setDialogOpen(true) }}>
                        <PackageSearch className="size-3.5" /> Adjust
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <InventoryAdjustDialog open={dialogOpen} onOpenChange={setDialogOpen} item={editing} onSubmit={save} />
    </BranchLayout>
  )
}
