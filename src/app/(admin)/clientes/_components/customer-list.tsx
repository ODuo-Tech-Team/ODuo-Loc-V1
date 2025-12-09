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
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Users, Edit, Trash2, Mail, Phone } from "lucide-react"
import { DataPagination } from "@/components/ui/data-pagination"
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
  AdminPageHeader,
  AdminFilterCard,
} from "@/components/admin"
import { toast } from "sonner"
import { useCustomers, useToggleCustomerStatus, useDeleteCustomer, Customer } from "@/hooks/useQueries"

interface CustomerListProps {
  initialData: Customer[]
}

export default function CustomerList({ initialData }: CustomerListProps) {
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // React Query com initialData para hidratação instantânea
  const { data: customers = initialData, isLoading: loading } = useCustomers({
    search,
    status: statusFilter,
    initialData,
  })
  const toggleStatus = useToggleCustomerStatus()
  const deleteCustomer = useDeleteCustomer()

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Calcular itens paginados
  const totalItems = customers.length
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCustomers = customers.slice(startIndex, startIndex + itemsPerPage)

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }, [])

  const handleToggleStatus = useCallback(async (customerId: string, currentStatus: boolean) => {
    setTogglingId(customerId)
    try {
      await toggleStatus.mutateAsync({ customerId, currentStatus })
      toast.success(currentStatus ? "Cliente desativado" : "Cliente ativado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar status")
    } finally {
      setTogglingId(null)
    }
  }, [toggleStatus])

  const handleDelete = useCallback(async () => {
    if (!deleteId) return

    try {
      await deleteCustomer.mutateAsync(deleteId)
      toast.success("Cliente excluído com sucesso")
      setDeleteId(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir cliente")
    }
  }, [deleteId, deleteCustomer])

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
        title="Clientes"
        description="Gerencie seus clientes cadastrados"
        icon={Users}
        iconColor="text-emerald-400"
        action={{
          label: "Novo Cliente",
          href: "/clientes/novo",
        }}
      />

      {/* Filters */}
      <AdminFilterCard
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Buscar por nome, email, telefone ou CPF/CNPJ..."
        filters={[
          {
            key: "status",
            label: "Status",
            placeholder: "Todos os status",
            options: [
              { value: "active", label: "Ativos" },
              { value: "inactive", label: "Inativos" },
            ],
            width: "w-[150px]",
          },
        ]}
        filterValues={{ status: statusFilter }}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {/* Customers Table */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="font-headline tracking-wide">
            {loading && customers.length === 0 ? "Carregando..." : `${customers.length} clientes`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-zinc-800">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-zinc-800/50 border-zinc-800">
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead className="text-center">Reservas</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Carregando clientes...
                    </TableCell>
                  </TableRow>
                ) : paginatedCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Nenhum cliente encontrado.
                      <br />
                      <Link href="/clientes/novo">
                        <Button variant="link" className="mt-2">
                          Cadastrar primeiro cliente
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCustomers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="hover:bg-zinc-800/50 transition-colors border-zinc-800"
                    >
                      <TableCell>
                        <div className="font-medium">{customer.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          {customer.email && (
                            <div className="flex items-center gap-1 text-zinc-400">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-zinc-400">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {customer.cpfCnpj || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-zinc-400">
                          {customer.city && customer.state
                            ? `${customer.city}, ${customer.state}`
                            : customer.city || customer.state || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className="bg-zinc-800 text-zinc-300"
                        >
                          {customer._count.bookings}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={customer.isActive}
                            onCheckedChange={() => handleToggleStatus(customer.id, customer.isActive)}
                            disabled={togglingId === customer.id}
                            className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-500"
                          />
                          <span className={`text-xs ${customer.isActive ? "text-emerald-400" : "text-red-400"}`}>
                            {customer.isActive ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/clientes/${customer.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-zinc-800 hover:text-white transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(customer.id)}
                            className="text-destructive hover:text-destructive hover:bg-red-500/10 transition-colors"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode
              ser desfeita. Clientes com reservas não podem ser excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:bg-zinc-800">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-red-600 transition-colors"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
