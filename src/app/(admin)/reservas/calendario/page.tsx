"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, dateFnsLocalizer } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar as CalendarIcon, Loader2, List } from "lucide-react"
import Link from "next/link"

const locales = {
  "pt-BR": ptBR,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface Booking {
  id: string
  startDate: string
  endDate: string
  totalPrice: number
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"
  notes: string | null
  equipment: {
    id: string
    name: string
    category: string
  }
  customer: {
    id: string
    name: string
    phone: string
  }
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Booking
}

const statusColors = {
  PENDING: "#eab308", // yellow
  CONFIRMED: "#3b82f6", // blue
  CANCELLED: "#ef4444", // red
  COMPLETED: "#22c55e", // green
}

const statusLabels = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Concluída",
}

export default function CalendarioPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/bookings?${params}`)
      if (response.ok) {
        const data = await response.json()
        // Garantir que data seja sempre um array
        setBookings(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error fetching bookings:", error)
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [statusFilter])

  // Convert bookings to calendar events
  const events: CalendarEvent[] = bookings.map((booking) => ({
    id: booking.id,
    title: `${booking.customer.name} - ${booking.equipment.name}`,
    start: new Date(booking.startDate),
    end: new Date(booking.endDate),
    resource: booking,
  }))

  // Event style based on status
  const eventStyleGetter = (event: CalendarEvent) => {
    const backgroundColor = statusColors[event.resource.status]
    return {
      style: {
        backgroundColor,
        borderRadius: "5px",
        opacity: event.resource.status === "CANCELLED" ? 0.6 : 1,
        color: "white",
        border: "0px",
        display: "block",
        fontSize: "0.875rem",
        fontWeight: 500,
      },
    }
  }

  // Handle event click
  const handleSelectEvent = (event: CalendarEvent) => {
    router.push(`/reservas/${event.id}`)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-headline tracking-wide">
            Calendário de Reservas
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize todas as reservas em formato de calendário
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/reservas">
            <Button variant="outline" className="gap-2">
              <List className="h-4 w-4" />
              Ver Lista
            </Button>
          </Link>
          <Link href="/reservas/novo">
            <Button className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              Nova Reserva
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters and Legend */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline tracking-wide">Filtros</CardTitle>
            <CardDescription>Filtre por status da reserva</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                <SelectItem value="COMPLETED">Concluída</SelectItem>
                <SelectItem value="CANCELLED">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline tracking-wide">Legenda</CardTitle>
            <CardDescription>Cores por status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(statusColors).map(([status, color]) => (
                <div key={status} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm">
                    {statusLabels[status as keyof typeof statusLabels]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline tracking-wide">Calendário</CardTitle>
          <CardDescription>
            Clique em uma reserva para ver detalhes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <style jsx global>{`
            /* Destaque para o dia atual no react-big-calendar */
            .rbc-today {
              background-color: hsl(var(--primary) / 0.15) !important;
            }

            .rbc-today .rbc-button-link {
              color: hsl(var(--primary)) !important;
              font-weight: 700 !important;
            }

            .rbc-day-bg.rbc-today {
              border: 2px solid hsl(var(--primary)) !important;
              border-radius: 4px;
            }

            /* Número do dia atual em destaque */
            .rbc-date-cell.rbc-now .rbc-button-link {
              background: hsl(var(--primary)) !important;
              color: white !important;
              border-radius: 50%;
              width: 28px;
              height: 28px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
            }

            /* Melhorar visual geral */
            .rbc-header {
              padding: 10px 4px;
              font-weight: 600;
              color: hsl(var(--muted-foreground));
              text-transform: uppercase;
              font-size: 0.75rem;
            }

            .rbc-off-range-bg {
              background-color: hsl(var(--muted) / 0.3);
            }

            .rbc-date-cell {
              padding: 4px 8px;
            }

            .rbc-toolbar button {
              border-radius: 6px;
            }

            .rbc-toolbar button.rbc-active {
              background-color: hsl(var(--primary));
              border-color: hsl(var(--primary));
            }
          `}</style>
          <div style={{ height: "700px" }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%" }}
              eventPropGetter={eventStyleGetter}
              onSelectEvent={handleSelectEvent}
              culture="pt-BR"
              messages={{
                next: "Próximo",
                previous: "Anterior",
                today: "Hoje",
                month: "Mês",
                week: "Semana",
                day: "Dia",
                agenda: "Agenda",
                date: "Data",
                time: "Hora",
                event: "Reserva",
                noEventsInRange: "Não há reservas neste período.",
                showMore: (total) => `+ ${total} mais`,
              }}
              views={["month", "week", "day", "agenda"]}
              defaultView="month"
              popup
              tooltipAccessor={(event: CalendarEvent) =>
                `${event.resource.customer.name} - ${event.resource.equipment.name}\n${formatCurrency(event.resource.totalPrice)}`
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Reservas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
          </CardContent>
        </Card>

        {Object.entries(statusLabels).map(([status, label]) => {
          const count = bookings.filter((b) => b.status === status).length
          return (
            <Card key={status}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        statusColors[status as keyof typeof statusColors],
                    }}
                  />
                  <div className="text-2xl font-bold">{count}</div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
