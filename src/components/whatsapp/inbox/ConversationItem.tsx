"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Bot,
  User,
  Building,
  Archive,
  ArchiveRestore,
  Trash2,
  UserPlus,
  BotOff,
  Copy,
  Check,
  Eye,
  EyeOff,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { Conversation } from "./WhatsAppInbox"
import { TagBadges } from "../tags/TagSelector"

interface Agent {
  id: string
  name: string
}

interface ConversationItemProps {
  conversation: Conversation
  selected: boolean
  onSelect: () => void
  onRefresh: () => void
  agents?: Agent[]
}

export function ConversationItem({
  conversation,
  selected,
  onSelect,
  onRefresh,
  agents = [],
}: ConversationItemProps) {
  const [loading, setLoading] = useState(false)

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

  const handleArchive = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/whatsapp/conversations/${conversation.id}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      })
      if (response.ok) {
        toast.success("Conversa arquivada")
        onRefresh()
      } else {
        toast.error("Erro ao arquivar conversa")
      }
    } catch (error) {
      toast.error("Erro ao arquivar conversa")
    } finally {
      setLoading(false)
    }
  }

  const handleUnarchive = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/whatsapp/conversations/${conversation.id}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: false }),
      })
      if (response.ok) {
        toast.success("Conversa desarquivada")
        onRefresh()
      } else {
        toast.error("Erro ao desarquivar conversa")
      }
    } catch (error) {
      toast.error("Erro ao desarquivar conversa")
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRead = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/whatsapp/conversations/${conversation.id}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      })
      if (response.ok) {
        toast.success("Marcada como lida")
        onRefresh()
      } else {
        toast.error("Erro ao marcar como lida")
      }
    } catch (error) {
      toast.error("Erro ao marcar como lida")
    } finally {
      setLoading(false)
    }
  }

  const handleMarkUnread = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/whatsapp/conversations/${conversation.id}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: false }),
      })
      if (response.ok) {
        toast.success("Marcada como não lida")
        onRefresh()
      } else {
        toast.error("Erro ao marcar como não lida")
      }
    } catch (error) {
      toast.error("Erro ao marcar como não lida")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleBot = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/whatsapp/conversations/${conversation.id}/bot`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBot: !conversation.isBot }),
      })
      if (response.ok) {
        toast.success(conversation.isBot ? "Bot desativado" : "Bot ativado")
        onRefresh()
      } else {
        toast.error("Erro ao alterar status do bot")
      }
    } catch (error) {
      toast.error("Erro ao alterar status do bot")
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async (userId: string | null) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/whatsapp/conversations/${conversation.id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      if (response.ok) {
        toast.success(userId ? "Conversa atribuída" : "Atribuição removida")
        onRefresh()
      } else {
        toast.error("Erro ao atribuir conversa")
      }
    } catch (error) {
      toast.error("Erro ao atribuir conversa")
    } finally {
      setLoading(false)
    }
  }

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(conversation.contactPhone)
    toast.success("Telefone copiado")
  }

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita.")) {
      return
    }
    setLoading(true)
    try {
      const response = await fetch(`/api/whatsapp/conversations/${conversation.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        toast.success("Conversa excluída")
        onRefresh()
      } else {
        toast.error("Erro ao excluir conversa")
      }
    } catch (error) {
      toast.error("Erro ao excluir conversa")
    } finally {
      setLoading(false)
    }
  }

  const isArchived = (conversation as any).archived === true

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild disabled={loading}>
        <button
          onClick={onSelect}
          disabled={loading}
          className={cn(
            "w-full p-3 flex items-start gap-3 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/50 text-left",
            selected && "bg-zinc-800",
            loading && "opacity-50 cursor-wait"
          )}
        >
          {/* Avatar */}
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={conversation.profilePic} />
            <AvatarFallback className="bg-emerald-500/20 text-emerald-500">
              {getInitials(conversation.contactName, conversation.contactPhone)}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">
                {conversation.contactName || formatPhone(conversation.contactPhone)}
              </span>
              {conversation.isBot && (
                <Bot className="h-3 w-3 text-blue-400 flex-shrink-0" />
              )}
              {conversation.assignedTo && (
                <span className="text-xs text-zinc-500 truncate">
                  → {conversation.assignedTo.name}
                </span>
              )}
            </div>

            {/* Vínculo */}
            {(conversation.lead || conversation.customer) && (
              <div className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5">
                {conversation.lead ? (
                  <>
                    <User className="h-3 w-3" />
                    <span className="truncate">{conversation.lead.name}</span>
                  </>
                ) : conversation.customer ? (
                  <>
                    <Building className="h-3 w-3" />
                    <span className="truncate">{conversation.customer.name}</span>
                  </>
                ) : null}
              </div>
            )}

            {/* Última mensagem */}
            <p className="text-sm text-zinc-400 truncate mt-1">
              {conversation.lastMessage || "Nenhuma mensagem"}
            </p>

            {/* Tags */}
            {conversation.tags && conversation.tags.length > 0 && (
              <div className="mt-1">
                <TagBadges tags={conversation.tags} />
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-xs text-zinc-500">
              {conversation.lastMessageAt
                ? formatDistanceToNow(new Date(conversation.lastMessageAt), {
                    addSuffix: false,
                    locale: ptBR,
                  })
                : ""}
            </span>

            {conversation.unreadCount > 0 && (
              <Badge className="bg-emerald-500 text-white h-5 min-w-5 flex items-center justify-center">
                {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
              </Badge>
            )}
          </div>
        </button>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-56">
        {/* Marcar lida/não lida */}
        {conversation.unreadCount > 0 ? (
          <ContextMenuItem onClick={handleMarkRead}>
            <Eye className="mr-2 h-4 w-4" />
            Marcar como lida
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onClick={handleMarkUnread}>
            <EyeOff className="mr-2 h-4 w-4" />
            Marcar como não lida
          </ContextMenuItem>
        )}

        {/* Atribuir */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <UserPlus className="mr-2 h-4 w-4" />
            Atribuir a...
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={() => handleAssign(null)}>
              <span className="text-zinc-500">Remover atribuição</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
            {agents.map((agent) => (
              <ContextMenuItem key={agent.id} onClick={() => handleAssign(agent.id)}>
                {conversation.assignedTo?.id === agent.id && (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {agent.name}
              </ContextMenuItem>
            ))}
            {agents.length === 0 && (
              <ContextMenuItem disabled>
                <span className="text-zinc-500 text-sm">Nenhum agente disponível</span>
              </ContextMenuItem>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Toggle bot */}
        <ContextMenuItem onClick={handleToggleBot}>
          {conversation.isBot ? (
            <>
              <BotOff className="mr-2 h-4 w-4" />
              Desativar bot
            </>
          ) : (
            <>
              <Bot className="mr-2 h-4 w-4" />
              Ativar bot
            </>
          )}
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Arquivar/Desarquivar */}
        {isArchived ? (
          <ContextMenuItem onClick={handleUnarchive}>
            <ArchiveRestore className="mr-2 h-4 w-4" />
            Desarquivar
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onClick={handleArchive}>
            <Archive className="mr-2 h-4 w-4" />
            Arquivar
          </ContextMenuItem>
        )}

        {/* Copiar telefone */}
        <ContextMenuItem onClick={handleCopyPhone}>
          <Copy className="mr-2 h-4 w-4" />
          Copiar telefone
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Excluir */}
        <ContextMenuItem onClick={handleDelete} className="text-red-500 focus:text-red-500">
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir conversa
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
