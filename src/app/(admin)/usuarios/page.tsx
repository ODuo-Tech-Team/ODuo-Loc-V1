"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Mail, Shield, UserCheck, UserX } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
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
import { hasPermission, type Role } from "@/lib/permissions"

interface User {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
  deactivatedAt?: string
  deactivatedReason?: string
  createdAt: string
  updatedAt: string
}

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  OPERATOR: "Operador",
  VIEWER: "Visualizador",
}

const roleColors: Record<Role, "default" | "destructive" | "secondary" | "outline"> = {
  SUPER_ADMIN: "destructive",
  ADMIN: "default",
  MANAGER: "secondary",
  OPERATOR: "outline",
  VIEWER: "outline",
}

export default function UsuariosPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null)

  const canEdit = session?.user?.role && hasPermission(session.user.role as Role, 'EDIT_USER')
  const canDelete = session?.user?.role && hasPermission(session.user.role as Role, 'DELETE_USER')
  const canCreate = session?.user?.role && hasPermission(session.user.role as Role, 'CREATE_USER')

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append("search", search)

      const response = await fetch(`/api/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [search])

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const response = await fetch(`/api/users/${deleteId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setUsers(users.filter((u) => u.id !== deleteId))
        setDeleteId(null)
        toast.success("Usuário excluído com sucesso")
      } else {
        const data = await response.json()
        toast.error(data.error || "Erro ao excluir usuário")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Erro ao excluir usuário")
    }
  }

  const handleToggleStatus = async (userId: string, currentActive: boolean) => {
    setTogglingUserId(userId)
    try {
      const response = await fetch(`/api/users/${userId}/toggle-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUsers(users.map((u) => (u.id === userId ? { ...u, ...updatedUser } : u)))
        toast.success(updatedUser.active ? "Usuário ativado" : "Usuário desativado")
      } else {
        const data = await response.json()
        toast.error(data.error || "Erro ao alterar status")
      }
    } catch (error) {
      console.error("Error toggling user status:", error)
      toast.error("Erro ao alterar status do usuário")
    } finally {
      setTogglingUserId(null)
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-headline tracking-wide">Usuários</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os usuários e permissões da sua equipe
          </p>
        </div>
        {canCreate && (
          <Link href="/usuarios/novo">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Usuário
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline tracking-wide">Filtros</CardTitle>
          <CardDescription>
            Busque por nome ou email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuário..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline tracking-wide">
            {loading ? "Carregando..." : `${users.length} usuários`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                  {(canEdit || canDelete) && (
                    <TableHead className="text-right">Ações</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Carregando usuários...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Nenhum usuário encontrado.
                      {canCreate && (
                        <>
                          <br />
                          <Link href="/usuarios/novo">
                            <Button variant="link" className="mt-2">
                              Cadastrar primeiro usuário
                            </Button>
                          </Link>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleColors[user.role]}>
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* Só mostra switch para usuários não-admin e não é o próprio usuário */}
                          {canEdit && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.id !== session?.user?.id ? (
                            <Switch
                              checked={user.active}
                              disabled={togglingUserId === user.id}
                              onCheckedChange={() => handleToggleStatus(user.id, user.active)}
                            />
                          ) : (
                            user.active ? (
                              <UserCheck className="h-4 w-4 text-green-500" />
                            ) : (
                              <UserX className="h-4 w-4 text-red-500" />
                            )
                          )}
                          <span className={`text-sm ${user.active ? 'text-green-600' : 'text-red-500'}`}>
                            {user.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                      {(canEdit || canDelete) && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {canEdit && (
                              <Link href={`/usuarios/${user.id}`}>
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                            {canDelete && user.id !== session?.user?.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteId(user.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este usuário? Esta ação não pode
              ser desfeita. O usuário perderá acesso ao sistema imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
