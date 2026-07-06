"use client"

import { useState, useEffect } from "react"
import { useParams, usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import {
  LayoutDashboard, ShoppingCart, Package, Tags, History,
  Users, Boxes, Settings, LogOut, Store, ChevronLeft, ChevronRight,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "" },
  { label: "POS", icon: ShoppingCart, href: "/pos" },
  { label: "Products", icon: Package, href: "/products" },
  { label: "Categories", icon: Tags, href: "/categories" },
  { label: "Sales", icon: History, href: "/sales" },
  { label: "Users", icon: Users, href: "/users" },
  { label: "Inventory", icon: Boxes, href: "/inventory" },
  { label: "Settings", icon: Settings, href: "/settings" },
]

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

export default function BranchLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const pathname = usePathname()
  const branchCode = params.code as string
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [branch, setBranch] = useState<{ name: string } | null>(null)

  useEffect(() => {
    fetch(`/api/v1/branches?code=${branchCode}`)
      .then((r) => r.json())
      .then((d) => setBranch(d))
  }, [branchCode])

  const basePath = `/branch/${branchCode}`
  const currentSlug = pathname.replace(basePath, "") || "/"

  const isActive = (href: string) => {
    if (!href) return currentSlug === "" || currentSlug === "/"
    return currentSlug.startsWith(href)
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-card border-r">
      <div className={cn("flex h-14 items-center border-b px-3", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white text-xs font-bold">
              L
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">{branch?.name || branchCode}</p>
              <p className="truncate text-[10px] text-muted-foreground leading-tight">{branchCode}</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white text-xs font-bold">
            L
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.label}
              href={`${basePath}${item.href}`}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-2",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className={cn("border-t p-2", collapsed && "flex flex-col items-center")}>
        <div className={cn("flex items-center gap-2 rounded-lg px-2 py-1.5", !collapsed && "")}>
          {!collapsed && (
            <>
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                {getInitials(session?.user?.name || session?.user?.username || "U")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium leading-tight">{session?.user?.name || session?.user?.username}</p>
                <p className="truncate text-[10px] text-muted-foreground leading-tight capitalize">{(session?.user as { role?: string })?.role?.toLowerCase() || "staff"}</p>
              </div>
            </>
          )}
          <Button variant="ghost" size="icon-xs" className="shrink-0 size-7 text-muted-foreground" onClick={() => signOut()}>
            <LogOut className="size-3.5" />
          </Button>
        </div>
        {collapsed ? (
          <Button variant="ghost" size="icon-xs" className="mt-1 size-7" onClick={() => setCollapsed(false)}>
            <ChevronRight className="size-3.5" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon-xs" className="mt-1 w-full justify-center text-muted-foreground" onClick={() => setCollapsed(true)}>
            <ChevronLeft className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 h-full z-30 transition-all duration-200",
          collapsed ? "w-16" : "w-56",
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer trigger */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger className="fixed top-3 left-3 z-20 lg:hidden inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted size-9">
        <Menu className="size-5" />
      </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/80 backdrop-blur-sm px-4 lg:hidden">
        <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white text-xs font-bold shrink-0">
          L
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{branch?.name || branchCode}</p>
          <p className="truncate text-[10px] text-muted-foreground leading-tight">
            {navItems.find((i) => isActive(i.href))?.label || "Dashboard"} · {branchCode}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => signOut()}>
          <LogOut className="size-4" />
        </Button>
      </header>

      {/* Main content */}
      <main className={cn(
        "flex-1 transition-all duration-200",
        "lg:pl-56",
        collapsed && "lg:pl-16",
      )}>
        <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  )
}
