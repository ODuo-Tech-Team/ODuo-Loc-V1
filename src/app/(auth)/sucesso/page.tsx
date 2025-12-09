"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, Loader2, ArrowRight, Sparkles, Rocket } from "lucide-react"
import { getTenantUrl } from "@/lib/redirect-utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const plans = {
  starter: { name: "Starter", price: 997 },
  professional: { name: "Professional", price: 1497 },
  enterprise: { name: "Enterprise", price: 2997 },
}

export const dynamic = 'force-dynamic'

function SucessoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(5)
  const [tenantSlug, setTenantSlug] = useState<string>("")
  const [plan, setPlan] = useState<string>("professional")
  const [tenantDomain, setTenantDomain] = useState<string>("")

  useEffect(() => {
    const tenant = searchParams.get("tenant")
    const planParam = searchParams.get("plano")

    if (!tenant) {
      router.push("/planos")
      return
    }

    setTenantSlug(tenant)
    if (planParam) setPlan(planParam)

    // Construir o domínio correto usando o ROOT_DOMAIN
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"
    const isLocalhost = rootDomain.includes('localhost')
    const domain = isLocalhost
      ? `${tenant}.localhost:3000`
      : `${tenant}.${rootDomain}`
    setTenantDomain(domain)

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Redirecionar para o subdomínio correto do tenant
          window.location.href = getTenantUrl(tenant, "/dashboard")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [searchParams, router])

  const currentPlan = plans[plan as keyof typeof plans]

  const handleRedirectNow = () => {
    if (tenantSlug) {
      window.location.href = getTenantUrl(tenantSlug, "/dashboard")
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-12 bg-[#030712] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-3xl relative z-10">
        <Card className="border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border-2 border-emerald-500/30 relative">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
              <Check className="h-10 w-10 text-emerald-400 relative z-10" />
            </div>
            <CardTitle className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Bem-vindo ao ODuoLoc! 🎉
            </CardTitle>
            <CardDescription className="text-lg text-gray-300">
              Sua conta foi criada com sucesso
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Account Details */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Sua locadora</p>
                  <p className="font-semibold text-white text-lg break-all">
                    {tenantDomain || `${tenantSlug}.oduoloc.com.br`}
                  </p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-sm px-4 py-1">
                  {currentPlan.name}
                </Badge>
              </div>

              <div className="border-t border-white/10 pt-4">
                <p className="text-sm text-gray-400 mb-2">Plano selecionado</p>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">{currentPlan.name}</p>
                  <p className="text-2xl font-bold text-white">R$ {currentPlan.price}/mês</p>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-emerald-400">
                  <Check className="h-4 w-4" />
                  <span>14 dias grátis - Primeiro pagamento em{" "}
                    {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(
                      "pt-BR"
                    )}</span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-blue-400" />
                <h3 className="font-semibold text-lg text-white">Próximos passos:</h3>
              </div>
              <div className="space-y-3">
                {[
                  {
                    step: "1",
                    title: "Acesse seu painel",
                    desc: "Configure sua locadora e adicione equipamentos"
                  },
                  {
                    step: "2",
                    title: "Cadastre seus equipamentos",
                    desc: "Adicione fotos, preços e disponibilidade"
                  },
                  {
                    step: "3",
                    title: "Comece a receber reservas",
                    desc: "Compartilhe o link da sua locadora com clientes"
                  }
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4 p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 border border-blue-500/30 shrink-0">
                      <span className="text-sm font-bold text-blue-400">{item.step}</span>
                    </div>
                    <div>
                      <p className="font-medium text-white mb-1">{item.title}</p>
                      <p className="text-sm text-gray-400">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Redirect Button */}
            <div className="pt-4 space-y-4">
              <Button
                onClick={handleRedirectNow}
                className="w-full h-14 text-lg bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 shadow-lg shadow-emerald-500/25"
                size="lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Acessar Minha Locadora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redirecionando em {countdown} segundo{countdown !== 1 ? "s" : ""}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">Redirecionando...</p>
                )}
              </div>
            </div>

            {/* Help Text */}
            <div className="pt-6 border-t border-white/10 text-center space-y-2">
              <p className="text-sm text-gray-500">
                Um email de confirmação foi enviado para sua caixa de entrada
              </p>
              <p className="text-sm text-gray-500">
                Precisa de ajuda?{" "}
                <a href="mailto:suporte@oduoloc.com.br" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                  Fale com nosso suporte
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function SucessoPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#030712]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SucessoContent />
    </Suspense>
  )
}
