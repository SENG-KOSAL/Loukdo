"use client"

import { History } from "lucide-react"
import BranchLayout from "@/components/layouts/BranchLayout"
import { Card } from "@/components/ui/card"

export default function SalesPage() {
  return (
    <BranchLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Sales History</h1>
        <p className="text-sm text-muted-foreground mt-1">View all completed transactions</p>
      </div>
      <Card className="p-12 flex flex-col items-center justify-center border-dashed">
        <History className="size-12 text-muted-foreground/30 mb-3" />
        <h3 className="font-semibold text-lg text-muted-foreground/70">No sales recorded</h3>
        <p className="text-sm text-muted-foreground mt-1">Sales transactions will appear here once processed.</p>
      </Card>
    </BranchLayout>
  )
}
