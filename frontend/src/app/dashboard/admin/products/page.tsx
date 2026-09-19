"use client"

import { Package, Plus } from "lucide-react"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"

export default function AdminProductsPage() {
  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage the global product catalog
          </p>
        </div>
        <Button disabled>
          <Plus className="size-4" /> Add Product
        </Button>
      </div>
      <EmptyState
        title="No products yet"
        description="Products will appear here once added."
        icon={<Package className="size-12 text-muted-foreground/30" />}
      />
    </DashboardLayout>
  )
}
