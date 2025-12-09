"use client"

import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { shouldRedirectToOnboarding } from "@/lib/onboarding-redirect"

/**
 * Hook para gerenciar redirecionamento após completar uma ação do onboarding
 */
export function useOnboardingRedirect() {
  const router = useRouter()

  /**
   * Redireciona para o destino apropriado:
   * - Se veio do guia de início, volta para ele
   * - Caso contrário, vai para o fallback
   */
  const redirectAfterAction = useCallback((fallbackPath: string) => {
    if (shouldRedirectToOnboarding()) {
      router.push("/guia-inicio")
    } else {
      router.push(fallbackPath)
    }
  }, [router])

  return { redirectAfterAction }
}
