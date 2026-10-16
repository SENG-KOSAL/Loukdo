"use client"

import DashboardLayout from "@/components/layouts/DashboardLayout"
import { StockMovementsPanel } from "@/components/purchasing/StockMovementsPanel"

export default function AdminStockMovementsPage() {
  return (
    <DashboardLayout>
      <StockMovementsPanel mode="admin" />
    </DashboardLayout>
  )
}