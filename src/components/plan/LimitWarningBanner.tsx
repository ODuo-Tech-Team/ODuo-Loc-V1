"use client"

import Link from "next/link"
import { AlertTriangle, ArrowRight, Users, Package, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LimitWarningBannerProps {
  type: "users" | "equipments" | "bookings"
  current: number
  max: number
  percentage: number
  showUpgradeButton?: boolean
}

const typeConfig = {
  users: {
    icon: Users,
    label: "usuários",
    singular: "usuário",
  },
  equipments: {
    icon: Package,
    label: "equipamentos",
    singular: "equipamento",
  },
  bookings: {
    icon: Calendar,
    label: "orçamentos este mês",
    singular: "orçamento",
  },
}

export function LimitWarningBanner({
  type,
  current,
  max,
  percentage,
  showUpgradeButton = true,
}: LimitWarningBannerProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  // Não mostrar se abaixo de 80%
  if (percentage < 80) {
    return null
  }

  const isAtLimit = percentage >= 100
  const bgColor = isAtLimit
    ? "bg-red-500/10 border-red-500/30"
    : "bg-yellow-500/10 border-yellow-500/30"
  const textColor = isAtLimit ? "text-red-400" : "text-yellow-400"
  const iconColor = isAtLimit ? "text-red-500" : "text-yellow-500"

  return (
    <div
      className={`flex items-center justify-between gap-4 p-4 rounded-lg border ${bgColor}`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isAtLimit ? "bg-red-500/20" : "bg-yellow-500/20"}`}>
          {isAtLimit ? (
            <AlertTriangle className={`h-5 w-5 ${iconColor}`} />
          ) : (
            <Icon className={`h-5 w-5 ${iconColor}`} />
          )}
        </div>
        <div>
          <p className={`font-medium ${textColor}`}>
            {isAtLimit
              ? `Limite de ${config.label} atingido!`
              : `Você está usando ${percentage}% dos ${config.label}`}
          </p>
          <p className="text-sm text-muted-foreground">
            {current} de {max} {config.label}
            {isAtLimit && " - Faça upgrade para continuar"}
          </p>
        </div>
      </div>

      {showUpgradeButton && (
        <Link href="/renovar">
          <Button
            size="sm"
            className={
              isAtLimit
                ? "bg-red-600 hover:bg-red-700"
                : "bg-yellow-600 hover:bg-yellow-700"
            }
          >
            Fazer Upgrade
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      )}
    </div>
  )
}
