"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { MessageCircle, Settings, Wifi, WifiOff, Loader2, Bot, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { toast } from "sonner"
import { WhatsAppInbox } from "@/components/whatsapp/inbox/WhatsAppInbox"
import { ConnectionSetup } from "@/components/whatsapp/settings/ConnectionSetup"
import { useWhatsAppSSE } from "@/hooks/useWhatsAppSSE"

export default function WhatsAppPage() {
  const router = useRouter()
  const [instance, setInstance] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [botEnabled, setBotEnabled] = useState(false)
  const [togglingBot, setTogglingBot] = useState(false)
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)

  const { isConnected: sseConnected, connectionStatus } = useWhatsAppSSE({
    enabled: instance?.status === "CONNECTED",
  })

  // Buscar status da instância e bot
  const fetchInstance = useCallback(async () => {
    try {
      const [instanceRes, botRes] = await Promise.all([
        fetch("/api/whatsapp/instance"),
        fetch("/api/whatsapp/bot/config"),
      ])

      const instanceData = await instanceRes.json()
      setInstance(instanceData.instance)

      if (botRes.ok) {
        const botData = await botRes.json()
        setBotEnabled(botData.config?.enabled ?? false)
      }
    } catch (error) {
      console.error("Erro ao buscar instância:", error)
      toast.error("Erro ao carregar WhatsApp")
    } finally {
      setLoading(false)
    }
  }, [])

  // Toggle bot
  const handleToggleBot = async () => {
    try {
      setTogglingBot(true)
      const response = await fetch("/api/whatsapp/bot/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !botEnabled }),
      })

      if (response.ok) {
        setBotEnabled(!botEnabled)
        toast.success(botEnabled ? "Bot desativado" : "Bot ativado")
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao alterar status do bot")
      }
    } catch {
      toast.error("Erro ao alterar status do bot")
    } finally {
      setTogglingBot(false)
    }
  }

  useEffect(() => {
    fetchInstance()
  }, [fetchInstance])

  // Atualizar status quando SSE notificar mudança
  useEffect(() => {
    if (connectionStatus && instance) {
      setInstance((prev: any) => ({
        ...prev,
        status: connectionStatus,
      }))
    }
  }, [connectionStatus])

  // Conectar WhatsApp
  const handleConnect = async () => {
    try {
      setConnecting(true)
      const response = await fetch("/api/whatsapp/instance", {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || "Erro ao conectar")
        return
      }

      const data = await response.json()
      setInstance(data.instance)

      if (data.instance.status === "CONNECTING") {
        toast.info("Escaneie o QR Code no seu WhatsApp")
      }
    } catch (error) {
      toast.error("Erro ao conectar WhatsApp")
    } finally {
      setConnecting(false)
    }
  }

  // Desconectar WhatsApp
  const handleDisconnect = async () => {
    try {
      await fetch("/api/whatsapp/instance", { method: "DELETE" })
      setInstance((prev: any) => ({
        ...prev,
        status: "DISCONNECTED",
        qrCode: null,
      }))
      toast.success("WhatsApp desconectado")
    } catch (error) {
      toast.error("Erro ao desconectar")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  // Se não tem instância ou está desconectado, mostrar tela de setup
  if (!instance || instance.status === "DISCONNECTED") {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <MessageCircle className="h-8 w-8 text-emerald-500" />
          <div>
            <h1 className="text-2xl font-bold">WhatsApp Business</h1>
            <p className="text-muted-foreground">
              Conecte seu WhatsApp para gerenciar conversas
            </p>
          </div>
        </div>

        <ConnectionSetup
          instance={instance}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          connecting={connecting}
        />
      </div>
    )
  }

  // Se está conectando (QR Code)
  if (instance.status === "CONNECTING") {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <MessageCircle className="h-8 w-8 text-emerald-500" />
          <div>
            <h1 className="text-2xl font-bold">Conectar WhatsApp</h1>
            <p className="text-muted-foreground">
              Escaneie o QR Code com seu WhatsApp
            </p>
          </div>
        </div>

        <ConnectionSetup
          instance={instance}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          connecting={connecting}
          onRefresh={fetchInstance}
        />
      </div>
    )
  }

  // Se está conectado, mostrar inbox
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-emerald-500" />
          <div>
            <h1 className="text-lg font-semibold">WhatsApp</h1>
            <div className="flex items-center gap-2 text-xs">
              {instance.status === "CONNECTED" ? (
                <>
                  <Wifi className="h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-500">Conectado</span>
                  {instance.phoneNumber && (
                    <span className="text-zinc-500">
                      ({instance.phoneNumber})
                    </span>
                  )}
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">Desconectado</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge de Status do Bot */}
          <Badge
            variant={botEnabled ? "default" : "secondary"}
            className={`gap-1 cursor-pointer ${
              botEnabled
                ? "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30"
                : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600"
            }`}
            onClick={handleToggleBot}
          >
            <Bot className="h-3 w-3" />
            {togglingBot ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : botEnabled ? (
              "Bot Ativo"
            ) : (
              "Bot Inativo"
            )}
          </Badge>

          {/* Dropdown de Acoes */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push("/whatsapp/settings")}>
                <Settings className="h-4 w-4 mr-2" />
                Configuracoes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleBot} disabled={togglingBot}>
                <Bot className="h-4 w-4 mr-2" />
                {botEnabled ? "Desativar Bot" : "Ativar Bot"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDisconnectDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <WifiOff className="h-4 w-4 mr-2" />
                Desconectar WhatsApp
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Inbox */}
      <div className="flex-1 overflow-hidden">
        <WhatsAppInbox />
      </div>

      {/* Dialog de Confirmacao de Desconexao */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar WhatsApp?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá encerrar a sessão do WhatsApp. Você precisará escanear o QR Code
              novamente para reconectar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
