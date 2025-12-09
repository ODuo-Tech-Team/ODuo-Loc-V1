"use client"

import { useRef, useCallback } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import listPlugin from "@fullcalendar/list"
import { EventClickArg, DateSelectArg, EventDropArg } from "@fullcalendar/core"
import type { EventResizeDoneArg } from "@fullcalendar/interaction"
import ptBrLocale from "@fullcalendar/core/locales/pt-br"
import { Loader2 } from "lucide-react"

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

interface CalendarWrapperProps {
  events: CalendarEvent[]
  eventsLoading: boolean
  onEventClick: (arg: EventClickArg) => void
  onDateSelect: (arg: DateSelectArg) => void
  onEventDrop: (arg: EventDropArg) => void
  onEventResize: (arg: EventResizeDoneArg) => void
  onDatesSet: (arg: { start: Date; end: Date }) => void
  onLoading: (isLoading: boolean) => void
}

export default function CalendarWrapper({
  events,
  eventsLoading,
  onEventClick,
  onDateSelect,
  onEventDrop,
  onEventResize,
  onDatesSet,
  onLoading,
}: CalendarWrapperProps) {
  const calendarRef = useRef<FullCalendar>(null)

  return (
    <div className="calendar-container relative">
      {eventsLoading && (
        <div className="absolute top-2 right-2 z-10">
          <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Carregando...</span>
          </div>
        </div>
      )}
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        locale={ptBrLocale}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,listWeek",
        }}
        events={events}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={3}
        eventClick={onEventClick}
        select={onDateSelect}
        eventDrop={onEventDrop}
        eventResize={onEventResize}
        datesSet={onDatesSet}
        height="auto"
        aspectRatio={1.8}
        eventDisplay="block"
        displayEventTime={false}
        eventClassNames="cursor-pointer rounded-md px-2 py-1 text-xs font-medium shadow-sm"
        lazyFetching={true}
        loading={onLoading}
      />
    </div>
  )
}
