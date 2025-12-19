"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  RefreshCw,
  Smartphone,
  Check,
  Wifi,
  WifiOff,
  QrCode,
  Calendar,
  Phone,
} from "lucide-react"
import { toast } from "sonner"

interface WhatsAppInstance {
  id: string
  status: "DISCONNECTED" | "CONNECTING" | "CONNECTED"
  phoneNumber?: string
  qrCode?: string
  createdAt?: string
  updatedAt?: string
}

interface ConnectionStatusProps {
  onStatusChange?: () => void
}

export function ConnectionStatus({ onStatusChange }: ConnectionStatusProps) {
  const [instance, setInstance] = useState<WhatsAppInstance | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [refreshingQr, setRefreshingQr] = useState(false)
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)

  // Buscar status da instância
  const fetchInstance = async () => {
    try {
      const response = await fetch("/api/whatsapp/instance")
      const data = await response.json()
      setInstance(data.instance)

      if (data.instance?.qrCode) {
        setQrCode(data.instance.qrCode)
      }
    } catch (error) {
      console.error("Erro ao buscar instância:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInstance()
  }, [])

  // Polling do QR Code quando estiver conectando
  useEffect(() => {
    if (instance?.status === "CONNECTING") {
      const interval = setInterval(async () => {
        try {
          const response = await fetch("/api/whatsapp/instance/qr-code")
          const data = await response.json()

          if (data.status === "CONNECTED") {
            fetchInstance()
            onStatusChange?.()
            clearInterval(interval)
          } else if (data.qrCode) {
            setQrCode(data.qrCode)
          }
        } catch (error) {
          console.error("Erro ao buscar QR Code:", error)
        }
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [instance?.status, onStatusChange])

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

      if (data.instance?.qrCode) {
        setQrCode(data.instance.qrCode)
      }

      toast.info("Escaneie o QR Code no seu WhatsApp")
    } catch (error) {
      toast.error("Erro ao conectar WhatsApp")
    } finally {
      setConnecting(false)
    }
  }

  // Desconectar WhatsApp
  const handleDisconnect = async () => {
    try {
      setDisconnecting(true)
      await fetch("/api/whatsapp/instance", { method: "DELETE" })
      setInstance((prev) =>
        prev ? { ...prev, status: "DISCONNECTED", qrCode: undefined } : null
      )
      setQrCode(null)
      setShowDisconnectDialog(false)
      toast.success("WhatsApp desconectado")
      onStatusChange?.()
    } catch (error) {
      toast.error("Erro ao desconectar")
    } finally {
      setDisconnecting(false)
    }
  }

  // Atualizar QR Code
  const handleRefreshQR = async () => {
    setRefreshingQr(true)
    try {
      const response = await fetch("/api/whatsapp/instance/qr-code?refresh=true")
      const data = await response.json()
      if (data.qrCode) {
        setQrCode(data.qrCode)
        toast.success("QR Code atualizado")
      }
    } catch (error) {
      toast.error("Erro ao atualizar QR Code")
    } finally {
      setRefreshingQr(false)
    }
  }

  // Cancelar conexão
  const handleCancelConnection = async () => {
    try {
      await fetch("/api/whatsapp/instance", { method: "DELETE" })
      setInstance((prev) =>
        prev ? { ...prev, status: "DISCONNECTED", qrCode: undefined } : null
      )
      setQrCode(null)
      toast.info("Conexão cancelada")
    } catch (error) {
      toast.error("Erro ao cancelar")
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleString("pt-BR")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    )
  }

  // Status: Desconectado
  if (!instance || instance.status === "DISCONNECTED") {
    return (
      <div className="space-y-6">
        {/* Status Card */}
        <Card className="border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-zinc-800">
                <WifiOff className="h-8 w-8 text-zinc-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">WhatsApp Desconectado</h3>
                  <Badge variant="secondary">Offline</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Conecte seu WhatsApp para começar a receber mensagens
                </p>
              </div>
              <Button
                onClick={handleConnect}
                disabled={connecting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {connecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Conectar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card className="border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base">Como conectar</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium">
                  1
                </span>
                <span>Clique em "Conectar" para gerar o QR Code</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium">
                  2
                </span>
                <span>Abra o WhatsApp no seu celular</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium">
                  3
                </span>
                <span>
                  Vá em Menu → Dispositivos conectados → Conectar dispositivo
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium">
                  4
                </span>
                <span>Escaneie o QR Code que aparecerá na tela</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Status: Conectando (QR Code)
  if (instance.status === "CONNECTING") {
    return (
      <div className="space-y-6">
        {/* QR Code Card */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-6">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-1">Escaneie o QR Code</h3>
                <p className="text-sm text-muted-foreground">
                  Use o WhatsApp do seu celular para escanear
                </p>
              </div>

              {qrCode ? (
                <div className="p-4 bg-white rounded-lg shadow-lg">
                  <img
                    src={
                      qrCode.startsWith("data:")
                        ? qrCode
                        : `data:image/png;base64,${qrCode}`
                    }
                    alt="QR Code"
                    className="w-64 h-64"
                  />
                </div>
              ) : (
                <div className="w-64 h-64 flex items-center justify-center bg-zinc-800 rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleRefreshQR}
                  disabled={refreshingQr}
                >
                  {refreshingQr ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Atualizar QR
                </Button>
                <Button variant="destructive" onClick={handleCancelConnection}>
                  Cancelar
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                O QR Code expira em alguns minutos. Se expirar, clique em
                "Atualizar QR".
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Status: Conectado
  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-emerald-500/20">
              <Wifi className="h-8 w-8 text-emerald-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-emerald-400">
                  WhatsApp Conectado
                </h3>
                <Badge className="bg-emerald-500/20 text-emerald-500">
                  Online
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Seu WhatsApp está conectado e pronto para uso
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDisconnectDialog(true)}
            >
              <WifiOff className="mr-2 h-4 w-4" />
              Desconectar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detalhes da Conexão */}
      <Card className="border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base">Detalhes da Conexão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {instance.phoneNumber && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-zinc-500" />
              <div>
                <p className="text-sm text-muted-foreground">Número conectado</p>
                <p className="font-medium">{instance.phoneNumber}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-zinc-500" />
            <div>
              <p className="text-sm text-muted-foreground">
                Última atualização
              </p>
              <p className="font-medium">{formatDate(instance.updatedAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Check className="h-4 w-4 text-zinc-500" />
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium text-emerald-500">Ativo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Confirmação */}
      <AlertDialog
        open={showDisconnectDialog}
        onOpenChange={setShowDisconnectDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar WhatsApp?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá encerrar a sessão do WhatsApp. Você precisará escanear o
              QR Code novamente para reconectar. As conversas existentes serão
              mantidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disconnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desconectando...
                </>
              ) : (
                "Desconectar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
