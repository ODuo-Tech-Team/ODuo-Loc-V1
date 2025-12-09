"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
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
import { Badge } from "@/components/ui/badge"
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  Loader2,
  ArrowRight,
  Calendar,
  Users,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
} from "lucide-react"

interface BillingData {
  period: string
  startDate: string
  summary: {
    periodRevenue: number
    allTimeRevenue: number
    newTenants: number
    totalTenants: number
    activeTenants: number
  }
  bookingsByStatus: Record<string, { count: number; revenue: number }>
  monthlyData: Array<{
    month: string
    monthLabel: string
    revenue: number
    bookings: number
  }>
  topTenants: Array<{
    id: string
    name: string
    slug: string
    periodRevenue: number
    bookingsCount: number
  }>
  allTenants: Array<{
    id: string
    name: string
    slug: string
    email: string
    active: boolean
    usersCount: number
    equipmentsCount: number
    bookingsCount: number
    periodRevenue: number
    confirmedBookings: number
    completedBookings: number
  }>
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("month")

  useEffect(() => {
    fetchBillingData()
  }, [period])

  const fetchBillingData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/super-admin/billing?period=${period}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error("Erro ao buscar dados de faturamento:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const getPeriodLabel = () => {
    switch (period) {
      case "quarter":
        return "Trimestre"
      case "year":
        return "Ano"
      default:
        return "Mês"
    }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Faturamento</h1>
          <p className="text-gray-400 mt-1">
            Visão geral das receitas do sistema
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48 bg-white/5 border-white/10">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Este Mês</SelectItem>
            <SelectItem value="quarter">Trimestre</SelectItem>
            <SelectItem value="year">Este Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              Receita do {getPeriodLabel()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {formatCurrency(data?.summary.periodRevenue || 0)}
            </div>
            <p className="text-sm text-emerald-400 mt-2 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Reservas confirmadas e completadas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              Receita Total (Histórico)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {formatCurrency(data?.summary.allTimeRevenue || 0)}
            </div>
            <p className="text-sm text-purple-400 mt-2">
              Desde o início do sistema
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              Tenants Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {data?.summary.activeTenants || 0}
              <span className="text-lg text-gray-500">
                /{data?.summary.totalTenants || 0}
              </span>
            </div>
            <p className="text-sm text-blue-400 mt-2">
              +{data?.summary.newTenants || 0} novos no período
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-amber-500" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {formatCurrency(
                (data?.summary.periodRevenue || 0) /
                  Math.max(
                    (data?.bookingsByStatus?.CONFIRMED?.count || 0) +
                      (data?.bookingsByStatus?.COMPLETED?.count || 0),
                    1
                  )
              )}
            </div>
            <p className="text-sm text-amber-400 mt-2">
              Por reserva no período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings by Status */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pendentes</p>
                  <p className="text-xl font-bold text-white">
                    {data?.bookingsByStatus?.PENDING?.count || 0}
                  </p>
                </div>
              </div>
              <p className="text-sm text-amber-400">
                {formatCurrency(data?.bookingsByStatus?.PENDING?.revenue || 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Confirmadas</p>
                  <p className="text-xl font-bold text-white">
                    {data?.bookingsByStatus?.CONFIRMED?.count || 0}
                  </p>
                </div>
              </div>
              <p className="text-sm text-blue-400">
                {formatCurrency(data?.bookingsByStatus?.CONFIRMED?.revenue || 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Completadas</p>
                  <p className="text-xl font-bold text-white">
                    {data?.bookingsByStatus?.COMPLETED?.count || 0}
                  </p>
                </div>
              </div>
              <p className="text-sm text-emerald-400">
                {formatCurrency(data?.bookingsByStatus?.COMPLETED?.revenue || 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Chart */}
      {data?.monthlyData && data.monthlyData.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Receita Mensal</CardTitle>
            <CardDescription>Últimos 6 meses de faturamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {data.monthlyData.map((month, index) => {
                const maxRevenue = Math.max(...data.monthlyData.map((m) => m.revenue))
                const height = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0

                return (
                  <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {formatCurrency(month.revenue)}
                    </span>
                    <div
                      className="w-full bg-gradient-to-t from-emerald-500/50 to-emerald-500/80 rounded-t-lg transition-all duration-500"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                    <span className="text-xs text-gray-500">{month.monthLabel}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Tenants and All Tenants */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Top 5 Tenants */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Top 5 Tenants
            </CardTitle>
            <CardDescription>Por receita no período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.topTenants.map((tenant, index) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center text-sm font-bold text-emerald-400">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{tenant.name}</p>
                      <p className="text-xs text-gray-500">
                        {tenant.bookingsCount} reservas
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-emerald-400">
                    {formatCurrency(tenant.periodRevenue)}
                  </p>
                </div>
              ))}

              {(!data?.topTenants || data.topTenants.length === 0) && (
                <div className="text-center py-4 text-gray-400">
                  Nenhum dado disponível
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* All Tenants Table */}
        <Card className="bg-white/5 border-white/10 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Receita por Tenant</CardTitle>
              <CardDescription>Todos os tenants no período</CardDescription>
            </div>
            <Link href="/super-admin/tenants">
              <Button variant="ghost" size="sm" className="gap-2">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-gray-400">Tenant</TableHead>
                  <TableHead className="text-gray-400 text-center">Reservas</TableHead>
                  <TableHead className="text-gray-400 text-right">Receita</TableHead>
                  <TableHead className="text-gray-400 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.allTenants.slice(0, 10).map((tenant) => (
                  <TableRow key={tenant.id} className="border-white/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{tenant.name}</p>
                          <p className="text-xs text-gray-500">{tenant.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                        <span className="text-blue-400">{tenant.confirmedBookings}</span>
                        <span>/</span>
                        <span className="text-emerald-400">{tenant.completedBookings}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm font-medium ${
                        tenant.periodRevenue > 0 ? "text-emerald-400" : "text-gray-500"
                      }`}>
                        {formatCurrency(tenant.periodRevenue)}
                      </span>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {(!data?.allTenants || data.allTenants.length === 0) && (
              <div className="text-center py-8 text-gray-400">
                Nenhum tenant encontrado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
