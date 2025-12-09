"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { getRootUrl } from "@/lib/redirect-utils"

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
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  ArrowLeft,
  CreditCard,
  Lock,
  Check,
  Building,
  Mail,
  Loader2,
  Shield,
  Sparkles,
} from "lucide-react"

const plans = {
  starter: {
    name: "Starter",
    price: 997,
    description: "Ideal para quem está começando",
    features: ["Até 50 equipamentos", "2 usuários", "Dashboard básico"],
  },
  professional: {
    name: "Professional",
    price: 1497,
    description: "Para empresas em crescimento",
    features: ["Até 200 equipamentos", "5 usuários", "+ Relatórios, API"],
  },
  enterprise: {
    name: "Enterprise",
    price: 2997,
    description: "Solução completa para grandes operações",
    features: ["Ilimitado", "Ilimitado", "+ Customizações", "40 H automações"],
  },
}

const paymentSchema = z.object({
  cardNumber: z.string().min(16, "Número do cartão inválido"),
  cardName: z.string().min(3, "Nome no cartão inválido"),
  cardExpiry: z.string().min(5, "Data de validade inválida"),
  cardCvv: z.string().min(3, "CVV inválido"),
})

type PaymentFormData = z.infer<typeof paymentSchema>

export const dynamic = 'force-dynamic'

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [checkoutData, setCheckoutData] = useState<any>(null)
  const [selectedPlan, setSelectedPlan] = useState<string>("professional")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
  })

  useEffect(() => {
    const pendingCheckout = localStorage.getItem("pendingCheckout")
    if (!pendingCheckout) {
      toast.error("Sessão expirada. Por favor, cadastre-se novamente.")
      router.push("/planos")
      return
    }

    const data = JSON.parse(pendingCheckout)

    if (Date.now() - data.timestamp > 30 * 60 * 1000) {
      localStorage.removeItem("pendingCheckout")
      toast.error("Sessão expirada. Por favor, cadastre-se novamente.")
      router.push("/planos")
      return
    }

    setCheckoutData(data)
    setSelectedPlan(data.plan || searchParams.get("plano") || "professional")
  }, [router, searchParams])

  const onSubmit = async (data: PaymentFormData) => {
    setIsLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const response = await fetch("/api/payment/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          tenantId: checkoutData.tenantId,
          plan: selectedPlan,
          amount: plans[selectedPlan as keyof typeof plans].price,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || "Erro ao processar pagamento")
        return
      }

      toast.success("Pagamento processado com sucesso!")

      if (checkoutData.autoLoginToken) {
        try {
          const loginResult = await signIn("auto-login", {
            token: checkoutData.autoLoginToken,
            redirect: false,
          })

          if (loginResult?.error) {
            console.error("Auto-login failed:", loginResult.error)
            toast.error("Por favor, faça login para acessar seu painel.")
            localStorage.removeItem("pendingCheckout")
            localStorage.removeItem("selectedPlan")
            // Redirecionar para login no domínio raiz
            window.location.href = getRootUrl(`/login?email=${encodeURIComponent(checkoutData.email)}`)
            return
          }
        } catch (error) {
          console.error("Auto-login error:", error)
          toast.error("Erro ao fazer login. Por favor, faça login manualmente.")
          localStorage.removeItem("pendingCheckout")
          localStorage.removeItem("selectedPlan")
          // Redirecionar para login no domínio raiz
          window.location.href = getRootUrl(`/login?email=${encodeURIComponent(checkoutData.email)}`)
          return
        }
      }

      localStorage.removeItem("pendingCheckout")
      localStorage.removeItem("selectedPlan")

      router.push(
        `/sucesso?tenant=${checkoutData.tenantSlug}&plano=${selectedPlan}`
      )
    } catch (error) {
      toast.error("Erro ao processar pagamento. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!checkoutData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const currentPlan = plans[selectedPlan as keyof typeof plans]

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 xl:p-12 bg-[#030712] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <Link
          href="/cadastro"
          className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Voltar
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Order Summary */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-white">Finalizar Pagamento</h1>
              <p className="text-gray-400">
                Revise seu pedido e complete o pagamento
              </p>
            </div>

            {/* Account Info */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-400" />
                  Informações da Conta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-400">Locadora</p>
                    <p className="text-sm text-white truncate">
                      {checkoutData.tenantSlug}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || "oduoloc.com.br"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-400">Email</p>
                    <p className="text-sm text-white truncate">
                      {checkoutData.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plan Details */}
            <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-white">{currentPlan.name}</CardTitle>
                  <Badge variant="secondary" className="text-base bg-white/10 text-white border-white/20">
                    R$ {currentPlan.price}/mês
                  </Badge>
                </div>
                <CardDescription className="text-gray-300">{currentPlan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {currentPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-blue-400" />
                      </div>
                      <span className="text-sm text-white">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Pricing Breakdown */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Plano {currentPlan.name}</span>
                  <span>R$ {currentPlan.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-400">
                  <span>14 dias grátis</span>
                  <span>- R$ {currentPlan.price.toFixed(2)}</span>
                </div>
                <div className="border-t border-white/10" />
                <div className="flex justify-between font-bold text-white">
                  <span>Total hoje</span>
                  <span className="text-2xl">R$ 0,00</span>
                </div>
                <p className="text-xs text-gray-500">
                  Você será cobrado R$ {currentPlan.price.toFixed(2)} após o período de teste
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div>
            <Card className="sticky top-6 bg-white/5 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-white">Informações de Pagamento</CardTitle>
                    <CardDescription className="text-gray-400 text-sm">
                      Seus dados estão protegidos
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber" className="text-gray-300">Número do Cartão</Label>
                    <Input
                      id="cardNumber"
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      disabled={isLoading}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      {...register("cardNumber")}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value.replace(/\s/g, "")
                        const formatted = value.match(/.{1,4}/g)?.join(" ") || value
                        e.target.value = formatted
                        register("cardNumber").onChange(e)
                      }}
                    />
                    {errors.cardNumber && (
                      <p className="text-sm text-red-400">{errors.cardNumber.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardName" className="text-gray-300">Nome no Cartão</Label>
                    <Input
                      id="cardName"
                      placeholder="João Silva"
                      disabled={isLoading}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      {...register("cardName")}
                    />
                    {errors.cardName && (
                      <p className="text-sm text-red-400">{errors.cardName.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardExpiry" className="text-gray-300">Validade</Label>
                      <Input
                        id="cardExpiry"
                        placeholder="MM/AA"
                        maxLength={5}
                        disabled={isLoading}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        {...register("cardExpiry")}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          let value = e.target.value.replace(/\D/g, "")
                          if (value.length >= 2) {
                            value = value.slice(0, 2) + "/" + value.slice(2, 4)
                          }
                          e.target.value = value
                          register("cardExpiry").onChange(e)
                        }}
                      />
                      {errors.cardExpiry && (
                        <p className="text-sm text-red-400">{errors.cardExpiry.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardCvv" className="text-gray-300">CVV</Label>
                      <Input
                        id="cardCvv"
                        placeholder="123"
                        maxLength={4}
                        disabled={isLoading}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        {...register("cardCvv")}
                      />
                      {errors.cardCvv && (
                        <p className="text-sm text-red-400">{errors.cardCvv.message}</p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/25"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Confirmar Pagamento
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Shield className="h-3 w-3" />
                    <span>Pagamento seguro e criptografado</span>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#030712]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
