"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Store, AlertCircle, ArrowLeft, Loader2 } from "lucide-react"
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

export default function BranchLoginPage() {
  const router = useRouter()
  const params = useParams()
  const branchCode = params.code as string

  const [branch, setBranch] = useState<{ name: string; code: string } | null>(null)
  const [branchLoading, setBranchLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/v1/branches?code=${branchCode}`)
      .then((r) => {
        if (!r.ok) throw new Error("Branch not found")
        return r.json()
      })
      .then((d) => setBranch(d))
      .catch(() => setError("Branch not found or is unavailable"))
      .finally(() => setBranchLoading(false))
  }, [branchCode])

  const handleLogin = async ({ username, password }: { username: string; password: string }) => {
    setLoading(true)
    setError(null)
    const result = await signIn("credentials", {
      username,
      password,
      loginType: "branch",
      branchCode,
      redirect: false,
    })
    if (result?.error) {
      setError("Invalid credentials or unauthorized branch access")
      setLoading(false)
    } else {
      window.location.href = `/branch/${branchCode}/pos`
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
              <Store className="size-5" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">Loukdo</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight mb-4">
            {branch ? (
              <>Welcome to <span className="text-teal-400">{branch.name}</span></>
            ) : (
              <>Branch <span className="text-teal-400">access</span></>
            )}
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            {branch
              ? `Sign in to process sales, manage inventory, and serve customers at ${branch.name}.`
              : "Sign in to process sales and manage your branch operations."}
          </p>
        </div>

        <div className="relative z-10">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to admin login
          </Link>
        </div>
      </div>

      {/* Right side — login form */}
      <div className="flex flex-1 items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Store className="size-5" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">Loukdo</span>
          </div>

          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="space-y-1 pb-6 px-0">
              <CardTitle className="font-display text-2xl font-bold tracking-tight">
                {branchLoading ? "Loading..." : branch ? branch.name : "Branch Unavailable"}
              </CardTitle>
              <CardDescription className="text-base">
                {branchLoading ? "Fetching branch details" : branch ? "Sign in with your branch account" : "This branch could not be found or is not accessible"}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {branchLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : branch ? (
                <LoginForm
                  onSubmit={handleLogin}
                  isLoading={loading}
                  errorMessage={error}
                  placeholderUsername="Enter your branch username"
                />
              ) : error ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="rounded-full bg-destructive/10 p-3">
                    <AlertCircle className="size-8 text-destructive" />
                  </div>
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button variant="outline" size="sm" onClick={() => router.push("/login")}>
                    Go to Admin Login
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
