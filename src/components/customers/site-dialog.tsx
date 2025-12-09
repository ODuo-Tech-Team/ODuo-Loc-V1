"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Search, MapPin } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { HelpTooltip } from "@/components/ui/help-tooltip"
import { CEPInput, PhoneInput } from "@/components/ui/masked-input"
import { consultarCEP, isCEPError } from "@/lib/services/cep-service"

// Schema de validação
const siteSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  street: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().max(2).optional().nullable(),
  zipCode: z.string().optional().nullable(),
  ibgeCode: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  isDefault: z.boolean(),
})

type SiteForm = z.infer<typeof siteSchema>

export interface CustomerSite {
  id: string
  name: string
  street: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  ibgeCode: string | null
  contactName: string | null
  contactPhone: string | null
  isActive: boolean
  isDefault: boolean
}

interface SiteDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  customerId: string
  site?: CustomerSite | null
}

export function SiteDialog({
  open,
  onClose,
  onSuccess,
  customerId,
  site,
}: SiteDialogProps) {
  const [loading, setLoading] = useState(false)
  const [loadingCEP, setLoadingCEP] = useState(false)
  const isEditing = !!site

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SiteForm>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      name: "",
      isDefault: false,
    },
  })

  // Preencher dados ao editar
  useEffect(() => {
    if (site) {
      reset({
        name: site.name,
        street: site.street,
        number: site.number,
        complement: site.complement,
        neighborhood: site.neighborhood,
        city: site.city,
        state: site.state,
        zipCode: site.zipCode,
        ibgeCode: site.ibgeCode,
        contactName: site.contactName,
        contactPhone: site.contactPhone,
        isDefault: site.isDefault,
      })
    } else {
      reset({
        name: "",
        street: null,
        number: null,
        complement: null,
        neighborhood: null,
        city: null,
        state: null,
        zipCode: null,
        ibgeCode: null,
        contactName: null,
        contactPhone: null,
        isDefault: false,
      })
    }
  }, [site, reset])

  // Buscar dados do CEP
  const handleSearchCEP = useCallback(async (cep: string) => {
    const cleanedCEP = cep.replace(/\D/g, "")
    if (cleanedCEP.length !== 8) return

    setLoadingCEP(true)

    try {
      const result = await consultarCEP(cleanedCEP)

      if (isCEPError(result)) {
        toast.error(result.message)
        return
      }

      setValue("street", result.logradouro)
      setValue("neighborhood", result.bairro)
      setValue("city", result.localidade)
      setValue("state", result.uf)
      setValue("ibgeCode", result.ibge)

      document.getElementById("site-number")?.focus()
      toast.success("Endereço preenchido!")
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
      toast.error("Erro ao consultar CEP")
    } finally {
      setLoadingCEP(false)
    }
  }, [setValue])

  const onSubmit = async (data: SiteForm) => {
    try {
      setLoading(true)

      const cleanData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          value === "" ? null : value,
        ])
      )

      const url = isEditing
        ? `/api/customers/${customerId}/sites/${site.id}`
        : `/api/customers/${customerId}/sites`

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanData),
      })

      if (response.ok) {
        toast.success(isEditing ? "Local atualizado!" : "Local cadastrado!")
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao salvar local")
      }
    } catch (error) {
      console.error("Error saving site:", error)
      toast.error("Erro ao salvar local")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {isEditing ? "Editar Local de Obra" : "Novo Local de Obra"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações do local de obra"
              : "Cadastre um novo local de entrega para este cliente"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nome do Local */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="site-name">
                Nome do Local <span className="text-destructive">*</span>
              </Label>
              <HelpTooltip content="Nome identificador do local (ex: Obra Centro, Canteiro Norte)" />
            </div>
            <Input
              id="site-name"
              {...register("name")}
              placeholder="Ex: Obra Centro, Canteiro 01"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Endereço</h4>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="site-zipCode">CEP</Label>
                <div className="flex gap-2">
                  <Controller
                    name="zipCode"
                    control={control}
                    render={({ field }) => (
                      <CEPInput
                        id="site-zipCode"
                        value={field.value || ""}
                        onChange={(value) => {
                          field.onChange(value)
                          if (value.replace(/\D/g, "").length === 8) {
                            handleSearchCEP(value)
                          }
                        }}
                        className="flex-1"
                      />
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const cep = watch("zipCode")
                      if (cep) handleSearchCEP(cep)
                    }}
                    disabled={loadingCEP}
                  >
                    {loadingCEP ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="site-street">Logradouro</Label>
                <Input
                  id="site-street"
                  {...register("street")}
                  placeholder="Rua, Avenida, etc."
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="site-number">Número</Label>
                <Input
                  id="site-number"
                  {...register("number")}
                  placeholder="Nº"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="site-complement">Complemento</Label>
                <Input
                  id="site-complement"
                  {...register("complement")}
                  placeholder="Sala, Bloco, etc."
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="site-neighborhood">Bairro</Label>
                <Input
                  id="site-neighborhood"
                  {...register("neighborhood")}
                  placeholder="Bairro"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="site-city">Cidade</Label>
                <Input
                  id="site-city"
                  {...register("city")}
                  placeholder="Cidade"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="site-state">UF</Label>
                <Input
                  id="site-state"
                  {...register("state")}
                  placeholder="UF"
                  maxLength={2}
                  className="uppercase"
                />
              </div>
            </div>
          </div>

          {/* Contato no Local */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">
              Contato no Local
            </h4>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="site-contactName">Nome do Responsável</Label>
                <Input
                  id="site-contactName"
                  {...register("contactName")}
                  placeholder="Nome do responsável no local"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="site-contactPhone">Telefone</Label>
                <Controller
                  name="contactPhone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      id="site-contactPhone"
                      value={field.value || ""}
                      onChange={(value) => field.onChange(value)}
                      placeholder="(00) 00000-0000"
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Local Padrão */}
          <div className="flex items-center space-x-2">
            <Controller
              name="isDefault"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="site-isDefault"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="site-isDefault" className="cursor-pointer">
              Definir como local padrão
            </Label>
            <HelpTooltip content="O local padrão será selecionado automaticamente ao criar novos orçamentos" />
          </div>

          {/* Campo oculto para código IBGE */}
          <input type="hidden" {...register("ibgeCode")} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : isEditing ? (
                "Salvar Alterações"
              ) : (
                "Cadastrar Local"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
