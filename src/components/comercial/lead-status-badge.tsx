"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST"

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  NEW: {
    label: "Novo",
    className: "bg-blue-500/30 text-blue-300 border-blue-400/50",
  },
  CONTACTED: {
    label: "Contatado",
    className: "bg-amber-500/30 text-amber-300 border-amber-400/50",
  },
  QUALIFIED: {
    label: "Qualificado",
    className: "bg-purple-500/30 text-purple-300 border-purple-400/50",
  },
  PROPOSAL: {
    label: "Proposta",
    className: "bg-orange-500/30 text-orange-300 border-orange-400/50",
  },
  WON: {
    label: "Ganho",
    className: "bg-emerald-500/30 text-emerald-300 border-emerald-400/50",
  },
  LOST: {
    label: "Perdido",
    className: "bg-red-500/30 text-red-300 border-red-400/50",
  },
}

interface LeadStatusBadgeProps {
  status: LeadStatus
  className?: string
}

export function LeadStatusBadge({ status, className }: LeadStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}

// Badge para origem do lead
type LeadSource = "DIRECT" | "REFERRAL" | "WEBSITE" | "COLD_CALL" | "SOCIAL_MEDIA" | "EVENT" | "OTHER"

const sourceConfig: Record<LeadSource, { label: string; className: string }> = {
  DIRECT: {
    label: "Direto",
    className: "bg-slate-500/30 text-slate-300 border-slate-400/50",
  },
  REFERRAL: {
    label: "Indicação",
    className: "bg-emerald-500/30 text-emerald-300 border-emerald-400/50",
  },
  WEBSITE: {
    label: "Site",
    className: "bg-blue-500/30 text-blue-300 border-blue-400/50",
  },
  COLD_CALL: {
    label: "Cold Call",
    className: "bg-orange-500/30 text-orange-300 border-orange-400/50",
  },
  SOCIAL_MEDIA: {
    label: "Redes Sociais",
    className: "bg-pink-500/30 text-pink-300 border-pink-400/50",
  },
  EVENT: {
    label: "Evento",
    className: "bg-purple-500/30 text-purple-300 border-purple-400/50",
  },
  OTHER: {
    label: "Outro",
    className: "bg-slate-500/30 text-slate-300 border-slate-400/50",
  },
}

interface LeadSourceBadgeProps {
  source: LeadSource
  className?: string
}

export function LeadSourceBadge({ source, className }: LeadSourceBadgeProps) {
  const config = sourceConfig[source]

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}

// Badge para tipo de contato
type ContactType = "PRESENCIAL" | "ONLINE"

const contactTypeConfig: Record<ContactType, { label: string; className: string }> = {
  PRESENCIAL: {
    label: "Presencial",
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  ONLINE: {
    label: "Online",
    className: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  },
}

interface ContactTypeBadgeProps {
  type: ContactType
  className?: string
}

export function ContactTypeBadge({ type, className }: ContactTypeBadgeProps) {
  const config = contactTypeConfig[type]

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
