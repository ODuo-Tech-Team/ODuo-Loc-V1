"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import {
  Wrench,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Loader2,
  RefreshCw,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdminPageHeader } from "@/components/admin"
import { Badge } from "@/components/ui/badge"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { EquipmentTabs, ManutencaoPageSkeleton } from "@/components/equipment"

interface Equipment {
  id: string
  name: string
  units: {
    id: string
    serialNumber: string
    internalCode: string | null
    status: string
  }[]
}

interface Maintenance {
  id: string
  type: string
  description: string
  scheduledDate: string
  completedDate: string | null
  status: string
  cost: number | null
  vendor: string | null
  notes: string | null
  unit: {
    id: string
    serialNumber: string
    internalCode: string | null
  }
}

export default function EquipamentoManutencaoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [maintenances, setMaintenances] = useState<Maintenance[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [unitFilter, setUnitFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    unitId: "",
    type: "PREVENTIVE",
    description: "",
    scheduledDate: "",
    cost: "",
    vendor: "",
    notes: "",
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      // Buscar equipamento com unidades
      const eqRes = await fetch(`/api/equipments/${resolvedParams.id}?includeUnits=true`)
      if (eqRes.ok) {
        const data = await eqRes.json()
        setEquipment(data)
      }

      // Buscar manutenções de todas as unidades deste equipamento
      const params = new URLSearchParams()
      params.append("equipmentId", resolvedParams.id)
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }

      const maintRes = await fetch(`/api/maintenance?${params}`)
      if (maintRes.ok) {
        const data = await maintRes.json()
        setMaintenances(data.maintenances || [])
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [resolvedParams.id, statusFilter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.unitId || !formData.description || !formData.scheduledDate) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId: formData.unitId,
          type: formData.type,
          description: formData.description,
          scheduledDate: formData.scheduledDate,
          cost: formData.cost ? parseFloat(formData.cost) : null,
          vendor: formData.vendor || null,
          notes: formData.notes || null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao criar manutenção")
      }

      toast.success("Manutenção agendada com sucesso!")
      setDialogOpen(false)
      setFormData({
        unitId: "",
        type: "PREVENTIVE",
        description: "",
        scheduledDate: "",
        cost: "",
        vendor: "",
        notes: "",
      })
      fetchData()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      SCHEDULED: { label: "Agendada", variant: "secondary" },
      IN_PROGRESS: { label: "Em Andamento", variant: "default" },
      COMPLETED: { label: "Concluída", variant: "outline" },
      CANCELLED: { label: "Cancelada", variant: "destructive" },
    }
    const { label, variant } = config[status] || { label: status, variant: "outline" }
    return <Badge variant={variant}>{label}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const config: Record<string, { label: string; color: string }> = {
      PREVENTIVE: { label: "Preventiva", color: "bg-blue-100 text-blue-800" },
      CORRECTIVE: { label: "Corretiva", color: "bg-red-100 text-red-800" },
      INSPECTION: { label: "Inspeção", color: "bg-green-100 text-green-800" },
    }
    const { label, color } = config[type] || { label: type, color: "bg-gray-100 text-gray-800" }
    return <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>{label}</span>
  }

  // Filtrar manutenções no frontend
  const filteredMaintenances = maintenances.filter((m) => {
    if (typeFilter !== "all" && m.type !== typeFilter) return false
    if (unitFilter !== "all" && m.unit.id !== unitFilter) return false
    return true
  })

  // Estatísticas
  const stats = {
    total: maintenances.length,
    scheduled: maintenances.filter(m => m.status === "SCHEDULED").length,
    inProgress: maintenances.filter(m => m.status === "IN_PROGRESS").length,
    completed: maintenances.filter(m => m.status === "COMPLETED").length,
  }

  if (loading && !equipment) {
    return <ManutencaoPageSkeleton />
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <AdminPageHeader
        title={`Manutenção - ${equipment?.name}`}
        description="Gerencie as manutenções de todas as unidades deste equipamento"
        icon={Wrench}
        iconColor="text-orange-400"
        backHref="/equipamentos"
        backLabel="Voltar para Equipamentos"
      />

      {/* Navigation Tabs */}
      <EquipmentTabs equipmentId={resolvedParams.id} activeTab="manutencao" />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Wrench className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Agendadas</p>
                <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold text-amber-600">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions & Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4 items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-zinc-900/50 border-zinc-800">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="SCHEDULED">Agendadas</SelectItem>
              <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
              <SelectItem value="COMPLETED">Concluídas</SelectItem>
              <SelectItem value="CANCELLED">Canceladas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px] bg-zinc-900/50 border-zinc-800">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Tipos</SelectItem>
              <SelectItem value="PREVENTIVE">Preventiva</SelectItem>
              <SelectItem value="CORRECTIVE">Corretiva</SelectItem>
              <SelectItem value="INSPECTION">Inspeção</SelectItem>
            </SelectContent>
          </Select>

          <Select value={unitFilter} onValueChange={setUnitFilter}>
            <SelectTrigger className="w-[180px] bg-zinc-900/50 border-zinc-800">
              <SelectValue placeholder="Unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Unidades</SelectItem>
              {equipment?.units?.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.serialNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex-1" />

          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setDialogOpen(true)} disabled={!equipment?.units?.length}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Manutenção
          </Button>
        </div>
      </div>

      {/* Aviso se não tem unidades */}
      {equipment && equipment.units?.length === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="font-medium">Nenhuma unidade cadastrada</p>
                <p className="text-sm text-muted-foreground">
                  Para agendar manutenções, primeiro cadastre unidades com número de série.
                </p>
                <Link href={`/equipamentos/${resolvedParams.id}/unidades`}>
                  <Button variant="link" className="px-0 mt-2">
                    Cadastrar unidades
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Manutenções */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Manutenções
          </CardTitle>
          <CardDescription>
            Lista de manutenções agendadas e realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMaintenances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{maintenances.length === 0 ? "Nenhuma manutenção encontrada" : "Nenhuma manutenção encontrada com os filtros selecionados"}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data Agendada</TableHead>
                  <TableHead>Data Conclusão</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaintenances.map((maintenance) => (
                  <TableRow key={maintenance.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{maintenance.unit.serialNumber}</div>
                        {maintenance.unit.internalCode && (
                          <div className="text-xs text-muted-foreground">
                            {maintenance.unit.internalCode}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(maintenance.type)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {maintenance.description}
                    </TableCell>
                    <TableCell>
                      {format(new Date(maintenance.scheduledDate), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      {maintenance.completedDate
                        ? format(new Date(maintenance.completedDate), "dd/MM/yyyy", {
                            locale: ptBR,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {maintenance.cost
                        ? new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(maintenance.cost)
                        : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(maintenance.status)}</TableCell>
                    <TableCell>
                      <Link
                        href={`/equipamentos/${resolvedParams.id}/unidades/${maintenance.unit.id}/manutencao`}
                      >
                        <Button variant="ghost" size="sm">
                          Ver Detalhes
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Nova Manutenção */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Manutenção</DialogTitle>
            <DialogDescription>
              Agende uma manutenção para uma unidade deste equipamento
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unitId">Unidade *</Label>
              <Select
                value={formData.unitId}
                onValueChange={(value) => setFormData({ ...formData, unitId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {equipment?.units?.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.serialNumber}
                      {unit.internalCode && ` (${unit.internalCode})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o serviço a ser realizado"
                rows={3}
              />
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

            <div className="grid grid-cols-2 gap-4">
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
                  placeholder="Nome do prestador"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações adicionais"
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Agendar Manutenção"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
