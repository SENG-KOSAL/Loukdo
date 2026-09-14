import * as React from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn("p-12 flex flex-col items-center justify-center border-dashed text-center", className)}>
      {icon && (
        <div className="mb-3 rounded-full bg-muted p-3">
          {icon}
        </div>
      )}
      <h3 className="font-semibold text-lg text-muted-foreground/70">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </Card>
  )
}
