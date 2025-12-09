"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
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
import { Calendar, Eye, Trash2, User, Package, XCircle } from "lucide-react"
import { DataPagination } from "@/components/ui/data-pagination"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { usePlanLimits } from "@/hooks/usePlanLimits"
import { LimitWarningBanner } from "@/components/plan"
import {
  AdminPageHeader,
  AdminFilterCard,
  StatusBadge,
} from "@/components/admin"
import { useBookings, useMarkBookingAsLost, useDeleteBooking, Booking } from "@/hooks/useQueries"

// Constantes movidas para fora do componente
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("pt-BR")
}

// Configuração estática dos filtros
const FILTER_CONFIG = [
  {
    key: "status",
    label: "Todos Status",
    width: "w-[180px]",
    options: [
      { value: "PENDING", label: "Pendente" },
      { value: "CONFIRMED", label: "Confirmado" },
      { value: "COMPLETED", label: "Concluído" },
      { value: "CANCELLED", label: "Cancelado" },
    ],
  },
]

interface BookingListProps {
  initialData: Booking[]
}

export default function BookingList({ initialData }: BookingListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // React Query com initialData para hidratação instantânea
  const { data: bookings = initialData, isLoading: loading } = useBookings({
    status: statusFilter,
    initialData,
  })
  const markAsLost = useMarkBookingAsLost()
  const deleteBooking = useDeleteBooking()

  // Hook de limites do plano
  const { usage, isNearBookingLimit, isAtBookingLimit } = usePlanLimits()

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Calcular itens paginados
  const totalItems = bookings.length
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedBookings = bookings.slice(startIndex, startIndex + itemsPerPage)

  const handleMarkAsLost = useCallback(async () => {
    if (!deleteId) return

    try {
      await markAsLost.mutateAsync(deleteId)
      setDeleteId(null)
      toast.success("Orçamento marcado como perdido")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao marcar como perdido")
    }
  }, [deleteId, markAsLost])

  const handleDeletePermanently = useCallback(async () => {
    if (!deleteId) return

    try {
      await deleteBooking.mutateAsync(deleteId)
      setDeleteId(null)
      toast.success("Orçamento excluído permanentemente")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir orçamento")
    }
  }, [deleteId, deleteBooking])

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }, [])

  const handleFilterChange = useCallback((key: string, value: string) => {
    if (key === "status") {
      setStatusFilter(value)
      setCurrentPage(1)
    }
  }, [])

  const handleClearFilters = useCallback(() => {
    setStatusFilter("all")
    setSearch("")
    setCurrentPage(1)
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Orçamentos"
        description="Gerencie todos os orçamentos de locação"
        icon={Calendar}
        iconColor="text-purple-400"
        action={{
          label: "Novo Orçamento",
          href: "/reservas/novo",
        }}
      />

      {/* Banner de Limite */}
      {usage && (isNearBookingLimit || isAtBookingLimit) && (
        <LimitWarningBanner
          type="bookings"
          current={usage.bookingsThisMonth.current}
          max={usage.bookingsThisMonth.max}
          percentage={usage.bookingsThisMonth.percentage}
        />
      )}

      {/* Filters */}
      <AdminFilterCard
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Buscar por cliente ou equipamento..."
        filters={FILTER_CONFIG}
        filterValues={{ status: statusFilter }}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {/* Bookings Table */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="font-headline tracking-wide">
            {loading && bookings.length === 0 ? "Carregando..." : `${bookings.length} orçamentos`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-zinc-800">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-zinc-800/50 border-zinc-800">
                  <TableHead>Cliente</TableHead>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Carregando reservas...
                    </TableCell>
                  </TableRow>
                ) : paginatedBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Nenhum orçamento encontrado.
                      <br />
                      <Link href="/reservas/novo">
                        <Button variant="link" className="mt-2">
                          Criar primeiro orçamento
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedBookings.map((booking) => (
                    <TableRow
                      key={booking.id}
                      className="hover:bg-zinc-800/50 transition-colors border-zinc-800"
                    >
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 mt-1 text-zinc-500" />
                          <div>
                            <div className="font-medium">
                              {booking.customer.name}
                            </div>
                            <div className="text-sm text-zinc-400">
                              {booking.customer.phone}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <Package className="h-4 w-4 mt-1 text-zinc-500" />
                          <div>
                            <div className="font-medium">
                              {booking.equipment.name}
                            </div>
                            <div className="text-sm text-zinc-400">
                              {booking.equipment.category}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 mt-1 text-zinc-500" />
                          <div className="text-sm">
                            <div>{formatDate(booking.startDate)}</div>
                            <div className="text-zinc-400">
                              até {formatDate(booking.endDate)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-emerald-400">
                          {formatCurrency(booking.totalPrice)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={booking.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/reservas/${booking.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-zinc-800 hover:text-white transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteId(booking.id)}
                            className="hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

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

      {/* Delete/Mark as Lost Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>O que deseja fazer com este orçamento?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">Escolha uma das opções abaixo:</span>
              <span className="block text-amber-400/80 text-xs">
                • Marcar como Perdido: mantém o registro para histórico
              </span>
              <span className="block text-red-400/80 text-xs">
                • Excluir Permanentemente: remove completamente do sistema
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="hover:bg-zinc-800">
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={handleMarkAsLost}
              className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 gap-2"
            >
              <XCircle className="h-4 w-4" />
              Marcar como Perdido
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePermanently}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Excluir Permanentemente
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
