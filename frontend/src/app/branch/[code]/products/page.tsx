"use client"

import { Package, Plus } from "lucide-react"
import BranchLayout from "@/components/layouts/BranchLayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ProductsPage() {
  return (
    <BranchLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage product catalog</p>
        </div>
        <Button disabled>
          <Plus className="size-4" /> Add Product
        </Button>
      </div>
      <Card className="p-12 flex flex-col items-center justify-center border-dashed">
        <Package className="size-12 text-muted-foreground/30 mb-3" />
        <h3 className="font-semibold text-lg text-muted-foreground/70">No products yet</h3>
        <p className="text-sm text-muted-foreground mt-1">Products will appear here once added.</p>
      </Card>
    </BranchLayout>
  )
}
