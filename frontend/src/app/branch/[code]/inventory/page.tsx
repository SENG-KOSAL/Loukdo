"use client"

import { Boxes } from "lucide-react"
import BranchLayout from "@/components/layouts/BranchLayout"
import { EmptyState } from "@/components/ui/empty-state"

export default function InventoryPage() {
  return (
    <BranchLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <p className="text-sm text-muted-foreground mt-1">Track stock levels and manage inventory</p>
      </div>
      <EmptyState
        title="No inventory data"
        description="Stock levels will be tracked here once products are added."
        icon={<Boxes className="size-12 text-muted-foreground/30" />}
      />
    </BranchLayout>
  )
}
