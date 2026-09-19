"use client"

import { useState, useEffect, useCallback } from "react"
import { Users, RefreshCw, Search, ShieldCheck, Store } from "lucide-react"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { apiClient } from "@/lib/api-client"
import { cn } from "@/lib/utils"

interface AppUser {
  id: string
  name: string | null
  username: string
  email: string
  role: "SUPER_ADMIN" | "BRANCH_ADMIN" | "MANAGER" | "CASHIER"
  branchId: string | null
  branch: { id: string; name: string; code: string } | null
  createdAt: string
}

const roleConfig: Record<AppUser["role"], { label: string; variant: "default" | "secondary" | "outline" }> = {
  SUPER_ADMIN: { label: "Super Admin", variant: "default" },
  BRANCH_ADMIN: { label: "Branch Admin", variant: "secondary" },
  MANAGER: { label: "Manager", variant: "outline" },
  CASHIER: { label: "Cashier", variant: "outline" },
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await apiClient<AppUser[]>("/v1/users")
      setUsers(data)
    } catch {
      setError("Failed to load users")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const q = search.trim().toLowerCase()
  const filtered = q
    ? users.filter((u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.name ?? "").toLowerCase().includes(q) ||
        (u.branch?.name ?? "").toLowerCase().includes(q),
      )
    : users

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every user across all branches
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchUsers} disabled={loading}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search users or branches..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="size-8 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={users.length === 0 ? "No users found" : "No matching users"}
            description={
              users.length === 0
                ? "User accounts across all branches will appear here."
                : "Try a different search term."
            }
            icon={<Users className="size-12 text-muted-foreground/30" />}
            className="border-0"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {(u.name || u.username).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{u.name || u.username}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleConfig[u.role].variant} className="gap-1">
                      {u.role === "SUPER_ADMIN" && <ShieldCheck className="size-3" />}
                      {roleConfig[u.role].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.branch ? (
                      <span className="flex items-center gap-1.5 text-sm">
                        <Store className="size-3.5 text-muted-foreground" />
                        {u.branch.name}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </DashboardLayout>
  )
}
