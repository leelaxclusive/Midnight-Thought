"use client"

import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

// Spinner component
export function Spinner({ size = "default", className, ...props }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  }

  return (
    <Loader2
      className={cn("animate-spin", sizeClasses[size], className)}
      {...props}
    />
  )
}

// Loading states
export function LoadingSpinner({ size = "default", text, className }) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Spinner size={size} />
      {text && <span className="text-muted-foreground">{text}</span>}
    </div>
  )
}

export function LoadingCard({ className }) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="rounded-lg border bg-card p-6">
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-20 bg-muted rounded"></div>
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-muted rounded-full"></div>
            <div className="h-6 w-20 bg-muted rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LoadingStoryCard({ className }) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="aspect-[16/9] bg-muted"></div>
        <div className="p-4 space-y-3">
          <div className="h-4 bg-muted rounded w-4/5"></div>
          <div className="h-3 bg-muted rounded w-3/5"></div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-muted rounded-full"></div>
              <div className="h-3 w-16 bg-muted rounded"></div>
            </div>
            <div className="h-3 w-12 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LoadingPage({ text = "Loading..." }) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center space-y-4">
        <Spinner size="xl" />
        <p className="text-lg text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}

export function LoadingButton({ isLoading, children, disabled, ...props }) {
  return (
    <button
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <Spinner size="sm" />
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  )
}

export function LoadingTable({ rows = 5, cols = 4, className }) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="border rounded-lg overflow-hidden">
        <div className="border-b bg-muted p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, i) => (
              <div key={i} className="h-4 bg-muted-foreground/20 rounded"></div>
            ))}
          </div>
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="border-b p-4 last:border-b-0">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {Array.from({ length: cols }).map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function LoadingList({ items = 5, className }) {
  return (
    <div className={cn("space-y-4 animate-pulse", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <div className="h-12 w-12 bg-muted rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
          <div className="h-8 w-20 bg-muted rounded"></div>
        </div>
      ))}
    </div>
  )
}

export function LoadingSkeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}