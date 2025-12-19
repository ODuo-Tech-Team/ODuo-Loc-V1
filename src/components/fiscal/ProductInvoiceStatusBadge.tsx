"use client"

import { Badge } from "@/components/ui/badge"

type ProductInvoiceStatus =
  | "PENDING"
  | "PROCESSING"
  | "AUTHORIZED"
  | "REJECTED"
  | "CANCELLED"
  | "DENEGADA"
  | "ERROR"

const statusConfig: Record<ProductInvoiceStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Pendente",
    className: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  },
  PROCESSING: {
    label: "Processando",
    className: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  },
  AUTHORIZED: {
    label: "Autorizada",
    className: "bg-green-500/20 text-green-600 border-green-500/30",
  },
  REJECTED: {
    label: "Rejeitada",
    className: "bg-red-500/20 text-red-600 border-red-500/30",
  },
  CANCELLED: {
    label: "Cancelada",
    className: "bg-gray-500/20 text-gray-600 border-gray-500/30",
  },
  DENEGADA: {
    label: "Denegada",
    className: "bg-orange-500/20 text-orange-600 border-orange-500/30",
  },
  ERROR: {
    label: "Erro",
    className: "bg-red-500/20 text-red-600 border-red-500/30",
  },
}

interface ProductInvoiceStatusBadgeProps {
  status: string
}

export function ProductInvoiceStatusBadge({ status }: ProductInvoiceStatusBadgeProps) {
  const config = statusConfig[status as ProductInvoiceStatus] || statusConfig.PENDING

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
