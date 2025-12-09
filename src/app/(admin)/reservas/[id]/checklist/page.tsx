"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import {
  ClipboardCheck,
  Plus,
  Trash2,
  Save,
  Loader2,
  Calendar,
  Check,
  X,
  Download,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdminPageHeader } from "@/components/admin"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { BookingTabs } from "@/components/booking"

interface Booking {
  id: string
  bookingNumber: string
  status: string
  customer: {
    name: string
  }
  equipment: {
    name: string
  }
}

interface ChecklistItem {
  id: string
  description: string
  checked: boolean
  notes: string | null
  order: number
}

interface Checklist {
  id: string
  type: "PICKUP" | "RETURN"
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED"
  completedAt: string | null
  completedBy: string | null
  notes: string | null
  items: ChecklistItem[]
}

interface ChecklistTemplate {
  id: string
  name: string
  type: "PICKUP" | "RETURN"
  items: { description: string; order: number }[]
}

export default function ChecklistOrcamentoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [pickupChecklist, setPickupChecklist] = useState<Checklist | null>(null)
  const [returnChecklist, setReturnChecklist] = useState<Checklist | null>(null)
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"pickup" | "return">("pickup")

  // Dialog states
  const [newItemDialog, setNewItemDialog] = useState(false)
  const [saveTemplateDialog, setSaveTemplateDialog] = useState(false)
  const [loadTemplateDialog, setLoadTemplateDialog] = useState(false)
  const [newItemDescription, setNewItemDescription] = useState("")
  const [templateName, setTemplateName] = useState("")

  useEffect(() => {
    fetchData()
  }, [resolvedParams.id])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Buscar booking
      const bookingRes = await fetch(`/api/bookings/${resolvedParams.id}`)
      if (!bookingRes.ok) throw new Error("Orçamento não encontrado")
      const bookingData = await bookingRes.json()
      setBooking(bookingData)

      // Buscar checklists
      const checklistRes = await fetch(`/api/bookings/${resolvedParams.id}/checklists`)
      if (checklistRes.ok) {
        const checklistData = await checklistRes.json()
        setPickupChecklist(checklistData.pickup || null)
        setReturnChecklist(checklistData.return || null)
      }

      // Buscar templates
      const templatesRes = await fetch("/api/checklist-templates")
      if (templatesRes.ok) {
        const templatesData = await templatesRes.json()
        setTemplates(templatesData || [])
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados")
      router.push("/reservas")
    } finally {
      setLoading(false)
    }
  }

  const getCurrentChecklist = () => {
    return activeTab === "pickup" ? pickupChecklist : returnChecklist
  }

  const setCurrentChecklist = (checklist: Checklist | null) => {
    if (activeTab === "pickup") {
      setPickupChecklist(checklist)
    } else {
      setReturnChecklist(checklist)
    }
  }

  const handleCreateChecklist = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/bookings/${resolvedParams.id}/checklists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab === "pickup" ? "PICKUP" : "RETURN",
          items: [],
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentChecklist(data)
        toast.success("Checklist criado com sucesso!")
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao criar checklist")
      }
    } catch (error) {
      console.error("Error creating checklist:", error)
      toast.error("Erro ao criar checklist")
    } finally {
      setSaving(false)
    }
  }

  const handleAddItem = async () => {
    if (!newItemDescription.trim()) {
      toast.error("Digite uma descrição para o item")
      return
    }

    const checklist = getCurrentChecklist()
    if (!checklist) return

    setSaving(true)
    try {
      const response = await fetch(`/api/bookings/${resolvedParams.id}/checklists/${checklist.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: newItemDescription,
          order: checklist.items.length,
        }),
      })

      if (response.ok) {
        const newItem = await response.json()
        setCurrentChecklist({
          ...checklist,
          items: [...checklist.items, newItem],
        })
        setNewItemDescription("")
        setNewItemDialog(false)
        toast.success("Item adicionado!")
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao adicionar item")
      }
    } catch (error) {
      console.error("Error adding item:", error)
      toast.error("Erro ao adicionar item")
    } finally {
      setSaving(false)
    }
  }

  const handleToggleItem = async (itemId: string, checked: boolean) => {
    const checklist = getCurrentChecklist()
    if (!checklist) return

    try {
      const response = await fetch(`/api/bookings/${resolvedParams.id}/checklists/${checklist.id}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checked }),
      })

      if (response.ok) {
        setCurrentChecklist({
          ...checklist,
          items: checklist.items.map((item) =>
            item.id === itemId ? { ...item, checked } : item
          ),
        })
      }
    } catch (error) {
      console.error("Error toggling item:", error)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    const checklist = getCurrentChecklist()
    if (!checklist) return

    try {
      const response = await fetch(`/api/bookings/${resolvedParams.id}/checklists/${checklist.id}/items/${itemId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setCurrentChecklist({
          ...checklist,
          items: checklist.items.filter((item) => item.id !== itemId),
        })
        toast.success("Item removido!")
      }
    } catch (error) {
      console.error("Error deleting item:", error)
      toast.error("Erro ao remover item")
    }
  }

  const handleCompleteChecklist = async () => {
    const checklist = getCurrentChecklist()
    if (!checklist) return

    const allChecked = checklist.items.every((item) => item.checked)
    if (!allChecked) {
      toast.error("Todos os itens devem ser marcados antes de finalizar")
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/bookings/${resolvedParams.id}/checklists/${checklist.id}/complete`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentChecklist(data)
        toast.success("Checklist finalizado com sucesso!")
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao finalizar checklist")
      }
    } catch (error) {
      console.error("Error completing checklist:", error)
      toast.error("Erro ao finalizar checklist")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Digite um nome para o modelo")
      return
    }

    const checklist = getCurrentChecklist()
    if (!checklist || checklist.items.length === 0) {
      toast.error("O checklist deve ter pelo menos um item")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/checklist-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          type: activeTab === "pickup" ? "PICKUP" : "RETURN",
          items: checklist.items.map((item, index) => ({
            description: item.description,
            order: index,
          })),
        }),
      })

      if (response.ok) {
        const newTemplate = await response.json()
        setTemplates([...templates, newTemplate])
        setTemplateName("")
        setSaveTemplateDialog(false)
        toast.success("Modelo salvo com sucesso!")
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao salvar modelo")
      }
    } catch (error) {
      console.error("Error saving template:", error)
      toast.error("Erro ao salvar modelo")
    } finally {
      setSaving(false)
    }
  }

  const handleLoadTemplate = async (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (!template) return

    setSaving(true)
    try {
      // Se já existe checklist, adiciona os itens
      const checklist = getCurrentChecklist()

      if (checklist) {
        // Adicionar itens do template ao checklist existente
        for (const item of template.items) {
          await fetch(`/api/bookings/${resolvedParams.id}/checklists/${checklist.id}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              description: item.description,
              order: checklist.items.length + item.order,
            }),
          })
        }
        fetchData()
      } else {
        // Criar novo checklist com os itens do template
        const response = await fetch(`/api/bookings/${resolvedParams.id}/checklists`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: activeTab === "pickup" ? "PICKUP" : "RETURN",
            items: template.items,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setCurrentChecklist(data)
        }
      }

      setLoadTemplateDialog(false)
      toast.success("Modelo carregado com sucesso!")
    } catch (error) {
      console.error("Error loading template:", error)
      toast.error("Erro ao carregar modelo")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!booking) {
    return null
  }

  const checklist = getCurrentChecklist()
  const filteredTemplates = templates.filter(
    (t) => t.type === (activeTab === "pickup" ? "PICKUP" : "RETURN")
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Checklist"
        description={`${booking.customer.name} - ${booking.equipment.name}`}
        icon={ClipboardCheck}
        iconColor="text-purple-400"
        backHref="/reservas"
        backLabel="Voltar para Orçamentos"
      />

      {/* Navigation Tabs */}
      <BookingTabs bookingId={resolvedParams.id} activeTab="checklist" />

      {/* Checklist Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pickup" | "return")}>
        <TabsList className="bg-zinc-900/50 border border-zinc-800 p-1 rounded-xl">
          <TabsTrigger
            value="pickup"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white rounded-lg px-4 py-2"
          >
            <Download className="h-4 w-4 mr-2" />
            Saída (Entrega)
          </TabsTrigger>
          <TabsTrigger
            value="return"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-4 py-2"
          >
            <Upload className="h-4 w-4 mr-2" />
            Entrada (Devolução)
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {!checklist ? (
            // Criar novo checklist
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="py-12 text-center">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  Nenhum checklist de {activeTab === "pickup" ? "saída" : "entrada"} criado
                </h3>
                <p className="text-muted-foreground mb-6">
                  Crie um checklist para registrar a condição do equipamento
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={handleCreateChecklist} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Criar Checklist Vazio
                  </Button>
                  {filteredTemplates.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setLoadTemplateDialog(true)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Usar Modelo
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            // Mostrar checklist
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-headline tracking-wide flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5" />
                      Checklist de {activeTab === "pickup" ? "Saída" : "Entrada"}
                    </CardTitle>
                    <CardDescription>
                      {checklist.items.filter((i) => i.checked).length} de{" "}
                      {checklist.items.length} itens verificados
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {checklist.status === "COMPLETED" ? (
                      <Badge className="bg-green-600">Finalizado</Badge>
                    ) : (
                      <Badge variant="secondary">Em andamento</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Lista de itens */}
                {checklist.items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhum item no checklist</p>
                    <p className="text-sm">Adicione itens ou carregue um modelo</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {checklist.items
                      .sort((a, b) => a.order - b.order)
                      .map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            item.checked
                              ? "bg-green-500/10 border-green-500/30"
                              : "bg-zinc-800/50 border-zinc-700"
                          }`}
                        >
                          <Checkbox
                            checked={item.checked}
                            onCheckedChange={(checked) =>
                              handleToggleItem(item.id, checked as boolean)
                            }
                            disabled={checklist.status === "COMPLETED"}
                          />
                          <span
                            className={`flex-1 ${
                              item.checked ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {item.description}
                          </span>
                          {checklist.status !== "COMPLETED" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteItem(item.id)}
                              className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                  </div>
                )}

                {/* Ações */}
                {checklist.status !== "COMPLETED" && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-800">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNewItemDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Item
                    </Button>
                    {filteredTemplates.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLoadTemplateDialog(true)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Carregar Modelo
                      </Button>
                    )}
                    {checklist.items.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSaveTemplateDialog(true)}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Salvar como Modelo
                      </Button>
                    )}
                    <div className="flex-1" />
                    {checklist.items.length > 0 && (
                      <Button
                        onClick={handleCompleteChecklist}
                        disabled={saving || !checklist.items.every((i) => i.checked)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        Finalizar Checklist
                      </Button>
                    )}
                  </div>
                )}

                {/* Info de conclusão */}
                {checklist.status === "COMPLETED" && checklist.completedAt && (
                  <div className="pt-4 border-t border-zinc-800 text-sm text-muted-foreground">
                    <p>
                      Finalizado em{" "}
                      {new Date(checklist.completedAt).toLocaleString("pt-BR")}
                      {checklist.completedBy && ` por ${checklist.completedBy}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog: Novo Item */}
      <Dialog open={newItemDialog} onOpenChange={setNewItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Item</DialogTitle>
            <DialogDescription>
              Adicione um novo item ao checklist
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Descrição do Item</Label>
              <Input
                placeholder="Ex: Verificar estado dos pneus"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewItemDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddItem} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Salvar como Modelo */}
      <Dialog open={saveTemplateDialog} onOpenChange={setSaveTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar como Modelo</DialogTitle>
            <DialogDescription>
              Salve este checklist como modelo para reutilizar em outros orçamentos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Modelo</Label>
              <Input
                placeholder="Ex: Checklist Betoneira"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveTemplateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAsTemplate} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Carregar Modelo */}
      <Dialog open={loadTemplateDialog} onOpenChange={setLoadTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Carregar Modelo</DialogTitle>
            <DialogDescription>
              Selecione um modelo para carregar os itens
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {filteredTemplates.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum modelo disponível para este tipo de checklist
              </p>
            ) : (
              <div className="space-y-2">
                {filteredTemplates.map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleLoadTemplate(template.id)}
                    disabled={saving}
                  >
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    {template.name}
                    <Badge variant="secondary" className="ml-auto">
                      {template.items.length} itens
                    </Badge>
                  </Button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoadTemplateDialog(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
