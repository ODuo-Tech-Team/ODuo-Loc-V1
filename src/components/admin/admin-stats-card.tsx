"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface AdminStatsCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  colorClass?: string
  className?: string
}

export function AdminStatsCard({
  label,
  value,
  icon: Icon,
  subtitle,
  trend,
  colorClass = "text-white",
  className,
}: AdminStatsCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden bg-zinc-900/50 border-zinc-800",
      "hover:border-zinc-700 transition-all duration-200",
      className
    )}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-2 text-zinc-400 text-xs sm:text-sm mb-2">
          {Icon && <Icon className="h-4 w-4 sm:h-5 sm:w-5" />}
          {label}
        </div>
        <p className={cn("text-xl sm:text-3xl font-bold", colorClass)}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">{subtitle}</p>
        )}
        {trend && (
          <p className={cn(
            "text-xs sm:text-sm mt-1 flex items-center gap-1",
            trend.isPositive ? "text-emerald-400" : "text-red-400"
          )}>
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Grid wrapper para múltiplos stats cards
interface AdminStatsGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4 | 5
  className?: string
}

export function AdminStatsGrid({
  children,
  columns = 4,
  className,
}: AdminStatsGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  }

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  )
}
