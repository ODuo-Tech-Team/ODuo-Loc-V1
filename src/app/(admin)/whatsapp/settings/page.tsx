"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Bot, MessageSquare, Clock, Loader2, RefreshCw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BotConfigForm } from "@/components/whatsapp/settings/BotConfigForm"
import { FollowUpRules } from "@/components/whatsapp/settings/FollowUpRules"
import { toast } from "sonner"

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
  businessHours: Record<string, { start: string; end: string; enabled: boolean }> | null
  welcomeMessage: string | null
  awayMessage: string | null
  transferMessage: string | null
  closingMessage: string | null
}

export default function WhatsAppSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<BotConfig | null>(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/whatsapp/bot/config")
      const data = await response.json()

      if (response.ok) {
        setConfig(data.config)
      } else {
        toast.error(data.error || "Erro ao carregar configuracoes")
      }
    } catch (error) {
      toast.error("Erro ao carregar configuracoes")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (updates: Partial<BotConfig> & { openaiApiKey?: string }) => {
    try {
      setSaving(true)
      const response = await fetch("/api/whatsapp/bot/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (response.ok) {
        setConfig(data.config)
        toast.success("Configuracoes salvas com sucesso")
        return true
      } else {
        toast.error(data.error || "Erro ao salvar configuracoes")
        return false
      }
    } catch (error) {
      toast.error("Erro ao salvar configuracoes")
      return false
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/whatsapp")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Configuracoes do WhatsApp</h1>
          <p className="text-zinc-500">Configure o bot de IA e automacoes</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="bot" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="bot" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Bot de IA
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Mensagens
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horario
          </TabsTrigger>
          <TabsTrigger value="followup" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Follow-up
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bot">
          {config && (
            <BotConfigForm
              config={config}
              onSave={handleSave}
              saving={saving}
            />
          )}
        </TabsContent>

        <TabsContent value="messages">
          {config && (
            <MessagesConfig
              config={config}
              onSave={handleSave}
              saving={saving}
            />
          )}
        </TabsContent>

        <TabsContent value="hours">
          {config && (
            <BusinessHoursConfig
              config={config}
              onSave={handleSave}
              saving={saving}
            />
          )}
        </TabsContent>

        <TabsContent value="followup">
          <FollowUpRules />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Componente para configuracao de mensagens
function MessagesConfig({
  config,
  onSave,
  saving,
}: {
  config: BotConfig
  onSave: (updates: Partial<BotConfig>) => Promise<boolean>
  saving: boolean
}) {
  const [welcomeMessage, setWelcomeMessage] = useState(config.welcomeMessage || "")
  const [awayMessage, setAwayMessage] = useState(config.awayMessage || "")
  const [transferMessage, setTransferMessage] = useState(config.transferMessage || "")
  const [closingMessage, setClosingMessage] = useState(config.closingMessage || "")

  const handleSave = async () => {
    await onSave({
      welcomeMessage: welcomeMessage || null,
      awayMessage: awayMessage || null,
      transferMessage: transferMessage || null,
      closingMessage: closingMessage || null,
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Mensagens Automaticas</h3>
          <p className="text-sm text-zinc-500 mb-6">
            Configure as mensagens que o bot envia automaticamente em diferentes situacoes.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Mensagem de Boas-vindas</label>
          <p className="text-xs text-zinc-500">Enviada na primeira mensagem de um novo contato</p>
          <textarea
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="Ola! Bem-vindo a [Empresa]. Como posso ajudar?"
            className="w-full h-24 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Mensagem Fora do Horario</label>
          <p className="text-xs text-zinc-500">Enviada quando o cliente entra em contato fora do horario comercial</p>
          <textarea
            value={awayMessage}
            onChange={(e) => setAwayMessage(e.target.value)}
            placeholder="No momento estamos fora do horario de atendimento. Retornaremos em breve!"
            className="w-full h-24 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Mensagem de Transferencia</label>
          <p className="text-xs text-zinc-500">Enviada quando o cliente solicita falar com um atendente humano</p>
          <textarea
            value={transferMessage}
            onChange={(e) => setTransferMessage(e.target.value)}
            placeholder="Entendi! Vou transferir voce para um de nossos atendentes..."
            className="w-full h-24 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Mensagem de Encerramento</label>
          <p className="text-xs text-zinc-500">Enviada ao encerrar uma conversa</p>
          <textarea
            value={closingMessage}
            onChange={(e) => setClosingMessage(e.target.value)}
            placeholder="Obrigado pelo contato! Qualquer duvida, estamos a disposicao."
            className="w-full h-24 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg resize-none"
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : "Salvar Mensagens"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Componente para configuracao de horario comercial
function BusinessHoursConfig({
  config,
  onSave,
  saving,
}: {
  config: BotConfig
  onSave: (updates: Partial<BotConfig>) => Promise<boolean>
  saving: boolean
}) {
  const days = [
    { key: "monday", label: "Segunda-feira" },
    { key: "tuesday", label: "Terca-feira" },
    { key: "wednesday", label: "Quarta-feira" },
    { key: "thursday", label: "Quinta-feira" },
    { key: "friday", label: "Sexta-feira" },
    { key: "saturday", label: "Sabado" },
    { key: "sunday", label: "Domingo" },
  ]

  const defaultHours = {
    monday: { start: "08:00", end: "18:00", enabled: true },
    tuesday: { start: "08:00", end: "18:00", enabled: true },
    wednesday: { start: "08:00", end: "18:00", enabled: true },
    thursday: { start: "08:00", end: "18:00", enabled: true },
    friday: { start: "08:00", end: "18:00", enabled: true },
    saturday: { start: "08:00", end: "12:00", enabled: false },
    sunday: { start: "08:00", end: "12:00", enabled: false },
  }

  const [hours, setHours] = useState<Record<string, { start: string; end: string; enabled: boolean }>>(
    config.businessHours || defaultHours
  )

  const handleDayChange = (day: string, field: "start" | "end" | "enabled", value: string | boolean) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }))
  }

  const handleSave = async () => {
    await onSave({ businessHours: hours })
  }

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Horario de Funcionamento</h3>
          <p className="text-sm text-zinc-500 mb-6">
            Configure os horarios em que o bot responde normalmente.
          </p>
        </div>

        <div className="space-y-4">
          {days.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg">
              <label className="flex items-center gap-3 flex-1 min-w-[140px]">
                <input
                  type="checkbox"
                  checked={hours[key]?.enabled ?? false}
                  onChange={(e) => handleDayChange(key, "enabled", e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-700"
                />
                <span className="text-sm font-medium">{label}</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={hours[key]?.start || "08:00"}
                  onChange={(e) => handleDayChange(key, "start", e.target.value)}
                  disabled={!hours[key]?.enabled}
                  className="px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-sm disabled:opacity-50"
                />
                <span className="text-zinc-500">ate</span>
                <input
                  type="time"
                  value={hours[key]?.end || "18:00"}
                  onChange={(e) => handleDayChange(key, "end", e.target.value)}
                  disabled={!hours[key]?.enabled}
                  className="px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-sm disabled:opacity-50"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : "Salvar Horarios"}
          </Button>
        </div>
      </div>
    </div>
  )
}
