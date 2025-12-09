"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
import {
  ArrowLeft,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Loader2,
  Wrench,
  Shield,
  Fuel,
  Package,
  MoreHorizontal,
} from "lucide-react"
import { toast } from "sonner"
import { EquipmentTabs, FinanceiroPageSkeleton } from "@/components/equipment"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"

interface Equipment {
  id: string
  name: string
  category: string
  pricePerDay: number
  pricePerHour: number | null
  purchasePrice: number | null
  purchaseDate: string | null
  status: string
  trackingType: "SERIALIZED" | "QUANTITY"
}

interface Cost {
  id: string
  type: string
  description: string
  amount: number
  date: string
  recurring: boolean
  createdAt: string
}

interface FinancialData {
  equipment: Equipment
  summary: {
    totalRevenue: number
    totalCosts: number
    profit: number
    profitMargin: number
    roi: number
    completedBookings: number
    totalBookings: number
    totalDaysRented: number
  }
  costsByType: Array<{ type: string; total: number }>
  recentCosts: Cost[]
  recentBookings: Array<{
    id: string
    customerName: string
    startDate: string
    endDate: string
    totalPrice: number
    status: string
  }>
  monthlyData: Array<{
    month: string
    revenue: number
    costs: number
    profit: number
  }>
}

const costTypeLabels: Record<string, string> = {
  PURCHASE: "Compra",
  MAINTENANCE: "Manutenção",
  INSURANCE: "Seguro",
  FUEL: "Combustível",
  REPAIR: "Reparo",
  DEPRECIATION: "Depreciação",
  OTHER: "Outros",
}

const costTypeIcons: Record<string, React.ReactNode> = {
  PURCHASE: <Package className="h-4 w-4" />,
  MAINTENANCE: <Wrench className="h-4 w-4" />,
  INSURANCE: <Shield className="h-4 w-4" />,
  FUEL: <Fuel className="h-4 w-4" />,
  REPAIR: <Wrench className="h-4 w-4" />,
  DEPRECIATION: <TrendingDown className="h-4 w-4" />,
  OTHER: <MoreHorizontal className="h-4 w-4" />,
}

export default function EquipmentFinancialPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAddingCost, setIsAddingCost] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [newCost, setNewCost] = useState({
    type: "MAINTENANCE",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    recurring: false,
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/financial/equipment/${id}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        toast.error("Erro ao carregar dados financeiros")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchData()
    }
  }, [id])

  const handleAddCost = async () => {
    if (!newCost.description || !newCost.amount) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    setIsAddingCost(true)
    try {
      const response = await fetch(`/api/equipments/${id}/costs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCost,
          amount: parseFloat(newCost.amount),
        }),
      })

      if (response.ok) {
        toast.success("Custo adicionado com sucesso")
        setIsDialogOpen(false)
        setNewCost({
          type: "MAINTENANCE",
          description: "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
          recurring: false,
        })
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao adicionar custo")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Erro ao adicionar custo")
    } finally {
      setIsAddingCost(false)
    }
  }

  const handleDeleteCost = async () => {
    if (!deleteId) return

    try {
      const response = await fetch(`/api/equipments/${id}/costs/${deleteId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Custo removido com sucesso")
        setDeleteId(null)
        fetchData()
      } else {
        toast.error("Erro ao remover custo")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Erro ao remover custo")
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR")
  }

  if (loading) {
    return <FinanceiroPageSkeleton />
  }

  if (!data) {
    return (
      <div className="p-8">
        <p className="text-center text-muted-foreground">Equipamento não encontrado</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{data.equipment.name}</h1>
          <p className="text-muted-foreground">
            Análise financeira • {data.equipment.category}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <EquipmentTabs equipmentId={id} activeTab="financeiro" trackingType={data.equipment.trackingType} />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {formatCurrency(data.summary.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.summary.completedBookings} reservas completadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Custos Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(data.summary.totalCosts)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.recentCosts.length} registros de custo
            </p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${data.summary.profit >= 0 ? "border-l-blue-500" : "border-l-orange-500"}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lucro/Prejuízo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-2 ${data.summary.profit >= 0 ? "text-blue-500" : "text-orange-500"}`}>
              {data.summary.profit >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              {formatCurrency(data.summary.profit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Margem: {data.summary.profitMargin}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">
              {data.summary.roi}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Preço compra: {data.equipment.purchasePrice ? formatCurrency(data.equipment.purchasePrice) : "Não informado"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Receitas vs Custos (12 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  name="Receitas"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="costs"
                  stroke="#ef4444"
                  name="Custos"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#3b82f6"
                  name="Lucro"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Costs by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Custos por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data.costsByType.map((item) => ({
                  ...item,
                  name: costTypeLabels[item.type] || item.type,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="total" fill="#ef4444" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Costs List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Custos Registrados</CardTitle>
            <CardDescription>
              Histórico de custos deste equipamento
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Custo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Custo</DialogTitle>
                <DialogDescription>
                  Registre um novo custo para este equipamento
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tipo de Custo</Label>
                  <Select
                    value={newCost.type}
                    onValueChange={(value) =>
                      setNewCost({ ...newCost, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(costTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            {costTypeIcons[value]}
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Descrição *</Label>
                  <Input
                    placeholder="Ex: Troca de óleo"
                    value={newCost.description}
                    onChange={(e) =>
                      setNewCost({ ...newCost, description: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={newCost.amount}
                      onChange={(e) =>
                        setNewCost({ ...newCost, amount: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={newCost.date}
                      onChange={(e) =>
                        setNewCost({ ...newCost, date: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={newCost.recurring}
                    onChange={(e) =>
                      setNewCost({ ...newCost, recurring: e.target.checked })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="recurring">Custo recorrente (mensal)</Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleAddCost} disabled={isAddingCost}>
                  {isAddingCost && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentCosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Nenhum custo registrado ainda
                  </TableCell>
                </TableRow>
              ) : (
                data.recentCosts.map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {costTypeIcons[cost.type]}
                        {costTypeLabels[cost.type] || cost.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {cost.description}
                      {cost.recurring && (
                        <Badge variant="secondary" className="ml-2">
                          Recorrente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(cost.date)}</TableCell>
                    <TableCell className="text-right font-medium text-red-500">
                      {formatCurrency(cost.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(cost.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Reservas</CardTitle>
          <CardDescription>
            Reservas recentes deste equipamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Nenhuma reserva encontrada
                  </TableCell>
                </TableRow>
              ) : (
                data.recentBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                      {booking.customerName}
                    </TableCell>
                    <TableCell>
                      {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          booking.status === "COMPLETED"
                            ? "default"
                            : booking.status === "CONFIRMED"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {booking.status === "COMPLETED"
                          ? "Concluída"
                          : booking.status === "CONFIRMED"
                          ? "Confirmada"
                          : booking.status === "PENDING"
                          ? "Pendente"
                          : booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-500">
                      {formatCurrency(booking.totalPrice)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este custo? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCost}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
