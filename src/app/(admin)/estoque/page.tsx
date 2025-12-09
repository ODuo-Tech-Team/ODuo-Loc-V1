"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Package,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  ArrowUpDown,
  Eye,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  StockOverviewCard,
  StockLevelBadge,
  StockMovementForm,
  StockAdjustDialog,
} from "@/components/stock"
import { toast } from "sonner"
import { DataPagination } from "@/components/ui/data-pagination"

interface Equipment {
  id: string
  name: string
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
  _count: {
    stockMovements: number
    bookingItems: number
  }
}

interface StockStats {
  totalEquipments: number
  totalStock: number
  totalAvailable: number
  totalReserved: number
  totalMaintenance: number
  totalDamaged: number
  lowStockCount: number
}

export default function EstoquePage() {
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [stats, setStats] = useState<StockStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [showLowStock, setShowLowStock] = useState(false)

  // Dialog states
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [movementDialogOpen, setMovementDialogOpen] = useState(false)
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Calcular itens paginados
  const totalItems = equipments.length
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedEquipments = equipments.slice(startIndex, startIndex + itemsPerPage)

  const loadStock = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (categoryFilter !== "all") params.append("category", categoryFilter)
      if (showLowStock) params.append("lowStock", "true")

      const res = await fetch(`/api/stock?${params}`)
      if (res.ok) {
        const data = await res.json()
        setEquipments(data.equipments || [])
        setStats(data.stats || null)
      } else {
        toast.error("Erro ao carregar estoque")
      }
    } catch (error) {
      console.error("Erro ao carregar estoque:", error)
      toast.error("Erro ao carregar estoque")
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter, showLowStock])

  useEffect(() => {
    loadStock()
    setCurrentPage(1) // Reset para página 1 quando filtros mudam
  }, [loadStock])

  // Extrair categorias únicas
  const categories = Array.from(new Set(equipments.map(eq => eq.category))).filter(Boolean)

  const openMovementDialog = (equipment: Equipment) => {
    setSelectedEquipment(equipment)
    setMovementDialogOpen(true)
  }

  const openAdjustDialog = (equipment: Equipment) => {
    setSelectedEquipment(equipment)
    setAdjustDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Estoque</h1>
          <p className="text-muted-foreground">
            Controle de inventário e movimentações
          </p>
        </div>
        <Button onClick={loadStock} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && <StockOverviewCard stats={stats} />}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar equipamento..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={showLowStock ? "default" : "outline"}
              onClick={() => setShowLowStock(!showLowStock)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Estoque Baixo
              {stats?.lowStockCount && stats.lowStockCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {stats.lowStockCount}
                </Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Equipamentos ({equipments.length})
          </CardTitle>
          <CardDescription>
            Lista de equipamentos com informações de estoque
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : paginatedEquipments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum equipamento encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Disponível</TableHead>
                  <TableHead className="text-center">Reservado</TableHead>
                  <TableHead className="text-center">Manutenção</TableHead>
                  <TableHead className="text-center">Avariado</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEquipments.map((equipment) => (
                  <TableRow key={equipment.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {equipment.images[0] ? (
                          <img
                            src={equipment.images[0]}
                            alt={equipment.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{equipment.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {equipment._count.bookingItems} reservas
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{equipment.category}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {equipment.totalStock}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-green-600 font-medium">
                        {equipment.availableStock}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-amber-600 font-medium">
                        {equipment.reservedStock}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-orange-600 font-medium">
                        {equipment.maintenanceStock}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-red-600 font-medium">
                        {equipment.damagedStock}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <StockLevelBadge
                        available={equipment.availableStock}
                        total={equipment.totalStock}
                        minLevel={equipment.minStockLevel}
                        showNumbers={false}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openMovementDialog(equipment)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openAdjustDialog(equipment)}
                        >
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                        <Link href={`/estoque/${equipment.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Paginação */}
          <DataPagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      {selectedEquipment && (
        <>
          <StockMovementForm
            equipmentId={selectedEquipment.id}
            equipmentName={selectedEquipment.name}
            currentStock={{
              available: selectedEquipment.availableStock,
              rented: selectedEquipment.reservedStock,
              maintenance: selectedEquipment.maintenanceStock,
              damaged: selectedEquipment.damagedStock,
            }}
            open={movementDialogOpen}
            onOpenChange={setMovementDialogOpen}
            onSuccess={loadStock}
          />

          <StockAdjustDialog
            equipmentId={selectedEquipment.id}
            equipmentName={selectedEquipment.name}
            currentStock={{
              total: selectedEquipment.totalStock,
              available: selectedEquipment.availableStock,
              rented: selectedEquipment.reservedStock,
              maintenance: selectedEquipment.maintenanceStock,
              damaged: selectedEquipment.damagedStock,
            }}
            open={adjustDialogOpen}
            onOpenChange={setAdjustDialogOpen}
            onSuccess={loadStock}
          />
        </>
      )}
    </div>
  )
}
