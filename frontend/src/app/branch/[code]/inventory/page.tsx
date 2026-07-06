"use client"

import { Boxes } from "lucide-react"
import BranchLayout from "@/components/layouts/BranchLayout"
import { Card } from "@/components/ui/card"

export default function InventoryPage() {
  return (
    <BranchLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <p className="text-sm text-muted-foreground mt-1">Track stock levels and manage inventory</p>
      </div>
      <Card className="p-12 flex flex-col items-center justify-center border-dashed">
        <Boxes className="size-12 text-muted-foreground/30 mb-3" />
        <h3 className="font-semibold text-lg text-muted-foreground/70">No inventory data</h3>
        <p className="text-sm text-muted-foreground mt-1">Stock levels will be tracked here once products are added.</p>
      </Card>
    </BranchLayout>
  )
}
