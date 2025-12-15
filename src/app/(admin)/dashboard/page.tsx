import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Users, Calendar, TrendingUp, Plus, ArrowRight } from "lucide-react"

const STATUS_LABELS = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Concluída",
} as const

const STATUS_COLORS = {
  PENDING: "bg-yellow-500/20 text-yellow-500 border-yellow-500/20",
  CONFIRMED: "bg-blue-500/20 text-blue-500 border-blue-500/20",
  CANCELLED: "bg-red-500/20 text-red-500 border-red-500/20",
  COMPLETED: "bg-emerald-500/20 text-emerald-500 border-emerald-500/20",
} as const

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString("pt-BR")
}

// Server-side data fetching - eliminates client-side fetch waterfall
async function getDashboardData(tenantId: string) {
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalEquipments,
    availableEquipments,
    totalCustomers,
    activeBookings,
    pendingBookings,
    thisMonthRevenue,
    totalRevenue,
    recentBookings,
  ] = await Promise.all([
    prisma.equipment.count({ where: { tenantId } }),
    prisma.equipment.count({ where: { tenantId, status: "AVAILABLE" } }),
    prisma.customer.count({ where: { tenantId } }),
    prisma.booking.count({ where: { tenantId, status: "CONFIRMED" } }),
    prisma.booking.count({ where: { tenantId, status: "PENDING" } }),
    prisma.booking.aggregate({
      where: { tenantId, status: "COMPLETED", createdAt: { gte: firstDayOfMonth } },
      _sum: { totalPrice: true },
    }),
    prisma.booking.aggregate({
      where: { tenantId, status: "COMPLETED" },
      _sum: { totalPrice: true },
    }),
    prisma.booking.findMany({
      where: { tenantId },
      include: {
        customer: { select: { name: true } },
        equipment: { select: { name: true } },
        items: { include: { equipment: { select: { name: true } } }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  return {
    equipment: { total: totalEquipments, available: availableEquipments },
    customers: { total: totalCustomers },
    bookings: { active: activeBookings, pending: pendingBookings },
    revenue: {
      thisMonth: Number(thisMonthRevenue._sum.totalPrice || 0),
      total: Number(totalRevenue._sum.totalPrice || 0),
    },
    recentBookings: recentBookings.map((b) => ({
      id: b.id,
      startDate: b.startDate,
      endDate: b.endDate,
      totalPrice: Number(b.totalPrice),
      status: b.status,
      customer: { name: b.customer.name },
      equipment: { name: b.equipment?.name || b.items[0]?.equipment?.name || "Equipamento" },
    })),
  }
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.tenantId) {
    redirect("/login")
  }

  const stats = await getDashboardData(session.user.tenantId)
  const userName = session.user.name?.split(" ")[0] || "Usuário"
  const tenantName = session.user.tenantName || "sua empresa"

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">
            Olá, {userName}
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Visão geral da {tenantName}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/reservas/novo">
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> Nova Reserva
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-l-4 border-l-blue-500">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Package className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Equipamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.equipment.total}</div>
            <p className="text-sm text-blue-400 mt-1 font-medium">
              {stats.equipment.available} disponíveis agora
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-cyan-500">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.customers.total}</div>
            <p className="text-sm text-cyan-400 mt-1 font-medium">
              Base ativa
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-amber-500">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Calendar className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Reservas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.bookings.active}</div>
            <p className="text-sm text-amber-400 mt-1 font-medium">
              {stats.bookings.pending} pendentes de aprovação
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-emerald-500">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Receita Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {formatCurrency(stats.revenue.thisMonth)}
            </div>
            <p className="text-sm text-emerald-400 mt-1 font-medium">
              Total: {formatCurrency(stats.revenue.total)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings and Quick Actions */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Recent Bookings */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Reservas Recentes</CardTitle>
              <CardDescription>
                Acompanhe as últimas movimentações
              </CardDescription>
            </div>
            <Link href="/reservas">
              <Button variant="ghost" size="sm" className="gap-2">
                Ver todas <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recentBookings.length > 0 ? (
              <div className="space-y-3">
                {stats.recentBookings.map((booking) => (
                  <article
                    key={booking.id}
                    className="group p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300"
                  >
                    {/* Mobile Layout */}
                    <div className="flex flex-col gap-3 sm:hidden">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-9 w-9 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 grid place-items-center border border-white/10">
                            <Calendar className="h-4 w-4 text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-white truncate">{booking.customer.name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {booking.equipment.name}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={`${STATUS_COLORS[booking.status as keyof typeof STATUS_COLORS]} border flex-shrink-0 text-xs`}
                          variant="outline"
                        >
                          {STATUS_LABELS[booking.status as keyof typeof STATUS_LABELS]}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="text-sm">
                          <span className="text-muted-foreground">{formatDate(booking.startDate)}</span>
                          <span className="text-muted-foreground mx-1">→</span>
                          <span className="text-muted-foreground">{formatDate(booking.endDate)}</span>
                        </div>
                        <p className="font-bold text-white text-base">
                          {formatCurrency(booking.totalPrice)}
                        </p>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:flex sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 grid place-items-center border border-white/10">
                          <Calendar className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{booking.customer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.equipment.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">
                            {formatDate(booking.startDate)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            até {formatDate(booking.endDate)}
                          </p>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <p className="font-bold text-white">
                            {formatCurrency(booking.totalPrice)}
                          </p>
                        </div>
                        <Badge
                          className={`${STATUS_COLORS[booking.status as keyof typeof STATUS_COLORS]} border min-w-[90px] justify-center`}
                          variant="outline"
                        >
                          {STATUS_LABELS[booking.status as keyof typeof STATUS_LABELS]}
                        </Badge>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground bg-white/5 rounded-xl border border-dashed border-white/10">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-lg font-medium text-white/50">Nenhuma reserva encontrada</p>
                <Link href="/reservas/novo">
                  <Button variant="link" className="mt-2">
                    Criar primeira reserva
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acesso Rápido</CardTitle>
            <CardDescription>
              Funcionalidades mais usadas
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Link href="/reservas/novo" className="group">
              <div className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-blue-500/10 hover:border-blue-500/20 transition-all duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">Nova Reserva</h3>
                  <p className="text-xs text-muted-foreground">
                    Agendar locação
                  </p>
                </div>
                <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            <Link href="/clientes/novo" className="group">
              <div className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/20 transition-all duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">Novo Cliente</h3>
                  <p className="text-xs text-muted-foreground">
                    Cadastrar cliente
                  </p>
                </div>
                <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            <Link href="/equipamentos/novo" className="group">
              <div className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">Novo Equipamento</h3>
                  <p className="text-xs text-muted-foreground">
                    Adicionar item
                  </p>
                </div>
                <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
