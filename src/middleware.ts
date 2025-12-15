import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Domínio raiz configurado (sem www)
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"

// Rotas protegidas que requerem autenticação (constante para evitar recriação)
const PROTECTED_ROUTE_PREFIXES = [
    "/super-admin",
    "/dashboard",
    "/equipamentos",
    "/clientes",
    "/reservas",
    "/usuarios",
    "/financeiro",
    "/configuracoes",
    "/integracoes",
    "/marketing",
    "/logs",
    "/ajuda",
    "/relatorios",
    "/calendario",
    "/comercial",
    "/estoque",
    "/notas-fiscais",
    "/renovar",
    "/api-docs",
    "/guia-inicio",
    "/whatsapp",
] as const

/**
 * Extrai o subdomínio (tenant slug) do hostname
 * Exemplos:
 * - locadora-xyz.oduoloc.com.br → "locadora-xyz"
 * - www.oduoloc.com.br → null (domínio principal)
 * - oduoloc.com.br → null (domínio principal)
 * - localhost:3000 → null (desenvolvimento)
 */
function getSubdomain(host: string): string | null {
    // Remove porta se houver
    const hostname = host.split(":")[0]

    // Desenvolvimento local - sem subdomínio
    if (hostname === "localhost" || hostname === "127.0.0.1") {
        return null
    }

    // Extrai domínio raiz sem porta
    const rootDomain = ROOT_DOMAIN.split(":")[0]

    // Se o hostname é igual ao domínio raiz, não há subdomínio
    if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
        return null
    }

    // Extrai o subdomínio
    const subdomain = hostname.replace(`.${rootDomain}`, "")

    // Se ainda tem o hostname original, não é um subdomínio válido
    if (subdomain === hostname) {
        return null
    }

    // Ignora 'www' como subdomínio
    if (subdomain === "www") {
        return null
    }

    return subdomain
}

export function middleware(req: NextRequest) {
    const host = req.headers.get("host") || ""
    const subdomain = getSubdomain(host)
    const pathname = req.nextUrl.pathname

    // Verifica se o usuário está logado através do token de sessão
    const token = req.cookies.get("authjs.session-token") || req.cookies.get("__Secure-authjs.session-token")
    const isLoggedIn = !!token

    // Verifica se está em rota protegida
    const isOnProtectedRoute = PROTECTED_ROUTE_PREFIXES.some(route => pathname.startsWith(route))

    // Se está em rota protegida e não está logado, redireciona para login
    if (isOnProtectedRoute && !isLoggedIn) {
        return NextResponse.redirect(new URL("/login", req.nextUrl))
    }

    // Se está logado e tenta acessar login ou cadastro, deixa a página lidar com o redirect
    // para garantir que o usuário seja direcionado ao subdomínio correto do tenant
    // (a página de login verificará a sessão e fará o redirect apropriado)

    // Adiciona o tenant slug (do subdomínio) nos headers para uso nas APIs e páginas
    const response = NextResponse.next()

    if (subdomain) {
        // Passa o slug do tenant para as páginas/APIs via header
        response.headers.set("x-tenant-slug", subdomain)
    }

    return response
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
