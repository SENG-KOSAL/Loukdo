"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Building2, Users, Activity, Plus, ArrowRight, RefreshCw, Store, ShieldCheck, Timer,
  DollarSign, TrendingUp, TrendingDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import { apiClient } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface ExchangeRate {
  id: number
  validDate: string
  currencyId: string
  currency: string
  symbol: string
  unit: number
  bid: number
  ask: number
  average: number
}

interface Branch {
  id: string
  name: string
  code: string
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
  users: { username: string; email: string }[]
  createdAt: string
}

const statusConfig = {
  ACTIVE: { label: "Active", variant: "default" as const, dot: "bg-green-500" },
  INACTIVE: { label: "Inactive", variant: "secondary" as const, dot: "bg-gray-400" },
  SUSPENDED: { label: "Suspended", variant: "destructive" as const, dot: "bg-red-500" },
}

function StatCard({ icon, label, value, sublabel }: {
  icon: React.ReactNode; label: string; value: string | number; sublabel?: string
}) {
  return (
    <Card className="relative overflow-hidden p-5 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
        </div>
        <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
          {icon}
        </div>
      </div>
    </Card>
  )
}

const KEY_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CNY", "THB", "AUD", "CAD"]

export default function AdminDashboard() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [rates, setRates] = useState<ExchangeRate[]>([])
  const [ratesLoading, setRatesLoading] = useState(true)
  const [ratesPrev, setRatesPrev] = useState<Record<string, number>>({})
  const ratesRef = useRef<ExchangeRate[]>([])

  const fetchBranches = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiClient<Branch[]>("/v1/branches")
      setBranches(data)
    } catch {
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRates = useCallback(async () => {
    setRatesLoading(true)
    try {
      const data = await apiClient<ExchangeRate[]>("/v1/exchange-rates")
      const prev: Record<string, number> = {}
      ratesRef.current.forEach((r) => { prev[r.currencyId] = r.average })
      setRatesPrev(prev)
      ratesRef.current = data
      setRates(data)
    } catch {
      // silently fail - rates are non-critical
    } finally {
      setRatesLoading(false)
    }
  }, [])

  useEffect(() => { fetchBranches() }, [fetchBranches])
  useEffect(() => { fetchRates() }, [fetchRates])

  const totalBranches = branches.length
  const activeBranches = branches.filter((b) => b.status === "ACTIVE").length
  const inactiveBranches = totalBranches - activeBranches
  const totalUsers = branches.reduce((acc, b) => acc + b.users.length, 0)
  const recentBranches = [...branches]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Overview of your branch network
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchBranches} disabled={loading}>
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            </Button>
            <Link href="/dashboard/admin/branches">
              <Button>
                <Building2 className="size-4" />
                Manage Branches
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Building2 className="size-5" />}
          label="Total Branches"
          value={loading ? "\u2014" : totalBranches}
          sublabel="Across all locations"
        />
        <StatCard
          icon={<ShieldCheck className="size-5" />}
          label="Active"
          value={loading ? "\u2014" : activeBranches}
          sublabel={`${inactiveBranches} inactive or suspended`}
        />
        <StatCard
          icon={<Users className="size-5" />}
          label="Total Users"
          value={loading ? "\u2014" : totalUsers}
          sublabel="Branch admins & staff"
        />
        <StatCard
          icon={<Activity className="size-5" />}
          label="Uptime"
          value={loading || totalBranches === 0 ? "\u2014" : `${Math.round((activeBranches / totalBranches) * 100)}%`}
          sublabel={activeBranches > 0 ? `${activeBranches}/${totalBranches} operational` : undefined}
        />
      </div>

      <div className="mt-8">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="size-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">Exchange Rates</h2>
              {rates.length > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  vs KHR &middot; {rates.find((r) => r.currencyId === "USD")?.validDate}
                </span>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={fetchRates} disabled={ratesLoading}>
              <RefreshCw className={cn("size-3.5", ratesLoading && "animate-spin")} />
            </Button>
          </div>
          {ratesLoading && rates.length === 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-3">
                  <div className="h-3 w-8 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-16 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-12 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {rates
                .filter((r) => KEY_CURRENCIES.includes(r.currencyId))
                .map((r) => {
                  const prev = ratesPrev[r.currencyId]
                  const diff = prev ? ((r.average - prev) / prev) * 100 : 0
                  const isUp = diff > 0
                  const TrendIcon = isUp ? TrendingUp : diff < 0 ? TrendingDown : null
                  return (
                    <div
                      key={r.currencyId}
                      className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <p className="text-[11px] font-medium text-muted-foreground">{r.currencyId}</p>
                      <p className="mt-1 text-lg font-bold tabular-nums tracking-tight">
                        {r.average.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        {TrendIcon && (
                          <TrendIcon className={cn("size-3", isUp ? "text-green-500" : "text-red-500")} />
                        )}
                        {r.unit > 1 ? `per ${r.unit} units` : ""}
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Recent Branches</h2>
              <Link href="/dashboard/admin/branches">
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="ml-1 size-3.5" />
                </Button>
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="size-8 animate-pulse rounded-lg bg-muted" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                  </div>
                ))}
              </div>
            ) : recentBranches.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Building2 className="mb-2 size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No branches yet</p>
                <p className="text-xs text-muted-foreground">Create your first branch to get started.</p>
              </div>
            ) : (
              <div className="divide-y">
                {recentBranches.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Store className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{b.name}</p>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Timer className="size-3" />
                        {new Date(b.createdAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge variant={statusConfig[b.status].variant} className="shrink-0 gap-1.5 px-2">
                      <span className={cn("size-1.5 rounded-full", statusConfig[b.status].dot)} />
                      {statusConfig[b.status].label}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card className="p-5">
            <h2 className="mb-4 text-base font-semibold">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/dashboard/admin/branches" className="contents">
                <Button variant="outline" className="flex-col gap-2 py-5 h-auto">
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/30">
                    <Plus className="size-4" />
                  </div>
                  <span className="text-xs font-medium">New Branch</span>
                </Button>
              </Link>
              <Link href="/dashboard/admin/branches" className="contents">
                <Button variant="outline" className="flex-col gap-2 py-5 h-auto">
                  <div className="rounded-lg bg-violet-50 p-2 text-violet-600 dark:bg-violet-950/30">
                    <Store className="size-4" />
                  </div>
                  <span className="text-xs font-medium">All Branches</span>
                </Button>
              </Link>
              <Button variant="outline" className="flex-col gap-2 py-5 h-auto" disabled>
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/30">
                  <Users className="size-4" />
                </div>
                <span className="text-xs font-medium">Users</span>
                <span className="text-[10px] text-muted-foreground">Coming soon</span>
              </Button>
              <Button variant="outline" className="flex-col gap-2 py-5 h-auto" disabled>
                <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/30">
                  <Activity className="size-4" />
                </div>
                <span className="text-xs font-medium">Reports</span>
                <span className="text-[10px] text-muted-foreground">Coming soon</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
