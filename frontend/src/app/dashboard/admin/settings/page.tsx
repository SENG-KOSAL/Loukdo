"use client"

import { Settings } from "lucide-react"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

export default function AdminSettingsPage() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Global configuration that applies across all branches
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Settings className="size-4" /> General
          </h3>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="platform-name">Platform Name</Label>
            <Input id="platform-name" value="Loukdo" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="default-currency">Default Currency</Label>
            <Input id="default-currency" value="USD" disabled />
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Settings className="size-4" /> Security
          </h3>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
            <Input id="session-timeout" type="number" placeholder="60" defaultValue="60" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-policy">Minimum Password Length</Label>
            <Input id="password-policy" type="number" placeholder="8" defaultValue="8" disabled />
          </div>
        </Card>
      </div>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        System settings configuration coming soon.
      </div>
    </DashboardLayout>
  )
}
