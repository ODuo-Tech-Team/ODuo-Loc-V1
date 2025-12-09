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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  Search,
  Loader2,
  User,
  Plus,
  Pencil,
  Trash2,
  LogIn,
  LogOut,
  Building2,
  Calendar,
  Filter,
  RefreshCw,
  Package,
  Users,
  FileText,
} from "lucide-react"

interface ActivityLog {
  id: string
  action: string
  entity: string
  entityId: string | null
  description: string
  metadata: any
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
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

const actionIcons: Record<string, any> = {
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
  LOGIN: LogIn,
  LOGOUT: LogOut,
}

const actionColors: Record<string, string> = {
  CREATE: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  UPDATE: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  DELETE: "text-red-400 border-red-400/30 bg-red-400/10",
  LOGIN: "text-purple-400 border-purple-400/30 bg-purple-400/10",
  LOGOUT: "text-gray-400 border-gray-400/30 bg-gray-400/10",
}

const entityIcons: Record<string, any> = {
  USER: Users,
  CUSTOMER: User,
  EQUIPMENT: Package,
  BOOKING: Calendar,
  TENANT: Building2,
  DOCUMENT: FileText,
}

const actionLabels: Record<string, string> = {
  CREATE: "Criação",
  UPDATE: "Atualização",
  DELETE: "Exclusão",
  LOGIN: "Login",
  LOGOUT: "Logout",
}

const entityLabels: Record<string, string> = {
  USER: "Usuário",
  CUSTOMER: "Cliente",
  EQUIPMENT: "Equipamento",
  BOOKING: "Reserva",
  TENANT: "Tenant",
  DOCUMENT: "Documento",
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)

  // Filtros
  const [tenantFilter, setTenantFilter] = useState("all")
  const [actionFilter, setActionFilter] = useState("all")
  const [entityFilter, setEntityFilter] = useState("all")
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchActivities()
  }, [tenantFilter, actionFilter, entityFilter, page])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      })

      if (tenantFilter !== "all") params.set("tenantId", tenantFilter)
      if (actionFilter !== "all") params.set("action", actionFilter)
      if (entityFilter !== "all") params.set("entity", entityFilter)

      const response = await fetch(`/api/super-admin/activities?${params}`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities)
        setTenants(data.tenants)
        setStats(data.stats)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Erro ao buscar atividades:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatRelativeTime = (date: string) => {
    const now = new Date()
    const activityDate = new Date(date)
    const diff = now.getTime() - activityDate.getTime()

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Agora"
    if (minutes < 60) return `${minutes}m atrás`
    if (hours < 24) return `${hours}h atrás`
    if (days < 7) return `${days}d atrás`
    return formatDate(date)
  }

  const clearFilters = () => {
    setTenantFilter("all")
    setActionFilter("all")
    setEntityFilter("all")
    setPage(1)
  }

  const hasFilters = tenantFilter !== "all" || actionFilter !== "all" || entityFilter !== "all"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Atividades</h1>
          <p className="text-gray-400 mt-1">
            Log de todas as ações realizadas no sistema
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchActivities}
          className="border-white/10"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Plus className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.CREATE || 0}</p>
                <p className="text-xs text-gray-400">Criações (24h)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Pencil className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.UPDATE || 0}</p>
                <p className="text-xs text-gray-400">Atualizações (24h)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.DELETE || 0}</p>
                <p className="text-xs text-gray-400">Exclusões (24h)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <LogIn className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.LOGIN || 0}</p>
                <p className="text-xs text-gray-400">Logins (24h)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex items-center gap-2 text-gray-400">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select value={tenantFilter} onValueChange={setTenantFilter}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Tenant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tenants</SelectItem>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Ações</SelectItem>
                  <SelectItem value="CREATE">Criação</SelectItem>
                  <SelectItem value="UPDATE">Atualização</SelectItem>
                  <SelectItem value="DELETE">Exclusão</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                </SelectContent>
              </Select>

              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Entidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Entidades</SelectItem>
                  <SelectItem value="USER">Usuário</SelectItem>
                  <SelectItem value="CUSTOMER">Cliente</SelectItem>
                  <SelectItem value="EQUIPMENT">Equipamento</SelectItem>
                  <SelectItem value="BOOKING">Reserva</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-400 hover:text-white"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activities Table */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-red-500" />
            Log de Atividades
          </CardTitle>
          <CardDescription>
            {pagination?.total || 0} atividade(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-red-500" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma atividade encontrada</p>
              {hasFilters && (
                <Button
                  variant="link"
                  onClick={clearFilters}
                  className="text-red-400 mt-2"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {activities.map((activity) => {
                  const ActionIcon = actionIcons[activity.action] || Activity
                  const EntityIcon = entityIcons[activity.entity] || FileText

                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                    >
                      {/* Action Icon */}
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          actionColors[activity.action] || "bg-gray-500/20"
                        }`}
                      >
                        <ActionIcon className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-white font-medium">
                              {activity.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge
                                variant="outline"
                                className={actionColors[activity.action]}
                              >
                                {actionLabels[activity.action] || activity.action}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-gray-400 border-gray-400/30 bg-gray-400/10"
                              >
                                <EntityIcon className="h-3 w-3 mr-1" />
                                {entityLabels[activity.entity] || activity.entity}
                              </Badge>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500 whitespace-nowrap">
                            {formatRelativeTime(activity.createdAt)}
                          </span>
                        </div>

                        {/* User and Tenant Info */}
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{activity.user.name}</span>
                            <span className="text-gray-600">({activity.user.email})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span>{activity.tenant.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-400">
                    Página {pagination.page} de {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="border-white/10"
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === pagination.totalPages}
                      className="border-white/10"
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
    </div>
  )
}
