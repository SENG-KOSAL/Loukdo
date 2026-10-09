"use client"

import { useParams } from "next/navigation"
import BranchLayout from "@/components/layouts/BranchLayout"
import { PurchaseOrdersPanel } from "@/components/purchasing/PurchaseOrdersPanel"

export default function BranchPurchaseOrdersPage() {
  const params = useParams()
  const branchCode = params.code as string

  return (
    <BranchLayout>
      <PurchaseOrdersPanel mode="branch" branchCode={branchCode} />
    </BranchLayout>
  )
}
