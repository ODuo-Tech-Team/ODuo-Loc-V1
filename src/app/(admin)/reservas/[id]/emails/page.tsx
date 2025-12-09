"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import {
  Mail,
  Send,
  FileText,
  Bell,
  CheckCircle,
  Clock,
  Loader2,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdminPageHeader } from "@/components/admin"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { BookingTabs } from "@/components/booking"

interface Booking {
  id: string
  bookingNumber: string
  status: string
  totalPrice: number
  startDate: string
  endDate: string
  confirmationSent: boolean
  reminderSent: boolean
  customer: {
    name: string
    email: string | null
    phone: string | null
  }
  equipment: {
    name: string
  }
}

export default function EmailsOrcamentoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [resolvedParams.id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/bookings/${resolvedParams.id}`)
      if (!response.ok) throw new Error("Orçamento não encontrado")
      const data = await response.json()
      setBooking(data)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados")
      router.push("/reservas")
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmail = async (type: string) => {
    if (!booking?.customer.email) {
      toast.error("Cliente não possui email cadastrado")
      return
    }

    setSendingEmail(type)
    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: resolvedParams.id, type }),
      })

      if (response.ok) {
        toast.success("Email enviado com sucesso!")
        fetchData() // Recarrega para atualizar status
      } else {
        const data = await response.json()
        toast.error(data.error || "Erro ao enviar email")
      }
    } catch (error) {
      console.error("Error sending email:", error)
      toast.error("Erro ao enviar email")
    } finally {
      setSendingEmail(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!booking) {
    return null
  }

  const emailTypes = [
    {
      type: "confirmation",
      title: "Confirmação de Orçamento",
      description: "Envia o orçamento detalhado para o cliente aprovar",
      icon: CheckCircle,
      color: "text-green-400",
      sent: booking.confirmationSent,
    },
    {
      type: "reminder",
      title: "Lembrete de Locação",
      description: "Envia um lembrete sobre a data de início da locação",
      icon: Bell,
      color: "text-amber-400",
      sent: booking.reminderSent,
    },
    {
      type: "contract",
      title: "Contrato por Email",
      description: "Envia o contrato de locação em anexo",
      icon: FileText,
      color: "text-blue-400",
      sent: false,
    },
    {
      type: "receiptDocument",
      title: "Recibo por Email",
      description: "Envia o recibo de pagamento em anexo",
      icon: Mail,
      color: "text-purple-400",
      sent: false,
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Contratos & Emails"
        description={`${booking.customer.name} - ${booking.equipment.name}`}
        icon={Mail}
        iconColor="text-purple-400"
        backHref="/reservas"
        backLabel="Voltar para Orçamentos"
      />

      {/* Navigation Tabs */}
      <BookingTabs bookingId={resolvedParams.id} activeTab="email" />

      {/* Info do Cliente */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="font-headline tracking-wide">Informações de Contato</CardTitle>
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
                  <span className="text-amber-400">Não cadastrado</span>
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
              <p className="text-sm text-muted-foreground">Período</p>
              <p className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(booking.startDate)} até {formatDate(booking.endDate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant="outline" className="mt-1">
                {booking.status === "PENDING" && "Pendente"}
                {booking.status === "CONFIRMED" && "Confirmado"}
                {booking.status === "COMPLETED" && "Concluído"}
                {booking.status === "CANCELLED" && "Cancelado"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enviar Emails */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="font-headline tracking-wide flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enviar Comunicações
          </CardTitle>
          <CardDescription>
            Envie emails e documentos para o cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!booking.customer.email ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                O cliente não possui email cadastrado.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Atualize o cadastro do cliente para enviar emails.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {emailTypes.map((email) => {
                const Icon = email.icon
                return (
                  <Card key={email.type} className="bg-zinc-800/50 border-zinc-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg bg-zinc-900 ${email.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-medium">{email.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {email.description}
                            </p>
                            {email.sent && (
                              <div className="flex items-center gap-1 mt-2 text-green-400 text-xs">
                                <CheckCircle className="h-3 w-3" />
                                Já enviado
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendEmail(email.type)}
                          disabled={sendingEmail === email.type}
                        >
                          {sendingEmail === email.type ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          {email.sent ? "Reenviar" : "Enviar"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
