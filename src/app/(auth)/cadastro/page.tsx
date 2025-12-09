"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { ArrowLeft, Check, Sparkles, Building2, User, Mail, Lock, Phone, Globe } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

const registerSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
  tenantName: z.string().min(3, "Nome da locadora deve ter no mínimo 3 caracteres"),
  tenantSlug: z.string()
    .min(3, "Slug deve ter no mínimo 3 caracteres")
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens"),
  phone: z.string().min(10, "Telefone inválido"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

// Plan definitions
const plans = {
  starter: { name: "Starter", price: 997, color: "border-blue-500/50 bg-blue-500/10 text-blue-400" },
  professional: { name: "Professional", price: 1497, color: "border-cyan-500/50 bg-cyan-500/10 text-cyan-400" },
  enterprise: { name: "Enterprise", price: 2997, color: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" },
}

// Force dynamic rendering due to useSearchParams
export const dynamic = 'force-dynamic'

function CadastroContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>("professional")

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  // Get plan from URL parameter or localStorage
  useEffect(() => {
    const planFromUrl = searchParams.get("plano")
    const planFromStorage = localStorage.getItem("selectedPlan")
    const plan = planFromUrl || planFromStorage || "professional"

    if (plan && (plan === "starter" || plan === "professional" || plan === "enterprise")) {
      setSelectedPlan(plan)
    }
  }, [searchParams])

  // Auto-generate slug from tenant name
  const handleTenantNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
    setValue("tenantSlug", slug)
  }

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          tenantName: data.tenantName,
          tenantSlug: data.tenantSlug,
          phone: data.phone,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || "Erro ao criar conta")
        return
      }

      toast.success("Conta criada com sucesso!")

      // Store registration data for checkout
      localStorage.setItem("pendingCheckout", JSON.stringify({
        tenantId: result.tenant.id,
        tenantSlug: result.tenant.slug,
        email: data.email,
        plan: selectedPlan,
        autoLoginToken: result.autoLoginToken,
        timestamp: Date.now()
      }))

      // Redirect to checkout
      router.push(`/checkout?plano=${selectedPlan}`)
    } catch (error) {
      toast.error("Erro ao criar conta. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const currentPlan = plans[selectedPlan as keyof typeof plans]

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-12">
      <div className="w-full max-w-3xl space-y-6">
        {/* Back to Plans Link */}
        <Link href="/planos" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors group">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Voltar para planos
        </Link>

        {/* Selected Plan Badge */}
        <div className={`rounded-xl border p-4 backdrop-blur-xl ${currentPlan.color}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-xs sm:text-sm opacity-80">Plano selecionado</p>
              <p className="text-base sm:text-lg font-bold">{currentPlan.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm sm:text-base border-current">
                R$ {currentPlan.price}/mês
              </Badge>
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Check className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        <Card className="w-full border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-2 text-center px-4 sm:px-6 pt-6 sm:pt-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Criar sua conta
            </CardTitle>
            <CardDescription className="text-gray-400">
              Configure sua locadora e comece a usar o sistema agora mesmo
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

              {/* Seção Pessoal */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Dados Pessoais</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-300">Seu Nome</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                      <Input
                        id="name"
                        placeholder="João Silva"
                        disabled={isLoading}
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary/50 focus:ring-primary/20"
                        {...register("name")}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-sm text-red-400">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        disabled={isLoading}
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary/50 focus:ring-primary/20"
                        {...register("email")}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-400">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-300">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        disabled={isLoading}
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary/50 focus:ring-primary/20"
                        {...register("password")}
                      />
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-400">{errors.password.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-300">Confirmar Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        disabled={isLoading}
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary/50 focus:ring-primary/20"
                        {...register("confirmPassword")}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-400">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/10" />

              {/* Seção Empresa */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Dados da Locadora</h3>

                <div className="space-y-2">
                  <Label htmlFor="tenantName" className="text-gray-300">Nome da Locadora</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                    <Input
                      id="tenantName"
                      placeholder="Locadora ABC"
                      disabled={isLoading}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary/50 focus:ring-primary/20"
                      {...register("tenantName")}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        register("tenantName").onChange(e)
                        handleTenantNameChange(e)
                      }}
                    />
                  </div>
                  {errors.tenantName && (
                    <p className="text-sm text-red-400">{errors.tenantName.message}</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tenantSlug" className="text-gray-300">Endereço do Site</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                      <Input
                        id="tenantSlug"
                        placeholder="locadora-abc"
                        disabled={isLoading}
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary/50 focus:ring-primary/20"
                        {...register("tenantSlug")}
                      />
                    </div>
                    {errors.tenantSlug && (
                      <p className="text-xs text-red-400">{errors.tenantSlug.message}</p>
                    )}
                    <p className="text-xs text-gray-500 break-all pl-1">
                      {watch("tenantSlug") || "seu-slug"}.oduoloc.com.br
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-300">Telefone / WhatsApp</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                      <Input
                        id="phone"
                        placeholder="(11) 99999-9999"
                        disabled={isLoading}
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary/50 focus:ring-primary/20"
                        {...register("phone")}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-sm text-red-400">{errors.phone.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-0 shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? "Criando conta..." : "Finalizar Cadastro"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 border-t border-white/5 pt-6 px-4 sm:px-6 pb-6 sm:pb-8">
            <div className="text-sm text-gray-400 text-center">
              Já tem uma conta?{" "}
              <Link href="/login" className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors">
                Faça login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default function CadastroPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#030712]">
      {/* Background Effects */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative w-full z-10">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        }>
          <CadastroContent />
        </Suspense>
      </div>
    </div>
  )
}
