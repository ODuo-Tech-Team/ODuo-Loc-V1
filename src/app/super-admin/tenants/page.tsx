"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Building2,
  Search,
  Plus,
  MoreHorizontal,
  Trash2,
  Eye,
  Power,
  PowerOff,
  Loader2,
  Users,
  Package,
  Calendar,
} from "lucide-react"
import {
  useTenants,
  useToggleTenantStatus,
  useCreateTenant,
  useDeleteTenant,
  Tenant,
} from "@/hooks/useSuperAdminQueries"

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function TenantsPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)

  // React Query hooks
  const { data, isLoading: loading } = useTenants({ search, status: statusFilter, page })
  const toggleStatus = useToggleTenantStatus()
  const createTenant = useCreateTenant()
  const deleteTenant = useDeleteTenant()

  const tenants = data?.tenants || []
  const pagination = data?.pagination

  // Modal de novo tenant
  const [createOpen, setCreateOpen] = useState(false)
  const [newTenant, setNewTenant] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    address: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  })

  // Modal de delete
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null)

  const handleCreateTenant = useCallback(async () => {
    if (!newTenant.name || !newTenant.slug || !newTenant.email || !newTenant.phone) {
      toast.error("Preencha todos os campos obrigatórios do tenant")
      return
    }

    const hasAdminData = newTenant.adminName || newTenant.adminEmail || newTenant.adminPassword
    if (hasAdminData) {
      if (!newTenant.adminName || !newTenant.adminEmail || !newTenant.adminPassword) {
        toast.error("Preencha todos os campos do administrador ou deixe-os em branco")
        return
      }
      if (newTenant.adminPassword.length < 8) {
        toast.error("A senha do admin deve ter pelo menos 8 caracteres")
        return
      }
    }

    try {
      const result = await createTenant.mutateAsync(newTenant)
      if (result.admin) {
        toast.success(`Tenant e admin "${result.admin.email}" criados com sucesso!`)
      } else {
        toast.success("Tenant criado com sucesso!")
      }
      setCreateOpen(false)
      setNewTenant({
        name: "",
        slug: "",
        email: "",
        phone: "",
        address: "",
        adminName: "",
        adminEmail: "",
        adminPassword: "",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar tenant"
      toast.error(message)
    }
  }, [newTenant, createTenant])

  const handleToggleStatus = useCallback(async (tenant: Tenant) => {
    try {
      await toggleStatus.mutateAsync({ tenantId: tenant.id, active: !tenant.active })
      toast.success(tenant.active ? "Tenant desativado" : "Tenant ativado")
    } catch (error) {
      toast.error("Erro ao atualizar status")
    }
  }, [toggleStatus])

  const handleDeleteTenant = useCallback(async () => {
    if (!tenantToDelete) return

    try {
      await deleteTenant.mutateAsync(tenantToDelete.id)
      toast.success("Tenant deletado com sucesso")
      setDeleteOpen(false)
      setTenantToDelete(null)
    } catch (error) {
      toast.error("Erro ao deletar tenant")
    }
  }, [tenantToDelete, deleteTenant])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Tenants</h1>
          <p className="text-gray-400 mt-1">
            Gerencie todas as locadoras do sistema
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-red-500 hover:bg-red-600">
          <Plus className="mr-2 h-4 w-4" />
          Novo Tenant
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, email ou slug..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10 bg-white/5 border-white/10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Lista de Tenants</CardTitle>
          <CardDescription>
            {pagination?.total || 0} tenant(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-red-500" />
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Nenhum tenant encontrado
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-gray-400">Tenant</TableHead>
                    <TableHead className="text-gray-400">Contato</TableHead>
                    <TableHead className="text-gray-400 text-center">Métricas</TableHead>
                    <TableHead className="text-gray-400 text-right">Receita</TableHead>
                    <TableHead className="text-gray-400 text-center">Status</TableHead>
                    <TableHead className="text-gray-400 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant.id} className="border-white/5">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{tenant.name}</p>
                            <p className="text-xs text-gray-500">/{tenant.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-white">{tenant.email}</p>
                        <p className="text-xs text-gray-500">{tenant.phone}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {tenant._count.users}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {tenant._count.equipments}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {tenant._count.bookings}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="text-sm font-medium text-emerald-400">
                          {formatCurrency(tenant.totalRevenue)}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={
                            tenant.active
                              ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                              : "text-red-400 border-red-400/30 bg-red-400/10"
                          }
                        >
                          {tenant.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => router.push(`/super-admin/tenants/${tenant.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(tenant)}>
                              {tenant.active ? (
                                <>
                                  <PowerOff className="h-4 w-4 mr-2" />
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <Power className="h-4 w-4 mr-2" />
                                  Ativar
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-500"
                              onClick={() => {
                                setTenantToDelete(tenant)
                                setDeleteOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deletar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-400">
                    Página {pagination.page} de {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === pagination.totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Tenant Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Tenant</DialogTitle>
            <DialogDescription>
              Crie uma nova locadora no sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-gray-400 uppercase tracking-wide">Dados da Locadora</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Locadora *</Label>
                  <Input
                    placeholder="Ex: Locadora ABC"
                    value={newTenant.name}
                    onChange={(e) => {
                      setNewTenant({
                        ...newTenant,
                        name: e.target.value,
                        slug: generateSlug(e.target.value),
                      })
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Slug (URL) *</Label>
                  <Input
                    placeholder="locadora-abc"
                    value={newTenant.slug}
                    onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email da Empresa *</Label>
                  <Input
                    type="email"
                    placeholder="contato@locadora.com"
                    value={newTenant.email}
                    onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Telefone *</Label>
                  <Input
                    placeholder="(11) 99999-9999"
                    value={newTenant.phone}
                    onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input
                  placeholder="Rua, número, cidade"
                  value={newTenant.address}
                  onChange={(e) => setNewTenant({ ...newTenant, address: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/10">
              <h4 className="font-medium text-sm text-gray-400 uppercase tracking-wide">
                Administrador (opcional)
              </h4>
              <p className="text-xs text-gray-500">
                Crie um usuário administrador para acessar o painel da locadora
              </p>

              <div className="space-y-2">
                <Label>Nome do Admin</Label>
                <Input
                  placeholder="Ex: João Silva"
                  value={newTenant.adminName}
                  onChange={(e) => setNewTenant({ ...newTenant, adminName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email do Admin</Label>
                  <Input
                    type="email"
                    placeholder="admin@locadora.com"
                    value={newTenant.adminEmail}
                    onChange={(e) => setNewTenant({ ...newTenant, adminEmail: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Senha do Admin</Label>
                  <Input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newTenant.adminPassword}
                    onChange={(e) => setNewTenant({ ...newTenant, adminPassword: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTenant} disabled={createTenant.isPending}>
              {createTenant.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Tenant"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-500">Deletar Tenant</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar o tenant "{tenantToDelete?.name}"?
              <br />
              <strong className="text-red-400">
                Esta ação é irreversível e deletará todos os dados associados.
              </strong>
            </DialogDescription>
          </DialogHeader>

          {tenantToDelete && (
            <div className="py-4 space-y-2 text-sm text-gray-400">
              <p>Serão deletados:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>{tenantToDelete._count.users} usuários</li>
                <li>{tenantToDelete._count.equipments} equipamentos</li>
                <li>{tenantToDelete._count.bookings} reservas</li>
                <li>{tenantToDelete._count.customers} clientes</li>
              </ul>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTenant}
              disabled={deleteTenant.isPending}
            >
              {deleteTenant.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                "Deletar Permanentemente"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
