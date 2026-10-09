"use client"

import DashboardLayout from "@/components/layouts/DashboardLayout"
import { VendorsPanel } from "@/components/vendors/VendorsPanel"

export default function AdminVendorsPage() {
  return (
    <DashboardLayout>
      <VendorsPanel mode="admin" />
    </DashboardLayout>
  )
}
