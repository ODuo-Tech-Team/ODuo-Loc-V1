"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StockLevelBadgeProps {
  available: number
  total: number
  minLevel?: number
  showNumbers?: boolean
  size?: "sm" | "md" | "lg"
}

export function StockLevelBadge({
  available,
  total,
  minLevel = 1,
  showNumbers = true,
  size = "md",
}: StockLevelBadgeProps) {
  // Tratar valores undefined/null
  const safeAvailable = available ?? 0
  const safeTotal = total ?? 0

  const percentage = safeTotal > 0 ? (safeAvailable / safeTotal) * 100 : 0
  const hasNoUnits = safeTotal === 0
  const isOutOfStock = safeAvailable === 0 && safeTotal > 0
  const isLow = safeAvailable <= minLevel && safeAvailable > 0
  const isCritical = safeAvailable > 0 && safeAvailable <= minLevel / 2

  let status: "critical" | "low" | "normal" | "out" | "empty"
  let label: string
  let variant: "default" | "secondary" | "destructive" | "outline"

  if (hasNoUnits) {
    status = "empty"
    label = "Sem unidades"
    variant = "outline"
  } else if (isOutOfStock) {
    status = "out"
    label = "Esgotado"
    variant = "destructive"
  } else if (isCritical) {
    status = "critical"
    label = "Crítico"
    variant = "destructive"
  } else if (isLow) {
    status = "low"
    label = "Baixo"
    variant = "secondary"
  } else {
    status = "normal"
    label = "Normal"
    variant = "outline"
  }

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0",
    md: "text-xs px-2 py-0.5",
    lg: "text-sm px-2.5 py-1",
  }

  return (
    <Badge
      variant={variant}
      className={cn(
        sizeClasses[size],
        status === "critical" && "bg-red-500 hover:bg-red-600",
        status === "low" && "bg-yellow-500 hover:bg-yellow-600 text-white",
        status === "normal" && "bg-green-100 text-green-800 border-green-200",
        status === "out" && "bg-red-600 hover:bg-red-700",
        status === "empty" && "bg-zinc-500 hover:bg-zinc-600 text-white border-zinc-400"
      )}
    >
      {showNumbers ? `${safeAvailable}/${safeTotal}` : label}
    </Badge>
  )
}
