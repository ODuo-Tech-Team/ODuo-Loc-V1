"use client"

import { useState, useMemo, useCallback } from "react"
import { LeadCard } from "./lead-card"
import { LeadStatusBadge } from "./lead-status-badge"
import { cn } from "@/lib/utils"
import { DollarSign, GripVertical } from "lucide-react"

type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST"

interface Lead {
  id: string
  name: string
  company?: string | null
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  city?: string | null
  state?: string | null
  status: LeadStatus
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

interface LeadKanbanProps {
  leads: Lead[]
  className?: string
  onStatusChange?: (leadId: string, newStatus: LeadStatus) => Promise<void>
}

const columns: { status: LeadStatus; label: string; borderColor: string; bgColor: string }[] = [
  { status: "NEW", label: "Novo", borderColor: "border-t-blue-500", bgColor: "bg-blue-500/5" },
  { status: "CONTACTED", label: "Contatado", borderColor: "border-t-amber-500", bgColor: "bg-amber-500/5" },
  { status: "QUALIFIED", label: "Qualificado", borderColor: "border-t-purple-500", bgColor: "bg-purple-500/5" },
  { status: "PROPOSAL", label: "Proposta", borderColor: "border-t-orange-500", bgColor: "bg-orange-500/5" },
  { status: "WON", label: "Ganho", borderColor: "border-t-emerald-500", bgColor: "bg-emerald-500/5" },
  { status: "LOST", label: "Perdido", borderColor: "border-t-red-500", bgColor: "bg-red-500/5" },
]

export function LeadKanban({ leads, className, onStatusChange }: LeadKanbanProps) {
  const [activeTab, setActiveTab] = useState<LeadStatus>("NEW")
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<LeadStatus | null>(null)

  // Handlers de Drag and Drop
  const handleDragStart = useCallback((e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("text/plain", leadId)
    e.dataTransfer.effectAllowed = "move"
    setDraggedLeadId(leadId)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedLeadId(null)
    setDragOverColumn(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverColumn(status)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, newStatus: LeadStatus) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData("text/plain")

    if (leadId && onStatusChange) {
      const lead = leads.find(l => l.id === leadId)
      if (lead && lead.status !== newStatus) {
        await onStatusChange(leadId, newStatus)
      }
    }

    setDraggedLeadId(null)
    setDragOverColumn(null)
  }, [leads, onStatusChange])

  // Agrupar leads por status
  const leadsByStatus = useMemo(() => {
    const grouped: Record<LeadStatus, Lead[]> = {
      NEW: [],
      CONTACTED: [],
      QUALIFIED: [],
      PROPOSAL: [],
      WON: [],
      LOST: [],
    }

    leads.forEach((lead) => {
      grouped[lead.status].push(lead)
    })

    return grouped
  }, [leads])

  // Calcular totais por status
  const totalsByStatus = useMemo(() => {
    const totals: Record<LeadStatus, { count: number; value: number }> = {
      NEW: { count: 0, value: 0 },
      CONTACTED: { count: 0, value: 0 },
      QUALIFIED: { count: 0, value: 0 },
      PROPOSAL: { count: 0, value: 0 },
      WON: { count: 0, value: 0 },
      LOST: { count: 0, value: 0 },
    }

    leads.forEach((lead) => {
      totals[lead.status].count++
      totals[lead.status].value += lead.expectedValue || 0
    })

    return totals
  }, [leads])

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`
    }
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Mobile: Tabs
  const MobileView = () => (
    <div className="md:hidden">
      {/* Tabs */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4">
        <div className="flex gap-1 p-1 min-w-max">
          {columns.map((column) => (
            <button
              key={column.status}
              onClick={() => setActiveTab(column.status)}
              className={cn(
                "flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                "flex flex-col items-center gap-0.5 min-w-[80px]",
                activeTab === column.status
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              )}
            >
              <span>{column.label}</span>
              <span className="text-xs opacity-70">
                ({totalsByStatus[column.status].count})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="mt-4 space-y-3">
        {leadsByStatus[activeTab].length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            Nenhum lead nesta etapa
          </div>
        ) : (
          leadsByStatus[activeTab].map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))
        )}
      </div>
    </div>
  )

  // Desktop: Kanban columns
  const DesktopView = () => (
    <div className="hidden md:block">
      <div className="overflow-x-auto pb-4 -mx-4 px-4 lg:-mx-8 lg:px-8">
        <div className="grid grid-cols-6 gap-4 min-w-[1400px]">
          {columns.map((column) => (
            <div
              key={column.status}
              className={cn(
                "flex flex-col rounded-xl border-t-4 transition-all duration-200",
                "bg-zinc-900/50 border border-zinc-800",
                column.borderColor,
                column.bgColor,
                // Highlight quando arrastando sobre a coluna
                dragOverColumn === column.status && "ring-2 ring-primary ring-offset-2 ring-offset-zinc-900 scale-[1.02]"
              )}
              onDragOver={(e) => handleDragOver(e, column.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              {/* Column Header */}
              <div className="p-4 border-b border-zinc-800/50">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-white text-base">
                    {column.label}
                  </h3>
                  <span className="text-sm font-medium text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                    {totalsByStatus[column.status].count}
                  </span>
                </div>
                {totalsByStatus[column.status].value > 0 && (
                  <span className="text-sm text-emerald-400 font-medium flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(totalsByStatus[column.status].value)}
                  </span>
                )}
              </div>

              {/* Cards */}
              <div className="p-3 space-y-3 flex-1 max-h-[calc(100vh-320px)] overflow-y-auto">
                {leadsByStatus[column.status].length === 0 ? (
                  <div className={cn(
                    "text-center py-12 text-zinc-500 text-sm border-2 border-dashed border-zinc-700 rounded-lg transition-colors",
                    dragOverColumn === column.status && "border-primary bg-primary/5"
                  )}>
                    {dragOverColumn === column.status ? "Solte aqui" : "Nenhum lead"}
                  </div>
                ) : (
                  leadsByStatus[column.status].map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "cursor-grab active:cursor-grabbing transition-all duration-200",
                        draggedLeadId === lead.id && "opacity-50 scale-95"
                      )}
                    >
                      <LeadCard lead={lead} variant="desktop" />
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className={className}>
      <MobileView />
      <DesktopView />
    </div>
  )
}
