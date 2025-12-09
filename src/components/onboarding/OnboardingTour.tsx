"use client"

import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import { systemTourSteps, defaultDriverConfig } from "@/lib/tours/tour-steps"

interface OnboardingTourProps {
  onComplete?: () => void
  onSkip?: () => void
  autoStart?: boolean
}

export function OnboardingTour({ onComplete, onSkip, autoStart = false }: OnboardingTourProps) {
  const startTour = useCallback(() => {
    // Guardar referência do elemento anterior para limpar estilos
    let previousElement: HTMLElement | null = null

    const driverObj = driver({
      ...defaultDriverConfig,
      steps: systemTourSteps,
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

          // Garantir que o elemento está totalmente visível com margem extra para o destaque
          const rect = el.getBoundingClientRect()
          const margin = 60 // Margem extra para o outline e box-shadow
          const viewportHeight = window.innerHeight

          // Verificar se o elemento está cortado (acima ou abaixo da viewport)
          if (rect.top < margin || rect.bottom > viewportHeight - margin) {
            // Encontrar o container scrollável do sidebar
            const sidebarScroll = document.querySelector('.sidebar-scroll')
            if (sidebarScroll) {
              // Calcular posição ideal para centralizar o elemento
              const elementTop = el.offsetTop
              const scrollContainer = sidebarScroll as HTMLElement
              const containerHeight = scrollContainer.clientHeight
              const scrollTo = elementTop - (containerHeight / 2) + (el.offsetHeight / 2)

              scrollContainer.scrollTo({
                top: Math.max(0, scrollTo),
                behavior: 'smooth'
              })
            }
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
          onComplete?.()
        } else {
          onSkip?.()
        }
      },
    })

    driverObj.drive()
  }, [onComplete, onSkip])

  useEffect(() => {
    if (autoStart) {
      const timer = setTimeout(() => {
        startTour()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [autoStart, startTour])

  return null
}

export { systemTourSteps as tourSteps }

export function useTour() {
  const router = useRouter()

  const startTour = (onComplete?: () => void, onSkip?: () => void) => {
    // Navigate to dashboard first, then start tour
    router.push("/dashboard")

    // Wait for navigation and page load
    setTimeout(() => {
      // Reset scroll to top
      window.scrollTo({ top: 0, behavior: "instant" })
      document.body.scrollTop = 0
      document.documentElement.scrollTop = 0

      // Também resetar scroll do container principal se existir
      const mainContent = document.querySelector("main")
      if (mainContent) {
        mainContent.scrollTop = 0
      }

      // Guardar referência do elemento anterior para limpar estilos
      let previousElement: HTMLElement | null = null

      const driverObj = driver({
        ...defaultDriverConfig,
        steps: systemTourSteps,
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

            // Garantir que o elemento está totalmente visível com margem extra para o destaque
            const rect = el.getBoundingClientRect()
            const margin = 60 // Margem extra para o destaque
            const viewportHeight = window.innerHeight

            // Verificar se o elemento está cortado (acima ou abaixo da viewport)
            if (rect.top < margin || rect.bottom > viewportHeight - margin) {
              // Encontrar o container scrollável do sidebar
              const sidebarScroll = document.querySelector('.sidebar-scroll')
              if (sidebarScroll) {
                // Calcular posição ideal para centralizar o elemento
                const elementTop = el.offsetTop
                const scrollContainer = sidebarScroll as HTMLElement
                const containerHeight = scrollContainer.clientHeight
                const scrollTo = elementTop - (containerHeight / 2) + (el.offsetHeight / 2)

                scrollContainer.scrollTo({
                  top: Math.max(0, scrollTo),
                  behavior: 'smooth'
                })
              }
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
            onComplete?.()
          } else {
            onSkip?.()
          }

          // Return to guia-inicio after tour
          router.push("/guia-inicio")
        },
      })

      driverObj.drive()
    }, 1200)
  }

  return { startTour }
}
