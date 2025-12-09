"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { toast } from "sonner"
import {
  Loader2,
  Plus,
  Key,
  Webhook,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Plug,
} from "lucide-react"
import { ConfigTabs } from "@/components/config"

interface ApiKey {
  id: string
  name: string
  prefix: string
  key?: string // Apenas na criação
  permissions: any
  lastUsedAt: string | null
  expiresAt: string | null
  active: boolean
  createdAt: string
}

interface WebhookItem {
  id: string
  name: string
  url: string
  events: string[]
  secret: string | null
  active: boolean
  lastTriggeredAt: string | null
  failureCount: number
  createdAt: string
}

const WEBHOOK_EVENTS = [
  { value: "booking.created", label: "Reserva criada" },
  { value: "booking.updated", label: "Reserva atualizada" },
  { value: "booking.cancelled", label: "Reserva cancelada" },
  { value: "booking.completed", label: "Reserva concluída" },
  { value: "customer.created", label: "Cliente criado" },
  { value: "customer.updated", label: "Cliente atualizado" },
  { value: "customer.deleted", label: "Cliente deletado" },
  { value: "equipment.created", label: "Equipamento criado" },
  { value: "equipment.updated", label: "Equipamento atualizado" },
  { value: "equipment.deleted", label: "Equipamento deletado" },
]

export default function IntegracoesPage() {
  const [loading, setLoading] = useState(true)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([])

  // Dialog states
  const [newKeyDialogOpen, setNewKeyDialogOpen] = useState(false)
  const [newWebhookDialogOpen, setNewWebhookDialogOpen] = useState(false)
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({})

  // Form states
  const [newKeyName, setNewKeyName] = useState("")
  const [newWebhookName, setNewWebhookName] = useState("")
  const [newWebhookUrl, setNewWebhookUrl] = useState("")
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([])
  const [savingKey, setSavingKey] = useState(false)
  const [savingWebhook, setSavingWebhook] = useState(false)

  // Delete states
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null)
  const [deleteWebhookId, setDeleteWebhookId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [keysRes, webhooksRes] = await Promise.all([
        fetch("/api/integrations/api-keys"),
        fetch("/api/integrations/webhooks"),
      ])

      if (keysRes.ok) {
        const keysData = await keysRes.json()
        setApiKeys(Array.isArray(keysData) ? keysData : [])
      }

      if (webhooksRes.ok) {
        const webhooksData = await webhooksRes.json()
        setWebhooks(Array.isArray(webhooksData) ? webhooksData : [])
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar integrações")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Nome é obrigatório")
      return
    }

    try {
      setSavingKey(true)
      const response = await fetch("/api/integrations/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      })

      if (response.ok) {
        const data = await response.json()
        setCreatedKey(data.key)
        setApiKeys([data, ...apiKeys])
        setNewKeyName("")
        toast.success("API Key criada com sucesso!")
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao criar API Key")
      }
    } catch (error) {
      console.error("Erro:", error)
      toast.error("Erro ao criar API Key")
    } finally {
      setSavingKey(false)
    }
  }

  const handleDeleteApiKey = async () => {
    if (!deleteKeyId) return

    try {
      const response = await fetch(`/api/integrations/api-keys/${deleteKeyId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setApiKeys(apiKeys.filter((k) => k.id !== deleteKeyId))
        toast.success("API Key revogada com sucesso!")
      } else {
        toast.error("Erro ao revogar API Key")
      }
    } catch (error) {
      console.error("Erro:", error)
      toast.error("Erro ao revogar API Key")
    } finally {
      setDeleteKeyId(null)
    }
  }

  const handleCreateWebhook = async () => {
    if (!newWebhookName.trim() || !newWebhookUrl.trim()) {
      toast.error("Nome e URL são obrigatórios")
      return
    }

    if (newWebhookEvents.length === 0) {
      toast.error("Selecione pelo menos um evento")
      return
    }

    try {
      setSavingWebhook(true)
      const response = await fetch("/api/integrations/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newWebhookName,
          url: newWebhookUrl,
          events: newWebhookEvents,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setWebhooks([data, ...webhooks])
        setNewWebhookName("")
        setNewWebhookUrl("")
        setNewWebhookEvents([])
        setNewWebhookDialogOpen(false)
        toast.success("Webhook criado com sucesso!")
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao criar Webhook")
      }
    } catch (error) {
      console.error("Erro:", error)
      toast.error("Erro ao criar Webhook")
    } finally {
      setSavingWebhook(false)
    }
  }

  const handleDeleteWebhook = async () => {
    if (!deleteWebhookId) return

    try {
      const response = await fetch(`/api/integrations/webhooks/${deleteWebhookId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setWebhooks(webhooks.filter((w) => w.id !== deleteWebhookId))
        toast.success("Webhook deletado com sucesso!")
      } else {
        toast.error("Erro ao deletar Webhook")
      }
    } catch (error) {
      console.error("Erro:", error)
      toast.error("Erro ao deletar Webhook")
    } finally {
      setDeleteWebhookId(null)
    }
  }

  const handleToggleWebhook = async (id: string, active: boolean) => {
    try {
      const response = await fetch(`/api/integrations/webhooks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      })

      if (response.ok) {
        setWebhooks(webhooks.map((w) => (w.id === id ? { ...w, active } : w)))
        toast.success(active ? "Webhook ativado" : "Webhook desativado")
      }
    } catch (error) {
      console.error("Erro:", error)
      toast.error("Erro ao atualizar Webhook")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copiado para a área de transferência!")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold font-headline tracking-wide flex items-center gap-3">
            <Plug className="h-8 w-8 text-primary" />
            Integrações
          </h1>
          <p className="text-muted-foreground">
            Gerencie chaves de API e webhooks para integração externa
          </p>
        </div>
      </div>

      {/* Config Tabs */}
      <ConfigTabs activeTab="integracoes" />

      {/* API Keys Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-headline tracking-wide">
              <Key className="h-5 w-5" />
              Chaves de API
            </CardTitle>
            <CardDescription>
              Use chaves de API para autenticar requisições à API
            </CardDescription>
          </div>
          <Dialog open={newKeyDialogOpen} onOpenChange={setNewKeyDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Chave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Chave de API</DialogTitle>
                <DialogDescription>
                  A chave será exibida apenas uma vez. Guarde-a em local seguro.
                </DialogDescription>
              </DialogHeader>

              {createdKey ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <Label className="text-green-500">Sua nova chave de API:</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="flex-1 p-2 bg-background rounded text-xs font-mono break-all">
                        {createdKey}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(createdKey)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Esta chave não será exibida novamente. Copie e guarde em local seguro.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => {
                        setCreatedKey(null)
                        setNewKeyDialogOpen(false)
                      }}
                    >
                      Entendi
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="keyName">Nome da Chave</Label>
                      <Input
                        id="keyName"
                        placeholder="Ex: Integração Mobile App"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setNewKeyDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateApiKey} disabled={savingKey}>
                      {savingKey ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        "Criar Chave"
                      )}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma chave de API criada ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{apiKey.name}</span>
                      <Badge variant={apiKey.active ? "default" : "secondary"}>
                        {apiKey.active ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    <code className="text-xs text-muted-foreground font-mono">
                      {apiKey.prefix}
                    </code>
                    <div className="text-xs text-muted-foreground">
                      Criada em {new Date(apiKey.createdAt).toLocaleDateString("pt-BR")}
                      {apiKey.lastUsedAt && (
                        <> · Último uso: {new Date(apiKey.lastUsedAt).toLocaleDateString("pt-BR")}</>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteKeyId(apiKey.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhooks Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-headline tracking-wide">
              <Webhook className="h-5 w-5" />
              Webhooks
            </CardTitle>
            <CardDescription>
              Receba notificações em tempo real quando eventos acontecerem
            </CardDescription>
          </div>
          <Dialog open={newWebhookDialogOpen} onOpenChange={setNewWebhookDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Novo Webhook</DialogTitle>
                <DialogDescription>
                  Configure uma URL para receber notificações de eventos
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhookName">Nome</Label>
                  <Input
                    id="webhookName"
                    placeholder="Ex: Notificação Slack"
                    value={newWebhookName}
                    onChange={(e) => setNewWebhookName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">URL do Endpoint</Label>
                  <Input
                    id="webhookUrl"
                    placeholder="https://exemplo.com/webhook"
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Eventos</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                    {WEBHOOK_EVENTS.map((event) => (
                      <div key={event.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={event.value}
                          checked={newWebhookEvents.includes(event.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewWebhookEvents([...newWebhookEvents, event.value])
                            } else {
                              setNewWebhookEvents(
                                newWebhookEvents.filter((e) => e !== event.value)
                              )
                            }
                          }}
                        />
                        <Label htmlFor={event.value} className="text-sm cursor-pointer">
                          {event.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setNewWebhookDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateWebhook} disabled={savingWebhook}>
                  {savingWebhook ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Webhook"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum webhook configurado ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{webhook.name}</span>
                      <Badge variant={webhook.active ? "default" : "secondary"}>
                        {webhook.active ? "Ativo" : "Inativo"}
                      </Badge>
                      {webhook.failureCount > 0 && (
                        <Badge variant="destructive">
                          {webhook.failureCount} falhas
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={webhook.active}
                        onCheckedChange={(checked) =>
                          handleToggleWebhook(webhook.id, checked)
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteWebhookId(webhook.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <code className="break-all">{webhook.url}</code>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {webhook.events.map((event) => (
                      <Badge key={event} variant="outline" className="text-xs">
                        {WEBHOOK_EVENTS.find((e) => e.value === event)?.label || event}
                      </Badge>
                    ))}
                  </div>

                  {webhook.secret && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Secret:</span>
                      <code className="text-xs font-mono">
                        {showSecret[webhook.id] ? webhook.secret : "••••••••••••"}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          setShowSecret({ ...showSecret, [webhook.id]: !showSecret[webhook.id] })
                        }
                      >
                        {showSecret[webhook.id] ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(webhook.secret!)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Criado em {new Date(webhook.createdAt).toLocaleDateString("pt-BR")}
                    {webhook.lastTriggeredAt && (
                      <> · Último disparo: {new Date(webhook.lastTriggeredAt).toLocaleString("pt-BR")}</>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete API Key Dialog */}
      <AlertDialog open={!!deleteKeyId} onOpenChange={() => setDeleteKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar Chave de API</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja revogar esta chave? Qualquer aplicação usando
              esta chave perderá acesso imediatamente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteApiKey}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revogar Chave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Webhook Dialog */}
      <AlertDialog open={!!deleteWebhookId} onOpenChange={() => setDeleteWebhookId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Webhook</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este webhook? Você deixará de receber
              notificações neste endpoint. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWebhook}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar Webhook
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
