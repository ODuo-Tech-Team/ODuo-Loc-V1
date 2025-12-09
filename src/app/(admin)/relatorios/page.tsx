"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Package,
  Users,
  FileDown,
  Filter,
  PieChart as PieChartIcon,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"

// Cores padronizadas para gráficos
const CHART_COLORS = {
  primary: "#06b6d4",    // cyan-500
  secondary: "#8b5cf6",  // violet-500
  success: "#10b981",    // emerald-500
  warning: "#f59e0b",    // amber-500
  danger: "#ef4444",     // red-500
  info: "#3b82f6",       // blue-500
}

const PIE_COLORS = ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6"]

interface ReportData {
  // Visão Geral
  totalRevenue: number
  totalBookings: number
  activeEquipments: number
  totalCustomers: number
  revenueGrowth: number
  bookingsGrowth: number
  // Financeiro
  monthlyRevenue: { month: string; value: number }[]
  revenueByStatus: { status: string; value: number }[]
  averageTicket: number
  pendingPayments: number
  // Equipamentos
  equipmentsByCategory: { category: string; count: number }[]
  equipmentsByStatus: { status: string; count: number }[]
  topEquipments: { name: string; bookings: number; revenue: number }[]
  utilizationRate: number
  // Reservas
  bookingsByMonth: { month: string; count: number }[]
  bookingsByStatus: { status: string; count: number }[]
  averageDuration: number
  recentBookings: any[]
  // Clientes
  newCustomersThisMonth: number
  topCustomers: { name: string; bookings: number; totalSpent: number }[]
  customersByCity: { city: string; count: number }[]
}

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [data, setData] = useState<ReportData | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
    period: "30d",
  })
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const [bookingsRes, equipmentsRes, customersRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/equipments"),
        fetch("/api/customers"),
      ])

      if (bookingsRes.ok && equipmentsRes.ok && customersRes.ok) {
        const bookingsData = await bookingsRes.json()
        const equipmentsData = await equipmentsRes.json()
        const customersData = await customersRes.json()

        const bookings = Array.isArray(bookingsData) ? bookingsData : []
        const equipments = Array.isArray(equipmentsData) ? equipmentsData : []
        const customers = Array.isArray(customersData) ? customersData : []

        // Calcular métricas
        const totalRevenue = bookings.reduce((sum: number, booking: any) => {
          return ["COMPLETED", "CONFIRMED"].includes(booking.status) ? sum + (booking.totalPrice || 0) : sum
        }, 0)

        const activeEquipments = equipments.filter(
          (eq: any) => eq.status === "AVAILABLE"
        ).length

        // Agrupar por categoria
        const categoryCount: Record<string, number> = {}
        equipments.forEach((eq: any) => {
          categoryCount[eq.category] = (categoryCount[eq.category] || 0) + 1
        })

        // Agrupar equipamentos por status
        const eqStatusCount: Record<string, number> = {}
        equipments.forEach((eq: any) => {
          eqStatusCount[eq.status] = (eqStatusCount[eq.status] || 0) + 1
        })

        // Agrupar reservas por status
        const bookingStatusCount: Record<string, number> = {}
        bookings.forEach((b: any) => {
          bookingStatusCount[b.status] = (bookingStatusCount[b.status] || 0) + 1
        })

        // Top equipamentos
        const equipmentStats: Record<string, { name: string; bookings: number; revenue: number }> = {}
        bookings.forEach((b: any) => {
          const eqId = b.equipment?.id || b.equipmentId
          const eqName = b.equipment?.name || "Desconhecido"
          if (!equipmentStats[eqId]) {
            equipmentStats[eqId] = { name: eqName, bookings: 0, revenue: 0 }
          }
          equipmentStats[eqId].bookings++
          equipmentStats[eqId].revenue += b.totalPrice || 0
        })

        // Top clientes
        const customerStats: Record<string, { name: string; bookings: number; totalSpent: number }> = {}
        bookings.forEach((b: any) => {
          const custId = b.customer?.id || b.customerId
          const custName = b.customer?.name || "Desconhecido"
          if (!customerStats[custId]) {
            customerStats[custId] = { name: custName, bookings: 0, totalSpent: 0 }
          }
          customerStats[custId].bookings++
          customerStats[custId].totalSpent += b.totalPrice || 0
        })

        // Clientes por cidade
        const cityCount: Record<string, number> = {}
        customers.forEach((c: any) => {
          const city = c.city || "Não informado"
          cityCount[city] = (cityCount[city] || 0) + 1
        })

        // Calcular duração média
        let totalDays = 0
        let countWithDates = 0
        bookings.forEach((b: any) => {
          if (b.startDate && b.endDate) {
            const start = new Date(b.startDate)
            const end = new Date(b.endDate)
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
            if (days > 0) {
              totalDays += days
              countWithDates++
            }
          }
        })

        // Dados mensais simulados (últimos 6 meses)
        const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"]
        const monthlyRevenue = months.map((month, i) => ({
          month,
          value: Math.floor(totalRevenue / 6 * (0.7 + Math.random() * 0.6)),
        }))

        const bookingsByMonth = months.map((month, i) => ({
          month,
          count: Math.floor(bookings.length / 6 * (0.7 + Math.random() * 0.6)),
        }))

        setData({
          totalRevenue,
          totalBookings: bookings.length,
          activeEquipments,
          totalCustomers: customers.length,
          revenueGrowth: 12.5,
          bookingsGrowth: 8.3,
          monthlyRevenue,
          revenueByStatus: Object.entries(bookingStatusCount).map(([status, count]) => ({
            status,
            value: bookings.filter((b: any) => b.status === status).reduce((s: number, b: any) => s + (b.totalPrice || 0), 0),
          })),
          averageTicket: bookings.length > 0 ? totalRevenue / bookings.length : 0,
          pendingPayments: bookings.filter((b: any) => b.status === "PENDING").reduce((s: number, b: any) => s + (b.totalPrice || 0), 0),
          equipmentsByCategory: Object.entries(categoryCount).map(([category, count]) => ({ category, count })),
          equipmentsByStatus: Object.entries(eqStatusCount).map(([status, count]) => ({ status, count })),
          topEquipments: Object.values(equipmentStats).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
          utilizationRate: equipments.length > 0 ? (equipments.filter((e: any) => e.status === "RENTED").length / equipments.length) * 100 : 0,
          bookingsByMonth,
          bookingsByStatus: Object.entries(bookingStatusCount).map(([status, count]) => ({ status, count })),
          averageDuration: countWithDates > 0 ? totalDays / countWithDates : 0,
          recentBookings: bookings.slice(0, 10),
          newCustomersThisMonth: Math.floor(customers.length * 0.15),
          topCustomers: Object.values(customerStats).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5),
          customersByCity: Object.entries(cityCount).map(([city, count]) => ({ city, count })).slice(0, 5),
        })
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
      toast.error("Erro ao carregar relatórios")
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR")
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "Pendente",
      CONFIRMED: "Confirmado",
      COMPLETED: "Concluido",
      CANCELLED: "Cancelado",
      AVAILABLE: "Disponivel",
      RENTED: "Alugado",
      MAINTENANCE: "Manutencao",
      INACTIVE: "Inativo",
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-500/20 text-yellow-400",
      CONFIRMED: "bg-blue-500/20 text-blue-400",
      COMPLETED: "bg-green-500/20 text-green-400",
      CANCELLED: "bg-red-500/20 text-red-400",
      AVAILABLE: "bg-green-500/20 text-green-400",
      RENTED: "bg-blue-500/20 text-blue-400",
      MAINTENANCE: "bg-orange-500/20 text-orange-400",
      INACTIVE: "bg-zinc-500/20 text-zinc-400",
    }
    return colors[status] || "bg-zinc-500/20 text-zinc-400"
  }

  // Exportar CSV
  const exportToCSV = () => {
    if (!data) return

    let csvContent = ""

    // Cabeçalho
    csvContent += "Relatorio de Desempenho\n"
    csvContent += `Gerado em: ${new Date().toLocaleString("pt-BR")}\n\n`

    // Métricas Gerais
    csvContent += "METRICAS GERAIS\n"
    csvContent += `Receita Total,${data.totalRevenue}\n`
    csvContent += `Total de Reservas,${data.totalBookings}\n`
    csvContent += `Equipamentos Ativos,${data.activeEquipments}\n`
    csvContent += `Total de Clientes,${data.totalCustomers}\n`
    csvContent += `Ticket Medio,${data.averageTicket}\n\n`

    // Top Equipamentos
    csvContent += "TOP EQUIPAMENTOS\n"
    csvContent += "Nome,Reservas,Receita\n"
    data.topEquipments.forEach((eq) => {
      csvContent += `${eq.name},${eq.bookings},${eq.revenue}\n`
    })
    csvContent += "\n"

    // Top Clientes
    csvContent += "TOP CLIENTES\n"
    csvContent += "Nome,Reservas,Total Gasto\n"
    data.topCustomers.forEach((c) => {
      csvContent += `${c.name},${c.bookings},${c.totalSpent}\n`
    })

    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    toast.success("CSV exportado com sucesso!")
  }

  // Exportar PDF
  const exportToPDF = async () => {
    if (!reportRef.current) return

    setExporting(true)
    try {
      const html2pdf = (await import("html2pdf.js")).default

      const element = reportRef.current
      const clone = element.cloneNode(true) as HTMLElement

      // Preparar para PDF - converter cores modernas
      clone.style.backgroundColor = "#ffffff"
      clone.style.color = "#1f2937"
      clone.style.padding = "20px"

      const processElement = (el: Element) => {
        const htmlEl = el as HTMLElement
        if (!htmlEl.style) return

        const computed = window.getComputedStyle(htmlEl)
        const hasModernColor = (color: string) =>
          color.includes("lab(") ||
          color.includes("oklch(") ||
          color.includes("oklab(") ||
          color.includes("color(")

        if (hasModernColor(computed.color)) {
          htmlEl.style.color = "#1f2937"
        }
        if (hasModernColor(computed.backgroundColor)) {
          if (computed.backgroundColor !== "rgba(0, 0, 0, 0)") {
            htmlEl.style.backgroundColor = "#f3f4f6"
          }
        }
        if (hasModernColor(computed.borderColor)) {
          htmlEl.style.borderColor = "#d1d5db"
        }
        Array.from(el.children).forEach(processElement)
      }
      processElement(clone)

      const opt = {
        margin: 10,
        filename: `relatorio_${new Date().toISOString().split("T")[0]}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm" as const, format: "a4", orientation: "portrait" as const },
      }

      await html2pdf().set(opt).from(clone).save()
      toast.success("PDF exportado com sucesso!")
    } catch (error) {
      console.error("Erro ao exportar PDF:", error)
      toast.error("Erro ao exportar PDF")
    } finally {
      setExporting(false)
    }
  }

  // Tooltip customizado para gráficos
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-lg">
          <p className="text-zinc-400 text-xs mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
              {entry.name}: {entry.name?.includes("Receita") || entry.name?.includes("Valor")
                ? formatCurrency(entry.value)
                : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Tooltip para pizza
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-white">{payload[0].name}</p>
          <p className="text-xs text-zinc-400">{payload[0].value} ({((payload[0].percent || 0) * 100).toFixed(0)}%)</p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6" ref={reportRef}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground font-headline tracking-wide flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-cyan-400" />
            Relatorios
          </h1>
          <p className="text-muted-foreground mt-1">
            Analise o desempenho do seu negocio
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <FileDown className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button onClick={exportToPDF} disabled={exporting}>
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            PDF
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-xs text-zinc-500">Periodo</Label>
              <Select
                value={dateFilter.period}
                onValueChange={(v) => setDateFilter({ ...dateFilter, period: v })}
              >
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Ultimos 7 dias</SelectItem>
                  <SelectItem value="30d">Ultimos 30 dias</SelectItem>
                  <SelectItem value="90d">Ultimos 90 dias</SelectItem>
                  <SelectItem value="12m">Ultimos 12 meses</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dateFilter.period === "custom" && (
              <>
                <div>
                  <Label className="text-xs text-zinc-500">Data Inicio</Label>
                  <Input
                    type="date"
                    value={dateFilter.startDate}
                    onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                    className="bg-zinc-800/50 border-zinc-700"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-500">Data Fim</Label>
                  <Input
                    type="date"
                    value={dateFilter.endDate}
                    onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                    className="bg-zinc-800/50 border-zinc-700"
                  />
                </div>
              </>
            )}
            <div className="flex items-end">
              <Button onClick={fetchReportData} variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Aplicar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {data && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-zinc-900/50 border border-zinc-800 p-1">
            <TabsTrigger value="overview">Visao Geral</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
            <TabsTrigger value="equipment">Equipamentos</TabsTrigger>
            <TabsTrigger value="bookings">Reservas</TabsTrigger>
            <TabsTrigger value="customers">Clientes</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            {/* Cards de Métricas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="h-5 w-5 text-emerald-400" />
                    <span className={`text-xs flex items-center ${data.revenueGrowth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {data.revenueGrowth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(data.revenueGrowth)}%
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">Receita Total</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(data.totalRevenue)}</p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Calendar className="h-5 w-5 text-blue-400" />
                    <span className={`text-xs flex items-center ${data.bookingsGrowth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {data.bookingsGrowth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(data.bookingsGrowth)}%
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">Total Reservas</p>
                  <p className="text-xl font-bold text-white">{data.totalBookings}</p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Package className="h-5 w-5 text-amber-400" />
                  </div>
                  <p className="text-xs text-zinc-500">Equipamentos Ativos</p>
                  <p className="text-xl font-bold text-white">{data.activeEquipments}</p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="h-5 w-5 text-purple-400" />
                  </div>
                  <p className="text-xs text-zinc-500">Total Clientes</p>
                  <p className="text-xl font-bold text-white">{data.totalCustomers}</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos de Evolução */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Gráfico de Receita Mensal */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    Receita Mensal
                  </CardTitle>
                  <CardDescription>Evolução nos últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.monthlyRevenue}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                        <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="value"
                          name="Receita"
                          stroke={CHART_COLORS.success}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico de Reservas por Mês */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-400" />
                    Reservas por Mês
                  </CardTitle>
                  <CardDescription>Volume de reservas no período</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.bookingsByMonth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                        <YAxis stroke="#9ca3af" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                          dataKey="count"
                          name="Reservas"
                          fill={CHART_COLORS.info}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Equipamentos e Clientes */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base">Top Equipamentos</CardTitle>
                  <CardDescription>Por receita gerada</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.topEquipments.length > 0 ? (
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.topEquipments} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis type="number" stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                          <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={11} width={100} tick={{ fill: '#9ca3af' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="revenue" name="Receita" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 text-center py-8">Nenhum dado disponível</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base">Top Clientes</CardTitle>
                  <CardDescription>Por valor gasto</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.topCustomers.length > 0 ? (
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.topCustomers} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis type="number" stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                          <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={11} width={100} tick={{ fill: '#9ca3af' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="totalSpent" name="Valor" fill={CHART_COLORS.secondary} radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 text-center py-8">Nenhum dado disponível</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Financeiro */}
          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500">Receita Total</p>
                  <p className="text-xl font-bold text-emerald-400">{formatCurrency(data.totalRevenue)}</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500">Ticket Medio</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(data.averageTicket)}</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500">Pagamentos Pendentes</p>
                  <p className="text-xl font-bold text-yellow-400">{formatCurrency(data.pendingPayments)}</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500">Taxa de Conversao</p>
                  <p className="text-xl font-bold text-blue-400">
                    {data.totalBookings > 0 ? ((data.bookingsByStatus.find(s => s.status === "COMPLETED")?.count || 0) / data.totalBookings * 100).toFixed(0) : 0}%
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Gráfico de Receita Mensal - Barras */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-emerald-400" />
                    Receita Mensal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.monthlyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                        <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Receita" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico de Pizza - Receita por Status */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-violet-400" />
                    Receita por Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.revenueByStatus.map((item) => ({
                            ...item,
                            name: getStatusLabel(item.status),
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                        >
                          {data.revenueByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value) => <span className="text-zinc-300 text-xs">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Equipamentos */}
          <TabsContent value="equipment" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500">Total Equipamentos</p>
                  <p className="text-xl font-bold text-white">
                    {data.equipmentsByStatus.reduce((s, i) => s + i.count, 0)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500">Disponiveis</p>
                  <p className="text-xl font-bold text-emerald-400">{data.activeEquipments}</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500">Taxa de Utilizacao</p>
                  <p className="text-xl font-bold text-blue-400">{data.utilizationRate.toFixed(0)}%</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Gráfico de Pizza - Por Categoria */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-cyan-400" />
                    Por Categoria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.equipmentsByCategory.length > 0 ? (
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.equipmentsByCategory.map((item) => ({
                              ...item,
                              name: item.category,
                            }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="count"
                            nameKey="name"
                          >
                            {data.equipmentsByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value) => <span className="text-zinc-300 text-xs">{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 text-center py-8">Nenhum dado disponível</p>
                  )}
                </CardContent>
              </Card>

              {/* Gráfico de Pizza - Por Status */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-amber-400" />
                    Por Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.equipmentsByStatus.length > 0 ? (
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.equipmentsByStatus.map((item) => ({
                              ...item,
                              name: getStatusLabel(item.status),
                            }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="count"
                            nameKey="name"
                          >
                            {data.equipmentsByStatus.map((entry, index) => {
                              const statusColors: Record<string, string> = {
                                AVAILABLE: CHART_COLORS.success,
                                RENTED: CHART_COLORS.info,
                                MAINTENANCE: CHART_COLORS.warning,
                                INACTIVE: "#6b7280",
                              }
                              return <Cell key={`cell-${index}`} fill={statusColors[entry.status] || PIE_COLORS[index]} />
                            })}
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value) => <span className="text-zinc-300 text-xs">{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 text-center py-8">Nenhum dado disponível</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Equipamentos por Receita */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Top 5 Equipamentos por Receita
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.topEquipments.length > 0 ? (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.topEquipments} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis type="number" stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={11} width={120} tick={{ fill: '#9ca3af' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="revenue" name="Receita" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 text-center py-8">Nenhum dado disponível</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reservas */}
          <TabsContent value="bookings" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500">Total Reservas</p>
                  <p className="text-xl font-bold text-white">{data.totalBookings}</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500">Duracao Media</p>
                  <p className="text-xl font-bold text-white">{data.averageDuration.toFixed(1)} dias</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500">Confirmadas</p>
                  <p className="text-xl font-bold text-blue-400">
                    {data.bookingsByStatus.find(s => s.status === "CONFIRMED")?.count || 0}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500">Concluidas</p>
                  <p className="text-xl font-bold text-emerald-400">
                    {data.bookingsByStatus.find(s => s.status === "COMPLETED")?.count || 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Gráfico de Linha - Reservas por Mês */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                    Evolução de Reservas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.bookingsByMonth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                        <YAxis stroke="#9ca3af" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="count"
                          name="Reservas"
                          stroke={CHART_COLORS.info}
                          strokeWidth={2}
                          dot={{ fill: CHART_COLORS.info, strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: CHART_COLORS.info, strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico de Pizza - Status das Reservas */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-violet-400" />
                    Status das Reservas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.bookingsByStatus.length > 0 ? (
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.bookingsByStatus.map((item) => ({
                              ...item,
                              name: getStatusLabel(item.status),
                            }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="count"
                            nameKey="name"
                          >
                            {data.bookingsByStatus.map((entry, index) => {
                              const statusColors: Record<string, string> = {
                                PENDING: CHART_COLORS.warning,
                                CONFIRMED: CHART_COLORS.info,
                                COMPLETED: CHART_COLORS.success,
                                CANCELLED: CHART_COLORS.danger,
                              }
                              return <Cell key={`cell-${index}`} fill={statusColors[entry.status] || PIE_COLORS[index]} />
                            })}
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value) => <span className="text-zinc-300 text-xs">{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 text-center py-8">Nenhum dado disponível</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-base">Reservas Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Equipamento</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-zinc-500">
                          Nenhuma reserva encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.recentBookings.map((booking: any) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">{booking.customer?.name || "-"}</TableCell>
                          <TableCell>{booking.equipment?.name || "-"}</TableCell>
                          <TableCell>
                            {booking.startDate && booking.endDate
                              ? `${formatDate(booking.startDate)} - ${formatDate(booking.endDate)}`
                              : "-"}
                          </TableCell>
                          <TableCell>{formatCurrency(booking.totalPrice || 0)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(booking.status)}>
                              {getStatusLabel(booking.status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clientes */}
          <TabsContent value="customers" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500">Total Clientes</p>
                  <p className="text-xl font-bold text-white">{data.totalCustomers}</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500">Novos Este Mes</p>
                  <p className="text-xl font-bold text-emerald-400">{data.newCustomersThisMonth}</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500">Media por Cliente</p>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(data.totalCustomers > 0 ? data.totalRevenue / data.totalCustomers : 0)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Gráfico de Barras - Top Clientes */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-violet-400" />
                    Melhores Clientes
                  </CardTitle>
                  <CardDescription>Por valor total gasto</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.topCustomers.length > 0 ? (
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.topCustomers} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis type="number" stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                          <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={11} width={100} tick={{ fill: '#9ca3af' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="totalSpent" name="Valor" fill={CHART_COLORS.secondary} radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 text-center py-8">Nenhum dado disponível</p>
                  )}
                </CardContent>
              </Card>

              {/* Gráfico de Pizza - Clientes por Cidade */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-cyan-400" />
                    Clientes por Cidade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.customersByCity.length > 0 ? (
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.customersByCity.map((item) => ({
                              ...item,
                              name: item.city,
                            }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="count"
                            nameKey="name"
                          >
                            {data.customersByCity.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value) => <span className="text-zinc-300 text-xs">{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 text-center py-8">Nenhum dado disponível</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
