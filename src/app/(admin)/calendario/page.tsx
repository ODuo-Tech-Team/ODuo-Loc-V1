"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { EventClickArg, DateSelectArg, EventDropArg } from "@fullcalendar/core"
import type { EventResizeDoneArg } from "@fullcalendar/interaction"
import { Button } from "@/components/ui/button"

// Dynamic import do calendário para code splitting
const CalendarWrapper = dynamic(
  () => import("@/components/calendar/CalendarWrapper"),
  {
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    ),
    ssr: false, // FullCalendar não funciona bem com SSR
  }
)
import {
  Card,
  CardContent,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  Plus,
  Filter,
  Phone,
  Package,
  User,
  DollarSign,
  Clock,
  ExternalLink,
  Loader2
} from "lucide-react"
import { usePlanLimits } from "@/hooks/usePlanLimits"
import { LimitWarningBanner } from "@/components/plan"

interface Equipment {
  id: string
  name: string
  category: string
  pricePerDay: number
}

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
}

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  backgroundColor: string
  borderColor: string
  extendedProps: {
    bookingId: string
    equipmentId: string
    equipmentName: string
    equipmentCategory: string
    customerId: string
    customerName: string
    customerPhone: string | null
    status: string
    totalPrice: number
    notes: string | null
  }
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Concluída",
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-500/20 text-amber-500 border-amber-500/20",
  CONFIRMED: "bg-blue-500/20 text-blue-500 border-blue-500/20",
  CANCELLED: "bg-red-500/20 text-red-500 border-red-500/20",
  COMPLETED: "bg-emerald-500/20 text-emerald-500 border-emerald-500/20",
}

export default function CalendarioPage() {
  const router = useRouter()

  // Hook de limites do plano
  const { usage, isNearBookingLimit, isAtBookingLimit } = usePlanLimits()

  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [eventsLoading, setEventsLoading] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<string>("all")
  const [currentDateRange, setCurrentDateRange] = useState<{ start: string; end: string } | null>(null)
  const isInitialMount = useRef(true)

  // Modal de detalhes da reserva
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Modal de nova reserva
  const [newBookingOpen, setNewBookingOpen] = useState(false)
  const [newBookingDates, setNewBookingDates] = useState<{ start: string; end: string } | null>(null)
  const [newBookingData, setNewBookingData] = useState({
    customerId: "",
    equipmentId: "",
    totalPrice: "",
    notes: "",
  })
  const [creating, setCreating] = useState(false)

  // Carregamento inicial - busca equipamentos e clientes em paralelo
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [equipmentsRes, customersRes] = await Promise.all([
          fetch("/api/equipments"),
          fetch("/api/customers")
        ])

        if (equipmentsRes.ok) {
          const data = await equipmentsRes.json()
          setEquipments(Array.isArray(data) ? data : [])
        }
        if (customersRes.ok) {
          const data = await customersRes.json()
          setCustomers(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error)
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [])

  // Busca eventos quando o filtro de equipamento muda (após load inicial)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (currentDateRange) {
      fetchEvents(currentDateRange.start, currentDateRange.end)
    }
  }, [selectedEquipment])

  const fetchEvents = useCallback(async (start?: string, end?: string) => {
    try {
      setEventsLoading(true)
      const params = new URLSearchParams()

      if (start) params.set("start", start)
      if (end) params.set("end", end)
      if (selectedEquipment !== "all") params.set("equipmentId", selectedEquipment)

      const response = await fetch(`/api/bookings/calendar?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setEvents(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Erro ao buscar eventos:", error)
      toast.error("Erro ao carregar calendário")
    } finally {
      setEventsLoading(false)
    }
  }, [selectedEquipment])

  const handleDatesSet = useCallback((arg: { start: Date; end: Date }) => {
    const start = arg.start.toISOString()
    const end = arg.end.toISOString()
    setCurrentDateRange({ start, end })
    fetchEvents(start, end)
  }, [fetchEvents])

  const handleEventClick = (arg: EventClickArg) => {
    setSelectedEvent(arg.event.toPlainObject() as unknown as CalendarEvent)
    setDetailsOpen(true)
  }

  const handleDateSelect = (arg: DateSelectArg) => {
    setNewBookingDates({
      start: arg.startStr,
      end: arg.endStr,
    })
    setNewBookingData({
      customerId: "",
      equipmentId: selectedEquipment !== "all" ? selectedEquipment : "",
      totalPrice: "",
      notes: "",
    })
    setNewBookingOpen(true)
  }

  const handleEventDrop = async (arg: EventDropArg) => {
    const { event } = arg
    const bookingId = event.extendedProps.bookingId

    try {
      const response = await fetch("/api/bookings/calendar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          startDate: event.startStr,
          endDate: event.endStr || event.startStr,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao mover orçamento")
      }

      toast.success("Orçamento atualizado com sucesso!")
      if (currentDateRange) fetchEvents(currentDateRange.start, currentDateRange.end)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao mover orçamento")
      arg.revert()
    }
  }

  const handleEventResize = async (arg: EventResizeDoneArg) => {
    const { event } = arg
    const bookingId = event.extendedProps.bookingId

    try {
      const response = await fetch("/api/bookings/calendar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          startDate: event.startStr,
          endDate: event.endStr || event.startStr,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao redimensionar orçamento")
      }

      toast.success("Orçamento atualizado com sucesso!")
      if (currentDateRange) fetchEvents(currentDateRange.start, currentDateRange.end)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao redimensionar orçamento")
      arg.revert()
    }
  }

  const handleCreateBooking = async () => {
    if (!newBookingDates || !newBookingData.customerId || !newBookingData.equipmentId || !newBookingData.totalPrice) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    setCreating(true)
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: newBookingData.customerId,
          equipmentId: newBookingData.equipmentId,
          startDate: newBookingDates.start,
          endDate: newBookingDates.end,
          totalPrice: parseFloat(newBookingData.totalPrice),
          notes: newBookingData.notes || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao criar orçamento")
      }

      toast.success("Orçamento criado com sucesso!")
      setNewBookingOpen(false)
      if (currentDateRange) fetchEvents(currentDateRange.start, currentDateRange.end)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar orçamento")
    } finally {
      setCreating(false)
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

  const calculateDays = () => {
    if (!newBookingDates) return 0
    const start = new Date(newBookingDates.start)
    const end = new Date(newBookingDates.end)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays || 1
  }

  const handleEquipmentChange = (equipmentId: string) => {
    setNewBookingData(prev => {
      const equipment = equipments.find(e => e.id === equipmentId)
      const days = calculateDays()
      const suggestedPrice = equipment ? equipment.pricePerDay * days : 0
      return {
        ...prev,
        equipmentId,
        totalPrice: suggestedPrice.toFixed(2),
      }
    })
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-headline tracking-wide">
            Calendário de Orçamentos
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize e gerencie todos os orçamentos
          </p>
        </div>
        <Button onClick={() => router.push("/reservas/novo")} disabled={isAtBookingLimit}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      {/* Banner de Limite */}
      {usage && (isNearBookingLimit || isAtBookingLimit) && (
        <LimitWarningBanner
          type="bookings"
          current={usage.bookingsThisMonth.current}
          max={usage.bookingsThisMonth.max}
          percentage={usage.bookingsThisMonth.percentage}
        />
      )}

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-full sm:w-64">
              <Label className="text-sm text-muted-foreground mb-2 block">
                Equipamento
              </Label>
              <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os equipamentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os equipamentos</SelectItem>
                  {equipments.map((equipment) => (
                    <SelectItem key={equipment.id} value={equipment.id}>
                      {equipment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap gap-3 items-center ml-auto">
              <span className="text-sm text-muted-foreground">Legenda:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span className="text-xs">Pendente</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-xs">Confirmada</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-xs">Concluída</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendário */}
      <Card className="overflow-hidden">
        <CardContent className="p-2 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <CalendarWrapper
              events={events}
              eventsLoading={eventsLoading}
              onEventClick={handleEventClick}
              onDateSelect={handleDateSelect}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventResize}
              onDatesSet={handleDatesSet}
              onLoading={setEventsLoading}
            />
          )}
        </CardContent>
      </Card>

      {/* Sheet de Detalhes da Reserva */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Detalhes do Orçamento</SheetTitle>
            <SheetDescription>
              Informações completas do orçamento selecionado
            </SheetDescription>
          </SheetHeader>

          {selectedEvent && (
            <div className="mt-6 space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={statusColors[selectedEvent.extendedProps.status]} variant="outline">
                  {statusLabels[selectedEvent.extendedProps.status]}
                </Badge>
              </div>

              {/* Equipamento */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  Equipamento
                </div>
                <div className="pl-6">
                  <p className="font-medium">{selectedEvent.extendedProps.equipmentName}</p>
                  <p className="text-sm text-muted-foreground">{selectedEvent.extendedProps.equipmentCategory}</p>
                </div>
              </div>

              {/* Cliente */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  Cliente
                </div>
                <div className="pl-6">
                  <p className="font-medium">{selectedEvent.extendedProps.customerName}</p>
                  {selectedEvent.extendedProps.customerPhone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedEvent.extendedProps.customerPhone}
                    </p>
                  )}
                </div>
              </div>

              {/* Período */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Período
                </div>
                <div className="pl-6">
                  <p className="font-medium">
                    {formatDate(selectedEvent.start)} até {formatDate(selectedEvent.end)}
                  </p>
                </div>
              </div>

              {/* Valor */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Valor Total
                </div>
                <div className="pl-6">
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(selectedEvent.extendedProps.totalPrice)}
                  </p>
                </div>
              </div>

              {/* Notas */}
              {selectedEvent.extendedProps.notes && (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Observações</span>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">
                    {selectedEvent.extendedProps.notes}
                  </p>
                </div>
              )}

              {/* Ações */}
              <div className="pt-4 flex gap-3">
                <Button
                  className="flex-1"
                  onClick={() => router.push(`/reservas/${selectedEvent.extendedProps.bookingId}`)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </Button>
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Dialog de Novo Orçamento Rápido */}
      <Dialog open={newBookingOpen} onOpenChange={setNewBookingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Orçamento Rápido</DialogTitle>
            <DialogDescription>
              {newBookingDates && (
                <>
                  Período: {formatDate(newBookingDates.start)} até {formatDate(newBookingDates.end)}
                  {" "}({calculateDays()} {calculateDays() === 1 ? "dia" : "dias"})
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Cliente */}
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select
                value={newBookingData.customerId}
                onValueChange={(value) => setNewBookingData(prev => ({ ...prev, customerId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Equipamento */}
            <div className="space-y-2">
              <Label>Equipamento *</Label>
              <Select
                value={newBookingData.equipmentId}
                onValueChange={handleEquipmentChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um equipamento" />
                </SelectTrigger>
                <SelectContent>
                  {equipments.map((equipment) => (
                    <SelectItem key={equipment.id} value={equipment.id}>
                      {equipment.name} - {formatCurrency(equipment.pricePerDay)}/dia
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label>Valor Total (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newBookingData.totalPrice}
                onChange={(e) => setNewBookingData(prev => ({ ...prev, totalPrice: e.target.value }))}
              />
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações sobre o orçamento..."
                value={newBookingData.notes}
                onChange={(e) => setNewBookingData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewBookingOpen(false)} disabled={creating}>
              Cancelar
            </Button>
            <Button onClick={handleCreateBooking} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Orçamento"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Estilos customizados para o calendário */}
      <style jsx global>{`
        .calendar-container {
          --fc-border-color: hsl(var(--border));
          --fc-button-bg-color: hsl(var(--primary));
          --fc-button-border-color: hsl(var(--primary));
          --fc-button-hover-bg-color: hsl(var(--primary) / 0.9);
          --fc-button-hover-border-color: hsl(var(--primary) / 0.9);
          --fc-button-active-bg-color: hsl(var(--primary) / 0.8);
          --fc-button-active-border-color: hsl(var(--primary) / 0.8);
          --fc-today-bg-color: hsl(var(--primary) / 0.1);
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: hsl(var(--muted));
          --fc-list-event-hover-bg-color: hsl(var(--muted));
        }

        .fc {
          font-family: inherit;
        }

        .fc .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 600;
        }

        .fc .fc-button {
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
          font-weight: 500;
          border-radius: 0.375rem;
        }

        .fc .fc-button-primary:not(:disabled).fc-button-active,
        .fc .fc-button-primary:not(:disabled):active {
          background-color: hsl(var(--primary));
          border-color: hsl(var(--primary));
        }

        .fc-theme-standard .fc-scrollgrid {
          border-color: hsl(var(--border));
        }

        .fc-theme-standard td,
        .fc-theme-standard th {
          border-color: hsl(var(--border));
        }

        .fc .fc-daygrid-day-number {
          color: hsl(var(--foreground));
          font-weight: 500;
        }

        .fc .fc-col-header-cell-cushion {
          color: hsl(var(--muted-foreground));
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
        }

        /* DESTAQUE DO DIA ATUAL - Estilos com alta especificidade */
        .fc .fc-daygrid-day.fc-day-today {
          background-color: hsl(var(--primary) / 0.15) !important;
          position: relative !important;
        }

        .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-frame {
          border: 2px solid hsl(var(--primary)) !important;
          border-radius: 8px !important;
          background-color: hsl(var(--primary) / 0.08) !important;
        }

        .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number,
        .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-top a {
          background: hsl(var(--primary)) !important;
          color: white !important;
          border-radius: 50% !important;
          width: 28px !important;
          height: 28px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-weight: 700 !important;
          margin: 4px !important;
          text-decoration: none !important;
        }

        /* Garantir destaque também na view de semana/dia */
        .fc .fc-timegrid-col.fc-day-today {
          background-color: hsl(var(--primary) / 0.1) !important;
        }

        .fc .fc-col-header-cell.fc-day-today {
          background-color: hsl(var(--primary) / 0.15) !important;
        }

        .fc .fc-col-header-cell.fc-day-today .fc-col-header-cell-cushion {
          color: hsl(var(--primary)) !important;
          font-weight: 700 !important;
        }

        /* Destaque na lista também */
        .fc .fc-list-day.fc-day-today {
          background-color: hsl(var(--primary) / 0.15) !important;
        }

        .fc .fc-list-day.fc-day-today .fc-list-day-cushion {
          background-color: hsl(var(--primary)) !important;
          color: white !important;
        }

        .fc .fc-daygrid-event {
          border-radius: 4px;
          font-size: 0.75rem;
          padding: 2px 4px;
        }

        .fc .fc-daygrid-more-link {
          color: hsl(var(--primary));
          font-weight: 600;
        }

        .fc .fc-popover {
          background: hsl(var(--card));
          border-color: hsl(var(--border));
        }

        .fc .fc-popover-header {
          background: hsl(var(--muted));
        }

        .fc-direction-ltr .fc-daygrid-event.fc-event-end,
        .fc-direction-rtl .fc-daygrid-event.fc-event-start {
          margin-right: 2px;
        }

        .fc-direction-ltr .fc-daygrid-event.fc-event-start,
        .fc-direction-rtl .fc-daygrid-event.fc-event-end {
          margin-left: 2px;
        }

        /* Feedback visual durante seleção/arrasto */
        .fc .fc-highlight {
          background: rgba(59, 130, 246, 0.25) !important;
          border: 2px dashed #3b82f6 !important;
          border-radius: 6px;
          transition: all 0.15s ease;
        }

        /* Cursor durante hover em slots do calendário */
        .fc .fc-timegrid-slot:hover,
        .fc .fc-daygrid-day:hover {
          cursor: crosshair;
        }

        /* Efeito ao clicar e segurar (arrasto) */
        .fc .fc-timegrid-slot:active,
        .fc .fc-daygrid-day-frame:active {
          background: rgba(59, 130, 246, 0.1);
        }

        /* Mirror (preview) do evento sendo criado/arrastado */
        .fc .fc-event-mirror {
          background: rgba(59, 130, 246, 0.6) !important;
          border: 2px solid #3b82f6 !important;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          opacity: 0.85;
        }

        /* Evento sendo arrastado */
        .fc .fc-event-dragging {
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
          transform: scale(1.02);
        }

        /* Evento sendo redimensionado */
        .fc .fc-event-resizing {
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        /* Responsividade */
        @media (max-width: 640px) {
          .fc .fc-toolbar {
            flex-direction: column;
            gap: 0.5rem;
          }

          .fc .fc-toolbar-title {
            font-size: 1rem;
          }

          .fc .fc-button {
            padding: 0.375rem 0.75rem;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  )
}
