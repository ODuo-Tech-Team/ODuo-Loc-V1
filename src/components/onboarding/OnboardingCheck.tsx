"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"

interface OnboardingCheckProps {
  children: React.ReactNode
}

// Pages that don't require onboarding check or are part of onboarding flow
const EXCLUDED_PATHS = [
  "/guia-inicio",
  "/dashboard", // Allow tour to run on dashboard
  "/ajuda",
  "/api-docs",
  "/logout",
  // Onboarding flow pages - allow navigation during onboarding
  "/equipamentos/novo",
  "/clientes/novo",
  "/reservas/novo",
  "/configuracoes",
]

// Session storage key to track if user has seen the guide
const ONBOARDING_SESSION_KEY = "oduo_onboarding_started"

export function OnboardingCheck({ children }: OnboardingCheckProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)
  const hasChecked = useRef(false)

  useEffect(() => {
    // Skip check for excluded paths
    if (EXCLUDED_PATHS.some(path => pathname.startsWith(path))) {
      setChecked(true)
      return
    }

    // Only check once per session to avoid redirect loops
    if (hasChecked.current) {
      setChecked(true)
      return
    }

    // Check if user has already started onboarding in this session
    const hasStartedOnboarding = sessionStorage.getItem(ONBOARDING_SESSION_KEY)
    if (hasStartedOnboarding) {
      setChecked(true)
      hasChecked.current = true
      return
    }

    const checkOnboarding = async () => {
      try {
        const res = await fetch("/api/onboarding")
        if (res.ok) {
          const data = await res.json()

          // If user hasn't completed or skipped onboarding, redirect once
          if (!data.onboardingCompleted && !data.onboardingSkippedAt) {
            // Mark that we've started the onboarding session
            sessionStorage.setItem(ONBOARDING_SESSION_KEY, "true")
            router.push("/guia-inicio")
            return
          }
        }
      } catch (error) {
        console.error("Error checking onboarding:", error)
      }
      hasChecked.current = true
      setChecked(true)
    }

    checkOnboarding()
  }, [pathname, router])

  // Show loading state while checking (very brief)
  if (!checked) {
    return null
  }

  return <>{children}</>
}
