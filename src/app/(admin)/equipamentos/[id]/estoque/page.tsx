"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import {
  Package,
  Plus,
  ArrowUpDown,
  History,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdminPageHeader, AdminStatsCard, AdminStatsGrid } from "@/components/admin"
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
  StockMovementForm,
  StockAdjustDialog,
  StockLevelBadge,
} from "@/components/stock"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { EquipmentTabs, EstoquePageSkeleton } from "@/components/equipment"

interface Equipment {
  id: string
  name: string
  category: string
  totalStock: number
  availableStock: number
  rentedStock: number // Em locação (não reserva - locadora trabalha com orçamento → locação)
  maintenanceStock: number
  damagedStock: number
  minStockLevel: number
  trackingType: "SERIALIZED" | "QUANTITY"
}

interface StockMovement {
  id: string
  type: string
  fromStatus: string | null
  toStatus: string | null
  quantity: number
  reason: string | null
  notes: string | null
  createdAt: string
  createdBy: {
    name: string
  } | null
}

export default function EquipamentoEstoquePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [movementDialogOpen, setMovementDialogOpen] = useState(false)
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      // Buscar equipamento com dados de estoque
      const [eqRes, movRes] = await Promise.all([
        fetch(`/api/stock/${resolvedParams.id}`),
        fetch(`/api/stock/${resolvedParams.id}/movements?limit=20`),
      ])

      if (eqRes.ok) {
        const data = await eqRes.json()
        // A API retorna { equipment, metrics } - extrair o equipment
        setEquipment(data.equipment || data)
      }

      if (movRes.ok) {
        const data = await movRes.json()
        setMovements(data.movements || [])
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados do estoque")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [resolvedParams.id])

  const getStatusLabel = (status: string | null) => {
    const labels: Record<string, string> = {
      AVAILABLE: "Disponível",
      RENTED: "Em Locação",
      MAINTENANCE: "Manutenção",
      DAMAGED: "Avariado",
    }
    return status ? labels[status] || status : "-"
  }

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ENTRY: "Entrada",
      EXIT: "Saída",
      TRANSFER: "Transferência",
      ADJUSTMENT: "Ajuste",
      RESERVE: "Reserva",
      RETURN: "Devolução",
    }
    return labels[type] || type
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "ENTRY":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "EXIT":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case "TRANSFER":
        return <ArrowUpDown className="h-4 w-4 text-blue-500" />
      default:
        return <History className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return <EstoquePageSkeleton />
  }

  if (!equipment) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Equipamento não encontrado</p>
          <Link href="/equipamentos">
            <Button variant="link">Voltar para equipamentos</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <AdminPageHeader
        title={`Estoque - ${equipment.name}`}
        description="Gerencie o estoque e movimentações deste equipamento"
        icon={Package}
        iconColor="text-amber-400"
        backHref="/equipamentos"
        backLabel="Voltar para Equipamentos"
      />

      {/* Navigation Tabs */}
      <EquipmentTabs equipmentId={resolvedParams.id} activeTab="estoque" trackingType={equipment.trackingType} />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{equipment.totalStock}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disponível</p>
                <p className="text-2xl font-bold text-green-600">
                  {equipment.availableStock}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Locação</p>
                <p className="text-2xl font-bold text-amber-600">
                  {equipment.rentedStock}
                </p>
              </div>
              <Package className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Manutenção</p>
                <p className="text-2xl font-bold text-orange-600">
                  {equipment.maintenanceStock}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avariado</p>
                <p className="text-2xl font-bold text-red-600">
                  {equipment.damagedStock}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions - Apenas para equipamentos com controle por quantidade */}
      {equipment.trackingType === "QUANTITY" && (
        <div className="flex gap-4">
          <Button onClick={() => setMovementDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Movimentação
          </Button>
          <Button variant="outline" onClick={() => setAdjustDialogOpen(true)}>
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Ajustar Estoque
          </Button>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      )}

      {/* Para equipamentos serializados, apenas botão de atualizar */}
      {equipment.trackingType === "SERIALIZED" && (
        <div className="flex gap-4">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Link href={`/equipamentos/${resolvedParams.id}/unidades`}>
            <Button>
              <Package className="h-4 w-4 mr-2" />
              Gerenciar Unidades
            </Button>
          </Link>
        </div>
      )}

      {/* Status do Estoque */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Status do Estoque
            <StockLevelBadge
              available={equipment.availableStock}
              total={equipment.totalStock}
              minLevel={equipment.minStockLevel}
            />
          </CardTitle>
          <CardDescription>
            Nível mínimo configurado: {equipment.minStockLevel} unidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          {equipment.totalStock === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">
                Nenhuma unidade cadastrada ainda. Cadastre as unidades na aba "Unidades/Serial".
              </p>
              <Link href={`/equipamentos/${resolvedParams.id}/unidades`}>
                <Button variant="outline" className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Unidades
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div className="flex h-full">
                  <div
                    className="bg-green-500 h-full"
                    style={{
                      width: `${(equipment.availableStock / equipment.totalStock) * 100}%`,
                    }}
                    title={`Disponível: ${equipment.availableStock}`}
                  />
                  <div
                    className="bg-amber-500 h-full"
                    style={{
                      width: `${(equipment.rentedStock / equipment.totalStock) * 100}%`,
                    }}
                    title={`Em Locação: ${equipment.rentedStock}`}
                  />
                  <div
                    className="bg-orange-500 h-full"
                    style={{
                      width: `${(equipment.maintenanceStock / equipment.totalStock) * 100}%`,
                    }}
                    title={`Manutenção: ${equipment.maintenanceStock}`}
                  />
                  <div
                    className="bg-red-500 h-full"
                    style={{
                      width: `${(equipment.damagedStock / equipment.totalStock) * 100}%`,
                    }}
                    title={`Avariado: ${equipment.damagedStock}`}
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded" /> Disponível
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-amber-500 rounded" /> Em Locação
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-orange-500 rounded" /> Manutenção
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded" /> Avariado
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Movimentações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Movimentações Recentes
          </CardTitle>
          <CardDescription>
            Últimas 20 movimentações deste equipamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma movimentação registrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>De</TableHead>
                  <TableHead>Para</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Usuário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="text-sm">
                      {format(new Date(movement.createdAt), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMovementIcon(movement.type)}
                        <span>{getMovementTypeLabel(movement.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getStatusLabel(movement.fromStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getStatusLabel(movement.toStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {movement.quantity}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {movement.reason || movement.notes || "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {movement.createdBy?.name || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs - Apenas para equipamentos com controle por quantidade */}
      {equipment.trackingType === "QUANTITY" && (
        <>
          <StockMovementForm
            equipmentId={equipment.id}
            equipmentName={equipment.name}
            currentStock={{
              available: equipment.availableStock,
              rented: equipment.rentedStock,
              maintenance: equipment.maintenanceStock,
              damaged: equipment.damagedStock,
            }}
            open={movementDialogOpen}
            onOpenChange={setMovementDialogOpen}
            onSuccess={fetchData}
          />

          <StockAdjustDialog
            equipmentId={equipment.id}
            equipmentName={equipment.name}
            currentStock={{
              total: equipment.totalStock,
              available: equipment.availableStock,
              rented: equipment.rentedStock,
              maintenance: equipment.maintenanceStock,
              damaged: equipment.damagedStock,
            }}
            open={adjustDialogOpen}
            onOpenChange={setAdjustDialogOpen}
            onSuccess={fetchData}
          />
        </>
      )}
    </div>
  )
}
