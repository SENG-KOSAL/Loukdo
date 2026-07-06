"use client"

import { Settings, Save } from "lucide-react"
import BranchLayout from "@/components/layouts/BranchLayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  return (
    <BranchLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Branch Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Tax rates, receipt format, and store configuration</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Settings className="size-4" /> General
          </h3>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="tax-rate">Tax Rate (%)</Label>
            <Input id="tax-rate" type="number" placeholder="10" defaultValue="10" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" value="USD" disabled />
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Settings className="size-4" /> Receipt
          </h3>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="receipt-footer">Receipt Footer</Label>
            <Input id="receipt-footer" placeholder="Thank you for your visit!" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receipt-prefix">Receipt Prefix</Label>
            <Input id="receipt-prefix" placeholder="INV-" disabled />
          </div>
        </Card>
      </div>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Settings configuration coming soon.
      </div>
    </BranchLayout>
  )
}
