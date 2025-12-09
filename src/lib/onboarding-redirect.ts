// Helper para gerenciar redirecionamentos do onboarding

const ONBOARDING_REDIRECT_KEY = "oduo_onboarding_redirect"

/**
 * Marca que o usuário veio do guia de início
 */
export function setOnboardingRedirect() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(ONBOARDING_REDIRECT_KEY, "true")
  }
}

/**
 * Verifica se deve redirecionar para o guia de início e limpa a flag
 */
export function shouldRedirectToOnboarding(): boolean {
  if (typeof window !== "undefined") {
    const shouldRedirect = sessionStorage.getItem(ONBOARDING_REDIRECT_KEY) === "true"
    if (shouldRedirect) {
      sessionStorage.removeItem(ONBOARDING_REDIRECT_KEY)
    }
    return shouldRedirect
  }
  return false
}

/**
 * Limpa a flag de redirecionamento
 */
export function clearOnboardingRedirect() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(ONBOARDING_REDIRECT_KEY)
  }
}
