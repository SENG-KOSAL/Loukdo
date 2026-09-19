"use client"

import { Users, UserPlus } from "lucide-react"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AdminUsersPage() {
  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage branch admins and staff across the network
          </p>
        </div>
        <Button disabled>
          <UserPlus className="size-4" /> Add User
        </Button>
      </div>
      <Card className="p-12 flex flex-col items-center justify-center border-dashed">
        <Users className="size-12 text-muted-foreground/30 mb-3" />
        <h3 className="font-semibold text-lg text-muted-foreground/70">No users found</h3>
        <p className="text-sm text-muted-foreground mt-1">User accounts across all branches will be managed here.</p>
      </Card>
    </DashboardLayout>
  )
}
