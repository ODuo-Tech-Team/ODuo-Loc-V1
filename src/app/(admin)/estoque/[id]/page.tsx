"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Package,
  ArrowLeft,
  Plus,
  ArrowUpDown,
  Calendar,
  History,
  AlertTriangle,
  TrendingUp,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  StockLevelBadge,
  StockMovementTable,
  StockMovementForm,
  StockAdjustDialog,
} from "@/components/stock"
import { toast } from "sonner"

interface Equipment {
  id: string
  name: string
  description?: string
  category: string
  images: string[]
  status: string
  pricePerDay: number
  totalStock: number
  availableStock: number
  reservedStock: number
  maintenanceStock: number
  damagedStock: number
  minStockLevel: number
  unitCost?: number
  stockMovements: any[]
  bookingItems: any[]
  costs: any[]
}

interface Metrics {
  utilizationRate: string
  isLowStock: boolean
  totalValue: number | null
}

export default function EstoqueDetailPage() {
  const params = useParams()
  const router = useRouter()
  const equipmentId = params.id as string

  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [movementDialogOpen, setMovementDialogOpen] = useState(false)
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)

  const loadEquipment = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/stock/${equipmentId}`)
      if (res.ok) {
        const data = await res.json()
        setEquipment(data.equipment)
        setMetrics(data.metrics)
      } else if (res.status === 404) {
        toast.error("Equipamento não encontrado")
        router.push("/estoque")
      } else {
        toast.error("Erro ao carregar equipamento")
      }
    } catch (error) {
      console.error("Erro ao carregar equipamento:", error)
      toast.error("Erro ao carregar equipamento")
    } finally {
      setLoading(false)
    }
  }, [equipmentId, router])

  useEffect(() => {
    loadEquipment()
  }, [loadEquipment])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!equipment) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/estoque">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{equipment.name}</h1>
            <p className="text-muted-foreground">
              Gestão de estoque e movimentações
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadEquipment} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button onClick={() => setMovementDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Movimentação
          </Button>
          <Button variant="outline" onClick={() => setAdjustDialogOpen(true)}>
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Ajustar Estoque
          </Button>
        </div>
      </div>

      {/* Equipment Info Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              {equipment.images[0] ? (
                <img
                  src={equipment.images[0]}
                  alt={equipment.name}
                  className="w-48 h-48 rounded-lg object-cover mb-4"
                />
              ) : (
                <div className="w-48 h-48 rounded-lg bg-muted flex items-center justify-center mb-4">
                  <Package className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              <Badge variant="outline" className="mb-2">
                {equipment.category}
              </Badge>
              <h2 className="text-xl font-bold">{equipment.name}</h2>
              {equipment.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {equipment.description}
                </p>
              )}
              <div className="mt-4">
                <StockLevelBadge
                  available={equipment.availableStock}
                  total={equipment.totalStock}
                  minLevel={equipment.minStockLevel}
                  size="lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Resumo do Estoque</CardTitle>
            <CardDescription>
              Visão geral do inventário deste equipamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
                <div className="text-3xl font-bold text-blue-600">
                  {equipment.totalStock}
                </div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950">
                <div className="text-3xl font-bold text-green-600">
                  {equipment.availableStock}
                </div>
                <div className="text-sm text-muted-foreground">Disponível</div>
              </div>
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950">
                <div className="text-3xl font-bold text-amber-600">
                  {equipment.reservedStock}
                </div>
                <div className="text-sm text-muted-foreground">Reservado</div>
              </div>
              <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950">
                <div className="text-3xl font-bold text-orange-600">
                  {equipment.maintenanceStock}
                </div>
                <div className="text-sm text-muted-foreground">Manutenção</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950">
                <div className="text-3xl font-bold text-red-600">
                  {equipment.damagedStock}
                </div>
                <div className="text-sm text-muted-foreground">Avariado</div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-3xl font-bold">
                  {metrics?.utilizationRate || 0}%
                </div>
                <div className="text-sm text-muted-foreground">Taxa de Uso</div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-3xl font-bold">
                  {equipment.minStockLevel}
                </div>
                <div className="text-sm text-muted-foreground">Nível Mínimo</div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-3xl font-bold">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(equipment.pricePerDay)}
                </div>
                <div className="text-sm text-muted-foreground">Preço/Dia</div>
              </div>
            </div>

            {metrics?.isLowStock && (
              <div className="mt-4 p-4 rounded-lg bg-red-100 dark:bg-red-900 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-medium text-red-800 dark:text-red-200">
                    Estoque Baixo
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300">
                    O estoque disponível está abaixo do nível mínimo configurado ({equipment.minStockLevel})
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="movements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="movements" className="gap-2">
            <History className="h-4 w-4" />
            Movimentações
          </TabsTrigger>
          <TabsTrigger value="bookings" className="gap-2">
            <Calendar className="h-4 w-4" />
            Reservas Ativas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
              <CardDescription>
                Últimas movimentações de estoque deste equipamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StockMovementTable
                movements={equipment.stockMovements}
                equipment={{ id: equipment.id, name: equipment.name }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Reservas Ativas</CardTitle>
              <CardDescription>
                Reservas pendentes ou confirmadas com este equipamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {equipment.bookingItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma reserva ativa</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {equipment.bookingItems.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-medium">
                            {item.booking.customer.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            #{item.booking.bookingNumber}
                          </div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">
                          Quantidade
                        </div>
                        <div className="font-medium">{item.quantity}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">
                          Período
                        </div>
                        <div className="text-sm">
                          {format(new Date(item.booking.startDate), "dd/MM", { locale: ptBR })} -{" "}
                          {format(new Date(item.booking.endDate), "dd/MM/yy", { locale: ptBR })}
                        </div>
                      </div>
                      <div>
                        <Badge
                          variant={item.booking.status === "CONFIRMED" ? "default" : "secondary"}
                        >
                          {item.booking.status === "CONFIRMED" ? "Confirmada" : "Pendente"}
                        </Badge>
                      </div>
                      <Link href={`/reservas/${item.booking.id}`}>
                        <Button variant="ghost" size="sm">
                          Ver Reserva
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <StockMovementForm
        equipmentId={equipment.id}
        equipmentName={equipment.name}
        currentStock={{
          available: equipment.availableStock,
          rented: equipment.reservedStock,
          maintenance: equipment.maintenanceStock,
          damaged: equipment.damagedStock,
        }}
        open={movementDialogOpen}
        onOpenChange={setMovementDialogOpen}
        onSuccess={loadEquipment}
      />

      <StockAdjustDialog
        equipmentId={equipment.id}
        equipmentName={equipment.name}
        currentStock={{
          total: equipment.totalStock,
          available: equipment.availableStock,
          rented: equipment.reservedStock,
          maintenance: equipment.maintenanceStock,
          damaged: equipment.damagedStock,
        }}
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
        onSuccess={loadEquipment}
      />
    </div>
  )
}
