"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// ===============================
// STATUS STYLES - Paleta Semântica
// ===============================

const statusStyles = {
  // Booking/Reservation Status
  PENDING: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  CONFIRMED: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  IN_PROGRESS: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
  COMPLETED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/40",
  DELIVERED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  RETURNED: "bg-blue-500/20 text-blue-400 border-blue-500/40",

  // Equipment Status
  AVAILABLE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  RENTED: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  MAINTENANCE: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  INACTIVE: "bg-zinc-500/20 text-zinc-400 border-zinc-500/40",
  RESERVED: "bg-purple-500/20 text-purple-400 border-purple-500/40",

  // Financial Status
  PAID: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  UNPAID: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  OVERDUE: "bg-red-500/20 text-red-400 border-red-500/40",
  PARTIAL: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
  REFUNDED: "bg-purple-500/20 text-purple-400 border-purple-500/40",

  // Client Status
  ACTIVE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  BLOCKED: "bg-red-500/20 text-red-400 border-red-500/40",

  // Lead Status (CRM)
  NEW: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  CONTACTED: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  QUALIFIED: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  PROPOSAL: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  WON: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  LOST: "bg-red-500/20 text-red-400 border-red-500/40",

  // Generic
  SUCCESS: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  WARNING: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  ERROR: "bg-red-500/20 text-red-400 border-red-500/40",
  INFO: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  NEUTRAL: "bg-zinc-500/20 text-zinc-400 border-zinc-500/40",
} as const

type StatusKey = keyof typeof statusStyles

// ===============================
// STATUS LABELS - Tradução pt-BR
// ===============================

const statusLabels: Record<StatusKey, string> = {
  // Booking
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "Em Andamento",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  DELIVERED: "Entregue",
  RETURNED: "Devolvido",

  // Equipment
  AVAILABLE: "Disponível",
  RENTED: "Alugado",
  MAINTENANCE: "Manutenção",
  INACTIVE: "Inativo",
  RESERVED: "Reservado",

  // Financial
  PAID: "Pago",
  UNPAID: "Não Pago",
  OVERDUE: "Vencido",
  PARTIAL: "Parcial",
  REFUNDED: "Reembolsado",

  // Client
  ACTIVE: "Ativo",
  BLOCKED: "Bloqueado",

  // Lead
  NEW: "Novo",
  CONTACTED: "Contatado",
  QUALIFIED: "Qualificado",
  PROPOSAL: "Proposta",
  WON: "Ganho",
  LOST: "Perdido",

  // Generic
  SUCCESS: "Sucesso",
  WARNING: "Atenção",
  ERROR: "Erro",
  INFO: "Info",
  NEUTRAL: "Neutro",
}

// ===============================
// COMPONENT
// ===============================

interface StatusBadgeProps {
  status: StatusKey | string
  label?: string // Override label
  className?: string
  size?: "sm" | "md" | "lg"
}

export function StatusBadge({
  status,
  label,
  className,
  size = "md",
}: StatusBadgeProps) {
  const normalizedStatus = status.toUpperCase() as StatusKey
  const style = statusStyles[normalizedStatus] || statusStyles.NEUTRAL
  const displayLabel = label || statusLabels[normalizedStatus] || status

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0",
    md: "text-xs px-2 py-0.5",
    lg: "text-sm px-2.5 py-1",
  }

  return (
    <Badge
      variant="outline"
      className={cn(style, sizeClasses[size], className)}
    >
      {displayLabel}
    </Badge>
  )
}

// ===============================
// UTILITY EXPORTS
// ===============================

export { statusStyles, statusLabels }
export type { StatusKey }
