"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { LogIn } from "lucide-react"
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
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 px-4 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.08),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.06),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.1),transparent_50%)]" />
      <Card className="relative w-full max-w-sm shadow-xl shadow-blue-500/5 dark:shadow-blue-500/10">
        <CardHeader className="space-y-1 pb-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary shadow-sm">
            <LogIn className="size-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Loukdo POS
          </CardTitle>
          <CardDescription className="text-sm">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm
            onSubmit={handleLogin}
            isLoading={loading}
            errorMessage={error}
          />
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
              Register
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
