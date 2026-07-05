"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Plus, Copy, Check, Trash2, Search, RefreshCw, Building2,
  ExternalLink, Calendar, User, ShieldAlert, Loader2, X,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  LayoutGrid, List, Key, ShieldCheck, Mail, ArrowRight,
  Clock, Info, Globe, Smartphone, Store
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import { apiClient } from "@/lib/api-client"
import { cn } from "@/lib/utils"

interface Branch {
  id: string
  name: string
  code: string
  url: string | null
  adminName: string | null
  adminEmail: string | null
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
  users: { username: string; email: string }[]
  createdAt: string
  updatedAt: string
}

interface CreateResult {
  id: string
  name: string
  code: string
  url: string | null
  status: string
  adminPassword: string | null
  adminUsername: string | null
}

const statusConfig = {
  ACTIVE: { label: "Active", variant: "default" as const, dot: "bg-green-500", bg: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" },
  INACTIVE: { label: "Inactive", variant: "secondary" as const, dot: "bg-gray-400", bg: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20" },
  SUSPENDED: { label: "Suspended", variant: "destructive" as const, dot: "bg-red-500", bg: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" },
}

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 w-full animate-pulse rounded bg-muted" style={{ width: i === 5 ? "64px" : i === 4 ? "64px" : i === 0 ? "64px" : "100%" }} />
        </TableCell>
      ))}
    </TableRow>
  )
}

function SkeletonCard() {
  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="size-10 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-8 w-full animate-pulse rounded bg-muted" />
        <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
      </div>
      <Separator />
      <div className="flex justify-between items-center">
        <div className="h-5 w-16 animate-pulse rounded bg-muted" />
        <div className="flex gap-2">
          <div className="size-7 animate-pulse rounded bg-muted" />
          <div className="size-7 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </Card>
  )
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  
  // Dialog / State controllers
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [credentials, setCredentials] = useState<CreateResult | null>(null)
  const [detail, setDetail] = useState<Branch | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [duplicateTarget, setDuplicateTarget] = useState<Branch | null>(null)
  const [duplicating, setDuplicating] = useState(false)
  const [form, setForm] = useState({
    name: "", code: "", url: "", adminUsername: "", adminPassword: "", status: "ACTIVE",
  })
  const [dupForm, setDupForm] = useState({ name: "", adminUsername: "", adminPassword: "" })
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const slug = (s: string, max: number) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, max) || ""

  const updateName = (name: string) => {
    setForm((prev) => ({ ...prev, name, url: slug(name, 30), code: slug(name, 20) }))
  }

  const fetchBranches = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiClient<Branch[]>("/branches")
      setBranches(data)
    } catch {
      setError("Failed to load branches")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBranches() }, [fetchBranches])

  const filtered = useMemo(
    () => branches.filter(
      (b) => b.name.toLowerCase().includes(search.toLowerCase())
        || b.code.toLowerCase().includes(search.toLowerCase())
        || b.users.some((u) => u.username.toLowerCase().includes(search.toLowerCase())),
    ),
    [branches, search],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await apiClient(`/branches/${deleteTarget.id}`, { method: "DELETE" })
      setDeleteTarget(null)
      setDetail(null)
      await fetchBranches()
    } catch {
      setError("Failed to delete branch")
    } finally {
      setDeleting(false)
    }
  }

  const handleDuplicate = async () => {
    if (!duplicateTarget) return
    setDuplicating(true)
    setError("")
    try {
      const result = await apiClient<CreateResult>(`/branches/${duplicateTarget.id}`, {
        method: "POST",
        body: JSON.stringify(dupForm),
      })
      setDuplicateTarget(null)
      setDupForm({ name: "", adminUsername: "", adminPassword: "" })
      setCredentials(result)
      await fetchBranches()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate branch")
    } finally {
      setDuplicating(false)
    }
  }

  const openDuplicate = (b: Branch) => {
    setDuplicateTarget(b)
    setDupForm({ name: `${b.name} (copy)`, adminUsername: "", adminPassword: "" })
  }

  const handleCreate = async () => {
    setCreating(true)
    setError("")
    try {
      const result = await apiClient<CreateResult>("/branches", {
        method: "POST",
        body: JSON.stringify(form),
      })
      setOpen(false)
      setCredentials(result)
      setForm({ name: "", code: "", url: "", adminUsername: "", adminPassword: "", status: "ACTIVE" })
      await fetchBranches()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create branch")
    } finally {
      setCreating(false)
    }
  }

  const handleCopyUrl = (e: React.MouseEvent, bCode: string) => {
    e.stopPropagation()
    const url = `${window.location.origin}/branch/${bCode}/login`
    navigator.clipboard.writeText(url)
    setCopiedCode(bCode)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }

  return (
    <DashboardLayout>
      {/* Top Banner / Hero Section */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8 border border-primary/10 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Building2 className="size-3" /> Branch Network
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Branches Management</h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Configure, duplicate, and monitor branch locations, manage store subdomains, and provision secure admin accounts for your retail network.
            </p>
          </div>
          <Button onClick={() => setOpen(true)} size="lg" className="shadow-md shrink-0 self-start md:self-auto gap-2">
            <Plus className="size-4" /> New Branch Location
          </Button>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 text-primary/5 select-none pointer-events-none">
          <Building2 className="size-64" />
        </div>
      </div>

      {/* Control Bar: Search, View Mode, Count, Refresh */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              placeholder="Search by name, code or admin username..."
              className="pl-9 pr-8 h-9 shadow-xs"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <Button variant="outline" size="icon" onClick={fetchBranches} disabled={loading} className="size-9 shrink-0">
            <RefreshCw className={cn("size-4 text-muted-foreground", loading && "animate-spin")} />
          </Button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <span className="text-xs font-medium text-muted-foreground">
            {loading ? "Loading..." : `${filtered.length} of ${branches.length} branches match`}
          </span>

          <Separator orientation="vertical" className="hidden sm:block h-6" />

          {/* Custom Segmented View Toggle */}
          <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon-xs"
              onClick={() => setViewMode("grid")}
              className={cn("size-7", viewMode === "grid" && "bg-background text-foreground shadow-xs")}
              title="Card grid view"
            >
              <LayoutGrid className="size-3.5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon-xs"
              onClick={() => setViewMode("list")}
              className={cn("size-7", viewMode === "list" && "bg-background text-foreground shadow-xs")}
              title="Detailed list view"
            >
              <List className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {error && !loading && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive shadow-xs">
          <ShieldAlert className="size-5 shrink-0 text-destructive" />
          <span className="font-medium">{error}</span>
          <Button variant="ghost" size="icon-xs" className="ml-auto hover:bg-destructive/10 text-destructive" onClick={() => setError("")}>
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* MAIN VIEW AREA */}
      {loading ? (
        viewMode === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Login URL</TableHead>
                  <TableHead className="hidden md:table-cell">Admin</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
              </TableBody>
            </Table>
          </div>
        )
      ) : filtered.length === 0 ? (
        <Card className="border-dashed py-16 flex flex-col items-center justify-center text-center max-w-xl mx-auto">
          {search ? (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full bg-muted p-3">
                <Search className="size-8 text-muted-foreground/60" />
              </div>
              <h3 className="font-semibold text-lg text-foreground">No matches found</h3>
              <p className="text-sm text-muted-foreground max-w-xs px-4">
                We couldn't find any branches matching "{search}". Try checking the spelling or use different keywords.
              </p>
              <Button variant="outline" size="sm" onClick={() => setSearch("")} className="mt-2">
                Clear Search Filter
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full bg-primary/10 p-4 text-primary">
                <Building2 className="size-10" />
              </div>
              <h3 className="font-semibold text-lg text-foreground">Set up your first branch</h3>
              <p className="text-sm text-muted-foreground max-w-xs px-4">
                You don't have any branch locations registered. Create a branch and instantly provision an admin account.
              </p>
              <Button onClick={() => setOpen(true)} className="mt-3 gap-1.5">
                <Plus className="size-4" /> Create Branch Location
              </Button>
            </div>
          )}
        </Card>
      ) : (
        /* GRID VIEW MODE */
        viewMode === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((b) => (
              <Card
                key={b.id}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-xl border bg-card p-5 transition-all duration-300 hover:shadow-md hover:border-primary/25 cursor-pointer",
                  b.status === "SUSPENDED" && "border-destructive/20 opacity-90",
                  b.status === "INACTIVE" && "border-muted-foreground/15"
                )}
                onClick={() => setDetail(b)}
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm select-none shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                      {getInitials(b.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base leading-snug text-foreground group-hover:text-primary transition-colors truncate">
                        {b.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[10px] tracking-wider font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded border">
                          {b.code}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge className={cn("gap-1 px-2 py-0.5 shadow-none border select-none shrink-0", statusConfig[b.status].bg)}>
                    <span className={cn("size-1.5 rounded-full", statusConfig[b.status].dot)} />
                    {statusConfig[b.status].label}
                  </Badge>
                </div>

                {/* Info rows */}
                <div className="space-y-2 text-sm flex-1 mb-4">
                  {/* Admin User */}
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                      <User className="size-3.5 text-muted-foreground/60" /> Admin Account
                    </span>
                    <span className="font-medium text-foreground text-xs truncate max-w-[150px]">
                      {b.users.length > 0 ? b.users[0].username : b.adminName || "—"}
                    </span>
                  </div>

                  {/* Created At */}
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                      <Calendar className="size-3.5 text-muted-foreground/60" /> Created On
                    </span>
                    <span className="text-foreground text-xs font-medium">
                      {new Date(b.createdAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Access Connection URL field */}
                  <div className="mt-3.5 space-y-1.5">
                    <div className="text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase">Access Login Link</div>
                    <div 
                      className="group/link flex items-center justify-between gap-2 rounded-lg bg-muted/60 p-2 border hover:bg-muted transition-colors cursor-pointer"
                      onClick={(e) => handleCopyUrl(e, b.code)}
                      title="Click to copy Login URL"
                    >
                      <span className="font-mono text-[11px] text-muted-foreground truncate select-none">
                        /branch/{b.code}/login
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="size-6 text-muted-foreground group-hover/link:text-foreground hover:bg-transparent shrink-0"
                      >
                        {copiedCode === b.code ? (
                          <Check className="size-3 text-green-600 animate-scale-up" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator className="my-1.5" />

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-muted-foreground/70 group-hover:text-primary transition-colors flex items-center gap-1 font-medium">
                    View Details <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost" size="icon-sm"
                      onClick={() => openDuplicate(b)}
                      className="text-muted-foreground hover:text-foreground size-8"
                      title="Duplicate branch location"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon-sm"
                      onClick={() => setDeleteTarget(b)}
                      className="text-muted-foreground hover:text-destructive size-8"
                      title="Delete branch"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* TABLE LIST VIEW MODE */
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/20">
                  <TableHead className="w-24">Code</TableHead>
                  <TableHead>Branch Details</TableHead>
                  <TableHead className="hidden sm:table-cell">Login Access URL</TableHead>
                  <TableHead className="hidden md:table-cell">Admin Username</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-24 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((b) => (
                  <TableRow
                    key={b.id}
                    className="cursor-pointer transition-colors hover:bg-muted/30 group"
                    onClick={() => setDetail(b)}
                  >
                    <TableCell>
                      <span className="font-mono text-xs font-semibold tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded border">
                        {b.code}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs select-none">
                          {getInitials(b.name)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate block">
                            {b.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
                            <Clock className="size-3 shrink-0" />
                            Created {new Date(b.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div 
                        className="inline-flex items-center justify-between gap-2 rounded-md bg-muted/60 hover:bg-muted p-1 px-2 border cursor-pointer max-w-[220px]"
                        onClick={(e) => handleCopyUrl(e, b.code)}
                        title="Click to copy Login URL"
                      >
                        <span className="font-mono text-xs text-muted-foreground truncate">
                          /branch/{b.code}/login
                        </span>
                        {copiedCode === b.code ? (
                          <Check className="size-3 text-green-600 shrink-0" />
                        ) : (
                          <Copy className="size-3 text-muted-foreground/70 shrink-0" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-sm text-foreground/85">
                        <User className="size-3.5 text-muted-foreground/70" />
                        <span>{b.users.length > 0 ? b.users[0].username : b.adminName || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("gap-1 px-2 py-0.5 shadow-none border select-none", statusConfig[b.status].bg)}>
                        <span className={cn("size-1.5 rounded-full", statusConfig[b.status].dot)} />
                        {statusConfig[b.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost" size="icon-sm"
                          onClick={() => openDuplicate(b)}
                          className="text-muted-foreground hover:text-foreground size-8"
                          title="Duplicate branch"
                        >
                          <Copy className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon-sm"
                          onClick={() => setDeleteTarget(b)}
                          className="text-muted-foreground hover:text-destructive size-8"
                          title="Delete branch"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      )}

      {/* Pagination Controls */}
      {filtered.length > 0 && !loading && (
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm bg-muted/20 p-3 rounded-xl border">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-muted-foreground font-medium">Rows per page</span>
            <select
              className="rounded-lg border bg-background px-2.5 py-1 text-xs font-semibold shadow-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
            >
              {[6, 9, 12, 24, 48].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{(safePage - 1) * pageSize + 1}</span> to{" "}
              <span className="font-semibold text-foreground">{Math.min(safePage * pageSize, filtered.length)}</span> of{" "}
              <span className="font-semibold text-foreground">{filtered.length}</span> branches
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              className="size-7 bg-background shadow-xs hover:bg-muted"
            >
              <ChevronsLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setPage(safePage - 1)}
              disabled={safePage === 1}
              className="size-7 bg-background shadow-xs hover:bg-muted"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(safePage - 2, totalPages - 4))
              const p = start + i
              if (p > totalPages) return null
              return (
                <Button
                  key={p}
                  variant={p === safePage ? "default" : "outline"}
                  size="icon-xs"
                  onClick={() => setPage(p)}
                  className={cn("size-7 font-medium shadow-xs", p !== safePage && "bg-background hover:bg-muted text-muted-foreground")}
                >
                  {p}
                </Button>
              )
            })}

            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setPage(safePage + 1)}
              disabled={safePage === totalPages}
              className="size-7 bg-background shadow-xs hover:bg-muted"
            >
              <ChevronRight className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              className="size-7 bg-background shadow-xs hover:bg-muted"
            >
              <ChevronsRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* CREATE DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl overflow-hidden shadow-xl p-0 border">
          <DialogHeader className="bg-muted/30 p-6 pb-4 border-b">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
                <Plus className="size-4" />
              </div>
              Create New Branch Location
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Provision a new physical or virtual branch location, customize its access URL, and establish its main admin.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 p-6 py-4 max-h-[70vh] overflow-y-auto">
            {/* General Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">General Settings</h4>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold text-foreground/85">
                  Branch Name <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="name" 
                  value={form.name} 
                  onChange={(e) => updateName(e.target.value)} 
                  required 
                  placeholder="e.g. Downtown Store" 
                  className="shadow-xs focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-xs font-semibold text-foreground/85">Branch Code (Auto)</Label>
                  <Input id="code" value={form.code} readOnly className="bg-muted font-mono text-xs select-none border-dashed" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-xs font-semibold text-foreground/85">Subdomain (Auto)</Label>
                  <Input id="url" value={form.url} readOnly className="bg-muted font-mono text-xs select-none border-dashed" />
                </div>
              </div>
              <div className="flex items-start gap-1.5 rounded-lg bg-primary/5 p-2.5 border border-primary/10 text-primary">
                <Info className="size-4 mt-0.5 shrink-0" />
                <span className="text-[11px] leading-relaxed">
                  The Branch Code and Subdomain URL are automatically generated dynamically from the Branch Name to maintain database and routing standards.
                </span>
              </div>
            </div>

            <Separator />

            {/* Admin Settings */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Provision Admin Account</h4>
              <div className="space-y-2">
                <Label htmlFor="adminUsername" className="text-xs font-semibold text-foreground/85">
                  Admin Username <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input 
                    id="adminUsername" 
                    value={form.adminUsername}
                    onChange={(e) => setForm({ ...form, adminUsername: e.target.value })} 
                    required 
                    placeholder="e.g. admin_downtown" 
                    className="pl-9 shadow-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPassword" className="text-xs font-semibold text-foreground/85">
                  Admin Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Key className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input 
                    id="adminPassword" 
                    type="password" 
                    value={form.adminPassword}
                    onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} 
                    required 
                    placeholder="Minimum 8 characters" 
                    className="pl-9 shadow-xs"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Status Selector */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-xs font-semibold text-foreground/85">Default Status</Label>
              <Select value={form.status ?? "ACTIVE"} onValueChange={(v) => setForm({ ...form, status: v ?? "ACTIVE" })}>
                <SelectTrigger id="status" className="shadow-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-green-500" /> Active
                    </span>
                  </SelectItem>
                  <SelectItem value="INACTIVE">
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-gray-400" /> Inactive
                    </span>
                  </SelectItem>
                  <SelectItem value="SUSPENDED">
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-red-500" /> Suspended
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <p className="text-xs font-medium text-destructive px-6 pb-2 text-center">{error}</p>}
          <DialogFooter className="bg-muted/10 border-t p-4 px-6 gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={creating} className="h-9 font-medium">
              Cancel
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={!form.name || !form.adminUsername || !form.adminPassword || creating}
              className="h-9 font-medium gap-2 shadow-sm"
            >
              {creating ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <Building2 className="size-4" /> Create Branch
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREDENTIALS DISPLAY DIALOG */}
      <Dialog open={!!credentials} onOpenChange={(o) => { if (!o) setCredentials(null) }}>
        <DialogContent className="sm:max-w-md rounded-2xl overflow-hidden p-0 shadow-2xl border border-amber-500/25">
          <DialogHeader className="bg-amber-500/10 dark:bg-amber-950/20 p-6 pb-4 border-b border-amber-500/20 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 mb-2">
              <ShieldAlert className="size-6 animate-pulse" />
            </div>
            <DialogTitle className="text-xl font-extrabold text-amber-800 dark:text-amber-300">
              Branch Successfully Provisioned
            </DialogTitle>
            <DialogDescription className="text-amber-700/80 dark:text-amber-400/80 text-xs">
              IMPORTANT: Please save these auto-generated administrative credentials now. You will not be able to view these details again!
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="rounded-xl border bg-muted/40 p-4 space-y-2.5">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 block">Branch Name</span>
                <span className="font-semibold text-base text-foreground">{credentials?.name}</span>
              </div>
              <Separator />
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 block">Access Login Link</span>
                <div 
                  onClick={() => {
                    const url = `${window.location.origin}/branch/${credentials?.code}/login`
                    navigator.clipboard.writeText(url)
                  }}
                  className="flex items-center justify-between gap-2 mt-1 rounded-lg border bg-background p-2 text-xs font-mono text-foreground hover:bg-muted cursor-pointer group"
                >
                  <span className="truncate">/branch/{credentials?.code}/login</span>
                  <Copy className="size-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
                </div>
              </div>
            </div>

            {credentials?.adminUsername && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  <Key className="size-4 text-amber-500" /> Secure Admin Credentials
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between rounded-lg bg-background border px-3 py-2">
                    <span className="text-xs text-muted-foreground">Username</span>
                    <span className="font-mono font-bold text-foreground select-all">{credentials.adminUsername}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-background border px-3 py-2">
                    <span className="text-xs text-muted-foreground">Password</span>
                    <span className="font-mono font-bold text-foreground select-all">{credentials.adminPassword}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="bg-muted/10 border-t p-4 px-6">
            <Button onClick={() => setCredentials(null)} className="w-full h-10 font-bold bg-amber-600 hover:bg-amber-700 text-white">
              I Have Saved the Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-sm rounded-2xl overflow-hidden p-0 shadow-xl border border-destructive/25">
          <DialogHeader className="bg-destructive/5 p-6 pb-4 border-b border-destructive/10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
              <Trash2 className="size-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-destructive">
              Delete Branch Location
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              This action is permanent and completely irreversible.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 py-4 text-center space-y-3">
            <p className="text-sm">
              Are you sure you want to permanently delete the branch{" "}
              <strong className="text-foreground font-semibold">"{deleteTarget?.name}"</strong>?
            </p>
            <div className="flex items-start gap-2 rounded-xl bg-destructive/5 border border-destructive/10 p-3 text-left text-xs text-destructive leading-relaxed">
              <ShieldAlert className="size-4 mt-0.5 shrink-0" />
              <span>Deleting this branch will immediately and permanently erase all associate branch users, administrative profiles, registers, transactions, and sales logs!</span>
            </div>
          </div>
          <DialogFooter className="bg-muted/10 border-t p-4 px-6 gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting} className="h-9 font-medium">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="h-9 font-medium gap-1.5 shadow-sm">
              {deleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="size-4" /> Delete Location
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DUPLICATE DIALOG */}
      <Dialog open={!!duplicateTarget} onOpenChange={(o) => { if (!o) setDuplicateTarget(null) }}>
        <DialogContent className="sm:max-w-md rounded-2xl overflow-hidden p-0 shadow-xl border">
          <DialogHeader className="bg-muted/30 p-6 pb-4 border-b">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
                <Copy className="size-4" />
              </div>
              Clone Branch Location
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Create a fresh replica of <span className="font-semibold text-foreground">"{duplicateTarget?.name}"</span> configuration with a brand new administrator account.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 p-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="dup-name" className="text-xs font-semibold text-foreground/85">
                New Branch Name <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="dup-name" 
                value={dupForm.name}
                onChange={(e) => setDupForm({ ...dupForm, name: e.target.value })} 
                placeholder="e.g. Downtown Store (copy)" 
                className="shadow-xs"
              />
            </div>
            
            <Separator />

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">New Admin Account Settings</h4>
              <div className="space-y-2">
                <Label htmlFor="dup-username" className="text-xs font-semibold text-foreground/85">
                  Admin Username <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input 
                    id="dup-username" 
                    value={dupForm.adminUsername}
                    onChange={(e) => setDupForm({ ...dupForm, adminUsername: e.target.value })} 
                    placeholder="e.g. admin_newstore" 
                    className="pl-9 shadow-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dup-password" className="text-xs font-semibold text-foreground/85">
                  Admin Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Key className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input 
                    id="dup-password" 
                    type="password" 
                    value={dupForm.adminPassword}
                    onChange={(e) => setDupForm({ ...dupForm, adminPassword: e.target.value })} 
                    placeholder="Minimum 8 characters" 
                    className="pl-9 shadow-xs"
                  />
                </div>
              </div>
            </div>
          </div>
          {error && <p className="text-xs font-medium text-destructive px-6 pb-2 text-center">{error}</p>}
          <DialogFooter className="bg-muted/10 border-t p-4 px-6 gap-2">
            <Button variant="outline" onClick={() => setDuplicateTarget(null)} disabled={duplicating} className="h-9 font-medium">
              Cancel
            </Button>
            <Button 
              onClick={handleDuplicate}
              disabled={!dupForm.name || !dupForm.adminUsername || !dupForm.adminPassword || duplicating}
              className="h-9 font-medium gap-2 shadow-sm"
            >
              {duplicating ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Duplicating...
                </>
              ) : (
                <>
                  <Copy className="size-4" /> Duplicate Location
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DETAIL SIDE PANEL (SHEET DRAWER - Redesigned slide-over for extreme modern UX) */}
      <Sheet open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null) }}>
        <SheetContent className="sm:max-w-md w-full p-0 flex flex-col h-full border-l shadow-2xl bg-background">
          {detail && (
            <div className="flex flex-col h-full">
              {/* Slide-over header */}
              <div className="p-6 border-b bg-muted/20 relative">
                <div className="flex items-center gap-4.5">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-extrabold text-lg shadow-md select-none">
                    {getInitials(detail.name)}
                  </div>
                  <div className="min-w-0 pr-6">
                    <SheetTitle className="text-lg font-bold text-foreground truncate leading-snug">
                      {detail.name}
                    </SheetTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[10px] tracking-widest font-bold text-muted-foreground bg-muted p-1 px-1.5 rounded border leading-none">
                        {detail.code}
                      </span>
                      <Badge className={cn("gap-1 px-2 py-0.5 shadow-none border text-[10px] select-none scale-95", statusConfig[detail.status].bg)}>
                        <span className={cn("size-1.5 rounded-full", statusConfig[detail.status].dot)} />
                        {statusConfig[detail.status].label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide-over body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Branch Configuration Card */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                    <Globe className="size-4 text-muted-foreground/80" /> Branch Routing Settings
                  </h4>
                  <div className="rounded-xl border bg-muted/20 p-4 space-y-3 text-sm">
                    <div className="flex flex-col gap-1 rounded-lg bg-background p-3 border">
                      <span className="text-xs text-muted-foreground font-medium">Branch Subdomain URL</span>
                      <span className="font-mono text-xs font-bold text-foreground mt-0.5">
                        {detail.url ? `${detail.url}.loukdo.com` : "—"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 rounded-lg bg-background p-3 border">
                      <span className="text-xs text-muted-foreground font-medium">Access Login URL Pattern</span>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="font-mono text-xs font-semibold text-muted-foreground truncate">
                          /branch/{detail.code}/login
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleCopyUrl(e, detail.code)}
                          className="size-7 text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
                          title="Copy Full Login Link"
                        >
                          {copiedCode === detail.code ? (
                            <Check className="size-3.5 text-green-600 animate-scale-up" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Personnel Card */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                    <User className="size-4 text-muted-foreground/80" /> Authorized Admin accounts
                  </h4>
                  <div className="space-y-3">
                    {detail.users.length > 0 ? (
                      detail.users.map((u) => (
                        <div key={u.username} className="rounded-xl border bg-background p-4 space-y-2.5 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                              <ShieldCheck className="size-4 text-primary" /> {u.username}
                            </span>
                            <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 shadow-none border-primary/20 bg-primary/5 text-primary">
                              Branch Admin
                            </Badge>
                          </div>
                          {u.email && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="size-3.5 text-muted-foreground/75" />
                              <span>{u.email}</span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 border border-dashed rounded-xl bg-muted/10 text-muted-foreground text-xs space-y-1">
                        <User className="size-6 text-muted-foreground/40 mx-auto" />
                        <p className="font-medium">No admin accounts configured yet</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Operational Auditing Details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                    <Clock className="size-4 text-muted-foreground/80" /> System Audit Metrics
                  </h4>
                  <div className="rounded-xl border bg-muted/20 p-4 space-y-3.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">Created On</span>
                      <span className="font-semibold text-foreground">
                        {new Date(detail.createdAt).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short"
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">Last Modified</span>
                      <span className="font-semibold text-foreground">
                        {new Date(detail.updatedAt).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short"
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide-over Footer Actions */}
              <div className="p-6 border-t bg-muted/20 mt-auto flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => openDuplicate(detail)}
                  className="flex-1 font-medium gap-1.5 h-10 shadow-xs"
                >
                  <Copy className="size-4 text-muted-foreground" /> Clone Location
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setDeleteTarget(detail)}
                  className="flex-1 font-medium gap-1.5 h-10 shadow-xs"
                >
                  <Trash2 className="size-4" /> Delete Location
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  )
}
