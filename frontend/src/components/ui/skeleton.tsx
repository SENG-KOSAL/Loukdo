import * as React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangle' | 'circle'
}

function Skeleton({
  className,
  variant = 'rectangle',
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        variant === 'circle' && "rounded-full",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
