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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Settings,
  Shield,
  Database,
  Server,
  Globe,
  Users,
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Building2,
  Package,
  Calendar,
  Activity,
  User,
  KeyRound,
} from "lucide-react"

interface SuperAdmin {
  id: string
  name: string
  email: string
  createdAt: string
  tenant: {
    name: string
  }
}

interface SystemStats {
  tenants: number
  users: number
  equipments: number
  bookings: number
  customers: number
  activityLogs: number
}

interface SystemInfo {
  nodeVersion: string
  platform: string
  environment: string
  databaseUrl: string
  authSecret: string
  rootDomain: string
}

interface SettingsData {
  superAdmins: SuperAdmin[]
  stats: SystemStats
  systemInfo: SystemInfo
}

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)

  // Modal de novo super admin
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
  })

  // Modal de delete
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [adminToDelete, setAdminToDelete] = useState<SuperAdmin | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/super-admin/settings")
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error("Erro ao buscar configurações:", error)
      toast.error("Erro ao carregar configurações")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      toast.error("Preencha todos os campos")
      return
    }

    if (newAdmin.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres")
      return
    }

    setCreating(true)
    try {
      const response = await fetch("/api/super-admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAdmin),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      toast.success("Super Admin criado com sucesso!")
      setCreateOpen(false)
      setNewAdmin({ name: "", email: "", password: "" })
      fetchSettings()
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar Super Admin")
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(
        `/api/super-admin/settings?userId=${adminToDelete.id}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      toast.success("Super Admin removido com sucesso")
      setDeleteOpen(false)
      setAdminToDelete(null)
      fetchSettings()
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover Super Admin")
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Configurações</h1>
        <p className="text-gray-400 mt-1">
          Configurações do sistema e gerenciamento de Super Admins
        </p>
      </div>

      {/* System Stats */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Building2 className="h-6 w-6 text-emerald-500 mb-2" />
              <p className="text-2xl font-bold text-white">{data?.stats.tenants || 0}</p>
              <p className="text-xs text-gray-400">Tenants</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Users className="h-6 w-6 text-purple-500 mb-2" />
              <p className="text-2xl font-bold text-white">{data?.stats.users || 0}</p>
              <p className="text-xs text-gray-400">Usuários</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Package className="h-6 w-6 text-cyan-500 mb-2" />
              <p className="text-2xl font-bold text-white">{data?.stats.equipments || 0}</p>
              <p className="text-xs text-gray-400">Equipamentos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Calendar className="h-6 w-6 text-blue-500 mb-2" />
              <p className="text-2xl font-bold text-white">{data?.stats.bookings || 0}</p>
              <p className="text-xs text-gray-400">Reservas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <User className="h-6 w-6 text-pink-500 mb-2" />
              <p className="text-2xl font-bold text-white">{data?.stats.customers || 0}</p>
              <p className="text-xs text-gray-400">Clientes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Activity className="h-6 w-6 text-amber-500 mb-2" />
              <p className="text-2xl font-bold text-white">{data?.stats.activityLogs || 0}</p>
              <p className="text-xs text-gray-400">Atividades</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Super Admins */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                Super Administradores
              </CardTitle>
              <CardDescription>
                Usuários com acesso total ao sistema
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="bg-red-500 hover:bg-red-600"
            >
              <Plus className="h-4 w-4 mr-1" />
              Novo
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-gray-400">Usuário</TableHead>
                  <TableHead className="text-gray-400">Criado em</TableHead>
                  <TableHead className="text-gray-400 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.superAdmins.map((admin) => (
                  <TableRow key={admin.id} className="border-white/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-red-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{admin.name}</p>
                          <p className="text-xs text-gray-500">{admin.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-400">
                        {formatDate(admin.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => {
                          setAdminToDelete(admin)
                          setDeleteOpen(true)
                        }}
                        disabled={data.superAdmins.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {(!data?.superAdmins || data.superAdmins.length === 0) && (
              <div className="text-center py-8 text-gray-400">
                Nenhum super admin encontrado
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-500" />
              Informações do Sistema
            </CardTitle>
            <CardDescription>
              Status das configurações e ambiente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-300">Node.js</span>
                </div>
                <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">
                  {data?.systemInfo.nodeVersion}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-300">Ambiente</span>
                </div>
                <Badge
                  variant="outline"
                  className={
                    data?.systemInfo.environment === "production"
                      ? "text-emerald-400 border-emerald-400/30"
                      : "text-amber-400 border-amber-400/30"
                  }
                >
                  {data?.systemInfo.environment}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-300">Domínio</span>
                </div>
                <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                  {data?.systemInfo.rootDomain}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-300">Database</span>
                </div>
                {data?.systemInfo.databaseUrl === "Configurado" ? (
                  <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configurado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-red-400 border-red-400/30">
                    <XCircle className="h-3 w-3 mr-1" />
                    Não configurado
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-300">Auth Secret</span>
                </div>
                {data?.systemInfo.authSecret === "Configurado" ? (
                  <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configurado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-red-400 border-red-400/30">
                    <XCircle className="h-3 w-3 mr-1" />
                    Não configurado
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Super Admin Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Super Admin</DialogTitle>
            <DialogDescription>
              Crie um novo administrador com acesso total ao sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                placeholder="Nome completo"
                value={newAdmin.name}
                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Senha *</Label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateAdmin}
              disabled={creating}
              className="bg-red-500 hover:bg-red-600"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Super Admin"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Super Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{adminToDelete?.name}</strong> como
              Super Admin? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAdmin}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
