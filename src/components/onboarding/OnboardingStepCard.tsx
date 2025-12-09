"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, ArrowRight, LucideIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { setOnboardingRedirect } from "@/lib/onboarding-redirect"

interface OnboardingStepCardProps {
  step: number
  title: string
  description: string
  icon: LucideIcon
  href?: string
  completed?: boolean
  current?: boolean
  onClick?: () => void
  actionLabel?: string
}

export function OnboardingStepCard({
  step,
  title,
  description,
  icon: Icon,
  href,
  completed = false,
  current = false,
  onClick,
  actionLabel = "Começar",
}: OnboardingStepCardProps) {
  const content = (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 rounded-xl",
        // Custom background - more transparent than default glass-card
        "!bg-[#0a1e3d]/60 !backdrop-blur-md !shadow-lg",
        // States
        completed && "!border-green-500/40 !bg-green-500/5",
        current && !completed && "!border-primary/50 !shadow-[0_0_20px_-5px_rgba(49,122,224,0.25)]",
        !completed && !current && "!border-white/10 hover:!border-primary/30 hover:!shadow-[0_0_12px_-3px_rgba(49,122,224,0.15)] hover:scale-[1.005]"
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Step indicator */}
          <div
            className={cn(
              "flex items-center justify-center h-12 w-12 rounded-full shrink-0",
              completed && "bg-green-500 text-white",
              current && !completed && "bg-primary text-primary-foreground",
              !completed && !current && "bg-muted text-muted-foreground"
            )}
          >
            {completed ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <span className="text-lg font-bold">{step}</span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{title}</h3>
              {completed && (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                  Concluído
                </Badge>
              )}
              {current && !completed && (
                <Badge variant="default">
                  Atual
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>

          {/* Icon */}
          <div
            className={cn(
              "flex items-center justify-center h-10 w-10 rounded-lg shrink-0",
              completed && "bg-green-500/10 text-green-500",
              !completed && "bg-primary/10 text-primary"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>

        {/* Action button */}
        {!completed && (
          <div className="mt-4 flex justify-end">
            {onClick ? (
              <Button onClick={onClick} size="sm" variant={current ? "default" : "outline"}>
                {actionLabel}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : href ? (
              <Button
                asChild
                size="sm"
                variant={current ? "default" : "outline"}
                onClick={() => setOnboardingRedirect()}
              >
                <Link href={href}>
                  {actionLabel}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return content
}
