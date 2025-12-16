"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Clock,
  Plus,
  Trash2,
  Edit,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

interface FollowUpRule {
  id: string
  name: string
  enabled: boolean
  trigger: {
    type: string
    days: number
    onlyIfNoReply?: boolean
    tags?: string[]
  }
  action: {
    message: string
    includeContext?: boolean
  }
  maxAttempts: number
}

export function FollowUpRules() {
  const [rules, setRules] = useState<FollowUpRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<FollowUpRule | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [days, setDays] = useState(3)
  const [onlyIfNoReply, setOnlyIfNoReply] = useState(true)
  const [message, setMessage] = useState("")
  const [includeContext, setIncludeContext] = useState(false)
  const [maxAttempts, setMaxAttempts] = useState(2)

  // Fetch rules
  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      const response = await fetch("/api/whatsapp/follow-up/rules")
      if (response.ok) {
        const data = await response.json()
        setRules(data.rules || [])
      }
    } catch (error) {
      console.error("Error fetching rules:", error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName("")
    setDays(3)
    setOnlyIfNoReply(true)
    setMessage("")
    setIncludeContext(false)
    setMaxAttempts(2)
    setEditingRule(null)
  }

  const openEditDialog = (rule: FollowUpRule) => {
    setEditingRule(rule)
    setName(rule.name)
    setDays(rule.trigger.days)
    setOnlyIfNoReply(rule.trigger.onlyIfNoReply ?? true)
    setMessage(rule.action.message)
    setIncludeContext(rule.action.includeContext ?? false)
    setMaxAttempts(rule.maxAttempts)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim() || !message.trim()) {
      toast.error("Nome e mensagem sao obrigatorios")
      return
    }

    setSaving(true)

    try {
      const payload = {
        name,
        enabled: true,
        trigger: {
          type: "inactivity",
          days,
          onlyIfNoReply,
        },
        action: {
          message,
          includeContext,
        },
        maxAttempts,
      }

      const url = editingRule
        ? `/api/whatsapp/follow-up/rules/${editingRule.id}`
        : "/api/whatsapp/follow-up/rules"

      const response = await fetch(url, {
        method: editingRule ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success(editingRule ? "Regra atualizada" : "Regra criada")
        setIsDialogOpen(false)
        resetForm()
        fetchRules()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao salvar regra")
      }
    } catch (error) {
      toast.error("Erro ao salvar regra")
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (rule: FollowUpRule) => {
    try {
      const response = await fetch(`/api/whatsapp/follow-up/rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !rule.enabled }),
      })

      if (response.ok) {
        toast.success(rule.enabled ? "Regra desativada" : "Regra ativada")
        fetchRules()
      }
    } catch (error) {
      toast.error("Erro ao alterar regra")
    }
  }

  const handleDelete = async (rule: FollowUpRule) => {
    if (!confirm(`Tem certeza que deseja excluir a regra "${rule.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/whatsapp/follow-up/rules/${rule.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Regra excluida")
        fetchRules()
      }
    } catch (error) {
      toast.error("Erro ao excluir regra")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Regras de Follow-up</h3>
          <p className="text-sm text-zinc-500">
            Configure mensagens automaticas para conversas inativas
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? "Editar Regra" : "Nova Regra de Follow-up"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label>Nome da Regra</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Reativar apos 3 dias"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              {/* Dias de inatividade */}
              <div className="space-y-2">
                <Label>Dias de Inatividade</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    min={1}
                    max={30}
                    className="w-24 bg-zinc-800 border-zinc-700"
                  />
                  <span className="text-sm text-zinc-500">dias sem resposta</span>
                </div>
              </div>

              {/* Apenas se nao respondeu */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Apenas se cliente nao respondeu</Label>
                  <p className="text-xs text-zinc-500">
                    Nao enviar se a ultima mensagem foi nossa
                  </p>
                </div>
                <Switch
                  checked={onlyIfNoReply}
                  onCheckedChange={setOnlyIfNoReply}
                />
              </div>

              {/* Mensagem */}
              <div className="space-y-2">
                <Label>Mensagem de Follow-up</Label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ola {{nome}}! Vi que voce demonstrou interesse..."
                  className="w-full h-24 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg resize-none text-sm"
                />
                <p className="text-xs text-zinc-500">
                  Variaveis: {"{{nome}}"}, {"{{telefone}}"}, {"{{ultima_mensagem}}"}
                </p>
              </div>

              {/* Incluir contexto */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Incluir ultima mensagem</Label>
                  <p className="text-xs text-zinc-500">
                    Mencionar o ultimo assunto na mensagem
                  </p>
                </div>
                <Switch
                  checked={includeContext}
                  onCheckedChange={setIncludeContext}
                />
              </div>

              {/* Max tentativas */}
              <div className="space-y-2">
                <Label>Maximo de Tentativas</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(Number(e.target.value))}
                    min={1}
                    max={5}
                    className="w-24 bg-zinc-800 border-zinc-700"
                  />
                  <span className="text-sm text-zinc-500">por conversa</span>
                </div>
              </div>

              {/* Botoes */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de regras */}
      {rules.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhuma regra configurada</p>
          <p className="text-sm">
            Crie regras para enviar follow-ups automaticos
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={() => handleToggle(rule)}
                />

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{rule.name}</span>
                    <Badge variant={rule.enabled ? "default" : "secondary"}>
                      {rule.enabled ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {rule.trigger.days} dias de inatividade
                    </span>
                    <span>•</span>
                    <span>Max {rule.maxAttempts} tentativas</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditDialog(rule)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-400"
                  onClick={() => handleDelete(rule)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-blue-400">
          <strong>Como funciona:</strong> O sistema verifica periodicamente as conversas
          inativas e envia follow-ups automaticos conforme as regras configuradas.
          As mensagens sao enviadas apenas para conversas com atendimento humano (bot desativado).
        </p>
      </div>
    </div>
  )
}
