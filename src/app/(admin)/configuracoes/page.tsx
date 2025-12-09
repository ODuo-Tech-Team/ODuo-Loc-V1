"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
import { toast } from "sonner"
import { Loader2, Save, Settings } from "lucide-react"
import { ImageUpload } from "@/components/ui/image-upload"
import { ConfigTabs } from "@/components/config"
import { shouldRedirectToOnboarding } from "@/lib/onboarding-redirect"
import { usePageTour, shouldAutoStartTour } from "@/hooks/usePageTour"
import { settingsTourSteps } from "@/lib/tours/tour-steps"

const settingsSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(8, "Telefone inválido"),
  address: z.string().optional(),
  logo: z.array(z.string()),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor inválida"),
})

type SettingsFormData = z.infer<typeof settingsSchema>

interface Tenant {
  id: string
  slug: string
  name: string
  email: string
  phone: string
  address: string | null
  logo: string | null
  primaryColor: string
  createdAt: string
  updatedAt: string
}

export default function ConfiguracoesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenant, setTenant] = useState<Tenant | null>(null)

  // Tour automático se veio do onboarding
  usePageTour({
    tourId: "settings-form",
    steps: settingsTourSteps,
    autoStart: shouldAutoStartTour("settings-form"),
    delay: 800,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      primaryColor: "#000000",
      logo: [],
    },
  })

  const logo = watch("logo")

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/tenant/settings")

      if (!response.ok) {
        throw new Error("Erro ao buscar configurações")
      }

      const data: Tenant = await response.json()
      setTenant(data)

      // Populate form
      setValue("name", data.name)
      setValue("email", data.email)
      setValue("phone", data.phone)
      setValue("address", data.address || "")
      setValue("logo", data.logo ? [data.logo] : [])
      setValue("primaryColor", data.primaryColor)
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast.error("Erro ao carregar configurações")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: SettingsFormData) => {
    setSaving(true)

    try {
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address || null,
        logo: data.logo.length > 0 ? data.logo[0] : null,
        primaryColor: data.primaryColor,
      }

      const response = await fetch("/api/tenant/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao salvar configurações")
      }

      toast.success("Configurações salvas com sucesso!")

      // Redireciona para guia-inicio se veio de lá
      if (shouldRedirectToOnboarding()) {
        router.push("/guia-inicio")
      } else {
        router.refresh()
      }
    } catch (error: any) {
      console.error("Error saving settings:", error)
      toast.error(error.message || "Erro ao salvar configurações")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold font-headline tracking-wide flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            Configurações
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">
            Gerencie as informações da sua locadora
          </p>
        </div>
      </div>

      {/* Tabs */}
      <ConfigTabs activeTab="geral" />

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline tracking-wide">Informações Básicas</CardTitle>
            <CardDescription>
              Dados principais da sua locadora
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo */}
            <div className="space-y-2" data-tour="settings-logo">
              <Label>Logo da Empresa</Label>
              <ImageUpload
                value={logo}
                onChange={(urls) => setValue("logo", urls)}
                maxImages={1}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Recomendado: 400x400px, formato PNG ou SVG
              </p>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome da Locadora <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Ex: Locadora ABC"
                disabled={saving}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Primary Color */}
            <div className="space-y-2" data-tour="settings-color">
              <Label htmlFor="primaryColor">
                Cor Principal <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-4 items-center">
                <Input
                  id="primaryColor"
                  type="color"
                  {...register("primaryColor")}
                  disabled={saving}
                  className="w-20 h-10"
                />
                <Input
                  {...register("primaryColor")}
                  placeholder="#000000"
                  disabled={saving}
                  className="flex-1"
                />
              </div>
              {errors.primaryColor && (
                <p className="text-sm text-destructive">
                  {errors.primaryColor.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card data-tour="settings-company">
          <CardHeader>
            <CardTitle className="font-headline tracking-wide">Informações de Contato</CardTitle>
            <CardDescription>
              Dados para contato com clientes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="contato@locadora.com.br"
                disabled={saving}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                Telefone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                {...register("phone")}
                placeholder="(00) 00000-0000"
                disabled={saving}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Textarea
                id="address"
                {...register("address")}
                placeholder="Rua, número, bairro, cidade, estado"
                rows={3}
                disabled={saving}
              />
              {errors.address && (
                <p className="text-sm text-destructive">
                  {errors.address.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        {tenant && (
          <Card>
            <CardHeader>
              <CardTitle className="font-headline tracking-wide">Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 text-sm">
                <div>
                  <Label className="text-muted-foreground">Slug</Label>
                  <p className="font-medium">{tenant.slug}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">ID</Label>
                  <p className="font-medium font-mono text-xs">{tenant.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Cadastrado em</Label>
                  <p className="font-medium">
                    {tenant.createdAt ? new Date(tenant.createdAt).toLocaleString("pt-BR") : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Última atualização
                  </Label>
                  <p className="font-medium">
                    {tenant.updatedAt ? new Date(tenant.updatedAt).toLocaleString("pt-BR") : "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
