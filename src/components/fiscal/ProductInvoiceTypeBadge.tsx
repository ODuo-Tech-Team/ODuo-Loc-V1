"use client"

import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownLeft } from "lucide-react"

type ProductInvoiceType = "REMESSA_LOCACAO" | "RETORNO_LOCACAO"

const typeConfig: Record<ProductInvoiceType, { label: string; className: string; icon: typeof ArrowUpRight }> = {
  REMESSA_LOCACAO: {
    label: "Remessa",
    className: "bg-blue-500/20 text-blue-600 border-blue-500/30",
    icon: ArrowUpRight,
  },
  RETORNO_LOCACAO: {
    label: "Retorno",
    className: "bg-purple-500/20 text-purple-600 border-purple-500/30",
    icon: ArrowDownLeft,
  },
}

interface ProductInvoiceTypeBadgeProps {
  type: string
}

export function ProductInvoiceTypeBadge({ type }: ProductInvoiceTypeBadgeProps) {
  const config = typeConfig[type as ProductInvoiceType] || typeConfig.REMESSA_LOCACAO
  const Icon = config.icon

  return (
    <Badge variant="outline" className={`${config.className} gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
