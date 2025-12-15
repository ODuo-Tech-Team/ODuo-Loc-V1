"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  RefreshCw,
  Bot,
  User,
  Building,
  MessageCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Conversation } from "./WhatsAppInbox"

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
  loading: boolean
  onRefresh: () => void
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  loading,
  onRefresh,
}: ConversationListProps) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "open" | "pending" | "closed">("all")

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

    return true
  })

  const getInitials = (name?: string, phone?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    }
    return phone?.slice(-2) || "?"
  }

  const formatPhone = (phone: string) => {
    if (phone.length === 13 && phone.startsWith("55")) {
      return `(${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`
    }
    return phone
  }

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

        {/* Filtros */}
        <div className="flex gap-1">
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
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <MessageCircle className="h-8 w-8 mb-2" />
            <p className="text-sm">Nenhuma conversa encontrada</p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                "w-full p-3 flex items-start gap-3 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/50",
                selectedId === conv.id && "bg-zinc-800"
              )}
            >
              {/* Avatar */}
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={conv.profilePic} />
                <AvatarFallback className="bg-emerald-500/20 text-emerald-500">
                  {getInitials(conv.contactName, conv.contactPhone)}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {conv.contactName || formatPhone(conv.contactPhone)}
                  </span>
                  {conv.isBot && (
                    <Bot className="h-3 w-3 text-blue-400 flex-shrink-0" />
                  )}
                </div>

                {/* Vínculo */}
                {(conv.lead || conv.customer) && (
                  <div className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5">
                    {conv.lead ? (
                      <>
                        <User className="h-3 w-3" />
                        <span className="truncate">{conv.lead.name}</span>
                      </>
                    ) : conv.customer ? (
                      <>
                        <Building className="h-3 w-3" />
                        <span className="truncate">{conv.customer.name}</span>
                      </>
                    ) : null}
                  </div>
                )}

                {/* Última mensagem */}
                <p className="text-sm text-zinc-400 truncate mt-1">
                  {conv.lastMessage || "Nenhuma mensagem"}
                </p>
              </div>

              {/* Meta */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-xs text-zinc-500">
                  {conv.lastMessageAt
                    ? formatDistanceToNow(new Date(conv.lastMessageAt), {
                        addSuffix: false,
                        locale: ptBR,
                      })
                    : ""}
                </span>

                {conv.unreadCount > 0 && (
                  <Badge className="bg-emerald-500 text-white h-5 min-w-5 flex items-center justify-center">
                    {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                  </Badge>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
