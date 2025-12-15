import { redirect } from "next/navigation"
import { Mail, Calendar } from "lucide-react"
import { AdminPageHeader } from "@/components/admin"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookingTabs } from "@/components/booking"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EmailsClient } from "./emails-client"

const STATUS_LABELS = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluido",
  CANCELLED: "Cancelado",
} as const

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString("pt-BR")
}

async function getBookingData(bookingId: string, tenantId: string) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, tenantId },
    select: {
      id: true,
      status: true,
      startDate: true,
      endDate: true,
      confirmationSent: true,
      reminderSent: true,
      customer: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
      equipment: {
        select: { name: true },
      },
      items: {
        select: {
          equipment: { select: { name: true } },
        },
        take: 1,
      },
    },
  })

  if (!booking) return null

  return {
    ...booking,
    equipmentName: booking.equipment?.name || booking.items[0]?.equipment?.name || "Equipamento",
  }
}

export default async function EmailsOrcamentoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user?.tenantId) {
    redirect("/login")
  }

  const { id } = await params
  const booking = await getBookingData(id, session.user.tenantId)

  if (!booking) {
    redirect("/reservas")
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Contratos & Emails"
        description={`${booking.customer.name} - ${booking.equipmentName}`}
        icon={Mail}
        iconColor="text-purple-400"
        backHref="/reservas"
        backLabel="Voltar para Orcamentos"
      />

      {/* Navigation Tabs */}
      <BookingTabs bookingId={id} activeTab="email" />

      {/* Info do Cliente */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="font-headline tracking-wide">Informacoes de Contato</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{booking.customer.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">
                {booking.customer.email || (
                  <span className="text-amber-400">Nao cadastrado</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Telefone</p>
              <p className="font-medium">{booking.customer.phone || "-"}</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 mt-4 pt-4 border-t border-zinc-800">
            <div>
              <p className="text-sm text-muted-foreground">Periodo</p>
              <p className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(booking.startDate)} ate {formatDate(booking.endDate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant="outline" className="mt-1">
                {STATUS_LABELS[booking.status as keyof typeof STATUS_LABELS] || booking.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enviar Emails - Client Component */}
      <EmailsClient
        bookingId={id}
        customerEmail={booking.customer.email}
        confirmationSent={booking.confirmationSent}
        reminderSent={booking.reminderSent}
      />
    </div>
  )
}
