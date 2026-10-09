"use client"

import DashboardLayout from "@/components/layouts/DashboardLayout"
import { PurchaseOrdersPanel } from "@/components/purchasing/PurchaseOrdersPanel"

export default function AdminPurchaseOrdersPage() {
  return (
    <DashboardLayout>
      <PurchaseOrdersPanel mode="admin" />
    </DashboardLayout>
  )
}
