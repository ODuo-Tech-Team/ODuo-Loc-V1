import { headers } from "next/headers"
import { prisma } from "./prisma"

/**
 * Obtém o slug do tenant a partir dos headers (definido pelo middleware)
 */
export async function getTenantSlug(): Promise<string | null> {
    const headersList = await headers()
    return headersList.get("x-tenant-slug")
}

/**
 * Busca o tenant no banco de dados pelo slug
 * Útil para páginas públicas onde o usuário não está logado
 */
export async function getTenantBySlug(slug: string) {
    return prisma.tenant.findUnique({
        where: { slug, active: true },
        select: {
            id: true,
            slug: true,
            name: true,
            logo: true,
            primaryColor: true,
            email: true,
            phone: true,
            address: true,
        },
    })
}

/**
 * Busca o tenant pelo domínio customizado
 */
export async function getTenantByDomain(domain: string) {
    return prisma.tenant.findUnique({
        where: { domain, active: true },
        select: {
            id: true,
            slug: true,
            name: true,
            logo: true,
            primaryColor: true,
            email: true,
            phone: true,
            address: true,
        },
    })
}

/**
 * Gera a URL completa para um tenant
 */
export function getTenantUrl(slug: string): string {
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"
    const protocol = rootDomain.includes("localhost") ? "http" : "https"
    return `${protocol}://${slug}.${rootDomain}`
}
