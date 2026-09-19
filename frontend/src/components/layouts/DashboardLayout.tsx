"use client"

import { useState, useMemo } from "react"
import { useParams, usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import {
  LayoutDashboard, Building2,
  Users, Menu, LogOut, Settings,
  Search, X, Bell, ChevronLeft, ChevronRight,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAppStore } from "@/stores"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navSections = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard/admin" },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Branches", icon: Building2, href: "/dashboard/admin/branches" },
      { label: "Users", icon: Users, href: "/dashboard/admin/users" },
      { label: "Settings", icon: Settings, href: "/dashboard/admin/settings" },
    ],
  },
]

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, toggleSidebar, mobileOpen, setMobileOpen } = useAppStore()
  const { data: session } = useSession()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")

  const collapsed = !sidebarOpen
  const showLabels = sidebarOpen

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return navSections
    return navSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (i) => i.label.toLowerCase().includes(q) || i.href.toLowerCase().includes(q),
        ),
      }))
      .filter((section) => section.items.length > 0)
  }, [searchQuery])

  const flatItems = navSections.flatMap((section) =>
    section.items.map((item) => ({ ...item, section: section.label })),
  )
  const currentItem = flatItems.find(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/"),
  )

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/")

  const searchActive = searchQuery.trim().length > 0

  const sidebarContent = (
    <div className="flex h-full flex-col bg-card border-r">
      <div className={cn("flex h-14 items-center border-b px-3", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold">
              L
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">Loukdo</p>
              <p className="truncate text-[10px] text-muted-foreground leading-tight uppercase tracking-wider">POS Admin</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold">
            L
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {filteredSections.map((section) => (
          <div key={section.label} className="mb-4">
            {showLabels && (
              <p className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      collapsed && "justify-center px-2",
                    )}
                  >
                    {Icon && <Icon className="size-4 shrink-0" />}
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
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
                <p className="truncate text-[10px] text-muted-foreground leading-tight capitalize">{(session?.user as { role?: string })?.role?.toLowerCase() || "admin"}</p>
              </div>
            </>
          )}
          <Button variant="ghost" size="icon" className="shrink-0 size-7 text-muted-foreground" onClick={() => signOut()}>
            <LogOut className="size-3.5" />
          </Button>
        </div>
        {collapsed ? (
          <Button variant="ghost" size="icon" className="mt-1 size-7" onClick={() => setCollapsed(false)}>
            <ChevronRight className="size-3.5" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="mt-1 w-full justify-center text-muted-foreground" onClick={() => setCollapsed(true)}>
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
        <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold shrink-0">
          L
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">Loukdo Admin</p>
          <p className="truncate text-[10px] text-muted-foreground leading-tight">
            {currentItem?.label || "Dashboard"}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => signOut()}>
          <LogOut className="size-4" />
        </Button>
      </header>

      {/* Main content */}
      <main className={cn(
        "flex-1 transition-all duration-200",
        "lg:pl-56",
        collapsed && "lg:pl-16",
      )}>
        <header className="hidden lg:flex sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/80 backdrop-blur-sm px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-muted-foreground"
          >
            {sidebarOpen ? <ChevronLeft className="size-5" /> : <Menu className="size-5" />}
          </Button>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold tracking-tight">
              {searchActive ? "Search" : (currentItem?.label || "Dashboard")}
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {currentItem ? `${currentItem.section} / ${currentItem.label}` : "Admin overview"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search pages..."
                className="pl-9 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchActive && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground relative">
              <Bell className="size-4" />
              <span className="absolute top-2 right-2 size-1.5 rounded-full bg-destructive" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 h-9">
                  <div className="flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                    {getInitials(session?.user?.name || session?.user?.username || "U")}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-medium leading-none">{session?.user?.name || session?.user?.email}</p>
                    <p className="text-[10px] text-muted-foreground capitalize leading-tight">{(session?.user as { role?: string })?.role?.toLowerCase() || "admin"}</p>
                  </div>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session?.user?.name || session?.user?.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="flex items-center gap-2">
                  <Settings className="size-4" />
                  Settings
                  <span className="ml-auto text-[10px] text-muted-foreground">Soon</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                >
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  )
}
