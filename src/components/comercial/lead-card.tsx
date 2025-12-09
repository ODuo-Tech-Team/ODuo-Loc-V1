"use client"

import { Card } from "@/components/ui/card"
import { LeadStatusBadge, LeadSourceBadge } from "./lead-status-badge"
import {
  Phone,
  Mail,
  DollarSign,
  Clock,
  Building2,
  MessageCircle,
  MapPin,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Lead {
  id: string
  name: string
  company?: string | null
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  city?: string | null
  state?: string | null
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST"
  source: "DIRECT" | "REFERRAL" | "WEBSITE" | "COLD_CALL" | "SOCIAL_MEDIA" | "EVENT" | "OTHER"
  contactType: "PRESENCIAL" | "ONLINE"
  expectedValue?: number | null
  nextAction?: string | null
  nextActionDate?: string | null
  assignedTo?: {
    id: string
    name: string | null
    email: string | null
  } | null
  _count?: {
    activities: number
  }
  updatedAt: string
}

interface LeadCardProps {
  lead: Lead
  className?: string
  variant?: "mobile" | "desktop"
}

export function LeadCard({ lead, className, variant = "mobile" }: LeadCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const isOverdue = lead.nextActionDate && new Date(lead.nextActionDate) < new Date()
  const isDesktop = variant === "desktop"

  return (
    <Link href={`/comercial/${lead.id}`}>
      <Card
        className={cn(
          "cursor-pointer transition-all duration-200",
          "hover:border-zinc-600 active:scale-[0.98]",
          isDesktop
            ? "p-4 bg-zinc-800/80 border-zinc-700/50 hover:bg-zinc-800"
            : "p-4 min-h-[100px] bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50",
          className
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex justify-between items-start gap-2",
          isDesktop ? "mb-4" : "mb-3"
        )}>
          <div className="flex-1 min-w-0">
            {lead.company && (
              <div className={cn(
                "flex items-center gap-1.5 text-zinc-400 mb-1",
                isDesktop ? "text-sm" : "text-xs"
              )}>
                <Building2 className={cn(isDesktop ? "h-4 w-4" : "h-3 w-3", "flex-shrink-0")} />
                <span className="truncate">{lead.company}</span>
              </div>
            )}
            <h3 className={cn(
              "font-semibold text-white truncate",
              isDesktop ? "text-base" : "text-sm"
            )}>
              {lead.name}
            </h3>
          </div>
          <LeadSourceBadge
            source={lead.source}
            className={isDesktop ? "text-xs px-2 py-0.5" : "text-[10px] px-1.5 py-0"}
          />
        </div>

        {/* Contact Info */}
        <div className={cn("space-y-2", isDesktop ? "text-sm" : "text-xs")}>
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors"
            >
              <Phone className={cn(isDesktop ? "h-4 w-4" : "h-3.5 w-3.5", "flex-shrink-0 text-zinc-500")} />
              <span className="truncate">{lead.phone}</span>
            </a>
          )}

          {lead.whatsapp && (
            <a
              href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <MessageCircle className={cn(isDesktop ? "h-4 w-4" : "h-3.5 w-3.5", "flex-shrink-0")} />
              <span className="truncate">{lead.whatsapp}</span>
            </a>
          )}

          {(lead.city || lead.state) && (
            <div className="flex items-center gap-2 text-zinc-400">
              <MapPin className={cn(isDesktop ? "h-4 w-4" : "h-3.5 w-3.5", "flex-shrink-0 text-zinc-500")} />
              <span className="truncate">
                {[lead.city, lead.state].filter(Boolean).join(" - ")}
              </span>
            </div>
          )}
        </div>

        {/* Value & Next Action */}
        <div className={cn(
          "border-t border-zinc-700/50 space-y-2",
          isDesktop ? "mt-4 pt-4" : "mt-3 pt-3"
        )}>
          {lead.expectedValue && (
            <div className={cn(
              "flex items-center gap-2 text-emerald-400 font-semibold",
              isDesktop ? "text-base" : "text-sm"
            )}>
              <DollarSign className={cn(isDesktop ? "h-5 w-5" : "h-4 w-4", "flex-shrink-0")} />
              <span>{formatCurrency(lead.expectedValue)}</span>
            </div>
          )}

          {lead.nextAction && (
            <div
              className={cn(
                "flex items-center gap-2",
                isDesktop ? "text-sm" : "text-xs",
                isOverdue ? "text-red-400" : "text-amber-400"
              )}
            >
              <Clock className={cn(isDesktop ? "h-4 w-4" : "h-3.5 w-3.5", "flex-shrink-0")} />
              <span className="truncate">{lead.nextAction}</span>
            </div>
          )}

          {lead.nextActionDate && (
            <div
              className={cn(
                isDesktop ? "text-xs pl-6" : "text-[10px] pl-5",
                isOverdue ? "text-red-400" : "text-zinc-500"
              )}
            >
              {isOverdue ? "Vencido: " : ""}
              {formatDistanceToNow(new Date(lead.nextActionDate), {
                addSuffix: true,
                locale: ptBR,
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {lead.assignedTo && (
          <div className={cn(
            "border-t border-zinc-700/50 flex items-center gap-2 text-zinc-400",
            isDesktop ? "mt-3 pt-3 text-xs" : "mt-2 pt-2 text-[10px]"
          )}>
            <User className={cn(isDesktop ? "h-4 w-4" : "h-3 w-3", "flex-shrink-0")} />
            <span className="truncate">{lead.assignedTo.name || lead.assignedTo.email}</span>
          </div>
        )}
      </Card>
    </Link>
  )
}
