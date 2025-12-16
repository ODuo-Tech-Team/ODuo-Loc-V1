"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  X,
  User,
  Building,
  Phone,
  Unlink,
  Plus,
  ExternalLink,
  Bot,
  Loader2,
  TrendingUp,
  DollarSign,
  Archive,
  ArchiveRestore,
  Trash2,
  Copy,
  UserPlus,
} from "lucide-react"
import { toast } from "sonner"
import { Conversation } from "./WhatsAppInbox"
import { TagSelector } from "../tags/TagSelector"

interface Agent {
  id: string
  name: string
}

interface ContactDetailsProps {
  conversation: Conversation
  onClose: () => void
  onUpdate: () => void
  agents?: Agent[]
}

// Status do Kanban com labels em português
const kanbanStatuses = [
  { value: "NEW", label: "Novo", color: "bg-blue-500" },
  { value: "CONTACTED", label: "Contactado", color: "bg-yellow-500" },
  { value: "QUALIFIED", label: "Qualificado", color: "bg-purple-500" },
  { value: "PROPOSAL", label: "Proposta", color: "bg-orange-500" },
]

export function ContactDetails({
  conversation,
  onClose,
  onUpdate,
  agents = [],
}: ContactDetailsProps) {
  const [linking, setLinking] = useState(false)
  const [tags, setTags] = useState<string[]>(conversation.tags || [])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Estado do dialog de criar negócio
  const [showCreateDealDialog, setShowCreateDealDialog] = useState(false)
  const [dealName, setDealName] = useState("")
  const [dealCompany, setDealCompany] = useState("")
  const [dealStatus, setDealStatus] = useState("NEW")
  const [dealValue, setDealValue] = useState("")
  const [dealNotes, setDealNotes] = useState("")
  const [creatingDeal, setCreatingDeal] = useState(false)

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

  // Abrir dialog de criar negócio com dados pré-preenchidos
  const openCreateDealDialog = () => {
    setDealName(conversation.contactName || "")
    setDealCompany("")
    setDealStatus("NEW")
    setDealValue("")
    setDealNotes("")
    setShowCreateDealDialog(true)
  }

  // Criar negócio no Kanban a partir da conversa
  const handleCreateDeal = async () => {
    if (!dealName.trim()) {
      toast.error("Nome e obrigatorio")
      return
    }

    try {
      setCreatingDeal(true)
      const response = await fetch(
        `/api/whatsapp/conversations/${conversation.id}/link`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            createLead: true,
            leadData: {
              name: dealName,
              company: dealCompany || null,
              status: dealStatus,
              expectedValue: dealValue ? parseFloat(dealValue) : null,
              interestNotes: dealNotes || null,
              source: "SOCIAL_MEDIA",
              contactType: "ONLINE",
            },
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        toast.success("Negocio criado com sucesso!")
        setShowCreateDealDialog(false)
        onUpdate()
        // Abrir a página do lead no comercial
        if (data.lead?.id) {
          window.open(`/comercial/${data.lead.id}`, "_blank")
        }
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao criar negocio")
      }
    } catch (error) {
      toast.error("Erro ao criar negocio")
    } finally {
      setCreatingDeal(false)
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

  // Arquivar/Desarquivar
  const handleArchive = async () => {
    setActionLoading(true)
    try {
      const isArchived = (conversation as any).archived === true
      const response = await fetch(
        `/api/whatsapp/conversations/${conversation.id}/archive`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archived: !isArchived }),
        }
      )

      if (response.ok) {
        toast.success(isArchived ? "Conversa desarquivada" : "Conversa arquivada")
        onUpdate()
      } else {
        toast.error("Erro ao arquivar conversa")
      }
    } catch (error) {
      toast.error("Erro ao arquivar conversa")
    } finally {
      setActionLoading(false)
    }
  }

  // Atribuir agente
  const handleAssign = async (userId: string | null) => {
    setActionLoading(true)
    try {
      const response = await fetch(
        `/api/whatsapp/conversations/${conversation.id}/assign`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      )

      if (response.ok) {
        toast.success(userId ? "Conversa atribuida" : "Atribuicao removida")
        onUpdate()
      } else {
        toast.error("Erro ao atribuir conversa")
      }
    } catch (error) {
      toast.error("Erro ao atribuir conversa")
    } finally {
      setActionLoading(false)
    }
  }

  // Excluir conversa
  const handleDelete = async () => {
    setActionLoading(true)
    try {
      const response = await fetch(
        `/api/whatsapp/conversations/${conversation.id}`,
        { method: "DELETE" }
      )

      if (response.ok) {
        toast.success("Conversa excluida")
        onClose()
        onUpdate()
      } else {
        toast.error("Erro ao excluir conversa")
      }
    } catch (error) {
      toast.error("Erro ao excluir conversa")
    } finally {
      setActionLoading(false)
      setShowDeleteDialog(false)
    }
  }

  // Copiar telefone
  const handleCopyPhone = () => {
    navigator.clipboard.writeText(conversation.contactPhone)
    toast.success("Telefone copiado")
  }

  const isArchived = (conversation as any).archived === true

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
                Nenhum vinculo. Crie um negocio no Kanban para acompanhar.
              </p>
              <Button
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={openCreateDealDialog}
              >
                <TrendingUp className="h-3 w-3 mr-2" />
                Criar Negocio
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

        {/* Atribuir agente */}
        <div className="space-y-2">
          <label className="text-xs text-zinc-500 uppercase">
            <UserPlus className="h-3 w-3 inline mr-1" />
            Atribuir a
          </label>
          <Select
            value={conversation.assignedTo?.id || "none"}
            onValueChange={(value) => handleAssign(value === "none" ? null : value)}
            disabled={actionLoading}
          >
            <SelectTrigger className="bg-zinc-800 border-zinc-700">
              <SelectValue placeholder="Selecione um agente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-zinc-500">Sem atribuicao</span>
              </SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs">
                        {agent.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    {agent.name}
                  </div>
                </SelectItem>
              ))}
              {agents.length === 0 && (
                <SelectItem value="no-agents" disabled>
                  <span className="text-zinc-500 text-sm">Nenhum agente disponivel</span>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

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

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleCopyPhone}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar telefone
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleArchive}
              disabled={actionLoading}
            >
              {isArchived ? (
                <>
                  <ArchiveRestore className="h-4 w-4 mr-2" />
                  Desarquivar
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Arquivar
                </>
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10"
              onClick={() => setShowDeleteDialog(true)}
              disabled={actionLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir conversa
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. Todas as mensagens desta conversa
              serao excluidas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Criar Negócio */}
      <Dialog open={showCreateDealDialog} onOpenChange={setShowCreateDealDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Criar Negocio
            </DialogTitle>
            <DialogDescription>
              Crie um negocio no Kanban para acompanhar este contato
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={dealName}
                onChange={(e) => setDealName(e.target.value)}
                placeholder="Nome do contato ou negocio"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            {/* Empresa */}
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Input
                value={dealCompany}
                onChange={(e) => setDealCompany(e.target.value)}
                placeholder="Nome da empresa (opcional)"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            {/* Telefone (somente leitura) */}
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={formatPhone(conversation.contactPhone)}
                disabled
                className="bg-zinc-900 border-zinc-800 text-zinc-400"
              />
            </div>

            {/* Etapa do Kanban */}
            <div className="space-y-2">
              <Label>Etapa Inicial</Label>
              <Select value={dealStatus} onValueChange={setDealStatus}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {kanbanStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${status.color}`} />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valor Esperado */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-zinc-500" />
                Valor Esperado
              </Label>
              <Input
                type="number"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                placeholder="0.00"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label>Observacoes</Label>
              <Textarea
                value={dealNotes}
                onChange={(e) => setDealNotes(e.target.value)}
                placeholder="Interesse, equipamentos, contexto da conversa..."
                className="bg-zinc-800 border-zinc-700 resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowCreateDealDialog(false)}
              disabled={creatingDeal}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleCreateDeal}
              disabled={creatingDeal || !dealName.trim()}
            >
              {creatingDeal ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Negocio
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
