"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { LogIn, ScanLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Link from "next/link"
import { LoginForm } from "@/components/auth/LoginForm"

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async ({ username, password }: { username: string; password: string }) => {
    setLoading(true)
    setError(null)
    const result = await signIn("credentials", { username, password, loginType: "admin", redirect: false })
    if (result?.error) {
      setError("Invalid username or password")
      setLoading(false)
    } else {
      window.location.href = "/dashboard/admin"
    }
  }

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
            Run your retail network<br />
            <span className="text-teal-400">without friction</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Multi-branch point of sale, inventory, and analytics — built for speed.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-sm text-slate-500">
          <span>Trusted by retail operators</span>
          <div className="flex -space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="size-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side — login form */}
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
                Admin sign in
              </CardTitle>
              <CardDescription className="text-base">
                Manage your branch network
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <LoginForm
                onSubmit={handleLogin}
                isLoading={loading}
                errorMessage={error}
              />
              <div className="mt-6 text-center text-sm text-muted-foreground">
                Need an account?{" "}
                <Link href="/register" className="font-medium text-primary hover:underline underline-offset-4">
                  Register
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
