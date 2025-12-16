"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  RefreshCw,
  MessageCircle,
  Archive,
  User,
  Users,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Conversation } from "./WhatsAppInbox"
import { ConversationItem } from "./ConversationItem"

interface Agent {
  id: string
  name: string
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
  loading: boolean
  onRefresh: () => void
  agents?: Agent[]
  showArchived?: boolean
  onToggleArchived?: () => void
  currentUserId?: string
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  loading,
  onRefresh,
  agents = [],
  showArchived = false,
  onToggleArchived,
  currentUserId,
}: ConversationListProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "pending" | "closed">("all")
  const [assignFilter, setAssignFilter] = useState<"all" | "mine" | "unassigned">("all")
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all")
  const [tagFilter, setTagFilter] = useState<string | null>(null)

  // Coletar todas as tags únicas das conversas
  const allTags = Array.from(
    new Set(conversations.flatMap((c) => c.tags || []))
  ).sort()

  // Helpers para filtro de data
  const isToday = (date: string) => {
    const d = new Date(date)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  }

  const isThisWeek = (date: string) => {
    const d = new Date(date)
    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    return d >= weekAgo
  }

  const isThisMonth = (date: string) => {
    const d = new Date(date)
    const today = new Date()
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  }

  const filteredConversations = conversations.filter((conv) => {
    // Filtro de busca
    if (search) {
      const searchLower = search.toLowerCase()
      const matchesPhone = conv.contactPhone.includes(search)
      const matchesName = conv.contactName?.toLowerCase().includes(searchLower)
      const matchesLead = conv.lead?.name.toLowerCase().includes(searchLower)
      const matchesCustomer = conv.customer?.name.toLowerCase().includes(searchLower)

      if (!matchesPhone && !matchesName && !matchesLead && !matchesCustomer) {
        return false
      }
    }

    // Filtro de status
    if (statusFilter !== "all") {
      if (statusFilter === "open" && conv.status !== "OPEN") return false
      if (statusFilter === "pending" && conv.status !== "PENDING") return false
      if (statusFilter === "closed" && conv.status !== "CLOSED") return false
    }

    // Filtro de atribuição
    if (assignFilter !== "all") {
      if (assignFilter === "mine" && conv.assignedTo?.id !== currentUserId) return false
      if (assignFilter === "unassigned" && conv.assignedTo) return false
    }

    // Filtro de data
    if (dateFilter !== "all" && conv.lastMessageAt) {
      if (dateFilter === "today" && !isToday(conv.lastMessageAt)) return false
      if (dateFilter === "week" && !isThisWeek(conv.lastMessageAt)) return false
      if (dateFilter === "month" && !isThisMonth(conv.lastMessageAt)) return false
    }

    // Filtro de tag
    if (tagFilter && (!conv.tags || !conv.tags.includes(tagFilter))) {
      return false
    }

    return true
  })

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800">
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Buscar conversas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-zinc-800 border-zinc-700"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            className="h-9 w-9"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>

        {/* Filtros de status */}
        <div className="flex gap-1 flex-wrap">
          {(["all", "open", "pending", "closed"] as const).map((f) => (
            <Button
              key={f}
              variant={statusFilter === f ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setStatusFilter(f)}
            >
              {f === "all" && "Todas"}
              {f === "open" && "Abertas"}
              {f === "pending" && "Pendentes"}
              {f === "closed" && "Fechadas"}
            </Button>
          ))}
          {onToggleArchived && (
            <Button
              variant={showArchived ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs ml-auto"
              onClick={onToggleArchived}
            >
              <Archive className="h-3 w-3 mr-1" />
              {showArchived ? "Ativas" : "Arquiv."}
            </Button>
          )}
        </div>

        {/* Filtros de atribuição e data */}
        <div className="flex gap-2 mt-2">
          <Select value={assignFilter} onValueChange={(v) => setAssignFilter(v as any)}>
            <SelectTrigger className="h-7 text-xs bg-zinc-800 border-zinc-700 flex-1">
              <User className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="mine">Minhas</SelectItem>
              <SelectItem value="unassigned">Sem atribuição</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as any)}>
            <SelectTrigger className="h-7 text-xs bg-zinc-800 border-zinc-700 flex-1">
              <Calendar className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtros de tags */}
        {allTags.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {tagFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-zinc-400"
                onClick={() => setTagFilter(null)}
              >
                Limpar tag
              </Button>
            )}
            {allTags.slice(0, 5).map((tag) => (
              <Button
                key={tag}
                variant={tagFilter === tag ? "secondary" : "outline"}
                size="sm"
                className="h-6 text-xs"
                onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              >
                {tag}
              </Button>
            ))}
            {allTags.length > 5 && (
              <span className="text-xs text-zinc-500 self-center">
                +{allTags.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto whatsapp-list-scroll scroll-smooth">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <MessageCircle className="h-8 w-8 mb-2" />
            <p className="text-sm">
              {showArchived
                ? "Nenhuma conversa arquivada"
                : "Nenhuma conversa encontrada"}
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              selected={selectedId === conv.id}
              onSelect={() => onSelect(conv.id)}
              onRefresh={onRefresh}
              agents={agents}
            />
          ))
        )}
      </div>
    </div>
  )
}
