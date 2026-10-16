"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScanLine } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()

  return (
    <div className="relative flex min-h-screen">
      {/* Left side — brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600/20 via-slate-900 to-slate-900" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-teal-500 text-white">
              <ScanLine className="size-5" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">Loukdo</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight mb-4">
            Get started with<br />
            <span className="text-teal-400">your retail network</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Set up branches, manage inventory, and process sales — all from one place.
          </p>
        </div>

        <div className="relative z-10 text-sm text-slate-500">
          Registration is currently by invitation only.
        </div>
      </div>

      {/* Right side — content */}
      <div className="flex flex-1 items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ScanLine className="size-5" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">Loukdo</span>
          </div>

          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="space-y-1 pb-6 px-0">
              <CardTitle className="font-display text-2xl font-bold tracking-tight">
                Create account
              </CardTitle>
              <p className="text-muted-foreground text-base">
                Registration will be available once the backend is configured.
              </p>
            </CardHeader>
            <CardContent className="px-0">
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
