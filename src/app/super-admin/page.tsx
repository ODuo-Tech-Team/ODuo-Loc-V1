"use client"

import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Users,
  Package,
  Calendar,
  TrendingUp,
  DollarSign,
  Loader2,
  ArrowRight,
  ArrowUpRight,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { useSuperAdminStats } from "@/hooks/useSuperAdminQueries"

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function SuperAdminDashboard() {
  const { data: stats, isLoading: loading } = useSuperAdminStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Visão geral do sistema ODuo
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Tenants */}
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-500" />
              Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {stats?.overview.totalTenants || 0}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 bg-emerald-400/10">
                <CheckCircle className="h-3 w-3 mr-1" />
                {stats?.overview.activeTenants || 0} ativos
              </Badge>
              {(stats?.overview.inactiveTenants || 0) > 0 && (
                <Badge variant="outline" className="text-red-400 border-red-400/30 bg-red-400/10">
                  <XCircle className="h-3 w-3 mr-1" />
                  {stats?.overview.inactiveTenants} inativos
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total Users */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {stats?.overview.totalUsers || 0}
            </div>
            <p className="text-sm text-purple-400 mt-2">
              Em todos os tenants
            </p>
          </CardContent>
        </Card>

        {/* Total Bookings */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              Reservas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {stats?.overview.totalBookings || 0}
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <span className="text-amber-400">
                {stats?.bookingsByStatus.pending || 0} pendentes
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-blue-400">
                {stats?.bookingsByStatus.confirmed || 0} confirmadas
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-500" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {formatCurrency(stats?.overview.totalRevenue || 0)}
            </div>
            <p className="text-sm text-amber-400 mt-2">
              Todas as reservas confirmadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Equipamentos</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats?.overview.totalEquipments || 0}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <Package className="h-6 w-6 text-cyan-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Clientes</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats?.overview.totalCustomers || 0}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-pink-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-pink-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Taxa de Conclusão</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats?.overview.totalBookings
                    ? Math.round(
                        ((stats.bookingsByStatus.completed || 0) /
                          stats.overview.totalBookings) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tenants */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Tenants Recentes</CardTitle>
            <CardDescription>Últimas locadoras cadastradas</CardDescription>
          </div>
          <Link href="/super-admin/tenants">
            <Button variant="ghost" size="sm" className="gap-2">
              Ver todos <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats?.recentTenants && stats.recentTenants.length > 0 ? (
            <div className="space-y-4">
              {stats.recentTenants.slice(0, 5).map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-white/10">
                      <Building2 className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{tenant.name}</p>
                      <p className="text-sm text-gray-400">{tenant.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="hidden sm:flex items-center gap-4 text-sm text-gray-400">
                      <span>{tenant._count.users} usuários</span>
                      <span>{tenant._count.equipments} equip.</span>
                      <span>{tenant._count.bookings} reservas</span>
                    </div>

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

                    <span className="text-sm text-gray-500">
                      {formatDate(tenant.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              Nenhum tenant cadastrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/super-admin/tenants">
          <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Building2 className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Gerenciar Tenants</h3>
                    <p className="text-sm text-gray-400">Ver todas as locadoras</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/super-admin/users">
          <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Gerenciar Usuários</h3>
                    <p className="text-sm text-gray-400">Ver todos os usuários</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard">
          <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowUpRight className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Ir para Tenant</h3>
                    <p className="text-sm text-gray-400">Acessar painel normal</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
