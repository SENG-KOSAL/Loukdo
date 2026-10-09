"use client"

import { useParams } from "next/navigation"
import BranchLayout from "@/components/layouts/BranchLayout"
import { POSTerminal } from "@/components/pos/POSTerminal"

export default function POSPage() {
  const params = useParams()
  const branchCode = params.code as string

  return (
    <BranchLayout>
      <POSTerminal mode="branch" branchCode={branchCode} />
    </BranchLayout>
  )
}
