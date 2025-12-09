"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, TrendingUp, DollarSign, Target, Percent, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { LeadKanban, QuickAddLead } from "@/components/comercial"
import { useLeads, useUpdateLeadStatus, Lead, LeadStatus } from "@/hooks/useQueries"

export default function ComercialPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)

  // React Query hooks
  const { data: leads = [], isLoading: loading } = useLeads()
  const updateLeadStatus = useUpdateLeadStatus()

  // Filtrar leads (memoizado)
  const filteredLeads = useMemo(() => {
    let filtered = leads

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchLower) ||
          lead.company?.toLowerCase().includes(searchLower) ||
          lead.phone?.includes(search) ||
          lead.email?.toLowerCase().includes(searchLower)
      )
    }

    if (sourceFilter !== "all") {
      filtered = filtered.filter((lead) => lead.source === sourceFilter)
    }

    return filtered
  }, [leads, search, sourceFilter])

  // Calcular métricas
  const metrics = useMemo(() => {
    const pipeline = leads
      .filter((l) => !["WON", "LOST"].includes(l.status))
      .reduce((sum, l) => sum + (l.expectedValue || 0), 0)

    const won = leads
      .filter((l) => l.status === "WON")
      .reduce((sum, l) => sum + (l.expectedValue || 0), 0)

    const total = leads.filter((l) => ["WON", "LOST"].includes(l.status)).length
    const wonCount = leads.filter((l) => l.status === "WON").length
    const conversionRate = total > 0 ? (wonCount / total) * 100 : 0

    const forecast = leads
      .filter((l) => l.status === "PROPOSAL")
      .reduce((sum, l) => sum + (l.expectedValue || 0), 0)

    return { pipeline, won, conversionRate, forecast }
  }, [leads])

  const formatCurrency = useCallback((value: number) => {
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`
    }
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value)
  }, [])

  // Handler para lead criado - React Query invalida automaticamente
  const handleLeadCreated = useCallback((lead: Lead) => {
    // Com React Query, o cache é atualizado pela mutation
    // Mas o QuickAddLead pode usar essa callback para feedback
  }, [])

  const handleStatusChange = useCallback(async (leadId: string, newStatus: LeadStatus) => {
    try {
      await updateLeadStatus.mutateAsync({ leadId, status: newStatus })
      toast.success("Status atualizado com sucesso")
    } catch (error) {
      toast.error("Erro ao mover lead")
    }
  }, [updateLeadStatus])

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold font-headline tracking-wide flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-emerald-400" />
            Comercial
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">
            Gerencie seu funil de vendas e prospectos
          </p>
        </div>
        <div className="hidden md:block">
          <QuickAddLead onCreated={handleLeadCreated} />
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
              <TrendingUp className="h-4 w-4" />
              Pipeline
            </div>
            <p className="text-lg md:text-2xl font-bold text-white">
              {formatCurrency(metrics.pipeline)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
              <DollarSign className="h-4 w-4" />
              Fechados
            </div>
            <p className="text-lg md:text-2xl font-bold text-emerald-400">
              {formatCurrency(metrics.won)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
              <Percent className="h-4 w-4" />
              Taxa Conv.
            </div>
            <p className="text-lg md:text-2xl font-bold text-white">
              {metrics.conversionRate.toFixed(0)}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
              <Target className="h-4 w-4" />
              Previsao
            </div>
            <p className="text-lg md:text-2xl font-bold text-amber-400">
              {formatCurrency(metrics.forecast)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  placeholder="Buscar por nome, empresa, telefone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-11 bg-zinc-800/50 border-zinc-700"
                />
              </div>
            </div>

            {/* Filtro de origem */}
            <div className="flex gap-2">
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-11 bg-zinc-800/50 border-zinc-700">
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas origens</SelectItem>
                  <SelectItem value="DIRECT">Direto</SelectItem>
                  <SelectItem value="REFERRAL">Indicacao</SelectItem>
                  <SelectItem value="WEBSITE">Site</SelectItem>
                  <SelectItem value="COLD_CALL">Cold Call</SelectItem>
                  <SelectItem value="SOCIAL_MEDIA">Redes Sociais</SelectItem>
                  <SelectItem value="EVENT">Evento</SelectItem>
                  <SelectItem value="OTHER">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">
          Carregando leads...
        </div>
      ) : (
        <LeadKanban leads={filteredLeads} onStatusChange={handleStatusChange} />
      )}

      {/* FAB para mobile */}
      <div className="md:hidden">
        <QuickAddLead onCreated={handleLeadCreated} />
      </div>
    </div>
  )
}
