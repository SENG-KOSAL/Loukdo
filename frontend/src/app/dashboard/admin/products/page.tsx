"use client"

import { useCallback, useEffect, useState } from "react"
import { Package, Plus, Pencil, Trash2, RefreshCw, Store } from "lucide-react"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient } from "@/lib/api-client"
import { type BranchOption } from "@/components/catalog/CategoryFormDialog"
import { ProductFormDialog, type CategoryOption, type EditableProduct } from "@/components/catalog/ProductFormDialog"

type ProductRow = EditableProduct & {
  category: { id: string; name: string } | null
  inventory: { id: string; quantity: number; minStock: number } | null
  branch: BranchOption
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EditableProduct | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const prods = await apiClient<ProductRow[]>("/v1/products")
      setProducts(prods)
    } catch { setError("Failed to load products") }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => { apiClient<BranchOption[]>("/v1/branches").then(setBranches).catch(() => {}) }, [])
  useEffect(() => { apiClient<CategoryOption[]>("/v1/categories").then(setCategories).catch(() => {}) }, [])

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
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">The product catalog across all branches.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={load} disabled={loading}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /></Button>
          <Button onClick={() => { setEditing(null); setDialogOpen(true) }}><Plus className="size-4" /> Add product</Button>
        </div>
      </div>

      {error && <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-sm text-muted-foreground">Loading products…</div>
        ) : products.length === 0 ? (
          <EmptyState title="No products yet" description="Products will appear here once branches add them." icon={<Package className="size-12 text-muted-foreground/30" />} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Product</TableHead><TableHead>Branch</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead><TableHead>Stock</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="font-medium">{p.name}</p>
                    {p.sku && <p className="text-xs text-muted-foreground">SKU: {p.sku}</p>}
                  </TableCell>
                  <TableCell><span className="flex items-center gap-1.5 text-sm"><Store className="size-3.5 text-muted-foreground" />{p.branch.name}</span></TableCell>
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
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(p); setDialogOpen(true) }}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => remove(p)}><Trash2 className="size-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <ProductFormDialog open={dialogOpen} onOpenChange={setDialogOpen} product={editing} branches={branches} categories={categories} onSubmit={save} />
    </DashboardLayout>
  )
}
