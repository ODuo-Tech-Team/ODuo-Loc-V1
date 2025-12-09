"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Building2, User, Phone, Mail, MapPin, DollarSign, Calendar } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Schema de validação
const leadFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  company: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  source: z.enum(["DIRECT", "REFERRAL", "WEBSITE", "COLD_CALL", "SOCIAL_MEDIA", "EVENT", "OTHER"]),
  contactType: z.enum(["PRESENCIAL", "ONLINE"]),
  expectedValue: z.string().optional().nullable(),
  interestNotes: z.string().optional().nullable(),
  nextAction: z.string().optional().nullable(),
  nextActionDate: z.string().optional().nullable(),
})

type LeadFormData = z.infer<typeof leadFormSchema>

interface LeadFormProps {
  lead?: any
  onSuccess?: (lead: any) => void
  onCancel?: () => void
  className?: string
}

const sourceOptions = [
  { value: "DIRECT", label: "Direto" },
  { value: "REFERRAL", label: "Indicacao" },
  { value: "WEBSITE", label: "Site" },
  { value: "COLD_CALL", label: "Ligacao Fria" },
  { value: "SOCIAL_MEDIA", label: "Redes Sociais" },
  { value: "EVENT", label: "Evento" },
  { value: "OTHER", label: "Outro" },
]

const contactTypeOptions = [
  { value: "PRESENCIAL", label: "Presencial" },
  { value: "ONLINE", label: "Online" },
]

export function LeadForm({ lead, onSuccess, onCancel, className }: LeadFormProps) {
  const [loading, setLoading] = useState(false)
  const isEditing = !!lead

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: lead?.name || "",
      company: lead?.company || "",
      email: lead?.email || "",
      phone: lead?.phone || "",
      whatsapp: lead?.whatsapp || "",
      address: lead?.address || "",
      city: lead?.city || "",
      state: lead?.state || "",
      source: lead?.source || "DIRECT",
      contactType: lead?.contactType || "PRESENCIAL",
      expectedValue: lead?.expectedValue?.toString() || "",
      interestNotes: lead?.interestNotes || "",
      nextAction: lead?.nextAction || "",
      nextActionDate: lead?.nextActionDate ? new Date(lead.nextActionDate).toISOString().split("T")[0] : "",
    },
  })

  const onSubmit = async (data: LeadFormData) => {
    try {
      setLoading(true)

      const url = isEditing ? `/api/comercial/${lead.id}` : "/api/comercial"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          email: data.email || null,
          expectedValue: data.expectedValue || null,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(isEditing ? "Lead atualizado!" : "Lead criado!")
        onSuccess?.(result.lead || result)
        if (!isEditing) reset()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao salvar lead")
      }
    } catch (error) {
      console.error("Error saving lead:", error)
      toast.error("Erro ao salvar lead")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn("space-y-6", className)}>
      {/* Dados do Prospect */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
          <User className="h-4 w-4" />
          Dados do Prospect
        </h3>

        <div className="grid gap-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label>
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register("name")}
              placeholder="Nome do contato"
              className="h-12 text-base"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Empresa */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-zinc-500" />
              Empresa
            </Label>
            <Input
              {...register("company")}
              placeholder="Nome da empresa"
              className="h-12 text-base"
            />
          </div>
        </div>
      </div>

      {/* Contato */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Contato
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Telefone */}
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input
              {...register("phone")}
              type="tel"
              placeholder="(11) 99999-9999"
              className="h-12 text-base"
            />
          </div>

          {/* WhatsApp */}
          <div className="space-y-2">
            <Label>WhatsApp</Label>
            <Input
              {...register("whatsapp")}
              type="tel"
              placeholder="(11) 99999-9999"
              className="h-12 text-base"
            />
          </div>

          {/* Email */}
          <div className="space-y-2 sm:col-span-2">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-zinc-500" />
              Email
            </Label>
            <Input
              {...register("email")}
              type="email"
              placeholder="email@exemplo.com"
              className="h-12 text-base"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Localizacao */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Localizacao
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input
              {...register("city")}
              placeholder="Cidade"
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Input
              {...register("state")}
              placeholder="SP"
              maxLength={2}
              className="h-12 text-base uppercase"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Endereco</Label>
            <Input
              {...register("address")}
              placeholder="Endereco completo"
              className="h-12 text-base"
            />
          </div>
        </div>
      </div>

      {/* Classificação */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-400">Classificacao</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Origem */}
          <div className="space-y-2">
            <Label>Origem</Label>
            <Controller
              name="source"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Tipo de Contato */}
          <div className="space-y-2">
            <Label>Tipo de Contato</Label>
            <Controller
              name="contactType"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {contactTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </div>

      {/* Negócio */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Negocio
        </h3>

        <div className="space-y-4">
          {/* Valor Esperado */}
          <div className="space-y-2">
            <Label>Valor Esperado</Label>
            <Input
              {...register("expectedValue")}
              type="number"
              step="0.01"
              placeholder="0.00"
              className="h-12 text-base"
            />
          </div>

          {/* Interesse/Notas */}
          <div className="space-y-2">
            <Label>Interesse / Notas</Label>
            <Textarea
              {...register("interestNotes")}
              placeholder="Descreva o interesse do prospect, equipamentos desejados, etc."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
      </div>

      {/* Proxima Acao */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Proxima Acao
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>O que fazer</Label>
            <Input
              {...register("nextAction")}
              placeholder="Ex: Ligar para apresentar proposta"
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label>Data</Label>
            <Input
              {...register("nextActionDate")}
              type="date"
              className="h-12 text-base"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-zinc-800">
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
          ) : isEditing ? (
            "Atualizar Lead"
          ) : (
            "Criar Lead"
          )}
        </Button>
      </div>
    </form>
  )
}
