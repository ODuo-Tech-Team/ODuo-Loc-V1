"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Users, Calendar, Package, Eye, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { CustomerTabs } from "@/components/customer"
import { formatCurrency } from "@/lib/utils"

interface Booking {
  id: string
  bookingNumber: string
  startDate: string
  endDate: string
  totalPrice: number
  status: string
  equipment?: {
    name: string
  }
  items?: Array<{
    equipment: {
      name: string
    }
    quantity: number
  }>
}

interface Customer {
  id: string
  name: string
  bookings: Booking[]
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  CONFIRMED: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  COMPLETED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/40",
}

export default function CustomerHistoricoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await fetch(`/api/customers/${id}`)
        if (response.ok) {
          const data = await response.json()
          setCustomer(data)
        } else {
          router.push("/clientes")
        }
      } catch (error) {
        console.error("Error fetching customer:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomer()
  }, [id, router])

  if (loading || !customer) {
    return null
  }

  // Calcular estatísticas
  const totalBookings = customer.bookings?.length || 0
  const totalValue = customer.bookings?.reduce((sum, b) => sum + b.totalPrice, 0) || 0
  const completedBookings = customer.bookings?.filter(b => b.status === "COMPLETED").length || 0

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/clientes" className="hover:text-foreground transition-colors">
          Clientes
        </Link>
        <span>/</span>
        <Link href={`/clientes/${id}`} className="hover:text-foreground transition-colors">
          {customer.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">Histórico</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold font-headline tracking-wide flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            {customer.name}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">
            Histórico de orçamentos e locações
          </p>
        </div>
        <Link href={`/reservas/novo?customerId=${id}`}>
          <Button className="gap-2">
            <Calendar className="h-4 w-4" />
            Novo Orçamento
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <CustomerTabs customerId={id} activeTab="historico" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
              <Package className="h-4 w-4" />
              Total de Orçamentos
            </div>
            <p className="text-2xl font-bold">{totalBookings}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
              <DollarSign className="h-4 w-4" />
              Valor Total
            </div>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
              <Calendar className="h-4 w-4" />
              Concluídos
            </div>
            <p className="text-2xl font-bold">{completedBookings}</p>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Orçamentos */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="font-headline tracking-wide">Orçamentos</CardTitle>
          <CardDescription>
            Todos os orçamentos deste cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customer.bookings && customer.bookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead>Orçamento</TableHead>
                  <TableHead>Equipamentos</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.bookings.map((booking) => {
                  // Determinar equipamentos
                  const equipmentNames = booking.items && booking.items.length > 0
                    ? booking.items.map(item => item.equipment.name).join(", ")
                    : booking.equipment?.name || "N/A"

                  return (
                    <TableRow key={booking.id} className="border-zinc-800">
                      <TableCell className="font-medium">
                        #{booking.bookingNumber.slice(-6)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {equipmentNames}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(booking.startDate).toLocaleDateString("pt-BR")}
                          {" - "}
                          {new Date(booking.endDate).toLocaleDateString("pt-BR")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(booking.totalPrice)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusStyles[booking.status] || statusStyles.PENDING}
                        >
                          {statusLabels[booking.status] || booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/reservas/${booking.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum orçamento encontrado</p>
              <Link href={`/reservas/novo?customerId=${id}`}>
                <Button variant="outline" className="mt-4">
                  Criar Primeiro Orçamento
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
