/**
 * Utilitários para redirecionamento com subdomínios de tenant
 */

/**
 * Gera URL completa para um tenant específico
 * @param tenantSlug - O slug do tenant (ex: "locadora-xyz")
 * @param path - O caminho após o domínio (ex: "/dashboard")
 * @returns URL completa (ex: "https://locadora-xyz.oduoloc.com.br/dashboard")
 */
export function getTenantUrl(tenantSlug: string, path: string = "/dashboard"): string {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"
  const protocol = typeof window !== "undefined" ? window.location.protocol : "https:"

  // Em localhost, usar caminho relativo para evitar problemas de CORS
  if (rootDomain.includes("localhost")) {
    return path
  }

  return `${protocol}//${tenantSlug}.${rootDomain}${path}`
}

/**
 * Gera URL completa para o domínio raiz (sem subdomínio de tenant)
 * @param path - O caminho após o domínio (ex: "/login")
 * @returns URL completa (ex: "https://oduoloc.com.br/login")
 */
export function getRootUrl(path: string = "/"): string {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"
  const protocol = typeof window !== "undefined" ? window.location.protocol : "https:"

  // Em localhost, usar caminho relativo
  if (rootDomain.includes("localhost")) {
    return path
  }

  return `${protocol}//${rootDomain}${path}`
}

/**
 * Versão server-side do getTenantUrl (para uso em middleware/API routes)
 * @param tenantSlug - O slug do tenant
 * @param path - O caminho após o domínio
 * @returns URL completa
 */
export function getServerTenantUrl(tenantSlug: string, path: string = "/dashboard"): string {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"

  if (rootDomain.includes("localhost")) {
    return `http://localhost:3000${path}`
  }

  return `https://${tenantSlug}.${rootDomain}${path}`
}

/**
 * Versão server-side do getRootUrl (para uso em middleware/API routes)
 * @param path - O caminho após o domínio
 * @returns URL completa
 */
export function getServerRootUrl(path: string = "/"): string {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"

  if (rootDomain.includes("localhost")) {
    return `http://localhost:3000${path}`
  }

  return `https://${rootDomain}${path}`
}
