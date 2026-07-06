"use client"

import { Tags, Plus } from "lucide-react"
import BranchLayout from "@/components/layouts/BranchLayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function CategoriesPage() {
  return (
    <BranchLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">Organize products into groups</p>
        </div>
        <Button disabled>
          <Plus className="size-4" /> Add Category
        </Button>
      </div>
      <Card className="p-12 flex flex-col items-center justify-center border-dashed">
        <Tags className="size-12 text-muted-foreground/30 mb-3" />
        <h3 className="font-semibold text-lg text-muted-foreground/70">No categories</h3>
        <p className="text-sm text-muted-foreground mt-1">Categories help organize your products.</p>
      </Card>
    </BranchLayout>
  )
}
