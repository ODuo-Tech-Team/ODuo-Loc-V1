"use client"

import { useState, useEffect } from "react"
import { Plus, Key, Webhook as WebhookIcon, Copy, Check, Trash2, Power, PowerOff, AlertTriangle, ExternalLink } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import Link from "next/link"

interface ApiKey {
  id: string
  name: string
  prefix: string
  active: boolean
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  active: boolean
  lastTriggeredAt: string | null
  failureCount: number
  createdAt: string
}

const availableEvents = [
  { value: "booking.created", label: "Reserva Criada" },
  { value: "booking.updated", label: "Reserva Atualizada" },
  { value: "booking.cancelled", label: "Reserva Cancelada" },
  { value: "equipment.created", label: "Equipamento Criado" },
  { value: "equipment.updated", label: "Equipamento Atualizado" },
  { value: "customer.created", label: "Cliente Criado" },
  { value: "customer.updated", label: "Cliente Atualizado" },
]

export default function IntegracoesPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)

  // API Key Dialog
  const [apiKeyDialog, setApiKeyDialog] = useState(false)
  const [apiKeyName, setApiKeyName] = useState("")
  const [creatingApiKey, setCreatingApiKey] = useState(false)
  const [newApiKey, setNewApiKey] = useState<string | null>(null)

  // Webhook Dialog
  const [webhookDialog, setWebhookDialog] = useState(false)
  const [webhookName, setWebhookName] = useState("")
  const [webhookUrl, setWebhookUrl] = useState("")
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [creatingWebhook, setCreatingWebhook] = useState(false)
  const [newWebhookSecret, setNewWebhookSecret] = useState<string | null>(null)

  // Delete Dialogs
  const [deleteApiKeyId, setDeleteApiKeyId] = useState<string | null>(null)
  const [deleteWebhookId, setDeleteWebhookId] = useState<string | null>(null)

  const [copiedText, setCopiedText] = useState<string | null>(null)

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
        const keys = await keysRes.json()
        setApiKeys(keys)
      }

      if (webhooksRes.ok) {
        const hooks = await webhooksRes.json()
        setWebhooks(hooks)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const createApiKey = async () => {
    if (!apiKeyName.trim()) {
      toast.error("Digite um nome para a API key")
      return
    }

    setCreatingApiKey(true)
    try {
      const response = await fetch("/api/integrations/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: apiKeyName }),
      })

      if (!response.ok) {
        throw new Error("Erro ao criar API key")
      }

      const data = await response.json()
      setNewApiKey(data.key)
      toast.success("API key criada com sucesso!")
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar API key")
    } finally {
      setCreatingApiKey(false)
    }
  }

  const deleteApiKey = async (id: string) => {
    try {
      const response = await fetch(`/api/integrations/api-keys/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erro ao deletar API key")
      }

      toast.success("API key deletada com sucesso!")
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Erro ao deletar API key")
    } finally {
      setDeleteApiKeyId(null)
    }
  }

  const toggleApiKey = async (id: string, active: boolean) => {
    try {
      const response = await fetch(`/api/integrations/api-keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      })

      if (!response.ok) {
        throw new Error("Erro ao atualizar API key")
      }

      toast.success(`API key ${!active ? "ativada" : "desativada"} com sucesso!`)
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar API key")
    }
  }

  const createWebhook = async () => {
    if (!webhookName.trim() || !webhookUrl.trim()) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    if (selectedEvents.length === 0) {
      toast.error("Selecione ao menos um evento")
      return
    }

    setCreatingWebhook(true)
    try {
      const response = await fetch("/api/integrations/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: webhookName,
          url: webhookUrl,
          events: selectedEvents,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao criar webhook")
      }

      const data = await response.json()
      setNewWebhookSecret(data.secret)
      toast.success("Webhook criado com sucesso!")
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar webhook")
    } finally {
      setCreatingWebhook(false)
    }
  }

  const deleteWebhook = async (id: string) => {
    try {
      const response = await fetch(`/api/integrations/webhooks/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erro ao deletar webhook")
      }

      toast.success("Webhook deletado com sucesso!")
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Erro ao deletar webhook")
    } finally {
      setDeleteWebhookId(null)
    }
  }

  const toggleWebhook = async (id: string, active: boolean) => {
    try {
      const response = await fetch(`/api/integrations/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      })

      if (!response.ok) {
        throw new Error("Erro ao atualizar webhook")
      }

      toast.success(`Webhook ${!active ? "ativado" : "desativado"} com sucesso!`)
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar webhook")
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(label)
    toast.success("Copiado para área de transferência!")
    setTimeout(() => setCopiedText(null), 2000)
  }

  const resetApiKeyDialog = () => {
    setApiKeyDialog(false)
    setApiKeyName("")
    setNewApiKey(null)
  }

  const resetWebhookDialog = () => {
    setWebhookDialog(false)
    setWebhookName("")
    setWebhookUrl("")
    setSelectedEvents([])
    setNewWebhookSecret(null)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 font-headline tracking-wide">Integrações</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie API keys e webhooks para integrar com sistemas externos
          </p>
        </div>
        <Link href="/ajuda/api" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver Documentação
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="api-keys" className="space-y-4 sm:space-y-6">
        <TabsList className="w-full grid grid-cols-2 h-auto">
          <TabsTrigger value="api-keys" className="text-xs sm:text-sm">
            <Key className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">API Keys</span>
            <span className="sm:hidden">API</span>
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="text-xs sm:text-sm">
            <WebhookIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 pb-4">
              <div>
                <CardTitle className="text-base sm:text-lg font-headline tracking-wide">API Keys</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Chaves para autenticar requisições à API
                </CardDescription>
              </div>
              <Dialog open={apiKeyDialog} onOpenChange={setApiKeyDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova API Key
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {newApiKey ? "API Key Criada!" : "Criar Nova API Key"}
                    </DialogTitle>
                    <DialogDescription>
                      {newApiKey
                        ? "Esta é a única vez que você verá esta chave. Copie e guarde em local seguro!"
                        : "Crie uma nova chave para autenticar requisições à API"}
                    </DialogDescription>
                  </DialogHeader>

                  {!newApiKey ? (
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="apiKeyName">Nome da API Key *</Label>
                        <Input
                          id="apiKeyName"
                          placeholder="Ex: Mobile App, Integração ERP"
                          value={apiKeyName}
                          onChange={(e) => setApiKeyName(e.target.value)}
                          disabled={creatingApiKey}
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={createApiKey}
                          disabled={creatingApiKey}
                          className="flex-1"
                        >
                          {creatingApiKey ? "Criando..." : "Criar API Key"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setApiKeyDialog(false)}
                          disabled={creatingApiKey}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-4">
                      <div className="p-4 bg-accent/10 dark:bg-accent/20 border border-accent/30 dark:border-accent/40 rounded-lg space-y-2">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-accent mt-0.5" />
                          <div className="text-sm text-foreground">
                            <p className="font-medium">Atenção!</p>
                            <p className="text-muted-foreground">
                              Esta é a única vez que esta chave será exibida. Copie
                              agora e guarde em local seguro.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Sua API Key</Label>
                        <div className="flex gap-2">
                          <Input value={newApiKey} readOnly className="font-mono text-sm" />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => copyToClipboard(newApiKey, "api-key")}
                          >
                            {copiedText === "api-key" ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <Button onClick={resetApiKeyDialog} className="w-full">
                        Fechar
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando...
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma API key cadastrada
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg"
                    >
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <h3 className="font-medium text-sm sm:text-base truncate">{key.name}</h3>
                          {key.active ? (
                            <Badge className="bg-green-600 w-fit text-xs">Ativa</Badge>
                          ) : (
                            <Badge variant="secondary" className="w-fit text-xs">Inativa</Badge>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                          <code className="bg-muted px-2 py-0.5 rounded w-fit">
                            {key.prefix}...
                          </code>
                          {key.lastUsedAt && (
                            <span className="text-[10px] sm:text-xs">
                              Último uso:{" "}
                              {new Date(key.lastUsedAt).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                          <span className="text-[10px] sm:text-xs">
                            Criada: {new Date(key.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end sm:justify-start">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleApiKey(key.id, key.active)}
                        >
                          {key.active ? (
                            <PowerOff className="h-4 w-4 text-orange-600" />
                          ) : (
                            <Power className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteApiKeyId(key.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 pb-4">
              <div>
                <CardTitle className="text-base sm:text-lg font-headline tracking-wide">Webhooks</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Receba notificações em tempo real sobre eventos do sistema
                </CardDescription>
              </div>
              <Dialog open={webhookDialog} onOpenChange={setWebhookDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Webhook
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {newWebhookSecret ? "Webhook Criado!" : "Criar Novo Webhook"}
                    </DialogTitle>
                    <DialogDescription>
                      {newWebhookSecret
                        ? "Webhook criado com sucesso. Guarde o secret para validar as requisições."
                        : "Configure um endpoint para receber notificações de eventos"}
                    </DialogDescription>
                  </DialogHeader>

                  {!newWebhookSecret ? (
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="webhookName">Nome do Webhook *</Label>
                        <Input
                          id="webhookName"
                          placeholder="Ex: Notificações ERP"
                          value={webhookName}
                          onChange={(e) => setWebhookName(e.target.value)}
                          disabled={creatingWebhook}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="webhookUrl">URL do Endpoint *</Label>
                        <Input
                          id="webhookUrl"
                          placeholder="https://seu-sistema.com/webhook"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          disabled={creatingWebhook}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Eventos *</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {availableEvents.map((event) => (
                            <div key={event.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={event.value}
                                checked={selectedEvents.includes(event.value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedEvents([...selectedEvents, event.value])
                                  } else {
                                    setSelectedEvents(
                                      selectedEvents.filter((e) => e !== event.value)
                                    )
                                  }
                                }}
                                disabled={creatingWebhook}
                              />
                              <Label
                                htmlFor={event.value}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {event.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={createWebhook}
                          disabled={creatingWebhook}
                          className="flex-1"
                        >
                          {creatingWebhook ? "Criando..." : "Criar Webhook"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setWebhookDialog(false)}
                          disabled={creatingWebhook}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-4">
                      <div className="p-4 bg-primary/10 dark:bg-primary/20 border border-primary/30 dark:border-primary/40 rounded-lg space-y-2">
                        <div className="flex items-start gap-2">
                          <Key className="h-5 w-5 text-primary mt-0.5" />
                          <div className="text-sm text-foreground">
                            <p className="font-medium">Secret do Webhook</p>
                            <p className="text-muted-foreground">
                              Use este secret para validar que as requisições vieram do
                              nosso sistema.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Webhook Secret</Label>
                        <div className="flex gap-2">
                          <Input
                            value={newWebhookSecret}
                            readOnly
                            className="font-mono text-sm"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() =>
                              copyToClipboard(newWebhookSecret, "webhook-secret")
                            }
                          >
                            {copiedText === "webhook-secret" ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <Button onClick={resetWebhookDialog} className="w-full">
                        Fechar
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando...
                </div>
              ) : webhooks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum webhook cadastrado
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {webhooks.map((webhook) => (
                    <div
                      key={webhook.id}
                      className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg"
                    >
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <h3 className="font-medium text-sm sm:text-base truncate">{webhook.name}</h3>
                          <div className="flex flex-wrap items-center gap-2">
                            {webhook.active ? (
                              <Badge className="bg-green-600 text-xs">Ativo</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Inativo</Badge>
                            )}
                            {webhook.failureCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {webhook.failureCount} falhas
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground space-y-2">
                          <p className="font-mono break-all">{webhook.url}</p>
                          <div className="flex flex-wrap gap-1">
                            {webhook.events.map((event) => (
                              <Badge key={event} variant="outline" className="text-[10px] sm:text-xs">
                                {availableEvents.find((e) => e.value === event)?.label ||
                                  event}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-[10px] sm:text-xs">
                            {webhook.lastTriggeredAt && (
                              <span>
                                Último disparo:{" "}
                                {new Date(webhook.lastTriggeredAt).toLocaleString("pt-BR")}
                              </span>
                            )}
                            <span>
                              Criado:{" "}
                              {new Date(webhook.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end sm:justify-start flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleWebhook(webhook.id, webhook.active)}
                        >
                          {webhook.active ? (
                            <PowerOff className="h-4 w-4 text-orange-600" />
                          ) : (
                            <Power className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteWebhookId(webhook.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete API Key Dialog */}
      <AlertDialog
        open={!!deleteApiKeyId}
        onOpenChange={() => setDeleteApiKeyId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta API key? Esta ação não pode ser
              desfeita e todas as integrações usando esta chave pararão de funcionar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteApiKeyId && deleteApiKey(deleteApiKeyId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Webhook Dialog */}
      <AlertDialog
        open={!!deleteWebhookId}
        onOpenChange={() => setDeleteWebhookId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Webhook</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este webhook? Você não receberá mais
              notificações deste endpoint.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteWebhookId && deleteWebhook(deleteWebhookId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
