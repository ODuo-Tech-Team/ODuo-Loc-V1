"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageCircle, Send, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Conversation {
  id: string
  contactPhone: string
  contactName?: string
  lastMessage?: string
  lastMessageAt?: string
  unreadCount: number
  status: string
}

interface LeadWhatsAppSectionProps {
  leadId: string
  leadPhone?: string | null
  leadWhatsapp?: string | null
}

export function LeadWhatsAppSection({
  leadId,
  leadPhone,
  leadWhatsapp,
}: LeadWhatsAppSectionProps) {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  // Buscar conversas vinculadas ao lead
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch(`/api/whatsapp/conversations?leadId=${leadId}`)
        const data = await response.json()
        setConversations(data.conversations || [])
      } catch (error) {
        console.error("Erro ao buscar conversas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [leadId])

  // Iniciar nova conversa
  const handleStartConversation = async () => {
    const phone = leadWhatsapp || leadPhone
    if (!phone) {
      toast.error("Lead não possui telefone cadastrado")
      return
    }

    try {
      setStarting(true)
      const response = await fetch("/api/whatsapp/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          leadId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/whatsapp?conversation=${data.conversation.id}`)
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao iniciar conversa")
      }
    } catch (error) {
      toast.error("Erro ao iniciar conversa")
    } finally {
      setStarting(false)
    }
  }

  // Abrir conversa existente
  const handleOpenConversation = (conversationId: string) => {
    router.push(`/whatsapp?conversation=${conversationId}`)
  }

  const formatPhone = (phone: string) => {
    if (phone.length === 13 && phone.startsWith("55")) {
      return `(${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`
    }
    return phone
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-emerald-500" />
          WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
          </div>
        ) : conversations.length > 0 ? (
          <>
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleOpenConversation(conv.id)}
                className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-zinc-800 transition-colors text-left"
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-emerald-500/20 text-emerald-500 text-xs">
                    {conv.contactName?.[0] || conv.contactPhone.slice(-2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">
                      {formatPhone(conv.contactPhone)}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="flex-shrink-0 h-5 min-w-5 flex items-center justify-center bg-emerald-500 text-white text-xs rounded-full px-1">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 truncate">
                    {conv.lastMessage || "Sem mensagens"}
                  </p>
                  {conv.lastMessageAt && (
                    <p className="text-xs text-zinc-500">
                      {formatDistanceToNow(new Date(conv.lastMessageAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  )}
                </div>
              </button>
            ))}

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => router.push("/whatsapp")}
            >
              <ExternalLink className="h-3 w-3 mr-2" />
              Ver Todas
            </Button>
          </>
        ) : (
          <div className="text-center py-2">
            <p className="text-xs text-zinc-500 mb-3">
              Nenhuma conversa com este lead
            </p>
            {(leadPhone || leadWhatsapp) && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleStartConversation}
                disabled={starting}
                className="w-full"
              >
                {starting ? (
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                ) : (
                  <Send className="h-3 w-3 mr-2" />
                )}
                Iniciar Conversa
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
