"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  DollarSign,
  Clock,
  Calendar,
  User,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Plus,
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
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  LeadStatusBadge,
  LeadSourceBadge,
  ContactTypeBadge,
  LeadForm,
  ActivityForm,
  ActivityTimeline,
} from "@/components/comercial"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST"

interface Lead {
  id: string
  name: string
  company?: string | null
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  status: LeadStatus
  source: "DIRECT" | "REFERRAL" | "WEBSITE" | "COLD_CALL" | "SOCIAL_MEDIA" | "EVENT" | "OTHER"
  contactType: "PRESENCIAL" | "ONLINE"
  expectedValue?: number | null
  interestNotes?: string | null
  nextAction?: string | null
  nextActionDate?: string | null
  lostReason?: string | null
  wonAt?: string | null
  lostAt?: string | null
  convertedCustomerId?: string | null
  assignedTo?: {
    id: string
    name: string | null
    email: string | null
  } | null
  activities: any[]
  createdAt: string
  updatedAt: string
}

const statusOptions = [
  { value: "NEW", label: "Novo" },
  { value: "CONTACTED", label: "Contatado" },
  { value: "QUALIFIED", label: "Qualificado" },
  { value: "PROPOSAL", label: "Proposta" },
  { value: "WON", label: "Ganho" },
  { value: "LOST", label: "Perdido" },
]

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const leadId = params.id as string

  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [activitySheetOpen, setActivitySheetOpen] = useState(false)
  const [converting, setConverting] = useState(false)
  const [statusChanging, setStatusChanging] = useState(false)

  useEffect(() => {
    fetchLead()
  }, [leadId])

  const fetchLead = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/comercial/${leadId}`)
      if (!response.ok) throw new Error("Lead nao encontrado")

      const data = await response.json()
      setLead(data)
    } catch (error) {
      toast.error("Erro ao carregar lead")
      router.push("/comercial")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!lead || newStatus === lead.status) return

    try {
      setStatusChanging(true)
      const response = await fetch(`/api/comercial/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const result = await response.json()
        setLead({ ...lead, status: newStatus as LeadStatus })
        toast.success("Status atualizado!")
      } else {
        toast.error("Erro ao atualizar status")
      }
    } catch (error) {
      toast.error("Erro ao atualizar status")
    } finally {
      setStatusChanging(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const response = await fetch(`/api/comercial/${leadId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Lead deletado!")
        router.push("/comercial")
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao deletar lead")
      }
    } catch (error) {
      toast.error("Erro ao deletar lead")
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleConvert = async () => {
    if (!lead || lead.status !== "WON") {
      toast.error("Apenas leads ganhos podem ser convertidos")
      return
    }

    try {
      setConverting(true)
      const response = await fetch(`/api/comercial/${leadId}/convert`, {
        method: "POST",
      })

      if (response.ok) {
        const result = await response.json()
        toast.success("Lead convertido em cliente!")
        setLead({ ...lead, convertedCustomerId: result.customer.id })
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao converter lead")
      }
    } catch (error) {
      toast.error("Erro ao converter lead")
    } finally {
      setConverting(false)
    }
  }

  const handleLeadUpdated = (updatedLead: Lead) => {
    setLead(updatedLead)
    setEditSheetOpen(false)
  }

  const handleActivityCreated = () => {
    fetchLead()
    setActivitySheetOpen(false)
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
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    )
  }

  if (!lead) {
    return null
  }

  const isOverdue = lead.nextActionDate && new Date(lead.nextActionDate) < new Date()

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/comercial">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl md:text-2xl font-bold">{lead.name}</h1>
            <LeadStatusBadge status={lead.status} />
          </div>
          {lead.company && (
            <p className="text-zinc-400 flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4" />
              {lead.company}
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {/* Mudar Status */}
        <Select
          value={lead.status}
          onValueChange={handleStatusChange}
          disabled={statusChanging}
        >
          <SelectTrigger className="w-[160px] h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Nova Atividade */}
        <Sheet open={activitySheetOpen} onOpenChange={setActivitySheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Atividade
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>Nova Atividade</SheetTitle>
              <SheetDescription>
                Registre um contato ou interacao com este lead
              </SheetDescription>
            </SheetHeader>
            <ActivityForm
              leadId={leadId}
              onSuccess={handleActivityCreated}
              onCancel={() => setActivitySheetOpen(false)}
            />
          </SheetContent>
        </Sheet>

        {/* Editar */}
        <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline">
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>Editar Lead</SheetTitle>
            </SheetHeader>
            <LeadForm
              lead={lead}
              onSuccess={handleLeadUpdated}
              onCancel={() => setEditSheetOpen(false)}
            />
          </SheetContent>
        </Sheet>

        {/* Converter em Cliente */}
        {lead.status === "WON" && !lead.convertedCustomerId && (
          <Button
            variant="default"
            onClick={handleConvert}
            disabled={converting}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {converting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Converter em Cliente
          </Button>
        )}

        {lead.convertedCustomerId && (
          <Button
            variant="outline"
            className="text-emerald-400"
            onClick={() => router.push(`/clientes/${lead.convertedCustomerId}`)}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Ver Cliente
          </Button>
        )}

        {/* Deletar */}
        <Button
          variant="ghost"
          className="text-red-400 hover:text-red-300 hover:bg-red-950/50"
          onClick={() => setDeleteDialogOpen(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Info Principal */}
        <div className="md:col-span-2 space-y-6">
          {/* Contato */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base">Informacoes de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="flex items-center gap-3 text-zinc-300 hover:text-white transition-colors"
                >
                  <Phone className="h-4 w-4 text-zinc-500" />
                  {lead.phone}
                </a>
              )}
              {lead.whatsapp && (
                <a
                  href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-green-400 hover:text-green-300 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  {lead.whatsapp}
                </a>
              )}
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-3 text-zinc-300 hover:text-white transition-colors"
                >
                  <Mail className="h-4 w-4 text-zinc-500" />
                  {lead.email}
                </a>
              )}
              {(lead.city || lead.state || lead.address) && (
                <div className="flex items-start gap-3 text-zinc-400">
                  <MapPin className="h-4 w-4 text-zinc-500 mt-0.5" />
                  <div>
                    {lead.address && <p>{lead.address}</p>}
                    {(lead.city || lead.state) && (
                      <p>{[lead.city, lead.state].filter(Boolean).join(" - ")}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Negócio */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base">Detalhes do Negocio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <LeadSourceBadge source={lead.source} />
                <ContactTypeBadge type={lead.contactType} />
              </div>

              {lead.expectedValue && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  <span className="text-lg font-semibold text-emerald-400">
                    {formatCurrency(lead.expectedValue)}
                  </span>
                </div>
              )}

              {lead.interestNotes && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Interesse / Notas</p>
                  <p className="text-zinc-300 whitespace-pre-wrap">
                    {lead.interestNotes}
                  </p>
                </div>
              )}

              {lead.lostReason && lead.status === "LOST" && (
                <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg">
                  <p className="text-xs text-red-400 mb-1">Motivo da Perda</p>
                  <p className="text-zinc-300">{lead.lostReason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline de Atividades */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base">Historico de Atividades</CardTitle>
              <CardDescription>
                {lead.activities.length} atividade(s) registrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityTimeline activities={lead.activities} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Próxima Ação */}
          {(lead.nextAction || lead.nextActionDate) && (
            <Card
              className={`border ${
                isOverdue
                  ? "bg-red-950/30 border-red-900/50"
                  : "bg-amber-950/30 border-amber-900/50"
              }`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className={`h-4 w-4 ${isOverdue ? "text-red-400" : "text-amber-400"}`} />
                  Proxima Acao
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lead.nextAction && (
                  <p className="text-zinc-200 mb-2">{lead.nextAction}</p>
                )}
                {lead.nextActionDate && (
                  <p className={`text-sm ${isOverdue ? "text-red-400" : "text-zinc-400"}`}>
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {format(new Date(lead.nextActionDate), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                    {isOverdue && " (Vencido)"}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Responsável */}
          {lead.assignedTo && (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4 text-zinc-500" />
                  Responsavel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-200">
                  {lead.assignedTo.name || lead.assignedTo.email}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Datas */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Datas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Criado em</span>
                <span className="text-zinc-300">
                  {format(new Date(lead.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Atualizado em</span>
                <span className="text-zinc-300">
                  {format(new Date(lead.updatedAt), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
              {lead.wonAt && (
                <div className="flex justify-between text-emerald-400">
                  <span>Ganho em</span>
                  <span>
                    {format(new Date(lead.wonAt), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}
              {lead.lostAt && (
                <div className="flex justify-between text-red-400">
                  <span>Perdido em</span>
                  <span>
                    {format(new Date(lead.lostAt), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusao</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar este lead? Esta acao nao pode ser
              desfeita. Todas as atividades associadas tambem serao removidas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deletando..." : "Deletar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
