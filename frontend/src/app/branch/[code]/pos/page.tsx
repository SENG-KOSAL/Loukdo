"use client"

import { ShoppingCart } from "lucide-react"
import BranchLayout from "@/components/layouts/BranchLayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function POSPage() {
  return (
    <BranchLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Point of Sale</h1>
        <p className="text-sm text-muted-foreground mt-1">Process customer transactions</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6 min-h-[400px] flex items-center justify-center border-dashed">
            <div className="text-center">
              <ShoppingCart className="mx-auto size-12 text-muted-foreground/30 mb-3" />
              <h3 className="font-semibold text-lg text-muted-foreground/70">POS Interface</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Product search, cart management, and checkout flow will appear here.
              </p>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-3">Current Cart</h3>
            <div className="flex items-center justify-center h-32 border border-dashed rounded-lg text-xs text-muted-foreground">
              No items in cart
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold text-lg">$0.00</span>
              </div>
              <Button className="w-full" disabled>
                Checkout
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </BranchLayout>
  )
}
