"use client"

import { Badge } from "@/components/ui/badge"

type InvoiceStatus = "PENDING" | "PROCESSING" | "AUTHORIZED" | "REJECTED" | "CANCELLED" | "ERROR"

const statusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
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
  ERROR: {
    label: "Erro",
    className: "bg-red-500/20 text-red-600 border-red-500/30",
  },
}

interface InvoiceStatusBadgeProps {
  status: string
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const config = statusConfig[status as InvoiceStatus] || statusConfig.PENDING

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
