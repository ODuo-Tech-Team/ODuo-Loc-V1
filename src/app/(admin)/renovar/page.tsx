"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  Loader2,
  Check,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Zap,
  Shield,
  Clock,
  Crown,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Plan {
  id: string
  name: string
  slug: string
  description: string | null
  monthlyPrice: number
  annualPrice: number | null
  features: string[]
  maxUsers: number
  maxEquipments: number
  maxBookingsPerMonth: number
  storageGb: number
  nfseEnabled: boolean
  stockEnabled: boolean
  financialEnabled: boolean
  reportsEnabled: boolean
  apiEnabled: boolean
  webhooksEnabled: boolean
  multiUserEnabled: boolean
  customDomainsEnabled: boolean
  whatsappEnabled: boolean
  featured?: boolean
}

interface SubscriptionInfo {
  hasSubscription: boolean
  plan: { id: string; name: string; slug: string; monthlyPrice: number; annualPrice: number | null } | null
  status: string | null
  daysRemaining: number
  isInTrial: boolean
  expiresAt: string | null
  currentPeriodEnd: string | null
  billingCycle: string | null
}

export default function RenovarPage() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string>("")
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY")
  const [continuing, setContinuing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [subRes, plansRes] = await Promise.all([
        fetch("/api/tenant/subscription"),
        fetch("/api/plans"),
      ])

      if (subRes.ok) {
        const subData = await subRes.json()
        setSubscription(subData)
        if (subData.plan) {
          setSelectedPlan(subData.plan.id)
        }
        if (subData.billingCycle) {
          setBillingCycle(subData.billingCycle)
        }
      }

      if (plansRes.ok) {
        const plansData = await plansRes.json()
        setPlans(plansData.plans || [])
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar informações")
    } finally {
      setLoading(false)
    }
  }

  const getSelectedPlanPrice = () => {
    const plan = plans.find(p => p.id === selectedPlan)
    if (!plan) return 0

    if (billingCycle === "ANNUAL" && plan.annualPrice) {
      return plan.annualPrice
    }
    return plan.monthlyPrice
  }

  const getMonthlyEquivalent = () => {
    const plan = plans.find(p => p.id === selectedPlan)
    if (!plan) return 0

    if (billingCycle === "ANNUAL" && plan.annualPrice) {
      return plan.annualPrice / 12
    }
    return plan.monthlyPrice
  }

  const getSavings = () => {
    const plan = plans.find(p => p.id === selectedPlan)
    if (!plan || !plan.annualPrice) return 0

    const yearlyFromMonthly = plan.monthlyPrice * 12
    return yearlyFromMonthly - plan.annualPrice
  }

  const handleContinue = () => {
    if (!selectedPlan) {
      toast.error("Selecione um plano para continuar")
      return
    }

    setContinuing(true)

    // Salvar dados no localStorage e redirecionar para checkout
    const plan = plans.find(p => p.id === selectedPlan)
    localStorage.setItem("renewalData", JSON.stringify({
      planId: selectedPlan,
      planSlug: plan?.slug,
      planName: plan?.name,
      billingCycle,
      price: getSelectedPlanPrice(),
      monthlyEquivalent: getMonthlyEquivalent(),
      savings: getSavings(),
      timestamp: Date.now(),
    }))

    router.push("/renovar/checkout")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-wide">
            Renovar Assinatura
          </h1>
          <p className="text-sm text-muted-foreground">
            Etapa 1 de 3 - Escolha seu plano
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
            1
          </div>
          <span className="text-sm font-medium hidden sm:inline">Plano</span>
        </div>
        <div className="w-12 h-0.5 bg-muted" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
            2
          </div>
          <span className="text-sm text-muted-foreground hidden sm:inline">Pagamento</span>
        </div>
        <div className="w-12 h-0.5 bg-muted" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
            3
          </div>
          <span className="text-sm text-muted-foreground hidden sm:inline">Confirmação</span>
        </div>
      </div>

      {/* Status Atual */}
      {subscription?.hasSubscription && (
        <Card className={subscription.daysRemaining <= 7 ? "border-red-500/50" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {subscription.daysRemaining <= 7 && (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
                Status da Assinatura
              </CardTitle>
              <Badge variant={subscription.daysRemaining <= 0 ? "destructive" : subscription.isInTrial ? "secondary" : "default"}>
                {subscription.daysRemaining <= 0
                  ? "Expirada"
                  : subscription.isInTrial
                  ? "Trial"
                  : subscription.status === "ACTIVE"
                  ? "Ativa"
                  : subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Plano Atual</p>
                <p className="font-medium">{subscription.plan?.name || "Nenhum"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ciclo</p>
                <p className="font-medium">
                  {subscription.billingCycle === "ANNUAL" ? "Anual" : "Mensal"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dias Restantes</p>
                <p className={`font-medium ${subscription.daysRemaining <= 7 ? "text-red-500" : ""}`}>
                  {subscription.daysRemaining} dias
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expira em</p>
                <p className="font-medium">
                  {subscription.expiresAt
                    ? new Date(subscription.expiresAt).toLocaleDateString("pt-BR")
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seleção de Plano */}
      <Card>
        <CardHeader>
          <CardTitle>Escolha seu Plano</CardTitle>
          <CardDescription>
            Selecione o plano que melhor atende às suas necessidades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ciclo de Cobrança */}
          <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Button
              variant={billingCycle === "MONTHLY" ? "default" : "outline"}
              onClick={() => setBillingCycle("MONTHLY")}
              className="flex-1 max-w-[150px]"
            >
              Mensal
            </Button>
            <Button
              variant={billingCycle === "ANNUAL" ? "default" : "outline"}
              onClick={() => setBillingCycle("ANNUAL")}
              className="flex-1 max-w-[150px] relative"
            >
              Anual
              <Badge className="absolute -top-2 -right-2 text-[10px] bg-green-600">
                -20%
              </Badge>
            </Button>
          </div>

          {/* Lista de Planos em Colunas */}
          <RadioGroup
            value={selectedPlan}
            onValueChange={setSelectedPlan}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {plans.map((plan) => {
              const price = billingCycle === "ANNUAL" && plan.annualPrice
                ? plan.annualPrice
                : plan.monthlyPrice
              const monthlyEquiv = billingCycle === "ANNUAL" && plan.annualPrice
                ? plan.annualPrice / 12
                : plan.monthlyPrice
              const isFeatured = plan.featured || plan.slug === "professional"
              const isCurrentPlan = subscription?.plan?.id === plan.id

              return (
                <Label
                  key={plan.id}
                  htmlFor={plan.id}
                  className={`relative flex flex-col p-6 rounded-xl border-2 transition-all h-full cursor-pointer ${
                    selectedPlan === plan.id
                      ? "border-primary bg-primary/5 shadow-lg"
                      : isCurrentPlan
                      ? "border-green-500/50 bg-green-500/5 hover:border-green-500"
                      : isFeatured
                      ? "border-blue-500/50 bg-blue-500/5 hover:border-blue-500"
                      : "border-muted hover:border-muted-foreground/50"
                  }`}
                >
                  {isCurrentPlan && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white border-0">
                      PLANO ATUAL
                    </Badge>
                  )}
                  {isFeatured && !isCurrentPlan && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0">
                      <Crown className="h-3 w-3 mr-1" />
                      MAIS POPULAR
                    </Badge>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <RadioGroupItem
                      value={plan.id}
                      id={plan.id}
                    />
                  </div>

                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {plan.description}
                    </p>
                  )}

                  <div className="mb-4">
                    <p className="text-3xl font-bold">
                      R$ {price.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {billingCycle === "ANNUAL"
                        ? `R$ ${monthlyEquiv.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}/mês`
                        : "/mês"}
                    </p>
                  </div>

                  {/* Features do plano */}
                  <div className="flex-1 space-y-2 pt-4 border-t border-muted">
                    {plan.features && plan.features.slice(0, 4).map((feature, idx) => (
                      <p key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </p>
                    ))}
                    {!plan.features && (
                      <>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {plan.maxUsers === -1 ? "Usuários ilimitados" : `Até ${plan.maxUsers} usuários`}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {plan.maxEquipments === -1 ? "Equipamentos ilimitados" : `Até ${plan.maxEquipments} equipamentos`}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {plan.maxBookingsPerMonth === -1 ? "Reservas ilimitadas" : `${plan.maxBookingsPerMonth} reservas/mês`}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {plan.storageGb}GB de armazenamento
                        </p>
                      </>
                    )}
                  </div>

                  {selectedPlan === plan.id && (
                    <div className="mt-4 pt-4 border-t border-primary/20">
                      <Badge className="w-full justify-center py-2 bg-primary/10 text-primary border-0">
                        <Check className="h-4 w-4 mr-2" />
                        Selecionado
                      </Badge>
                    </div>
                  )}
                </Label>
              )
            })}
          </RadioGroup>

          {/* Precisa de mais? */}
          <div className="mt-6 text-center p-6 rounded-xl border border-muted bg-muted/30">
            <h3 className="text-lg font-semibold mb-1">Precisa de mais?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Temos soluções personalizadas para operações de grande escala.
            </p>
            <a href="mailto:contato@oduoloc.com.br" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium">
              Fale com nosso time de vendas
              <Zap className="h-4 w-4" />
            </a>
          </div>

          {plans.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum plano disponível</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo e Botão Continuar */}
      {selectedPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo da Seleção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Plano selecionado</span>
              <span className="font-medium">
                {plans.find(p => p.id === selectedPlan)?.name}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Ciclo de cobrança</span>
              <span className="font-medium">
                {billingCycle === "ANNUAL" ? "Anual" : "Mensal"}
              </span>
            </div>
            {billingCycle === "ANNUAL" && getSavings() > 0 && (
              <div className="flex justify-between items-center py-2 border-b text-green-600">
                <span className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  Economia com plano anual
                </span>
                <span className="font-medium">
                  R$ {getSavings().toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-3 text-lg">
              <span className="font-semibold">Total a pagar</span>
              <span className="font-bold text-xl">
                R$ {getSelectedPlanPrice().toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
                disabled={continuing}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                onClick={handleContinue}
                disabled={continuing || !selectedPlan}
              >
                {continuing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    Continuar para Pagamento
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benefícios */}
      <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20">
        <CardContent className="pt-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Check className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-sm">Acesso Imediato</p>
                <p className="text-xs text-muted-foreground">
                  Continue usando assim que o pagamento for confirmado
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Calendar className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-sm">Sem Perda de Dados</p>
                <p className="text-xs text-muted-foreground">
                  Todos os seus dados são mantidos
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Clock className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <p className="font-medium text-sm">Suporte Prioritário</p>
                <p className="text-xs text-muted-foreground">
                  Atendimento rápido para assinantes
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
