"use client"

import { History } from "lucide-react"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import { EmptyState } from "@/components/ui/empty-state"

export default function AdminSalesPage() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Sales History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View completed transactions across all branches
        </p>
      </div>
      <EmptyState
        title="No sales recorded"
        description="Sales transactions from every branch will appear here once processed."
        icon={<History className="size-12 text-muted-foreground/30" />}
      />
    </DashboardLayout>
  )
}
