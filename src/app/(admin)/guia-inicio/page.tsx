"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OnboardingStepCard, OnboardingProgress, useTour } from "@/components/onboarding"
import {
  Rocket,
  LayoutDashboard,
  Package,
  Users,
  Calendar,
  Settings,
  Play,
  X,
  Sparkles,
  PartyPopper
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Session storage key - same as OnboardingCheck
const ONBOARDING_SESSION_KEY = "oduo_onboarding_started"

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: any
  href?: string
  completed: boolean
  actionLabel: string
}

const defaultSteps: OnboardingStep[] = [
  {
    id: "tour",
    title: "Conheça o Sistema",
    description: "Faça um tour interativo pelo painel e descubra onde encontrar cada funcionalidade.",
    icon: LayoutDashboard,
    completed: false,
    actionLabel: "Iniciar Tour",
  },
  {
    id: "equipment",
    title: "Cadastre seu primeiro equipamento",
    description: "Adicione máquinas, ferramentas e equipamentos que você aluga no dia a dia.",
    icon: Package,
    href: "/equipamentos/novo",
    completed: false,
    actionLabel: "Cadastrar",
  },
  {
    id: "customer",
    title: "Adicione um cliente",
    description: "Cadastre seus clientes com informações de contato e endereço para facilitar as locações.",
    icon: Users,
    href: "/clientes/novo",
    completed: false,
    actionLabel: "Cadastrar",
  },
  {
    id: "booking",
    title: "Crie seu primeiro orçamento",
    description: "Monte um orçamento de locação selecionando equipamentos, cliente e período.",
    icon: Calendar,
    href: "/reservas/novo",
    completed: false,
    actionLabel: "Criar",
  },
  {
    id: "settings",
    title: "Configure sua empresa",
    description: "Personalize o sistema com o logo, cores e informações da sua locadora.",
    icon: Settings,
    href: "/configuracoes",
    completed: false,
    actionLabel: "Configurar",
  },
]

export default function GuiaInicioPage() {
  const router = useRouter()
  const { startTour } = useTour()
  const [loading, setLoading] = useState(true)
  const [steps, setSteps] = useState<OnboardingStep[]>(defaultSteps)
  const [userName, setUserName] = useState("")
  const [skipping, setSkipping] = useState(false)

  const fetchOnboardingStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/onboarding")
      if (res.ok) {
        const data = await res.json()
        setUserName(data.userName || "")

        // Update steps with completion status from API
        if (data.steps) {
          setSteps(prev => prev.map(step => ({
            ...step,
            completed: data.steps[step.id] || false,
          })))
        }
      }
    } catch (error) {
      console.error("Error fetching onboarding status:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Mark session as started when user visits the guide
    sessionStorage.setItem(ONBOARDING_SESSION_KEY, "true")

    fetchOnboardingStatus()

    // Re-fetch status when window gets focus (user comes back from another page)
    const handleFocus = () => {
      fetchOnboardingStatus()
    }

    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [fetchOnboardingStatus])

  const handleStepComplete = async (stepId: string) => {
    try {
      await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId, completed: true }),
      })

      setSteps(prev => prev.map(step =>
        step.id === stepId ? { ...step, completed: true } : step
      ))
    } catch (error) {
      console.error("Error updating step:", error)
    }
  }

  const handleTourStart = () => {
    startTour(
      () => {
        // On complete
        handleStepComplete("tour")
        toast.success("Tour concluído! Continue explorando o sistema.")
      },
      () => {
        // On skip
        toast.info("Você pode reiniciar o tour a qualquer momento.")
      }
    )
  }

  const handleSkipOnboarding = async () => {
    setSkipping(true)
    try {
      await fetch("/api/onboarding/skip", {
        method: "POST",
      })
      toast.success("Guia pulado! Você pode acessá-lo novamente pelo menu de ajuda.")
      router.push("/dashboard")
    } catch (error) {
      toast.error("Erro ao pular guia")
    } finally {
      setSkipping(false)
    }
  }

  const handleCompleteOnboarding = async () => {
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      })
      toast.success("Parabéns! Você completou o guia de início.")
      router.push("/dashboard")
    } catch (error) {
      toast.error("Erro ao completar guia")
    }
  }

  const completedSteps = steps.filter(s => s.completed).length
  const currentStep = steps.findIndex(s => !s.completed)
  const allCompleted = completedSteps === steps.length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20">
      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-wide">
                {userName ? `Olá, ${userName.split(" ")[0]}!` : "Bem-vindo!"}
              </h1>
              <p className="text-muted-foreground">
                Vamos configurar sua locadora em poucos passos
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleSkipOnboarding}
            disabled={skipping}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-2" />
            Pular guia
          </Button>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="pt-6">
            <OnboardingProgress totalSteps={steps.length} completedSteps={completedSteps} />
          </CardContent>
        </Card>

        {/* Celebration banner when all complete */}
        {allCompleted && (
          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                <div className="p-4 bg-green-500/10 rounded-full">
                  <PartyPopper className="h-10 w-10 text-green-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-green-600">
                    Tudo pronto!
                  </h3>
                  <p className="text-muted-foreground">
                    Você completou todos os passos do guia. Agora é hora de gerenciar sua locadora!
                  </p>
                </div>
                <Button onClick={handleCompleteOnboarding} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Ir para o Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Steps */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold font-headline tracking-wide flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Primeiros Passos
          </h2>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <OnboardingStepCard
                key={step.id}
                step={index + 1}
                title={step.title}
                description={step.description}
                icon={step.icon}
                href={step.id !== "tour" ? step.href : undefined}
                completed={step.completed}
                current={index === currentStep}
                onClick={step.id === "tour" ? handleTourStart : undefined}
                actionLabel={step.actionLabel}
              />
            ))}
          </div>
        </div>

        {/* Help section */}
        <Card className="bg-accent/50">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
              <div className="p-3 bg-background rounded-lg">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Precisa de ajuda?</h3>
                <p className="text-sm text-muted-foreground">
                  Nosso suporte está disponível para tirar suas dúvidas. Entre em contato pelo chat ou acesse a documentação.
                </p>
              </div>
              <Button variant="outline" asChild>
                <a href="/ajuda">Ver Documentação</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
