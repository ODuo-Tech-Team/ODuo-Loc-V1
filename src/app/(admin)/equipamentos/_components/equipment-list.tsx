"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Trash2, Package, Eye } from "lucide-react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { DataPagination } from "@/components/ui/data-pagination"
import { usePlanLimits } from "@/hooks/usePlanLimits"
import { LimitWarningBanner } from "@/components/plan"
import {
  AdminPageHeader,
  AdminFilterCard,
  StatusBadge,
} from "@/components/admin"
import { useEquipments, useDeleteEquipment } from "@/hooks/useQueries"

import { Equipment } from "@/hooks/useQueries"

interface EquipmentListProps {
  initialData: Equipment[]
}

// Constante movida para fora do componente
const formatPrice = (price: number | null | undefined) => {
  if (price === null || price === undefined) return "-"
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price)
}

// Configuração base dos filtros (estática)
const BASE_FILTER_CONFIG = [
  {
    key: "status",
    label: "Todos Status",
    width: "w-[160px]",
    options: [
      { value: "AVAILABLE", label: "Disponível" },
      { value: "RENTED", label: "Alugado" },
      { value: "MAINTENANCE", label: "Manutenção" },
      { value: "INACTIVE", label: "Inativo" },
    ],
  },
  {
    key: "sortBy",
    label: "Ordenar",
    width: "w-[160px]",
    options: [
      { value: "name", label: "Nome (A-Z)" },
      { value: "category", label: "Categoria" },
      { value: "priceAsc", label: "Menor Preço" },
      { value: "priceDesc", label: "Maior Preço" },
      { value: "newest", label: "Mais Recentes" },
      { value: "oldest", label: "Mais Antigos" },
    ],
  },
]

export default function EquipmentList({ initialData }: EquipmentListProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [equipmentToDelete, setEquipmentToDelete] = useState<string | null>(null)

  // React Query com initialData para hidratação instantânea
  const { data: equipments = initialData, isLoading: loading } = useEquipments({
    initialData,
  })
  const deleteEquipment = useDeleteEquipment()

  // Hook de limites do plano
  const { usage, isNearEquipmentLimit, isAtEquipmentLimit } = usePlanLimits()

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Extrair categorias únicas dos equipamentos (memoizado)
  const categories = useMemo(
    () => [...new Set(equipments.map(eq => eq.category))].sort(),
    [equipments]
  )

  // Filtrar e ordenar equipamentos (memoizado)
  const filteredEquipments = useMemo(() => {
    let filtered = equipments

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (eq) =>
          eq.name.toLowerCase().includes(searchLower) ||
          eq.category.toLowerCase().includes(searchLower)
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((eq) => eq.status === statusFilter)
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((eq) => eq.category === categoryFilter)
    }

    // Ordenação
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "category":
          return a.category.localeCompare(b.category)
        case "priceAsc":
          return (a.pricePerDay || 0) - (b.pricePerDay || 0)
        case "priceDesc":
          return (b.pricePerDay || 0) - (a.pricePerDay || 0)
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        default:
          return 0
      }
    })
  }, [equipments, search, statusFilter, categoryFilter, sortBy])

  // Calcular itens paginados
  const totalItems = filteredEquipments.length
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedEquipments = filteredEquipments.slice(startIndex, startIndex + itemsPerPage)

  // Reset página quando filtro muda
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }, [])

  const handleDelete = useCallback(async () => {
    if (!equipmentToDelete) return

    try {
      await deleteEquipment.mutateAsync(equipmentToDelete)
      toast.success("Equipamento deletado com sucesso!")
      setDeleteDialogOpen(false)
      setEquipmentToDelete(null)
    } catch (error) {
      toast.error("Erro ao deletar equipamento")
    }
  }, [equipmentToDelete, deleteEquipment])

  // Configuração dos filtros (memoizada com categorias dinâmicas)
  const filterConfig = useMemo(() => [
    BASE_FILTER_CONFIG[0],
    {
      key: "category",
      label: "Todas Categorias",
      width: "w-[180px]",
      options: categories.map((cat) => ({ value: cat, label: cat })),
    },
    BASE_FILTER_CONFIG[1],
  ], [categories])

  const handleFilterChange = useCallback((key: string, value: string) => {
    if (key === "status") setStatusFilter(value)
    else if (key === "category") setCategoryFilter(value)
    else if (key === "sortBy") setSortBy(value)
    setCurrentPage(1)
  }, [])

  const handleClearFilters = useCallback(() => {
    setStatusFilter("all")
    setCategoryFilter("all")
    setSortBy("name")
    setSearch("")
    setCurrentPage(1)
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Equipamentos"
        description="Gerencie o catálogo de equipamentos da sua locadora"
        icon={Package}
        iconColor="text-amber-400"
        action={{
          label: "Novo Equipamento",
          href: "/equipamentos/novo",
        }}
      />

      {/* Banner de Limite */}
      {usage && (isNearEquipmentLimit || isAtEquipmentLimit) && (
        <LimitWarningBanner
          type="equipments"
          current={usage.equipments.current}
          max={usage.equipments.max}
          percentage={usage.equipments.percentage}
        />
      )}

      {/* Filters */}
      <AdminFilterCard
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Buscar equipamentos..."
        filters={filterConfig}
        filterValues={{
          status: statusFilter,
          category: categoryFilter,
          sortBy: sortBy,
        }}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {/* Equipment List */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="font-headline tracking-wide">Lista de Equipamentos</CardTitle>
          <CardDescription>
            {filteredEquipments.length} equipamento(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && equipments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : paginatedEquipments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum equipamento encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-zinc-800/50">
                  <TableHead className="w-20">Imagem</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço/Dia</TableHead>
                  <TableHead>Preço/Hora</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEquipments.map((equipment) => (
                  <TableRow
                    key={equipment.id}
                    className="hover:bg-zinc-800/50 transition-colors"
                  >
                    <TableCell>
                      <div className="relative h-14 w-14 rounded-md overflow-hidden bg-zinc-800 flex items-center justify-center">
                        {equipment.images && equipment.images.length > 0 ? (
                          <Image
                            src={equipment.images[0]}
                            alt={equipment.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-zinc-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {equipment.name}
                    </TableCell>
                    <TableCell>{equipment.category}</TableCell>
                    <TableCell>{formatPrice(equipment.pricePerDay)}</TableCell>
                    <TableCell>{formatPrice(equipment.pricePerHour)}</TableCell>
                    <TableCell>{equipment.quantity}</TableCell>
                    <TableCell>
                      <StatusBadge status={equipment.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/equipamentos/${equipment.id}`)}
                          className="hover:bg-zinc-800 hover:text-white transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEquipmentToDelete(equipment.id)
                            setDeleteDialogOpen(true)
                          }}
                          className="text-destructive hover:text-destructive hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar este equipamento? Esta ação não
              pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteEquipment.isPending}
              className="hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteEquipment.isPending}
              className="hover:bg-red-600 transition-colors"
            >
              {deleteEquipment.isPending ? "Deletando..." : "Deletar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
