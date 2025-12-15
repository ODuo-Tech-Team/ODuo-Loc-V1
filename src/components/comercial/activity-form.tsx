"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Loader2,
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  Users,
  FileText,
  MoreHorizontal,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type ActivityType = "VISIT" | "CALL" | "WHATSAPP" | "EMAIL" | "MEETING" | "PROPOSAL" | "OTHER"

const activityTypes: { value: ActivityType; label: string; icon: any }[] = [
  { value: "VISIT", label: "Visita", icon: MapPin },
  { value: "CALL", label: "Ligacao", icon: Phone },
  { value: "WHATSAPP", label: "WhatsApp", icon: MessageCircle },
  { value: "EMAIL", label: "Email", icon: Mail },
  { value: "MEETING", label: "Reuniao", icon: Users },
  { value: "PROPOSAL", label: "Proposta", icon: FileText },
  { value: "OTHER", label: "Outro", icon: MoreHorizontal },
]

const statusOptions = [
  { value: "KEEP_CURRENT", label: "Manter atual" },
  { value: "NEW", label: "Novo" },
  { value: "CONTACTED", label: "Contatado" },
  { value: "QUALIFIED", label: "Qualificado" },
  { value: "PROPOSAL", label: "Proposta" },
  { value: "WON", label: "Ganho" },
  { value: "LOST", label: "Perdido" },
]

interface ActivityFormProps {
  leadId: string
  onSuccess?: (activity: any) => void
  onCancel?: () => void
  className?: string
}

export function ActivityForm({ leadId, onSuccess, onCancel, className }: ActivityFormProps) {
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<ActivityType>("CALL")
  const [description, setDescription] = useState("")
  const [updateLeadStatus, setUpdateLeadStatus] = useState("KEEP_CURRENT")
  const [nextAction, setNextAction] = useState("")
  const [nextActionDate, setNextActionDate] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!description.trim()) {
      toast.error("Descricao é obrigatória")
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`/api/comercial/${leadId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          description,
          updateLeadStatus: updateLeadStatus && updateLeadStatus !== "KEEP_CURRENT" ? updateLeadStatus : undefined,
          nextAction: nextAction || undefined,
          nextActionDate: nextActionDate || undefined,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success("Atividade registrada!")
        onSuccess?.(result.activity)
        // Reset form
        setDescription("")
        setUpdateLeadStatus("KEEP_CURRENT")
        setNextAction("")
        setNextActionDate("")
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao registrar atividade")
      }
    } catch (error) {
      console.error("Error creating activity:", error)
      toast.error("Erro ao registrar atividade")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      {/* Tipo de Atividade - Botões grandes para mobile */}
      <div className="space-y-2">
        <Label>Tipo de Atividade</Label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {activityTypes.map((activity) => {
            const Icon = activity.icon
            return (
              <Button
                key={activity.value}
                type="button"
                variant={type === activity.value ? "default" : "outline"}
                className={cn(
                  "h-16 flex-col gap-1",
                  type === activity.value && "ring-2 ring-primary"
                )}
                onClick={() => setType(activity.value)}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{activity.label}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Descricao */}
      <div className="space-y-2">
        <Label>
          O que foi conversado? <span className="text-destructive">*</span>
        </Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva o que foi tratado neste contato..."
          rows={4}
          className="resize-none"
        />
      </div>

      {/* Atualizar Status */}
      <div className="space-y-2">
        <Label>Atualizar Status do Lead</Label>
        <Select value={updateLeadStatus} onValueChange={setUpdateLeadStatus}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Manter status atual" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Proxima Acao */}
      <div className="space-y-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
        <h4 className="text-sm font-medium text-zinc-400">Proxima Acao</h4>

        <div className="space-y-2">
          <Label>O que fazer depois?</Label>
          <Input
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder="Ex: Enviar proposta, ligar novamente..."
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label>Data</Label>
          <Input
            type="date"
            value={nextActionDate}
            onChange={(e) => setNextActionDate(e.target.value)}
            className="h-12"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-12"
            disabled={loading}
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" className="flex-1 h-12" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Registrar Atividade"
          )}
        </Button>
      </div>
    </form>
  )
}
