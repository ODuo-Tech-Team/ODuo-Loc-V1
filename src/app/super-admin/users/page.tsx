"use client"

import { useEffect, useState } from "react"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Shield,
  Building2,
  Loader2,
  Key,
} from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  tenant: {
    id: string
    name: string
    slug: string
  }
}

interface Tenant {
  id: string
  name: string
  slug: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Gerente",
  OPERATOR: "Operador",
  VIEWER: "Visualizador",
}

const roleColors: Record<string, string> = {
  SUPER_ADMIN: "text-red-400 border-red-400/30 bg-red-400/10",
  ADMIN: "text-purple-400 border-purple-400/30 bg-purple-400/10",
  MANAGER: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  OPERATOR: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  VIEWER: "text-gray-400 border-gray-400/30 bg-gray-400/10",
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [page, setPage] = useState(1)

  // Modal de novo usuário
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "ADMIN",
    tenantId: "",
  })

  // Modal de delete
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Modal de editar
  const [editOpen, setEditOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  })
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    fetchUsers()
    fetchTenants()
  }, [search, roleFilter, page])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      })

      if (search) params.set("search", search)
      if (roleFilter !== "all") params.set("role", roleFilter)

      const response = await fetch(`/api/super-admin/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
      toast.error("Erro ao carregar usuários")
    } finally {
      setLoading(false)
    }
  }

  const fetchTenants = async () => {
    try {
      const response = await fetch("/api/super-admin/tenants?limit=100")
      if (response.ok) {
        const data = await response.json()
        setTenants(data.tenants)
      }
    } catch (error) {
      console.error("Erro ao buscar tenants:", error)
    }
  }

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    if (newUser.role !== "SUPER_ADMIN" && !newUser.tenantId) {
      toast.error("Selecione um tenant para usuários não Super Admin")
      return
    }

    setCreating(true)
    try {
      const response = await fetch("/api/super-admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      toast.success("Usuário criado com sucesso!")
      setCreateOpen(false)
      setNewUser({ name: "", email: "", password: "", role: "ADMIN", tenantId: "" })
      fetchUsers()
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar usuário")
    } finally {
      setCreating(false)
    }
  }

  const handleEditUser = async () => {
    if (!userToEdit) return

    setEditing(true)
    try {
      const payload: any = {}
      if (editData.name) payload.name = editData.name
      if (editData.email) payload.email = editData.email
      if (editData.password) payload.password = editData.password
      if (editData.role) payload.role = editData.role

      const response = await fetch(`/api/super-admin/users/${userToEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Erro ao atualizar")

      toast.success("Usuário atualizado com sucesso!")
      setEditOpen(false)
      setUserToEdit(null)
      fetchUsers()
    } catch (error) {
      toast.error("Erro ao atualizar usuário")
    } finally {
      setEditing(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/super-admin/users/${userToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      toast.success("Usuário deletado com sucesso")
      setDeleteOpen(false)
      setUserToDelete(null)
      fetchUsers()
    } catch (error: any) {
      toast.error(error.message || "Erro ao deletar usuário")
    } finally {
      setDeleting(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR")
  }

  const openEditModal = (user: User) => {
    setUserToEdit(user)
    setEditData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    })
    setEditOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Usuários</h1>
          <p className="text-gray-400 mt-1">
            Gerencie todos os usuários do sistema
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-red-500 hover:bg-red-600">
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
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
                  placeholder="Buscar por nome ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MANAGER">Gerente</SelectItem>
                <SelectItem value="OPERATOR">Operador</SelectItem>
                <SelectItem value="VIEWER">Visualizador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Lista de Usuários</CardTitle>
          <CardDescription>
            {pagination?.total || 0} usuário(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-red-500" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Nenhum usuário encontrado
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-gray-400">Usuário</TableHead>
                    <TableHead className="text-gray-400">Tenant</TableHead>
                    <TableHead className="text-gray-400 text-center">Role</TableHead>
                    <TableHead className="text-gray-400 text-right">Criado em</TableHead>
                    <TableHead className="text-gray-400 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-white/5">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-white/10">
                            <AvatarFallback className={user.role === "SUPER_ADMIN" ? "bg-red-500/20 text-red-400" : "bg-purple-500/20 text-purple-400"}>
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-white">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-300">{user.tenant.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={roleColors[user.role]}
                        >
                          {user.role === "SUPER_ADMIN" && <Shield className="h-3 w-3 mr-1" />}
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-gray-400 text-sm">
                        {formatDate(user.createdAt)}
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
                            <DropdownMenuItem onClick={() => openEditModal(user)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Key className="h-4 w-4 mr-2" />
                              Resetar Senha
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-500"
                              onClick={() => {
                                setUserToDelete(user)
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

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>
              Crie um novo usuário no sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                placeholder="Nome completo"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Senha *</Label>
              <Input
                type="password"
                placeholder="Senha segura"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Role *</Label>
              <Select
                value={newUser.role}
                onValueChange={(value) =>
                  setNewUser({ ...newUser, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MANAGER">Gerente</SelectItem>
                  <SelectItem value="OPERATOR">Operador</SelectItem>
                  <SelectItem value="VIEWER">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newUser.role !== "SUPER_ADMIN" && (
              <div className="space-y-2">
                <Label>Tenant *</Label>
                <Select
                  value={newUser.tenantId}
                  onValueChange={(value) =>
                    setNewUser({ ...newUser, tenantId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateUser} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Usuário"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={editData.name}
                onChange={(e) =>
                  setEditData({ ...editData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editData.email}
                onChange={(e) =>
                  setEditData({ ...editData, email: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Nova Senha (deixe em branco para manter)</Label>
              <Input
                type="password"
                placeholder="Nova senha"
                value={editData.password}
                onChange={(e) =>
                  setEditData({ ...editData, password: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={editData.role}
                onValueChange={(value) =>
                  setEditData({ ...editData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MANAGER">Gerente</SelectItem>
                  <SelectItem value="OPERATOR">Operador</SelectItem>
                  <SelectItem value="VIEWER">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditUser} disabled={editing}>
              {editing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-500">Deletar Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar o usuário "{userToDelete?.name}"?
              <br />
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                "Deletar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
