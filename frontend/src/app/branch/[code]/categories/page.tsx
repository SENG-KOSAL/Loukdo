"use client"

import { useCallback, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"
import { Tags, Plus, Pencil, Trash2, RefreshCw } from "lucide-react"
import BranchLayout from "@/components/layouts/BranchLayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient } from "@/lib/api-client"
import { CategoryFormDialog, type BranchOption, type EditableCategory } from "@/components/catalog/CategoryFormDialog"

type CategoryRow = EditableCategory & { _count: { products: number } }

export default function BranchCategoriesPage() {
  const params = useParams()
  const { data: session } = useSession()
  const branchCode = params.code as string
  const [branch, setBranch] = useState<BranchOption | null>(null)
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EditableCategory | null>(null)
  const role = (session?.user as { role?: string } | undefined)?.role
  const canManage = role === "BRANCH_ADMIN" || role === "MANAGER" || role === "SUPER_ADMIN"

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const [branchData, cats] = await Promise.all([
        apiClient<BranchOption>(`/v1/branches?code=${branchCode}`),
        apiClient<CategoryRow[]>("/v1/categories"),
      ])
      setBranch(branchData)
      setCategories(cats)
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load categories") }
    finally { setLoading(false) }
  }, [branchCode])
  useEffect(() => { load() }, [load])

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
    <BranchLayout>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">Organize this branch's product catalog.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={load} disabled={loading}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /></Button>
          {canManage && <Button onClick={() => { setEditing(null); setDialogOpen(true) }}><Plus className="size-4" /> Add category</Button>}
        </div>
      </div>

      {error && <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-sm text-muted-foreground">Loading categories…</div>
        ) : categories.length === 0 ? (
          <EmptyState title="No categories" description="Create a category to start organizing products." icon={<Tags className="size-12 text-muted-foreground/30" />} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead>Products</TableHead><TableHead>Status</TableHead>{canManage && <TableHead className="text-right">Actions</TableHead>}</TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{cat.desc || "—"}</TableCell>
                  <TableCell className="text-sm">{cat._count.products}</TableCell>
                  <TableCell><Badge variant={cat.active ? "secondary" : "outline"}>{cat.active ? "Active" : "Inactive"}</Badge></TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(cat); setDialogOpen(true) }}><Pencil className="size-4" /></Button>
                      <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => remove(cat)}><Trash2 className="size-4" /></Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {branch && (
        <CategoryFormDialog open={dialogOpen} onOpenChange={setDialogOpen} category={editing} branches={[branch]} lockedBranchId={branch.id} onSubmit={save} />
      )}
    </BranchLayout>
  )
}
