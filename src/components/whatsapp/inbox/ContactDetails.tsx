"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  X,
  User,
  Building,
  Phone,
  Unlink,
  Plus,
  ExternalLink,
  Bot,
} from "lucide-react"
import { toast } from "sonner"
import { Conversation } from "./WhatsAppInbox"
import { TagSelector } from "../tags/TagSelector"

interface ContactDetailsProps {
  conversation: Conversation
  onClose: () => void
  onUpdate: () => void
}

export function ContactDetails({
  conversation,
  onClose,
  onUpdate,
}: ContactDetailsProps) {
  const [linking, setLinking] = useState(false)
  const [tags, setTags] = useState<string[]>(conversation.tags || [])

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
      return `+55 (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`
    }
    return phone
  }

  // Criar lead a partir da conversa
  const handleCreateLead = async () => {
    try {
      setLinking(true)
      const response = await fetch(
        `/api/whatsapp/conversations/${conversation.id}/link`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ createLead: true }),
        }
      )

      if (response.ok) {
        toast.success("Lead criado com sucesso!")
        onUpdate()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao criar lead")
      }
    } catch (error) {
      toast.error("Erro ao criar lead")
    } finally {
      setLinking(false)
    }
  }

  // Desvincular
  const handleUnlink = async () => {
    try {
      const response = await fetch(
        `/api/whatsapp/conversations/${conversation.id}/link`,
        { method: "DELETE" }
      )

      if (response.ok) {
        toast.success("Vínculo removido")
        onUpdate()
      }
    } catch (error) {
      toast.error("Erro ao remover vínculo")
    }
  }

  // Alterar status da conversa
  const handleStatusChange = async (status: string) => {
    try {
      const response = await fetch(
        `/api/whatsapp/conversations/${conversation.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      )

      if (response.ok) {
        toast.success("Status atualizado")
        onUpdate()
      }
    } catch (error) {
      toast.error("Erro ao atualizar status")
    }
  }

  // Toggle bot
  const handleToggleBot = async () => {
    try {
      const response = await fetch(
        `/api/whatsapp/conversations/${conversation.id}/bot`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isBot: !conversation.isBot }),
        }
      )

      if (response.ok) {
        toast.success(conversation.isBot ? "Bot desativado" : "Bot ativado")
        onUpdate()
      }
    } catch (error) {
      toast.error("Erro ao alterar bot")
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-800">
        <h3 className="font-medium">Detalhes</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Contato */}
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 mb-3">
            <AvatarImage src={conversation.profilePic} />
            <AvatarFallback className="bg-emerald-500/20 text-emerald-500 text-2xl">
              {getInitials(conversation.contactName, conversation.contactPhone)}
            </AvatarFallback>
          </Avatar>

          <h2 className="font-semibold text-lg">
            {conversation.contactName || "Contato"}
          </h2>

          <p className="text-sm text-zinc-400">
            {formatPhone(conversation.contactPhone)}
          </p>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="text-xs text-zinc-500 uppercase">Status</label>
          <Select
            value={conversation.status}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="bg-zinc-800 border-zinc-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">Aberta</SelectItem>
              <SelectItem value="PENDING">Pendente</SelectItem>
              <SelectItem value="RESOLVED">Resolvida</SelectItem>
              <SelectItem value="CLOSED">Fechada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bot */}
        <div className="space-y-2">
          <label className="text-xs text-zinc-500 uppercase">Bot de IA</label>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleToggleBot}
          >
            <Bot className="h-4 w-4 mr-2" />
            {conversation.isBot ? "Bot Ativo" : "Bot Inativo"}
            <Badge
              variant={conversation.isBot ? "default" : "secondary"}
              className="ml-auto"
            >
              {conversation.isBot ? "ON" : "OFF"}
            </Badge>
          </Button>
        </div>

        {/* Vínculo com Lead/Customer */}
        <div className="space-y-2">
          <label className="text-xs text-zinc-500 uppercase">Vinculado a</label>

          {conversation.lead ? (
            <div className="p-3 bg-zinc-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-blue-400" />
                <span className="font-medium">Lead</span>
              </div>
              <p className="text-sm">{conversation.lead.name}</p>
              {conversation.lead.company && (
                <p className="text-xs text-zinc-400">
                  {conversation.lead.company}
                </p>
              )}
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    window.open(`/comercial/${conversation.lead!.id}`, "_blank")
                  }
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Abrir
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleUnlink}
                >
                  <Unlink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : conversation.customer ? (
            <div className="p-3 bg-zinc-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building className="h-4 w-4 text-emerald-400" />
                <span className="font-medium">Cliente</span>
              </div>
              <p className="text-sm">{conversation.customer.name}</p>
              {conversation.customer.tradeName && (
                <p className="text-xs text-zinc-400">
                  {conversation.customer.tradeName}
                </p>
              )}
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    window.open(
                      `/clientes/${conversation.customer!.id}`,
                      "_blank"
                    )
                  }
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Abrir
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleUnlink}
                >
                  <Unlink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-zinc-800/50 rounded-lg border border-dashed border-zinc-700">
              <p className="text-sm text-zinc-400 mb-3">
                Nenhum vínculo. Crie um lead ou vincule a um existente.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={handleCreateLead}
                disabled={linking}
              >
                <Plus className="h-3 w-3 mr-2" />
                Criar Lead
              </Button>
            </div>
          )}
        </div>

        {/* Tags */}
        <TagSelector
          conversationId={conversation.id}
          tags={tags}
          onTagsChange={(newTags) => {
            setTags(newTags)
            onUpdate()
          }}
        />

        {/* Atribuído */}
        {conversation.assignedTo && (
          <div className="space-y-2">
            <label className="text-xs text-zinc-500 uppercase">
              Atribuido a
            </label>
            <div className="flex items-center gap-2 p-2 bg-zinc-800 rounded">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {conversation.assignedTo.name[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{conversation.assignedTo.name}</span>
            </div>
          </div>
        )}

        {/* Ações rápidas */}
        <div className="space-y-2">
          <label className="text-xs text-zinc-500 uppercase">Acoes</label>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                window.open(`tel:${conversation.contactPhone}`, "_blank")
              }}
            >
              <Phone className="h-4 w-4 mr-2" />
              Ligar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
