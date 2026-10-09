"use client"

import DashboardLayout from "@/components/layouts/DashboardLayout"
import { POSTerminal } from "@/components/pos/POSTerminal"

export default function AdminPOSPage() {
  return (
    <DashboardLayout>
      <POSTerminal mode="admin" />
    </DashboardLayout>
  )
}
