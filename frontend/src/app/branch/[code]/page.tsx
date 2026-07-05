"use client"

import { useParams, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Store, LogOut, User, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"

export default function BranchLandingPage() {
  const params = useParams()
  const router = useRouter()
  const branchCode = params.code as string
  const { data: session } = useSession()
  const [branch, setBranch] = useState<{ name: string; code: string } | null>(null)

  useEffect(() => {
    fetch(`/api/branches?code=${branchCode}`)
      .then((r) => r.json())
      .then((d) => setBranch(d))
  }, [branchCode])

  const isBranchUser = session?.user?.branchId

  if (!isBranchUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-sm text-center">
          <CardContent className="py-8">
            <p className="text-destructive">Unauthorized — branch login required</p>
            <Button className="mt-4" onClick={() => router.push(`/branch/${branchCode}/login`)}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Store className="size-4" />
            </div>
            <span className="font-semibold text-sm">
              {branch?.name || branchCode}
            </span>
            <Badge variant="outline" className="text-[10px] font-mono">{branchCode}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {session?.user?.name || session?.user?.username}
            </span>
            <Button variant="ghost" size="icon-sm" onClick={() => signOut()}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold">Welcome to {branch?.name || branchCode}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Point of Sale dashboard for this branch location
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <CardTitle className="text-sm font-medium text-muted-foreground mb-1">Location Code</CardTitle>
            <p className="text-2xl font-bold font-mono">{branchCode}</p>
          </Card>
          <Card className="p-5">
            <CardTitle className="text-sm font-medium text-muted-foreground mb-1">Signed in as</CardTitle>
            <p className="text-2xl font-bold truncate">{session?.user?.name || session?.user?.username}</p>
          </Card>
          <Card className="p-5">
            <CardTitle className="text-sm font-medium text-muted-foreground mb-1">Role</CardTitle>
            <p className="text-2xl font-bold capitalize">{((session?.user as { role?: string })?.role || "staff").toLowerCase()}</p>
          </Card>
        </div>

        <Card className="mt-6 p-6 text-center text-muted-foreground border-dashed">
          <Store className="mx-auto size-8 mb-2 text-muted-foreground/40" />
          <p className="text-sm font-medium">POS interface coming soon</p>
          <p className="text-xs mt-1">This branch portal will be the main Point of Sale workspace.</p>
        </Card>
      </main>
    </div>
  )
}
