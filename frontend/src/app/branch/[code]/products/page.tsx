"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Package, Plus, Pencil, Trash2, RefreshCw } from "lucide-react"
import BranchLayout from "@/components/layouts/BranchLayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient } from "@/lib/api-client"
import { usePermissions } from "@/hooks/usePermissions"
import { type BranchOption } from "@/components/catalog/CategoryFormDialog"
import { ProductFormDialog, type CategoryOption, type EditableProduct } from "@/components/catalog/ProductFormDialog"

type ProductRow = EditableProduct & {
  category: { id: string; name: string } | null
  inventory: { id: string; quantity: number; minStock: number } | null
}

export default function BranchProductsPage() {
  const params = useParams()
  const branchCode = params.code as string
  const [branch, setBranch] = useState<BranchOption | null>(null)
  const [products, setProducts] = useState<ProductRow[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EditableProduct | null>(null)
  const { can, error: permError } = usePermissions()
  const canManage = can("products.manage")

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const [branchData, prods, cats] = await Promise.all([
        apiClient<BranchOption>(`/v1/branches?code=${branchCode}`),
        apiClient<ProductRow[]>("/v1/products"),
        apiClient<CategoryOption[]>("/v1/categories"),
      ])
      setBranch(branchData)
      setProducts(prods)
      setCategories(cats)
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load products") }
    finally { setLoading(false) }
  }, [branchCode])
  useEffect(() => { load() }, [load])

  async function save(data: Record<string, unknown>) {
    await apiClient(`/v1/products${editing ? `/${editing.id}` : ""}`, { method: editing ? "PATCH" : "POST", body: JSON.stringify(data) })
    await load()
  }
  async function remove(p: ProductRow) {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return
    try { await apiClient(`/v1/products/${p.id}`, { method: "DELETE" }); await load() }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to delete product") }
  }

  return (
    <BranchLayout>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage this branch's product catalog.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={load} disabled={loading}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /></Button>
          {canManage && <Button onClick={() => { setEditing(null); setDialogOpen(true) }}><Plus className="size-4" /> Add product</Button>}
        </div>
      </div>

      {error && <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {permError && (
        <p className="mb-4 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
          Couldn&apos;t verify your permissions ({permError}) — showing view-only. Refresh to try again.
        </p>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-sm text-muted-foreground">Loading products…</div>
        ) : products.length === 0 ? (
          <EmptyState title="No products yet" description="Add your first product to start selling." icon={<Package className="size-12 text-muted-foreground/30" />} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Product</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead><TableHead>Stock</TableHead><TableHead>Status</TableHead>{canManage && <TableHead className="text-right">Actions</TableHead>}</TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="font-medium">{p.name}</p>
                    {p.sku && <p className="text-xs text-muted-foreground">SKU: {p.sku}</p>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.category?.name || "—"}</TableCell>
                  <TableCell className="text-sm font-medium">${Number(p.price).toFixed(2)}</TableCell>
                  <TableCell>
                    {p.inventory ? (
                      <Badge variant={p.inventory.quantity <= p.inventory.minStock ? "destructive" : "outline"}>
                        {p.inventory.quantity} in stock
                      </Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell><Badge variant={p.active ? "secondary" : "outline"}>{p.active ? "Active" : "Inactive"}</Badge></TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(p); setDialogOpen(true) }}><Pencil className="size-4" /></Button>
                      <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => remove(p)}><Trash2 className="size-4" /></Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {branch && (
        <ProductFormDialog open={dialogOpen} onOpenChange={setDialogOpen} product={editing} branches={[branch]} categories={categories} lockedBranchId={branch.id} onSubmit={save} />
      )}
    </BranchLayout>
  )
}
