"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { MessageCircle, Settings, Wifi, WifiOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { WhatsAppInbox } from "@/components/whatsapp/inbox/WhatsAppInbox"
import { ConnectionSetup } from "@/components/whatsapp/settings/ConnectionSetup"
import { useWhatsAppSSE } from "@/hooks/useWhatsAppSSE"

export default function WhatsAppPage() {
  const router = useRouter()
  const [instance, setInstance] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  const { isConnected: sseConnected, connectionStatus } = useWhatsAppSSE({
    enabled: instance?.status === "CONNECTED",
  })

  // Buscar status da instância
  const fetchInstance = useCallback(async () => {
    try {
      const response = await fetch("/api/whatsapp/instance")
      const data = await response.json()
      setInstance(data.instance)
    } catch (error) {
      console.error("Erro ao buscar instância:", error)
      toast.error("Erro ao carregar WhatsApp")
    } finally {
      setLoading(false)
    }
  }, [])

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

        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/whatsapp/settings")}
        >
          <Settings className="h-4 w-4 mr-2" />
          Configuracoes
        </Button>
      </div>

      {/* Inbox */}
      <div className="flex-1 overflow-hidden">
        <WhatsAppInbox />
      </div>
    </div>
  )
}
