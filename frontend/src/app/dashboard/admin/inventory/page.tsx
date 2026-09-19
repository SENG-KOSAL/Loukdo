"use client"

import { Boxes } from "lucide-react"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import { EmptyState } from "@/components/ui/empty-state"

export default function AdminInventoryPage() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Stock levels across all branches
        </p>
      </div>
      <EmptyState
        title="No inventory data"
        description="Stock levels will be tracked here once branches add products."
        icon={<Boxes className="size-12 text-muted-foreground/30" />}
      />
    </DashboardLayout>
  )
}
