"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Search, Loader2, Building2, User, MapPin, Info } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

// Componentes de UI
import { HelpTooltip } from "@/components/ui/help-tooltip"
import { MaskedInput, PhoneInput, CEPInput } from "@/components/ui/masked-input"

// Serviços
import { consultarCEP, isCEPError } from "@/lib/services/cep-service"
import { getSituacaoColor } from "@/lib/services/cnpj-service"

// Validações
import { validateCpfCnpj, validateCEP } from "@/lib/fiscal/validators"

// Hooks
import { useOnboardingRedirect } from "@/hooks/useOnboardingRedirect"
import { usePageTour, shouldAutoStartTour } from "@/hooks/usePageTour"
import { customerTourSteps } from "@/lib/tours/tour-steps"

// Schema de validação
const customerSchema = z.object({
  personType: z.enum(["PF", "PJ"]),
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  tradeName: z.string().optional().nullable(),
  cpfCnpj: z.string().optional().nullable().refine(
    (val) => !val || validateCpfCnpj(val),
    "CPF/CNPJ inválido"
  ),
  inscricaoEstadual: z.string().optional().nullable(),
  inscricaoMunicipal: z.string().optional().nullable(),
  isIsentoIE: z.boolean(),
  email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  phoneSecondary: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().max(2, "UF deve ter 2 caracteres").optional().nullable(),
  zipCode: z.string().optional().nullable().refine(
    (val) => !val || val.replace(/\D/g, "").length === 0 || validateCEP(val),
    "CEP inválido"
  ),
  ibgeCode: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

type CustomerForm = z.infer<typeof customerSchema>

// Tipos para dados do CNPJ
interface CNPJData {
  cnpj: string
  razaoSocial: string
  nomeFantasia: string | null
  situacaoCadastral: string
  endereco: {
    logradouro: string | null
    numero: string | null
    complemento: string | null
    bairro: string | null
    cidade: string | null
    uf: string | null
    cep: string | null
    codigoMunicipio: string | null
  }
  telefones: string[]
  email: string | null
}

export default function NovoClientePage() {
  const router = useRouter()
  const { redirectAfterAction } = useOnboardingRedirect()
  const [loading, setLoading] = useState(false)
  const [loadingCNPJ, setLoadingCNPJ] = useState(false)
  const [loadingCEP, setLoadingCEP] = useState(false)
  const [cnpjStatus, setCnpjStatus] = useState<string | null>(null)

  // Tour automático se veio do onboarding
  usePageTour({
    tourId: "customer-form",
    steps: customerTourSteps,
    autoStart: shouldAutoStartTour("customer-form"),
    delay: 800,
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      personType: "PJ",
      isIsentoIE: false,
    },
  })

  const personType = watch("personType")
  const isIsentoIE = watch("isIsentoIE")
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
    setCnpjStatus(null)

    try {
      const response = await fetch(`/api/cnpj/${cleanedCNPJ}`)
      const data = await response.json()

      if (data.error) {
        toast.error(data.message || "Erro ao consultar CNPJ")
        return
      }

      const cnpjData = data as CNPJData

      // Preencher campos
      setValue("name", cnpjData.razaoSocial)
      if (cnpjData.nomeFantasia) {
        setValue("tradeName", cnpjData.nomeFantasia)
      }
      if (cnpjData.email) {
        setValue("email", cnpjData.email)
      }
      if (cnpjData.telefones?.length > 0) {
        setValue("phone", cnpjData.telefones[0])
        if (cnpjData.telefones.length > 1) {
          setValue("phoneSecondary", cnpjData.telefones[1])
        }
      }
      if (cnpjData.endereco) {
        setValue("street", cnpjData.endereco.logradouro || "")
        setValue("number", cnpjData.endereco.numero || "")
        setValue("complement", cnpjData.endereco.complemento || "")
        setValue("neighborhood", cnpjData.endereco.bairro || "")
        setValue("city", cnpjData.endereco.cidade || "")
        setValue("state", cnpjData.endereco.uf || "")
        setValue("zipCode", cnpjData.endereco.cep || "")
        setValue("ibgeCode", cnpjData.endereco.codigoMunicipio || "")
      }

      setCnpjStatus(cnpjData.situacaoCadastral)
      toast.success("Dados do CNPJ carregados com sucesso!")
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

      // Foca no campo número após preencher
      document.getElementById("number")?.focus()

      toast.success("Endereço preenchido!")
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
      toast.error("Erro ao consultar CEP")
    } finally {
      setLoadingCEP(false)
    }
  }, [setValue])

  const onSubmit = async (data: CustomerForm) => {
    try {
      setLoading(true)

      // Limpar strings vazias para null
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
        toast.success("Cliente cadastrado com sucesso!")
        redirectAfterAction("/clientes")
        router.refresh()
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

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/clientes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground font-headline tracking-wide">
            Novo Cliente
          </h1>
          <p className="text-muted-foreground mt-1">
            Cadastre um novo cliente no sistema
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tipo de Pessoa */}
        <Card data-tour="customer-type">
          <CardHeader>
            <CardTitle className="font-headline tracking-wide">
              Tipo de Pessoa
            </CardTitle>
            <CardDescription>
              Selecione se é pessoa física ou jurídica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Controller
              name="personType"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PJ" id="pj" />
                    <Label htmlFor="pj" className="flex items-center gap-2 cursor-pointer">
                      <Building2 className="h-4 w-4" />
                      Pessoa Jurídica
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PF" id="pf" />
                    <Label htmlFor="pf" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      Pessoa Física
                    </Label>
                  </div>
                </RadioGroup>
              )}
            />
          </CardContent>
        </Card>

        {/* Dados da Empresa / Pessoa */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline tracking-wide">
              {personType === "PJ" ? "Dados da Empresa" : "Dados Pessoais"}
            </CardTitle>
            <CardDescription>
              {personType === "PJ"
                ? "Informações da empresa"
                : "Informações pessoais"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* CPF/CNPJ com busca */}
            <div className="grid gap-4 md:grid-cols-2" data-tour="customer-document">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="cpfCnpj">
                    {personType === "PJ" ? "CNPJ" : "CPF"}
                  </Label>
                  <HelpTooltip
                    content={
                      personType === "PJ"
                        ? "Digite o CNPJ para buscar automaticamente os dados da empresa na Receita Federal"
                        : "Digite o CPF do cliente"
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Controller
                    name="cpfCnpj"
                    control={control}
                    render={({ field }) => (
                      <MaskedInput
                        mask={personType === "PJ" ? "cnpj" : "cpf"}
                        value={field.value || ""}
                        onChange={(value) => field.onChange(value)}
                        placeholder={
                          personType === "PJ"
                            ? "00.000.000/0000-00"
                            : "000.000.000-00"
                        }
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
                      {loadingCNPJ ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                {errors.cpfCnpj && (
                  <p className="text-sm text-destructive">
                    {errors.cpfCnpj.message}
                  </p>
                )}
              </div>

              {/* Status do CNPJ */}
              {cnpjStatus && personType === "PJ" && (
                <div className="space-y-2">
                  <Label>Situação Cadastral</Label>
                  <div className="h-10 flex items-center">
                    <Badge variant={getSituacaoColor(cnpjStatus) as "default"}>
                      {cnpjStatus}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Nome / Razão Social */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="name">
                    {personType === "PJ" ? "Razão Social" : "Nome Completo"}
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <HelpTooltip
                    content={
                      personType === "PJ"
                        ? "Nome oficial da empresa registrado na Receita Federal"
                        : "Nome completo do cliente"
                    }
                  />
                </div>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder={
                    personType === "PJ"
                      ? "Razão Social da Empresa LTDA"
                      : "Nome completo"
                  }
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Nome Fantasia (só PJ) */}
              {personType === "PJ" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="tradeName">Nome Fantasia</Label>
                    <HelpTooltip content="Nome comercial pelo qual a empresa é conhecida" />
                  </div>
                  <Input
                    id="tradeName"
                    {...register("tradeName")}
                    placeholder="Nome Fantasia"
                  />
                </div>
              )}
            </div>

            {/* Inscrições (só PJ) */}
            {personType === "PJ" && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                    <HelpTooltip content="Número de registro na Secretaria da Fazenda estadual. Marque 'Isento' se a empresa não possui" />
                  </div>
                  <Input
                    id="inscricaoEstadual"
                    {...register("inscricaoEstadual")}
                    placeholder="Inscrição Estadual"
                    disabled={isIsentoIE}
                  />
                </div>

                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <div className="flex items-center space-x-2 h-10">
                    <Controller
                      name="isIsentoIE"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="isIsentoIE"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="isIsentoIE" className="cursor-pointer">
                      Isento de IE
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="inscricaoMunicipal">
                      Inscrição Municipal
                    </Label>
                    <HelpTooltip content="Número de registro na prefeitura para prestadores de serviço" />
                  </div>
                  <Input
                    id="inscricaoMunicipal"
                    {...register("inscricaoMunicipal")}
                    placeholder="Inscrição Municipal"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contato */}
        <Card data-tour="customer-contact">
          <CardHeader>
            <CardTitle className="font-headline tracking-wide">Contato</CardTitle>
            <CardDescription>Informações de contato do cliente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nome do Contato (só PJ) */}
            {personType === "PJ" && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="contactName">Nome do Contato</Label>
                  <HelpTooltip content="Nome da pessoa responsável pelo contato na empresa" />
                </div>
                <Input
                  id="contactName"
                  {...register("contactName")}
                  placeholder="Nome da pessoa de contato"
                />
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone Comercial</Label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      id="phone"
                      value={field.value || ""}
                      onChange={(value) => field.onChange(value)}
                      placeholder="(00) 0000-0000"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneSecondary">Celular</Label>
                <Controller
                  name="phoneSecondary"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      id="phoneSecondary"
                      value={field.value || ""}
                      onChange={(value) => field.onChange(value)}
                      placeholder="(00) 00000-0000"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <HelpTooltip content="Número do WhatsApp para contato rápido" />
                </div>
                <Controller
                  name="whatsapp"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      id="whatsapp"
                      value={field.value || ""}
                      onChange={(value) => field.onChange(value)}
                      placeholder="(00) 00000-0000"
                    />
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="cliente@exemplo.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card data-tour="customer-address">
          <CardHeader>
            <CardTitle className="font-headline tracking-wide">Endereço</CardTitle>
            <CardDescription>Localização do cliente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="zipCode">CEP</Label>
                  <HelpTooltip content="Digite o CEP para preencher o endereço automaticamente" />
                </div>
                <div className="flex gap-2">
                  <Controller
                    name="zipCode"
                    control={control}
                    render={({ field }) => (
                      <CEPInput
                        id="zipCode"
                        value={field.value || ""}
                        onChange={(value) => {
                          field.onChange(value)
                          // Auto-busca quando completa 8 dígitos
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
                {errors.zipCode && (
                  <p className="text-sm text-destructive">
                    {errors.zipCode.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="street">Logradouro</Label>
                <Input
                  id="street"
                  {...register("street")}
                  placeholder="Rua, Avenida, etc."
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  {...register("number")}
                  placeholder="Nº"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  {...register("complement")}
                  placeholder="Sala, Andar, etc."
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  {...register("neighborhood")}
                  placeholder="Bairro"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  {...register("city")}
                  placeholder="Cidade"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">UF</Label>
                <Input
                  id="state"
                  {...register("state")}
                  placeholder="UF"
                  maxLength={2}
                  className="uppercase"
                />
                {errors.state && (
                  <p className="text-sm text-destructive">
                    {errors.state.message}
                  </p>
                )}
              </div>
            </div>

            {/* Campo oculto para código IBGE */}
            <input type="hidden" {...register("ibgeCode")} />
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline tracking-wide">
              Observações
            </CardTitle>
            <CardDescription>
              Informações adicionais sobre o cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Adicione notas sobre o cliente..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Nota sobre locais de obra */}
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Locais de Obra
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Após salvar o cliente, você poderá adicionar locais de obra e entrega
                  na tela de edição do cliente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/clientes">
            <Button type="button" variant="outline" disabled={loading}>
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="gap-2">
            <Save className="h-4 w-4" />
            {loading ? "Salvando..." : "Salvar Cliente"}
          </Button>
        </div>
      </form>
    </div>
  )
}
