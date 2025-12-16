"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  MessageCircle,
  Wifi,
  WifiOff,
  Loader2,
  Bot,
  Key,
  Check,
  X,
  Save,
  Webhook,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ConnectionSetup } from "@/components/whatsapp/settings/ConnectionSetup"

interface BotConfig {
  enabled: boolean
  hasApiKey: boolean
  openaiModel: string
  temperature: number
  maxTokens: number
  systemPrompt: string | null
  includeEquipmentCatalog: boolean
  includeRentalPrices: boolean
  autoCreateLeads: boolean
  transferKeywords: string[]
  welcomeMessage: string | null
  awayMessage: string | null
  transferMessage: string | null
}

export default function WhatsAppSettingsPage() {
  const router = useRouter()
  const [instance, setInstance] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [savingBot, setSavingBot] = useState(false)
  const [configuringWebhook, setConfiguringWebhook] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null)

  // Bot config state
  const [botConfig, setBotConfig] = useState<BotConfig | null>(null)
  const [newApiKey, setNewApiKey] = useState("")
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)

  // Buscar dados
  const fetchData = useCallback(async () => {
    try {
      const [instanceRes, botRes, webhookRes] = await Promise.all([
        fetch("/api/whatsapp/instance"),
        fetch("/api/whatsapp/bot/config"),
        fetch("/api/whatsapp/instance/webhook"),
      ])

      const instanceData = await instanceRes.json()
      setInstance(instanceData.instance)

      if (botRes.ok) {
        const botData = await botRes.json()
        setBotConfig(botData.config)
      }

      if (webhookRes.ok) {
        const webhookData = await webhookRes.json()
        setWebhookUrl(webhookData.webhookUrl)
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
      toast.error("Erro ao carregar configuracoes")
    } finally {
      setLoading(false)
    }
  }, [])

  // Configurar webhook
  const handleConfigureWebhook = async () => {
    try {
      setConfiguringWebhook(true)
      const response = await fetch("/api/whatsapp/instance/webhook", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        setWebhookUrl(data.webhookUrl)
        toast.success("Webhook configurado com sucesso!")
      } else {
        toast.error(data.error || "Erro ao configurar webhook")
      }
    } catch (error) {
      toast.error("Erro ao configurar webhook")
    } finally {
      setConfiguringWebhook(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

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

  // Salvar configuração do bot
  const handleSaveBotConfig = async () => {
    if (!botConfig) return

    try {
      setSavingBot(true)

      const payload: any = {
        enabled: botConfig.enabled,
        openaiModel: botConfig.openaiModel,
        temperature: botConfig.temperature,
        maxTokens: botConfig.maxTokens,
        systemPrompt: botConfig.systemPrompt,
        includeEquipmentCatalog: botConfig.includeEquipmentCatalog,
        includeRentalPrices: botConfig.includeRentalPrices,
        autoCreateLeads: botConfig.autoCreateLeads,
        transferKeywords: botConfig.transferKeywords,
        welcomeMessage: botConfig.welcomeMessage,
        awayMessage: botConfig.awayMessage,
        transferMessage: botConfig.transferMessage,
      }

      // Incluir nova API key se fornecida
      if (newApiKey) {
        payload.openaiApiKey = newApiKey
      }

      const response = await fetch("/api/whatsapp/bot/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || "Erro ao salvar")
        return
      }

      const data = await response.json()
      setBotConfig(data.config)
      setNewApiKey("")
      setShowApiKeyInput(false)
      toast.success("Configuracoes salvas!")
    } catch (error) {
      toast.error("Erro ao salvar configuracoes")
    } finally {
      setSavingBot(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/whatsapp")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <MessageCircle className="h-8 w-8 text-emerald-500" />
          <div>
            <h1 className="text-2xl font-bold">Configuracoes WhatsApp</h1>
            <p className="text-muted-foreground">
              Gerencie sua conexao e bot de IA
            </p>
          </div>
        </div>
      </div>

      {/* Status da Conexão */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {instance?.status === "CONNECTED" ? (
              <Wifi className="h-5 w-5 text-emerald-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            Status da Conexao
          </CardTitle>
          <CardDescription>
            {instance?.status === "CONNECTED"
              ? `Conectado${instance.phoneNumber ? ` - ${instance.phoneNumber}` : ""}`
              : "WhatsApp nao conectado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConnectionSetup
            instance={instance}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            connecting={connecting}
            onRefresh={fetchData}
          />
        </CardContent>
      </Card>

      {/* Webhook - Sincronização de Mensagens */}
      {instance?.status === "CONNECTED" && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhook (Sincronizacao de Mensagens)
            </CardTitle>
            <CardDescription>
              Configure o webhook para receber mensagens em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>URL do Webhook</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-zinc-800 rounded-md text-sm text-zinc-300 overflow-x-auto">
                  {webhookUrl || "Nao configurado"}
                </code>
              </div>
              <p className="text-xs text-zinc-500">
                Esta URL recebe as mensagens da Uazapi. Clique em &quot;Configurar&quot; se as mensagens nao estiverem sincronizando.
              </p>
            </div>

            <Button
              onClick={handleConfigureWebhook}
              disabled={configuringWebhook}
              variant="outline"
            >
              {configuringWebhook ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Configurar Webhook
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Configuração do Bot de IA */}
      {instance?.status === "CONNECTED" && botConfig && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Bot de IA (Atendimento Automatico)
            </CardTitle>
            <CardDescription>
              Configure o assistente virtual para responder automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Habilitar/Desabilitar */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Bot habilitado</Label>
                <p className="text-sm text-zinc-500">
                  O bot respondera automaticamente as mensagens
                </p>
              </div>
              <Switch
                checked={botConfig.enabled}
                onCheckedChange={(enabled) =>
                  setBotConfig({ ...botConfig, enabled })
                }
              />
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Chave API OpenAI
              </Label>
              {botConfig.hasApiKey && !showApiKeyInput ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm text-emerald-400">Chave configurada</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowApiKeyInput(true)}
                  >
                    Alterar
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                  />
                  {showApiKeyInput && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowApiKeyInput(false)
                        setNewApiKey("")
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
              <p className="text-xs text-zinc-500">
                Sua chave da OpenAI para o bot de IA. Obtenha em platform.openai.com
              </p>
            </div>

            {/* Modelo */}
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Select
                value={botConfig.openaiModel}
                onValueChange={(value) =>
                  setBotConfig({ ...botConfig, openaiModel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini (Economico)</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o (Mais inteligente)</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Opções */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div>
                  <Label>Incluir catalogo</Label>
                  <p className="text-xs text-zinc-500">Equipamentos disponiveis</p>
                </div>
                <Switch
                  checked={botConfig.includeEquipmentCatalog}
                  onCheckedChange={(includeEquipmentCatalog) =>
                    setBotConfig({ ...botConfig, includeEquipmentCatalog })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div>
                  <Label>Mostrar precos</Label>
                  <p className="text-xs text-zinc-500">Incluir valores</p>
                </div>
                <Switch
                  checked={botConfig.includeRentalPrices}
                  onCheckedChange={(includeRentalPrices) =>
                    setBotConfig({ ...botConfig, includeRentalPrices })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div>
                  <Label>Criar leads</Label>
                  <p className="text-xs text-zinc-500">Automaticamente</p>
                </div>
                <Switch
                  checked={botConfig.autoCreateLeads}
                  onCheckedChange={(autoCreateLeads) =>
                    setBotConfig({ ...botConfig, autoCreateLeads })
                  }
                />
              </div>
            </div>

            {/* Mensagens */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Mensagem de boas-vindas</Label>
                <Textarea
                  placeholder="Ola! Como posso ajudar?"
                  value={botConfig.welcomeMessage || ""}
                  onChange={(e) =>
                    setBotConfig({ ...botConfig, welcomeMessage: e.target.value || null })
                  }
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem fora do horario</Label>
                <Textarea
                  placeholder="Estamos fora do horario de atendimento..."
                  value={botConfig.awayMessage || ""}
                  onChange={(e) =>
                    setBotConfig({ ...botConfig, awayMessage: e.target.value || null })
                  }
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem ao transferir para humano</Label>
                <Textarea
                  placeholder="Transferindo para um atendente..."
                  value={botConfig.transferMessage || ""}
                  onChange={(e) =>
                    setBotConfig({ ...botConfig, transferMessage: e.target.value || null })
                  }
                  rows={2}
                />
              </div>
            </div>

            {/* Palavras de transferência */}
            <div className="space-y-2">
              <Label>Palavras-chave para transferir (separadas por virgula)</Label>
              <Input
                placeholder="atendente, humano, pessoa"
                value={botConfig.transferKeywords?.join(", ") || ""}
                onChange={(e) =>
                  setBotConfig({
                    ...botConfig,
                    transferKeywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
              <p className="text-xs text-zinc-500">
                Quando o cliente digitar essas palavras, o bot transfere para atendimento humano
              </p>
            </div>

            {/* Botão Salvar */}
            <div className="flex justify-end pt-4 border-t border-zinc-800">
              <Button
                onClick={handleSaveBotConfig}
                disabled={savingBot}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {savingBot ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Configuracoes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
