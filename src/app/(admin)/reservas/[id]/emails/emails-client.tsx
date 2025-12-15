"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Mail,
  Send,
  FileText,
  Bell,
  CheckCircle,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"

interface EmailsClientProps {
  bookingId: string
  customerEmail: string | null
  confirmationSent: boolean
  reminderSent: boolean
}

const emailTypes = [
  {
    type: "confirmation",
    title: "Confirmacao de Orcamento",
    description: "Envia o orcamento detalhado para o cliente aprovar",
    icon: CheckCircle,
    color: "text-green-400",
    sentKey: "confirmationSent" as const,
  },
  {
    type: "reminder",
    title: "Lembrete de Locacao",
    description: "Envia um lembrete sobre a data de inicio da locacao",
    icon: Bell,
    color: "text-amber-400",
    sentKey: "reminderSent" as const,
  },
  {
    type: "contract",
    title: "Contrato por Email",
    description: "Envia o contrato de locacao em anexo",
    icon: FileText,
    color: "text-blue-400",
    sentKey: null,
  },
  {
    type: "receiptDocument",
    title: "Recibo por Email",
    description: "Envia o recibo de pagamento em anexo",
    icon: Mail,
    color: "text-purple-400",
    sentKey: null,
  },
]

export function EmailsClient({
  bookingId,
  customerEmail,
  confirmationSent: initialConfirmationSent,
  reminderSent: initialReminderSent,
}: EmailsClientProps) {
  const router = useRouter()
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(initialConfirmationSent)
  const [reminderSent, setReminderSent] = useState(initialReminderSent)

  const handleSendEmail = async (type: string) => {
    if (!customerEmail) {
      toast.error("Cliente nao possui email cadastrado")
      return
    }

    setSendingEmail(type)
    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, type }),
      })

      if (response.ok) {
        toast.success("Email enviado com sucesso!")
        // Update local state instead of refetching
        if (type === "confirmation") setConfirmationSent(true)
        if (type === "reminder") setReminderSent(true)
        router.refresh() // Revalidate server data
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

  const getSentStatus = (email: typeof emailTypes[0]) => {
    if (email.sentKey === "confirmationSent") return confirmationSent
    if (email.sentKey === "reminderSent") return reminderSent
    return false
  }

  if (!customerEmail) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="font-headline tracking-wide flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enviar Comunicacoes
          </CardTitle>
          <CardDescription>
            Envie emails e documentos para o cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              O cliente nao possui email cadastrado.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Atualize o cadastro do cliente para enviar emails.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="font-headline tracking-wide flex items-center gap-2">
          <Send className="h-5 w-5" />
          Enviar Comunicacoes
        </CardTitle>
        <CardDescription>
          Envie emails e documentos para o cliente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {emailTypes.map((email) => {
            const Icon = email.icon
            const sent = getSentStatus(email)
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
                        {sent && (
                          <div className="flex items-center gap-1 mt-2 text-green-400 text-xs">
                            <CheckCircle className="h-3 w-3" />
                            Ja enviado
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
                      {sent ? "Reenviar" : "Enviar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
