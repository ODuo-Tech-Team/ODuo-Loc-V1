"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Send,
  MoreVertical,
  Bot,
  BotOff,
  User,
  Building,
  Info,
  Check,
  CheckCheck,
  Clock,
  Loader2,
  Reply,
  Copy,
  Trash2,
  X,
  Archive,
  Phone,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { useWhatsAppSSE } from "@/hooks/useWhatsAppSSE"
import { Conversation } from "../inbox/WhatsAppInbox"
import { AudioRecorder, AudioRecordButton } from "./AudioRecorder"
import { FileUploader } from "./FileUploader"

interface Message {
  id: string
  direction: "INBOUND" | "OUTBOUND"
  type: string
  content?: string
  mediaUrl?: string
  mediaFileName?: string
  status: string
  createdAt: string
  sentByUser?: {
    id: string
    name: string
  }
  isFromBot?: boolean
  quotedMessageId?: string
  quotedMessage?: {
    id: string
    content?: string
    type: string
    direction: "INBOUND" | "OUTBOUND"
  }
  metadata?: {
    isGroup?: boolean
    groupName?: string
    senderName?: string
    senderPhone?: string
  }
}

interface ChatPanelProps {
  conversation: Conversation
  onToggleDetails: () => void
  showDetails: boolean
  onUpdate?: () => void
}

export function ChatPanel({
  conversation,
  onToggleDetails,
  showDetails,
  onUpdate,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [text, setText] = useState("")
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [sendingAudio, setSendingAudio] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { addEventListener } = useWhatsAppSSE({ enabled: true })

  // Buscar mensagens
  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/whatsapp/conversations/${conversation.id}/messages`
      )
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error)
    } finally {
      setLoading(false)
    }
  }, [conversation.id])

  useEffect(() => {
    setLoading(true)
    fetchMessages()
  }, [fetchMessages])

  // Scroll para baixo quando novas mensagens chegarem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Escutar novas mensagens via SSE
  useEffect(() => {
    const removeListener = addEventListener("new_message", (data) => {
      if (data.conversationId === conversation.id) {
        // Adicionar nova mensagem
        // Normalizar type para uppercase (SSE pode enviar lowercase)
        const messageType = (data.message.type || "TEXT").toUpperCase()
        const newMessage: Message = {
          id: data.message.id,
          direction: data.message.direction as "INBOUND" | "OUTBOUND",
          type: messageType,
          content: data.message.content,
          mediaUrl: data.message.mediaUrl,
          status: "DELIVERED",
          createdAt: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, newMessage])
      }
    })

    const removeStatusListener = addEventListener("message_status", (data) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId ? { ...m, status: data.status } : m
        )
      )
    })

    return () => {
      removeListener()
      removeStatusListener()
    }
  }, [addEventListener, conversation.id])

  // Enviar mensagem
  const handleSend = async () => {
    if (!text.trim() || sending) return

    const messageText = text.trim()
    const quotedMsg = replyingTo
    setText("")
    setReplyingTo(null)

    // Adicionar mensagem otimisticamente
    const tempId = `temp-${Date.now()}`
    const tempMessage: Message = {
      id: tempId,
      direction: "OUTBOUND",
      type: "TEXT",
      content: messageText,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      quotedMessageId: quotedMsg?.id,
      quotedMessage: quotedMsg ? {
        id: quotedMsg.id,
        content: quotedMsg.content,
        type: quotedMsg.type,
        direction: quotedMsg.direction,
      } : undefined,
    }
    setMessages((prev) => [...prev, tempMessage])

    try {
      setSending(true)
      const response = await fetch(
        `/api/whatsapp/conversations/${conversation.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "text",
            content: messageText,
            quotedMessageId: quotedMsg?.id,
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Erro ao enviar")
      }

      const data = await response.json()

      // Atualizar mensagem com ID real
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...data.message, status: "SENT" } : m
        )
      )
    } catch (error) {
      toast.error("Erro ao enviar mensagem")
      // Marcar como falha
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "FAILED" } : m))
      )
    } finally {
      setSending(false)
    }
  }

  // Enviar com Enter (Shift+Enter para nova linha)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
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
        toast.success(
          conversation.isBot ? "Bot desativado" : "Bot ativado"
        )
        onUpdate?.()
      }
    } catch (error) {
      toast.error("Erro ao alterar bot")
    }
  }

  // Copiar telefone
  const handleCopyPhone = () => {
    navigator.clipboard.writeText(conversation.contactPhone)
    toast.success("Telefone copiado")
  }

  // Arquivar
  const handleArchive = async () => {
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
        onUpdate?.()
      } else {
        toast.error("Erro ao arquivar")
      }
    } catch (error) {
      toast.error("Erro ao arquivar")
    }
  }

  // Ligar
  const handleCall = () => {
    window.open(`tel:${conversation.contactPhone}`, "_blank")
  }

  // Copiar mensagem
  const handleCopy = (message: Message) => {
    if (message.content) {
      navigator.clipboard.writeText(message.content)
      toast.success("Mensagem copiada")
    }
  }

  // Responder mensagem
  const handleReply = (message: Message) => {
    setReplyingTo(message)
    textareaRef.current?.focus()
  }

  // Cancelar resposta
  const handleCancelReply = () => {
    setReplyingTo(null)
  }

  // Excluir mensagem (local)
  const handleDelete = async (message: Message) => {
    // Por enquanto, apenas remove localmente
    // TODO: Implementar exclusão via API Uazapi se suportado
    setMessages((prev) => prev.filter((m) => m.id !== message.id))
    toast.success("Mensagem removida")
  }

  // Enviar arquivo (upload)
  const handleSendFile = async (
    result: { url: string; type: string; fileName: string },
    caption?: string
  ) => {
    const tempId = `temp-file-${Date.now()}`
    const messageType = result.type.toUpperCase() as Message["type"]

    const tempMessage: Message = {
      id: tempId,
      direction: "OUTBOUND",
      type: messageType,
      content: caption || "",
      mediaUrl: result.url,
      mediaFileName: result.fileName,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMessage])

    try {
      const response = await fetch(
        `/api/whatsapp/conversations/${conversation.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: result.type,
            media: result.url,
            caption,
            fileName: result.fileName,
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Erro ao enviar arquivo")
      }

      const data = await response.json()

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...data.message, status: "SENT" } : m
        )
      )
    } catch (error) {
      toast.error("Erro ao enviar arquivo")
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "FAILED" } : m))
      )
    }
  }

  // Enviar audio
  const handleSendAudio = async (audioBase64: string) => {
    setSendingAudio(true)

    // Adicionar mensagem otimisticamente
    const tempId = `temp-audio-${Date.now()}`
    const tempMessage: Message = {
      id: tempId,
      direction: "OUTBOUND",
      type: "AUDIO",
      content: "",
      status: "PENDING",
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMessage])

    try {
      const response = await fetch(
        `/api/whatsapp/conversations/${conversation.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "audio",
            media: `data:audio/webm;base64,${audioBase64}`,
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Erro ao enviar audio")
      }

      const data = await response.json()

      // Atualizar mensagem com ID real
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...data.message, status: "SENT" } : m
        )
      )

      setIsRecording(false)
      toast.success("Audio enviado")
    } catch (error) {
      toast.error("Erro ao enviar audio")
      // Marcar como falha
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "FAILED" } : m))
      )
    } finally {
      setSendingAudio(false)
    }
  }

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

  const MessageStatus = ({ status }: { status: string }) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-3 w-3 text-zinc-500" />
      case "SENT":
        return <Check className="h-3 w-3 text-zinc-500" />
      case "DELIVERED":
        return <CheckCheck className="h-3 w-3 text-zinc-500" />
      case "READ":
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      case "FAILED":
        return <span className="text-xs text-red-500">Falhou</span>
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={conversation.profilePic} />
            <AvatarFallback className="bg-emerald-500/20 text-emerald-500">
              {getInitials(conversation.contactName, conversation.contactPhone)}
            </AvatarFallback>
          </Avatar>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {conversation.contactName ||
                  formatPhone(conversation.contactPhone)}
              </span>
              {conversation.isBot && (
                <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                  <Bot className="h-3 w-3" />
                  Bot ativo
                </span>
              )}
            </div>

            {(conversation.lead || conversation.customer) && (
              <div className="flex items-center gap-1 text-xs text-zinc-500">
                {conversation.lead ? (
                  <>
                    <User className="h-3 w-3" />
                    <span>{conversation.lead.name}</span>
                  </>
                ) : conversation.customer ? (
                  <>
                    <Building className="h-3 w-3" />
                    <span>{conversation.customer.name}</span>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleDetails}
            className={cn(showDetails && "bg-zinc-800")}
          >
            <Info className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleToggleBot}>
                {conversation.isBot ? (
                  <>
                    <BotOff className="h-4 w-4 mr-2" />
                    Desativar Bot
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4 mr-2" />
                    Ativar Bot
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCall}>
                <Phone className="h-4 w-4 mr-2" />
                Ligar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyPhone}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar telefone
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="h-4 w-4 mr-2" />
                {(conversation as any).archived ? "Desarquivar" : "Arquivar"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <p>Nenhuma mensagem ainda</p>
            <p className="text-sm">Envie a primeira mensagem!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOutbound = message.direction === "OUTBOUND"
            const showDate =
              index === 0 ||
              format(new Date(message.createdAt), "yyyy-MM-dd") !==
                format(new Date(messages[index - 1].createdAt), "yyyy-MM-dd")

            return (
              <div key={message.id}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="text-xs text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full">
                      {format(new Date(message.createdAt), "d 'de' MMMM", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                )}

                <div
                  className={cn(
                    "flex group",
                    isOutbound ? "justify-end" : "justify-start"
                  )}
                  onMouseEnter={() => setHoveredMessageId(message.id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                  {/* Ações da mensagem - lado esquerdo para outbound */}
                  {isOutbound && (
                    <div className={cn(
                      "flex items-center gap-1 mr-2 transition-opacity",
                      hoveredMessageId === message.id ? "opacity-100" : "opacity-0"
                    )}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-4 w-4 text-zinc-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => handleReply(message)}>
                            <Reply className="h-4 w-4 mr-2" />
                            Responder
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopy(message)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(message)}
                            className="text-red-500 focus:text-red-500"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[70%] rounded-lg px-3 py-2",
                      isOutbound
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-800 text-zinc-100"
                    )}
                  >
                    {/* Mensagem citada (quote reply) */}
                    {message.quotedMessage && (
                      <div
                        className={cn(
                          "mb-2 p-2 rounded border-l-2 text-sm",
                          isOutbound
                            ? "bg-emerald-700/50 border-emerald-400"
                            : "bg-zinc-700/50 border-zinc-500"
                        )}
                      >
                        <p className={cn(
                          "text-xs font-medium mb-0.5",
                          message.quotedMessage.direction === "OUTBOUND"
                            ? "text-emerald-300"
                            : "text-zinc-400"
                        )}>
                          {message.quotedMessage.direction === "OUTBOUND" ? "Você" : conversation.contactName || "Contato"}
                        </p>
                        <p className="line-clamp-2 opacity-80">
                          {message.quotedMessage.type === "TEXT"
                            ? message.quotedMessage.content
                            : `[${message.quotedMessage.type}]`}
                        </p>
                      </div>
                    )}

                    {/* Nome do remetente (para grupos) */}
                    {!isOutbound && message.metadata?.senderName && (
                      <div className="text-xs font-medium text-emerald-400 mb-1">
                        {message.metadata.senderName}
                        {message.metadata.groupName && (
                          <span className="text-zinc-500 font-normal"> • {message.metadata.groupName}</span>
                        )}
                      </div>
                    )}

                    {/* Conteúdo da mensagem */}
                    {message.type === "TEXT" ? (
                      <p className="whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    ) : message.type === "IMAGE" ? (
                      <div>
                        <img
                          src={message.mediaUrl}
                          alt="Imagem"
                          className="max-w-full rounded"
                        />
                        {message.content && (
                          <p className="mt-1">{message.content}</p>
                        )}
                      </div>
                    ) : message.type === "AUDIO" ? (
                      <audio src={message.mediaUrl} controls className="max-w-full" />
                    ) : message.type === "VIDEO" ? (
                      <video src={message.mediaUrl} controls className="max-w-full rounded" />
                    ) : message.type === "DOCUMENT" ? (
                      <a
                        href={message.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 underline"
                      >
                        📄 {message.mediaFileName || "Documento"}
                      </a>
                    ) : (
                      <p>[{message.type}]</p>
                    )}

                    {/* Rodapé: hora e status */}
                    <div
                      className={cn(
                        "flex items-center justify-end gap-1 mt-1",
                        isOutbound ? "text-emerald-200" : "text-zinc-500"
                      )}
                    >
                      <span className="text-xs">
                        {format(new Date(message.createdAt), "HH:mm")}
                      </span>
                      {isOutbound && <MessageStatus status={message.status} />}
                    </div>
                  </div>

                  {/* Ações da mensagem - lado direito para inbound */}
                  {!isOutbound && (
                    <div className={cn(
                      "flex items-center gap-1 ml-2 transition-opacity",
                      hoveredMessageId === message.id ? "opacity-100" : "opacity-0"
                    )}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-4 w-4 text-zinc-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-40">
                          <DropdownMenuItem onClick={() => handleReply(message)}>
                            <Reply className="h-4 w-4 mr-2" />
                            Responder
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopy(message)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(message)}
                            className="text-red-500 focus:text-red-500"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 bg-zinc-900">
        {/* Preview da resposta */}
        {replyingTo && (
          <div className="px-3 pt-3 pb-0">
            <div className="flex items-start gap-2 p-2 bg-zinc-800 rounded-lg border-l-2 border-emerald-500">
              <Reply className="h-4 w-4 text-zinc-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-emerald-400 mb-0.5">
                  {replyingTo.direction === "OUTBOUND" ? "Você" : conversation.contactName || "Contato"}
                </p>
                <p className="text-sm text-zinc-400 truncate">
                  {replyingTo.type === "TEXT"
                    ? replyingTo.content
                    : `[${replyingTo.type}]`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={handleCancelReply}
              >
                <X className="h-4 w-4 text-zinc-500" />
              </Button>
            </div>
          </div>
        )}

        <div className="p-3">
          {isRecording ? (
            <AudioRecorder
              onSend={handleSendAudio}
              onCancel={() => setIsRecording(false)}
              sending={sendingAudio}
            />
          ) : (
            <div className="flex items-end gap-2">
              <FileUploader
                onUpload={handleSendFile}
                disabled={sending}
              />

              <Textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite uma mensagem..."
                className="min-h-[44px] max-h-32 resize-none bg-zinc-800 border-zinc-700"
                rows={1}
              />

              {/* Botao de audio ou enviar */}
              {text.trim() ? (
                <Button
                  onClick={handleSend}
                  disabled={sending}
                  className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-700"
                >
                  {sending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              ) : (
                <AudioRecordButton
                  onClick={() => setIsRecording(true)}
                  disabled={sending}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
