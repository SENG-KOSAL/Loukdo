"use client"

import { useState } from "react"
import { KeyRound, Loader2, CheckCircle2 } from "lucide-react"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { apiClient } from "@/lib/api-client"
import { RolePermissionsCard } from "@/components/settings/RolePermissionsCard"

export default function AdminSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match")
      return
    }

    setLoading(true)
    try {
      await apiClient("/v1/users/me/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      setSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your super admin account
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <KeyRound className="size-4" /> Change Password
          </h3>
          <Separator />
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {success && (
              <p className="flex items-center gap-1.5 text-sm text-emerald-600">
                <CheckCircle2 className="size-4" /> Password updated successfully
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="size-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </Card>
      </div>

      <div className="mt-6">
        <RolePermissionsCard />
      </div>
    </DashboardLayout>
  )
}
