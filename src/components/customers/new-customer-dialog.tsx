"use client"

import { useState, useCallback } from "react"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Search, Building2, User } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { HelpTooltip } from "@/components/ui/help-tooltip"
import { MaskedInput, PhoneInput, CEPInput } from "@/components/ui/masked-input"
import { consultarCEP, isCEPError } from "@/lib/services/cep-service"
import { validateCpfCnpj, validateCEP } from "@/lib/fiscal/validators"

// Schema simplificado para criação rápida
const quickCustomerSchema = z.object({
  personType: z.enum(["PF", "PJ"]),
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  tradeName: z.string().optional().nullable(),
  cpfCnpj: z.string().optional().nullable().refine(
    (val) => !val || validateCpfCnpj(val),
    "CPF/CNPJ inválido"
  ),
  email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().max(2).optional().nullable(),
  zipCode: z.string().optional().nullable().refine(
    (val) => !val || val.replace(/\D/g, "").length === 0 || validateCEP(val),
    "CEP inválido"
  ),
  ibgeCode: z.string().optional().nullable(),
})

type QuickCustomerForm = z.infer<typeof quickCustomerSchema>

export interface CreatedCustomer {
  id: string
  name: string
  tradeName: string | null
  cpfCnpj: string | null
  personType: string
}

interface NewCustomerDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (customer: CreatedCustomer) => void
}

export function NewCustomerDialog({
  open,
  onClose,
  onCreated,
}: NewCustomerDialogProps) {
  const [loading, setLoading] = useState(false)
  const [loadingCNPJ, setLoadingCNPJ] = useState(false)
  const [loadingCEP, setLoadingCEP] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<QuickCustomerForm>({
    resolver: zodResolver(quickCustomerSchema),
    defaultValues: {
      personType: "PJ",
    },
  })

  const personType = watch("personType")
  const cpfCnpj = watch("cpfCnpj")

  // Buscar dados do CNPJ
  const handleSearchCNPJ = useCallback(async () => {
    if (!cpfCnpj) return

    const cleanedCNPJ = cpfCnpj.replace(/\D/g, "")
    if (cleanedCNPJ.length !== 14) {
      toast.error("CNPJ deve ter 14 dígitos")
      return
    }

    setLoadingCNPJ(true)

    try {
      const response = await fetch(`/api/cnpj/${cleanedCNPJ}`)
      const data = await response.json()

      if (data.error) {
        toast.error(data.message || "Erro ao consultar CNPJ")
        return
      }

      setValue("name", data.razaoSocial)
      if (data.nomeFantasia) setValue("tradeName", data.nomeFantasia)
      if (data.email) setValue("email", data.email)
      if (data.telefones?.length > 0) setValue("phone", data.telefones[0])
      if (data.endereco) {
        setValue("street", data.endereco.logradouro || "")
        setValue("number", data.endereco.numero || "")
        setValue("neighborhood", data.endereco.bairro || "")
        setValue("city", data.endereco.cidade || "")
        setValue("state", data.endereco.uf || "")
        setValue("zipCode", data.endereco.cep || "")
        setValue("ibgeCode", data.endereco.codigoMunicipio || "")
      }

      toast.success("Dados carregados!")
    } catch (error) {
      console.error("Erro ao buscar CNPJ:", error)
      toast.error("Erro ao consultar CNPJ")
    } finally {
      setLoadingCNPJ(false)
    }
  }, [cpfCnpj, setValue])

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

      document.getElementById("quick-number")?.focus()
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
    } finally {
      setLoadingCEP(false)
    }
  }, [setValue])

  const onSubmit = async (data: QuickCustomerForm) => {
    try {
      setLoading(true)

      const cleanData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          value === "" ? null : value,
        ])
      )

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanData),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success("Cliente cadastrado!")
        onCreated(result.customer)
        reset()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao criar cliente")
      }
    } catch (error) {
      console.error("Error creating customer:", error)
      toast.error("Erro ao criar cliente")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastro Rápido de Cliente</DialogTitle>
          <DialogDescription>
            Preencha os dados básicos do cliente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tipo de Pessoa */}
          <Controller
            name="personType"
            control={control}
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PJ" id="quick-pj" />
                  <Label htmlFor="quick-pj" className="flex items-center gap-1 cursor-pointer text-sm">
                    <Building2 className="h-4 w-4" />
                    PJ
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PF" id="quick-pf" />
                  <Label htmlFor="quick-pf" className="flex items-center gap-1 cursor-pointer text-sm">
                    <User className="h-4 w-4" />
                    PF
                  </Label>
                </div>
              </RadioGroup>
            )}
          />

          {/* CPF/CNPJ */}
          <div className="space-y-2">
            <Label>{personType === "PJ" ? "CNPJ" : "CPF"}</Label>
            <div className="flex gap-2">
              <Controller
                name="cpfCnpj"
                control={control}
                render={({ field }) => (
                  <MaskedInput
                    mask={personType === "PJ" ? "cnpj" : "cpf"}
                    value={field.value || ""}
                    onChange={(value) => field.onChange(value)}
                    placeholder={personType === "PJ" ? "00.000.000/0000-00" : "000.000.000-00"}
                    className="flex-1"
                  />
                )}
              />
              {personType === "PJ" && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleSearchCNPJ}
                  disabled={loadingCNPJ}
                >
                  {loadingCNPJ ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              )}
            </div>
            {errors.cpfCnpj && <p className="text-sm text-destructive">{errors.cpfCnpj.message}</p>}
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label>
              {personType === "PJ" ? "Razão Social" : "Nome"} <span className="text-destructive">*</span>
            </Label>
            <Input {...register("name")} placeholder={personType === "PJ" ? "Razão Social" : "Nome completo"} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          {/* Nome Fantasia (só PJ) */}
          {personType === "PJ" && (
            <div className="space-y-2">
              <Label>Nome Fantasia</Label>
              <Input {...register("tradeName")} placeholder="Nome Fantasia" />
            </div>
          )}

          {/* Contato */}
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    value={field.value || ""}
                    onChange={(value) => field.onChange(value)}
                    placeholder="(00) 00000-0000"
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input {...register("email")} type="email" placeholder="email@exemplo.com" />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              CEP
              <HelpTooltip content="Digite o CEP para preencher automaticamente" />
            </Label>
            <div className="flex gap-2">
              <Controller
                name="zipCode"
                control={control}
                render={({ field }) => (
                  <CEPInput
                    value={field.value || ""}
                    onChange={(value) => {
                      field.onChange(value)
                      if (value.replace(/\D/g, "").length === 8) {
                        handleSearchCEP(value)
                      }
                    }}
                    className="w-32"
                  />
                )}
              />
              <Input {...register("street")} placeholder="Logradouro" className="flex-1" />
              <Input {...register("number")} id="quick-number" placeholder="Nº" className="w-20" />
            </div>
          </div>

          <div className="grid gap-4 grid-cols-3">
            <Input {...register("neighborhood")} placeholder="Bairro" />
            <Input {...register("city")} placeholder="Cidade" />
            <Input {...register("state")} placeholder="UF" maxLength={2} className="uppercase" />
          </div>

          <input type="hidden" {...register("ibgeCode")} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
