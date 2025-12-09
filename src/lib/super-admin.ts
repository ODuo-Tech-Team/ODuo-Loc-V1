import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

/**
 * Verifica se o usuário atual é SUPER_ADMIN
 * Retorna o session se for super admin, ou null se não for
 */
export async function requireSuperAdmin() {
  const session = await auth()

  if (!session?.user) {
    return { error: "Não autorizado", status: 401 }
  }

  if (session.user.role !== "SUPER_ADMIN") {
    return { error: "Acesso negado. Apenas Super Admins.", status: 403 }
  }

  return { session }
}

/**
 * Helper para usar em API routes
 */
export async function withSuperAdmin<T>(
  handler: (session: any) => Promise<T>
): Promise<NextResponse | T> {
  const result = await requireSuperAdmin()

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    )
  }

  return handler(result.session)
}

/**
 * Verifica se um email pertence a um super admin
 * Lista de emails autorizados como super admin
 */
export const SUPER_ADMIN_EMAILS = [
  "admin@oduo.com.br",
  "super@oduo.com.br",
  // Adicione outros emails de super admin aqui
]

export function isSuperAdminEmail(email: string): boolean {
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase())
}
