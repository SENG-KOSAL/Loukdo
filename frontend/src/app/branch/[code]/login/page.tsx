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
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100 px-4 dark:from-emerald-950 dark:via-green-950 dark:to-teal-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.08),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(5,150,105,0.06),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,rgba(5,150,105,0.1),transparent_50%)]" />

      <div className="absolute left-4 top-4 sm:left-8 sm:top-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to admin login
        </Link>
      </div>

      <Card className="relative w-full max-w-sm shadow-xl shadow-emerald-500/5 dark:shadow-emerald-500/10">
        <CardHeader className="space-y-1 pb-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-emerald-600 shadow-sm dark:bg-emerald-500">
            <Store className="size-6 text-white" />
          </div>
          {branchLoading ? (
            <>
              <CardTitle className="text-xl font-semibold tracking-tight">Loading...</CardTitle>
              <CardDescription className="text-sm">Fetching branch details</CardDescription>
            </>
          ) : branch ? (
            <>
              <CardTitle className="text-xl font-semibold tracking-tight">{branch.name}</CardTitle>
              <CardDescription className="text-sm">
                Sign in with your branch account
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-xl font-semibold tracking-tight text-destructive">Branch Unavailable</CardTitle>
              <CardDescription className="text-sm">This branch could not be found or is not accessible</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
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
  )
}
