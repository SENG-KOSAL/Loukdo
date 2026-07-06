"use client"

import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Store, ShoppingCart, Package, Tags, History,
  Users, Boxes, Settings, TrendingUp, Receipt,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import BranchLayout from "@/components/layouts/BranchLayout"
import { cn } from "@/lib/utils"
import Link from "next/link"

const modules = [
  { label: "POS", icon: ShoppingCart, href: "/pos", desc: "Sell products & process orders", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  { label: "Products", icon: Package, href: "/products", desc: "Manage product catalog", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
  { label: "Categories", icon: Tags, href: "/categories", desc: "Organize product groups", color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
  { label: "Sales", icon: History, href: "/sales", desc: "View transaction history", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
  { label: "Users", icon: Users, href: "/users", desc: "Manage cashiers & staff", color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/30" },
  { label: "Inventory", icon: Boxes, href: "/inventory", desc: "Track stock levels", color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-950/30" },
  { label: "Settings", icon: Settings, href: "/settings", desc: "Tax, receipt & store config", color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-950/30" },
]

export default function BranchDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const branchCode = params.code as string
  const { data: session } = useSession()

  if (!session?.user?.branchId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-sm text-center p-8">
          <Store className="mx-auto size-10 text-muted-foreground/40 mb-3" />
          <p className="text-destructive font-medium">Unauthorized</p>
          <p className="text-sm text-muted-foreground mt-1">Branch login required.</p>
          <Button className="mt-4" onClick={() => router.push(`/branch/${branchCode}/login`)}>
            Go to Login
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <BranchLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Branch Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Overview and quick access to all branch modules
            </p>
          </div>
          <Link href={`/branch/${branchCode}/pos`}>
            <Button className="gap-2 shadow-sm">
              <ShoppingCart className="size-4" />
              Open POS
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Today&apos;s Sales</p>
              <p className="text-2xl font-bold">$0.00</p>
              <p className="text-xs text-muted-foreground">No transactions yet</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950/30">
              <Receipt className="size-5" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Orders</p>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/30">
              <TrendingUp className="size-5" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Products</p>
              <p className="text-2xl font-bold">&mdash;</p>
              <p className="text-xs text-muted-foreground">In catalog</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-950/30">
              <Package className="size-5" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Staff</p>
              <p className="text-2xl font-bold">&mdash;</p>
              <p className="text-xs text-muted-foreground">Active users</p>
            </div>
            <div className="rounded-lg bg-violet-50 p-2.5 text-violet-600 dark:bg-violet-950/30">
              <Users className="size-5" />
            </div>
          </div>
        </Card>
      </div>

      <h2 className="text-base font-semibold mb-4">Modules</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {modules.map((m) => {
          const Icon = m.icon
          return (
            <Link key={m.label} href={`/branch/${branchCode}${m.href}`}>
              <Card className="group p-4 transition-all hover:shadow-md hover:border-primary/25 cursor-pointer h-full">
                <div className="flex items-start gap-3">
                  <div className={cn("rounded-lg p-2.5 shrink-0", m.bg)}>
                    <Icon className={cn("size-5", m.color)} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm group-hover:text-primary transition-colors">{m.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </BranchLayout>
  )
}


