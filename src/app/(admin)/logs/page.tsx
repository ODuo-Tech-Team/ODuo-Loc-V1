"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Activity, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { type Role } from "@/lib/permissions"

interface ActivityLog {
  id: string
  action: string
  entity: string
  entityId: string | null
  description: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    role: Role
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

const actionColors: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  CREATE: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
  LOGIN: "outline",
  LOGOUT: "outline",
  VIEW: "outline",
}

const actionLabels: Record<string, string> = {
  CREATE: "Criou",
  UPDATE: "Atualizou",
  DELETE: "Deletou",
  LOGIN: "Login",
  LOGOUT: "Logout",
  VIEW: "Visualizou",
}

const entityLabels: Record<string, string> = {
  USER: "Usuário",
  CUSTOMER: "Cliente",
  EQUIPMENT: "Equipamento",
  BOOKING: "Orçamento",
  SYSTEM: "Sistema",
}

export default function ActivityLogsPage() {
  const { data: session } = useSession()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  // Filtros
  const [entityFilter, setEntityFilter] = useState<string>("all")
  const [actionFilter, setActionFilter] = useState<string>("all")

  const fetchLogs = async (page: number = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      })

      if (entityFilter !== "all") params.append("entity", entityFilter)
      if (actionFilter !== "all") params.append("action", actionFilter)

      const response = await fetch(`/api/activity-logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs(1)
  }, [entityFilter, actionFilter])

  const handlePageChange = (newPage: number) => {
    fetchLogs(newPage)
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2 font-headline tracking-wide">
            <Activity className="h-8 w-8" />
            Registro de Atividades
          </h1>
          <p className="text-muted-foreground mt-1">
            Histórico de ações realizadas no sistema
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline tracking-wide">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
          <CardDescription>
            Filtre os registros por tipo de ação ou entidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Entidade</label>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as entidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as entidades</SelectItem>
                  <SelectItem value="USER">Usuários</SelectItem>
                  <SelectItem value="CUSTOMER">Clientes</SelectItem>
                  <SelectItem value="EQUIPMENT">Equipamentos</SelectItem>
                  <SelectItem value="BOOKING">Orçamentos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Ação</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="CREATE">Criação</SelectItem>
                  <SelectItem value="UPDATE">Atualização</SelectItem>
                  <SelectItem value="DELETE">Exclusão</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline tracking-wide">
            {loading
              ? "Carregando..."
              : `${pagination.total} registro${pagination.total !== 1 ? "s" : ""}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Carregando registros...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(log.createdAt).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{log.user.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {log.user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionColors[log.action]}>
                          {actionLabels[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {entityLabels[log.entity] || log.entity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{log.description}</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Página {pagination.page} de {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages || loading}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
