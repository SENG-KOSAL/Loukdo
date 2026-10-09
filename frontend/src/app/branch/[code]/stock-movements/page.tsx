"use client"

import { useParams } from "next/navigation"
import BranchLayout from "@/components/layouts/BranchLayout"
import { StockMovementsPanel } from "@/components/purchasing/StockMovementsPanel"

export default function BranchStockMovementsPage() {
  const params = useParams()
  const branchCode = params.code as string

  return (
    <BranchLayout>
      <StockMovementsPanel mode="branch" branchCode={branchCode} />
    </BranchLayout>
  )
}
