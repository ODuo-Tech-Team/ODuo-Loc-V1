"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { ConversationList } from "./ConversationList"
import { ChatPanel } from "../chat/ChatPanel"
import { ContactDetails } from "./ContactDetails"
import { useWhatsAppSSE } from "@/hooks/useWhatsAppSSE"
import { useWhatsAppNotifications } from "@/hooks/useWhatsAppNotifications"

export interface Conversation {
  id: string
  contactPhone: string
  contactName?: string
  profilePic?: string
  status: string
  unreadCount: number
  lastMessage?: string
  lastMessageAt?: string
  isBot: boolean
  tags: string[]
  archived?: boolean
  lead?: {
    id: string
    name: string
    company?: string
    status: string
  }
  customer?: {
    id: string
    name: string
    tradeName?: string
  }
  assignedTo?: {
    id: string
    name: string
  }
}

interface Agent {
  id: string
  name: string
}

export function WhatsAppInbox() {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [agents, setAgents] = useState<Agent[]>([])

  const { addEventListener } = useWhatsAppSSE({ enabled: true })

  // Inicializar sistema de notificacoes
  useWhatsAppNotifications({
    enabled: true,
    currentUserId: session?.user?.id,
    playSound: true,
  })

  // Buscar conversas
  const fetchConversations = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("archived", showArchived ? "true" : "false")
      const response = await fetch(`/api/whatsapp/conversations?${params}`)
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error("Erro ao buscar conversas:", error)
    } finally {
      setLoading(false)
    }
  }, [showArchived])

  // Buscar agentes para atribuição
  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch("/api/users?role=ADMIN,MANAGER,OPERATOR")
      if (response.ok) {
        const data = await response.json()
        setAgents(data.users?.map((u: any) => ({ id: u.id, name: u.name })) || [])
      }
    } catch (error) {
      console.error("Erro ao buscar agentes:", error)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  // Escutar eventos SSE
  useEffect(() => {
    // Nova mensagem
    const removeNewMessage = addEventListener("new_message", (data) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === data.conversationId)

        if (index >= 0) {
          // Atualizar conversa existente
          const updated = [...prev]
          updated[index] = {
            ...updated[index],
            lastMessage: data.message.content || `[${data.message.type}]`,
            lastMessageAt: new Date().toISOString(),
            unreadCount: selectedId === data.conversationId
              ? 0
              : updated[index].unreadCount + 1,
          }
          // Mover para o topo
          const [conv] = updated.splice(index, 1)
          return [conv, ...updated]
        } else {
          // Nova conversa - buscar lista atualizada
          fetchConversations()
          return prev
        }
      })
    })

    // Atualização de conversa
    const removeConvUpdate = addEventListener("conversation_update", (data) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === data.conversationId
            ? { ...c, ...data }
            : c
        )
      )
    })

    return () => {
      removeNewMessage()
      removeConvUpdate()
    }
  }, [addEventListener, selectedId, fetchConversations])

  const selectedConversation = conversations.find((c) => c.id === selectedId)

  // Marcar como lida quando selecionar
  useEffect(() => {
    if (selectedId) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedId ? { ...c, unreadCount: 0 } : c
        )
      )
    }
  }, [selectedId])

  return (
    <div className="flex h-full">
      {/* Lista de conversas */}
      <div className="w-80 flex-shrink-0 border-r border-zinc-800 overflow-hidden">
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
          loading={loading}
          onRefresh={fetchConversations}
          agents={agents}
          showArchived={showArchived}
          onToggleArchived={() => setShowArchived(!showArchived)}
        />
      </div>

      {/* Painel de chat */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedConversation ? (
          <ChatPanel
            conversation={selectedConversation}
            onToggleDetails={() => setShowDetails(!showDetails)}
            showDetails={showDetails}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-zinc-950">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-lg font-medium text-zinc-400">
                Selecione uma conversa
              </h3>
              <p className="text-sm text-zinc-500 mt-1">
                Escolha uma conversa da lista para comecar
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Painel de detalhes */}
      {showDetails && selectedConversation && (
        <div className="w-80 flex-shrink-0 border-l border-zinc-800 overflow-hidden">
          <ContactDetails
            conversation={selectedConversation}
            onClose={() => setShowDetails(false)}
            onUpdate={() => fetchConversations()}
            agents={agents}
          />
        </div>
      )}
    </div>
  )
}
