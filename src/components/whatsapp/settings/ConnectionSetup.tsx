"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, RefreshCw, Smartphone, Check, X, QrCode } from "lucide-react"

interface ConnectionSetupProps {
  instance: any
  onConnect: () => Promise<void>
  onDisconnect: () => Promise<void>
  connecting: boolean
  onRefresh?: () => Promise<void>
}

export function ConnectionSetup({
  instance,
  onConnect,
  onDisconnect,
  connecting,
  onRefresh,
}: ConnectionSetupProps) {
  const [qrCode, setQrCode] = useState<string | null>(instance?.qrCode || null)
  const [refreshing, setRefreshing] = useState(false)
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null)

  // Polling do QR Code quando estiver conectando
  useEffect(() => {
    if (instance?.status === "CONNECTING") {
      const interval = setInterval(async () => {
        try {
          const response = await fetch("/api/whatsapp/instance/qr-code")
          const data = await response.json()

          if (data.status === "CONNECTED") {
            // Conectou! Atualizar página
            onRefresh?.()
            clearInterval(interval)
          } else if (data.qrCode) {
            setQrCode(data.qrCode)
          }
        } catch (error) {
          console.error("Erro ao buscar QR Code:", error)
        }
      }, 3000) // Atualiza a cada 3 segundos

      setPollInterval(interval)

      return () => {
        clearInterval(interval)
      }
    }
  }, [instance?.status, onRefresh])

  const handleRefreshQR = async () => {
    setRefreshing(true)
    try {
      const response = await fetch("/api/whatsapp/instance/qr-code")
      const data = await response.json()
      if (data.qrCode) {
        setQrCode(data.qrCode)
      }
    } catch (error) {
      console.error("Erro ao atualizar QR Code:", error)
    } finally {
      setRefreshing(false)
    }
  }

  // Não conectado - mostrar botão de conectar
  if (!instance || instance.status === "DISCONNECTED") {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Conectar WhatsApp
          </CardTitle>
          <CardDescription>
            Conecte seu WhatsApp Business para gerenciar conversas e atendimento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="p-6 rounded-full bg-emerald-500/10">
              <QrCode className="h-12 w-12 text-emerald-500" />
            </div>
            <div className="text-center">
              <h3 className="font-medium mb-1">WhatsApp nao conectado</h3>
              <p className="text-sm text-zinc-400 max-w-md">
                Clique no botao abaixo para gerar um QR Code e conectar seu WhatsApp Business
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={onConnect}
              disabled={connecting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {connecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                "Conectar WhatsApp"
              )}
            </Button>
          </div>

          <div className="border-t border-zinc-800 pt-6">
            <h4 className="font-medium mb-3">Como conectar:</h4>
            <ol className="space-y-2 text-sm text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-xs">1</span>
                <span>Clique em "Conectar WhatsApp"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-xs">2</span>
                <span>Abra o WhatsApp no seu celular</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-xs">3</span>
                <span>Toque em Menu ou Configuracoes e selecione "Dispositivos conectados"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-xs">4</span>
                <span>Toque em "Conectar um dispositivo"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-xs">5</span>
                <span>Escaneie o QR Code que aparecera na tela</span>
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Conectando - mostrar QR Code
  if (instance.status === "CONNECTING") {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Escaneie o QR Code
          </CardTitle>
          <CardDescription>
            Use o WhatsApp do seu celular para escanear o codigo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            {qrCode ? (
              <div className="p-4 bg-white rounded-lg">
                <img
                  src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>
            ) : (
              <div className="w-64 h-64 flex items-center justify-center bg-zinc-800 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshQR}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2">Atualizar QR</span>
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={onDisconnect}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>

          <div className="text-center text-sm text-zinc-400">
            <p>O QR Code expira em alguns minutos.</p>
            <p>Se expirar, clique em "Atualizar QR" para gerar um novo.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Conectado - mostrar status
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Check className="h-5 w-5 text-emerald-500" />
          WhatsApp Conectado
        </CardTitle>
        <CardDescription>
          Seu WhatsApp esta conectado e pronto para uso
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <div className="p-3 rounded-full bg-emerald-500/20">
            <Smartphone className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <p className="font-medium text-emerald-400">Conectado</p>
            {instance.phoneNumber && (
              <p className="text-sm text-zinc-400">{instance.phoneNumber}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="destructive"
            size="sm"
            onClick={onDisconnect}
          >
            Desconectar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
