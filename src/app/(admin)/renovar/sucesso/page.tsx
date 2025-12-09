"use client"

import { useEffect, useState } from "react"
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
import {
  Check,
  CheckCircle,
  Loader2,
  ArrowRight,
  Sparkles,
  Rocket,
  PartyPopper,
} from "lucide-react"

export default function SucessoPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    // Countdown para redirecionar
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push("/dashboard")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const handleGoToDashboard = () => {
    router.push("/dashboard")
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Progress Steps - Completed */}
      <div className="flex items-center justify-center gap-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">
            <Check className="h-4 w-4" />
          </div>
          <span className="text-sm text-green-600 font-medium hidden sm:inline">Plano</span>
        </div>
        <div className="w-12 h-0.5 bg-green-600" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">
            <Check className="h-4 w-4" />
          </div>
          <span className="text-sm text-green-600 font-medium hidden sm:inline">Pagamento</span>
        </div>
        <div className="w-12 h-0.5 bg-green-600" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">
            <Check className="h-4 w-4" />
          </div>
          <span className="text-sm text-green-600 font-medium hidden sm:inline">Confirmação</span>
        </div>
      </div>

      {/* Card de Sucesso */}
      <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/30 relative">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
            <CheckCircle className="h-10 w-10 text-green-500 relative z-10" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-green-600">
            Pagamento Confirmado! <PartyPopper className="inline h-6 w-6 ml-1" />
          </CardTitle>
          <CardDescription className="text-base">
            Sua assinatura foi renovada com sucesso
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Mensagem de Confirmação */}
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-green-500/20">
                <Sparkles className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-700">Tudo certo!</p>
                <p className="text-sm text-green-600/80">
                  Seu acesso foi atualizado e você já pode continuar utilizando todos os recursos da plataforma.
                </p>
              </div>
            </div>
          </div>

          {/* Próximos Passos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Continue de onde parou:</h3>
            </div>
            <div className="space-y-3">
              {[
                {
                  step: "1",
                  title: "Acesse o Dashboard",
                  desc: "Veja o resumo das suas reservas e equipamentos"
                },
                {
                  step: "2",
                  title: "Gerencie seus equipamentos",
                  desc: "Adicione novos itens ou atualize os existentes"
                },
                {
                  step: "3",
                  title: "Receba reservas",
                  desc: "Continue atendendo seus clientes sem interrupção"
                }
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border border-muted hover:bg-muted/80 transition-all"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shrink-0">
                    <span className="text-sm font-bold text-primary">{item.step}</span>
                  </div>
                  <div>
                    <p className="font-medium mb-1">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botão de Ação */}
          <div className="pt-4 space-y-4">
            <Button
              onClick={handleGoToDashboard}
              className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-500/25"
              size="lg"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Ir para o Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecionando em {countdown} segundo{countdown !== 1 ? "s" : ""}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Redirecionando...</p>
              )}
            </div>
          </div>

          {/* Info Adicional */}
          <div className="pt-4 border-t border-muted text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Um email de confirmação foi enviado para você
            </p>
            <p className="text-sm text-muted-foreground">
              Dúvidas?{" "}
              <a
                href="mailto:suporte@oduoloc.com.br"
                className="text-primary hover:underline"
              >
                Fale com nosso suporte
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Badge de Segurança */}
      <div className="flex justify-center">
        <Badge variant="outline" className="text-muted-foreground">
          <Check className="h-3 w-3 mr-1" />
          Transação processada com segurança
        </Badge>
      </div>
    </div>
  )
}
