"use client"

import { Users, UserPlus } from "lucide-react"
import BranchLayout from "@/components/layouts/BranchLayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function BranchUsersPage() {
  return (
    <BranchLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage cashiers and branch staff</p>
        </div>
        <Button disabled>
          <UserPlus className="size-4" /> Add Staff
        </Button>
      </div>
      <Card className="p-12 flex flex-col items-center justify-center border-dashed">
        <Users className="size-12 text-muted-foreground/30 mb-3" />
        <h3 className="font-semibold text-lg text-muted-foreground/70">No staff users</h3>
        <p className="text-sm text-muted-foreground mt-1">Staff accounts will be managed here.</p>
      </Card>
    </BranchLayout>
  )
}
