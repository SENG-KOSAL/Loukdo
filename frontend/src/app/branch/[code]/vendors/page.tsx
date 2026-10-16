"use client"

import { useParams } from "next/navigation"
import BranchLayout from "@/components/layouts/BranchLayout"
import { VendorsPanel } from "@/components/vendors/VendorsPanel"

export default function BranchVendorsPage() {
  const params = useParams()
  const branchCode = params.code as string

  return (
    <BranchLayout>
      <VendorsPanel mode="branch" branchCode={branchCode} />
    </BranchLayout>
  )
}
