"use client"

import { useEffect, useCallback, useRef } from "react"
import { driver, DriveStep } from "driver.js"
import "driver.js/dist/driver.css"
import { defaultDriverConfig } from "@/lib/tours/tour-steps"

const TOUR_STARTED_PREFIX = "oduo_tour_started_"

interface UsePageTourOptions {
  tourId: string
  steps: DriveStep[]
  onComplete?: () => void
  onSkip?: () => void
  autoStart?: boolean
  delay?: number
}

/**
 * Hook para gerenciar tours de páginas específicas
 */
export function usePageTour({
  tourId,
  steps,
  onComplete,
  onSkip,
  autoStart = false,
  delay = 500,
}: UsePageTourOptions) {
  const hasStarted = useRef(false)

  const startTour = useCallback(() => {
    // Evita iniciar múltiplas vezes
    if (hasStarted.current) return
    hasStarted.current = true

    // Reset scroll antes de iniciar
    window.scrollTo({ top: 0, behavior: "instant" })

    // Guardar referência do elemento anterior para limpar estilos
    let previousElement: HTMLElement | null = null

    const driverObj = driver({
      ...defaultDriverConfig,
      steps,
      onHighlightStarted: (element) => {
        // Adicionar classe ao html para ativar CSS de overflow visible
        document.documentElement.classList.add('driver-active')

        // Limpar estilos do elemento anterior
        if (previousElement) {
          previousElement.style.removeProperty('z-index')
          previousElement.style.removeProperty('box-shadow')
        }

        // Aplicar estilos ao novo elemento destacado
        if (element) {
          const el = element as unknown as HTMLElement

          // Garantir que o elemento está totalmente visível
          const rect = el.getBoundingClientRect()
          const margin = 60
          const viewportHeight = window.innerHeight

          if (rect.top < margin || rect.bottom > viewportHeight - margin) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }

          el.style.setProperty('position', 'relative', 'important')
          el.style.setProperty('z-index', '100001', 'important')
          el.style.setProperty('box-shadow', 'inset 0 0 0 2px #317AE0', 'important')
          previousElement = el
        }
      },
      onDestroyStarted: () => {
        // Verificar se completou todas as etapas
        const completed = !driverObj.hasNextStep()

        // Destruir o driver
        driverObj.destroy()

        // Remover classe do html
        document.documentElement.classList.remove('driver-active')

        // Limpar estilos ao finalizar
        if (previousElement) {
          previousElement.style.removeProperty('position')
          previousElement.style.removeProperty('z-index')
          previousElement.style.removeProperty('box-shadow')
        }

        if (completed) {
          sessionStorage.setItem(`${TOUR_STARTED_PREFIX}${tourId}`, "completed")
          onComplete?.()
        } else {
          sessionStorage.setItem(`${TOUR_STARTED_PREFIX}${tourId}`, "skipped")
          onSkip?.()
        }

        hasStarted.current = false
      },
    })

    driverObj.drive()
  }, [tourId, steps, onComplete, onSkip])

  useEffect(() => {
    if (!autoStart) return

    // Verifica se já iniciou o tour nesta sessão
    const tourStatus = sessionStorage.getItem(`${TOUR_STARTED_PREFIX}${tourId}`)
    if (tourStatus) return

    // Marca como iniciado
    sessionStorage.setItem(`${TOUR_STARTED_PREFIX}${tourId}`, "started")

    // Delay para garantir que os elementos estão renderizados
    const timer = setTimeout(() => {
      startTour()
    }, delay)

    return () => clearTimeout(timer)
  }, [autoStart, tourId, startTour, delay])

  const resetTour = useCallback(() => {
    sessionStorage.removeItem(`${TOUR_STARTED_PREFIX}${tourId}`)
    hasStarted.current = false
  }, [tourId])

  return { startTour, resetTour }
}

/**
 * Verifica se deve iniciar tour automaticamente (veio do onboarding)
 */
export function shouldAutoStartTour(tourId: string): boolean {
  if (typeof window === "undefined") return false

  const onboardingRedirect = sessionStorage.getItem("oduo_onboarding_redirect")
  const tourStatus = sessionStorage.getItem(`${TOUR_STARTED_PREFIX}${tourId}`)

  return onboardingRedirect === "true" && !tourStatus
}
