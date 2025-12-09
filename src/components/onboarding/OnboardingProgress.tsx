"use client"

import { cn } from "@/lib/utils"

interface OnboardingProgressProps {
  totalSteps: number
  completedSteps: number
  className?: string
}

export function OnboardingProgress({
  totalSteps,
  completedSteps,
  className,
}: OnboardingProgressProps) {
  const percentage = Math.round((completedSteps / totalSteps) * 100)

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">
          Progresso: {completedSteps} de {totalSteps} etapas
        </span>
        <span className="font-medium text-primary">{percentage}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {percentage === 100 && (
        <p className="text-sm text-green-600 font-medium text-center mt-2">
          Parabéns! Você completou todos os passos do guia.
        </p>
      )}
    </div>
  )
}
