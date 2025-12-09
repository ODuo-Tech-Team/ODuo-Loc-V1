"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Play,
  XCircle,
  Wrench,
  AlertTriangle,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Unit {
  id: string
  serialNumber: string
  internalCode: string | null
  equipment: {
    id: string
    name: string
  }
}

interface Maintenance {
  id: string
  type: "PREVENTIVE" | "CORRECTIVE" | "INSPECTION"
  description: string
  scheduledDate: string
  completedDate: string | null
  cost: number | null
  vendor: string | null
  notes: string | null
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  createdAt: string
}

const statusConfig = {
  SCHEDULED: { label: "Agendada", color: "bg-blue-100 text-blue-800", icon: Calendar },
  IN_PROGRESS: { label: "Em Andamento", color: "bg-yellow-100 text-yellow-800", icon: Play },
  COMPLETED: { label: "Concluída", color: "bg-green-100 text-green-800", icon: CheckCircle },
  CANCELLED: { label: "Cancelada", color: "bg-gray-100 text-gray-800", icon: XCircle },
}

const typeConfig = {
  PREVENTIVE: { label: "Preventiva", color: "bg-purple-100 text-purple-800" },
  CORRECTIVE: { label: "Corretiva", color: "bg-red-100 text-red-800" },
  INSPECTION: { label: "Inspeção", color: "bg-cyan-100 text-cyan-800" },
}

export default function ManutencaoUnidadePage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [unit, setUnit] = useState<Unit | null>(null)
  const [maintenances, setMaintenances] = useState<Maintenance[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    type: "PREVENTIVE",
    description: "",
    scheduledDate: "",
    cost: "",
    vendor: "",
    notes: "",
    status: "SCHEDULED",
    completedDate: "",
  })

  useEffect(() => {
    fetchData()
  }, [resolvedParams.id, resolvedParams.unitId])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Buscar unidade
      const unitRes = await fetch(
        `/api/equipments/${resolvedParams.id}/units/${resolvedParams.unitId}`
      )
      if (!unitRes.ok) throw new Error("Unidade não encontrada")
      const unitData = await unitRes.json()
      setUnit(unitData)

      // Buscar manutenções da unidade
      const maintenanceRes = await fetch(`/api/maintenance?unitId=${resolvedParams.unitId}`)
      if (maintenanceRes.ok) {
        const data = await maintenanceRes.json()
        setMaintenances(data.maintenances || [])
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar dados")
      router.push(`/equipamentos/${resolvedParams.id}/unidades`)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      type: "PREVENTIVE",
      description: "",
      scheduledDate: "",
      cost: "",
      vendor: "",
      notes: "",
      status: "SCHEDULED",
      completedDate: "",
    })
  }

  const handleCreate = async () => {
    if (!formData.description.trim() || !formData.scheduledDate) {
      toast.error("Descrição e data são obrigatórios")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId: resolvedParams.unitId,
          type: formData.type,
          description: formData.description,
          scheduledDate: formData.scheduledDate,
          cost: formData.cost ? parseFloat(formData.cost) : undefined,
          vendor: formData.vendor || undefined,
          notes: formData.notes || undefined,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao criar manutenção")
      }

      toast.success("Manutenção agendada com sucesso!")
      setIsCreateOpen(false)
      resetForm()
      fetchData()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedMaintenance) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/maintenance/${selectedMaintenance.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formData.type,
          description: formData.description,
          scheduledDate: formData.scheduledDate,
          completedDate: formData.completedDate || null,
          cost: formData.cost ? parseFloat(formData.cost) : null,
          vendor: formData.vendor || null,
          notes: formData.notes || null,
          status: formData.status,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao atualizar manutenção")
      }

      toast.success("Manutenção atualizada com sucesso!")
      setIsEditOpen(false)
      setSelectedMaintenance(null)
      resetForm()
      fetchData()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedMaintenance) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/maintenance/${selectedMaintenance.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao excluir manutenção")
      }

      toast.success("Manutenção excluída com sucesso!")
      setIsDeleteOpen(false)
      setSelectedMaintenance(null)
      fetchData()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance)
    setFormData({
      type: maintenance.type,
      description: maintenance.description,
      scheduledDate: maintenance.scheduledDate.split("T")[0],
      cost: maintenance.cost?.toString() || "",
      vendor: maintenance.vendor || "",
      notes: maintenance.notes || "",
      status: maintenance.status,
      completedDate: maintenance.completedDate?.split("T")[0] || "",
    })
    setIsEditOpen(true)
  }

  const openDeleteDialog = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance)
    setIsDeleteOpen(true)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link href={`/equipamentos/${resolvedParams.id}/unidades`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Unidades
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 font-headline tracking-wide">
              Manutenções
            </h1>
            <p className="text-muted-foreground">
              Unidade: <strong>{unit?.serialNumber}</strong> - {unit?.equipment.name}
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Manutenção
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Agendadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {maintenances.filter(m => m.status === "SCHEDULED").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {maintenances.filter(m => m.status === "IN_PROGRESS").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {maintenances.filter(m => m.status === "COMPLETED").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Custo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                maintenances
                  .filter(m => m.status === "COMPLETED")
                  .reduce((sum, m) => sum + (m.cost || 0), 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {maintenances.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Nenhuma manutenção registrada</h3>
              <p className="text-muted-foreground mt-2">
                Agende a primeira manutenção para esta unidade.
              </p>
              <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Manutenção
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data Agendada</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenances.map((maintenance) => {
                  const statusCfg = statusConfig[maintenance.status]
                  const typeCfg = typeConfig[maintenance.type]
                  const StatusIcon = statusCfg.icon

                  return (
                    <TableRow key={maintenance.id}>
                      <TableCell>
                        <Badge className={typeCfg.color}>{typeCfg.label}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{maintenance.description}</TableCell>
                      <TableCell>
                        {format(new Date(maintenance.scheduledDate), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusCfg.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{maintenance.cost ? formatCurrency(maintenance.cost) : "-"}</TableCell>
                      <TableCell>{maintenance.vendor || "-"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(maintenance)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(maintenance)}
                              className="text-red-600"
                              disabled={maintenance.status === "IN_PROGRESS"}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Manutenção</DialogTitle>
            <DialogDescription>Agende uma nova manutenção para esta unidade.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PREVENTIVE">Preventiva</SelectItem>
                    <SelectItem value="CORRECTIVE">Corretiva</SelectItem>
                    <SelectItem value="INSPECTION">Inspeção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Data Agendada *</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva a manutenção a ser realizada..."
                rows={3}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cost">Custo Estimado (R$)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor">Fornecedor/Técnico</Label>
                <Input
                  id="vendor"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="Nome do fornecedor"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações adicionais..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? "Agendando..." : "Agendar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Manutenção</DialogTitle>
            <DialogDescription>Atualize as informações da manutenção.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PREVENTIVE">Preventiva</SelectItem>
                    <SelectItem value="CORRECTIVE">Corretiva</SelectItem>
                    <SelectItem value="INSPECTION">Inspeção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCHEDULED">Agendada</SelectItem>
                    <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                    <SelectItem value="COMPLETED">Concluída</SelectItem>
                    <SelectItem value="CANCELLED">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-scheduledDate">Data Agendada</Label>
                <Input
                  id="edit-scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-completedDate">Data de Conclusão</Label>
                <Input
                  id="edit-completedDate"
                  type="date"
                  value={formData.completedDate}
                  onChange={(e) => setFormData({ ...formData, completedDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-cost">Custo (R$)</Label>
                <Input
                  id="edit-cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-vendor">Fornecedor/Técnico</Label>
                <Input
                  id="edit-vendor"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Observações</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false)
                setSelectedMaintenance(null)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Manutenção</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta manutenção? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteOpen(false)
                setSelectedMaintenance(null)
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
