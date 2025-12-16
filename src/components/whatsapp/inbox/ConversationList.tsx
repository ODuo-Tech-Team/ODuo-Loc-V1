"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Search,
  RefreshCw,
  MessageCircle,
  Archive,
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
}: ConversationListProps) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "open" | "pending" | "closed">("all")
  const [tagFilter, setTagFilter] = useState<string | null>(null)

  // Coletar todas as tags únicas das conversas
  const allTags = Array.from(
    new Set(conversations.flatMap((c) => c.tags || []))
  ).sort()

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
    if (filter !== "all") {
      if (filter === "open" && conv.status !== "OPEN") return false
      if (filter === "pending" && conv.status !== "PENDING") return false
      if (filter === "closed" && conv.status !== "CLOSED") return false
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
              variant={filter === f ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFilter(f)}
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
              {showArchived ? "Ver ativas" : "Arquivadas"}
            </Button>
          )}
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
      <div className="flex-1 overflow-y-auto">
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
