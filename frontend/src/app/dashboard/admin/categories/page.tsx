"use client"

import { useCallback, useEffect, useState } from "react"
import { Tags, Plus, Pencil, Trash2, RefreshCw, Store } from "lucide-react"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient } from "@/lib/api-client"
import { CategoryFormDialog, type BranchOption, type EditableCategory } from "@/components/catalog/CategoryFormDialog"

type CategoryRow = EditableCategory & { _count: { products: number }; branch: BranchOption }

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EditableCategory | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const cats = await apiClient<CategoryRow[]>("/v1/categories")
      setCategories(cats)
    } catch { setError("Failed to load categories") }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => { apiClient<BranchOption[]>("/v1/branches").then(setBranches).catch(() => {}) }, [])

  async function save(data: Record<string, unknown>) {
    await apiClient(`/v1/categories${editing ? `/${editing.id}` : ""}`, { method: editing ? "PATCH" : "POST", body: JSON.stringify(data) })
    await load()
  }
  async function remove(cat: CategoryRow) {
    if (!window.confirm(`Delete "${cat.name}"? This cannot be undone.`)) return
    try { await apiClient(`/v1/categories/${cat.id}`, { method: "DELETE" }); await load() }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to delete category") }
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">Product categories across all branches.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={load} disabled={loading}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /></Button>
          <Button onClick={() => { setEditing(null); setDialogOpen(true) }}><Plus className="size-4" /> Add category</Button>
        </div>
      </div>

      {error && <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-sm text-muted-foreground">Loading categories…</div>
        ) : categories.length === 0 ? (
          <EmptyState title="No categories" description="Categories will appear here once branches create them." icon={<Tags className="size-12 text-muted-foreground/30" />} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Name</TableHead><TableHead>Branch</TableHead><TableHead>Products</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell><span className="flex items-center gap-1.5 text-sm"><Store className="size-3.5 text-muted-foreground" />{cat.branch.name}</span></TableCell>
                  <TableCell className="text-sm">{cat._count.products}</TableCell>
                  <TableCell><Badge variant={cat.active ? "secondary" : "outline"}>{cat.active ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(cat); setDialogOpen(true) }}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => remove(cat)}><Trash2 className="size-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <CategoryFormDialog open={dialogOpen} onOpenChange={setDialogOpen} category={editing} branches={branches} onSubmit={save} />
    </DashboardLayout>
  )
}
