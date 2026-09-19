"use client"

import { Tags, Plus } from "lucide-react"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"

export default function AdminCategoriesPage() {
  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize the product catalog shared across all branches
          </p>
        </div>
        <Button disabled>
          <Plus className="size-4" /> Add Category
        </Button>
      </div>
      <EmptyState
        title="No categories"
        description="Categories help organize products across every branch."
        icon={<Tags className="size-12 text-muted-foreground/30" />}
      />
    </DashboardLayout>
  )
}
