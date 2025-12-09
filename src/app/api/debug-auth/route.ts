import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// API temporária para debug de autenticação - REMOVER APÓS RESOLVER O PROBLEMA
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const debugInfo: Record<string, any> = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? "SET (hidden)" : "NOT SET",
      authSecret: process.env.AUTH_SECRET ? "SET (hidden)" : "NOT SET",
      rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN || "NOT SET",
    }

    // Tentar buscar usuário
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { tenant: true },
      })

      if (!user) {
        debugInfo.userFound = false
        debugInfo.error = "Usuário não encontrado no banco"

        // Listar todos os usuários (apenas emails)
        const allUsers = await prisma.user.findMany({
          select: { email: true, name: true, role: true },
          take: 10,
        })
        debugInfo.existingUsers = allUsers
      } else {
        debugInfo.userFound = true
        debugInfo.userId = user.id
        debugInfo.userName = user.name
        debugInfo.userEmail = user.email
        debugInfo.userRole = user.role
        debugInfo.tenantSlug = user.tenant.slug
        debugInfo.tenantName = user.tenant.name
        debugInfo.tenantActive = user.tenant.active
        debugInfo.passwordHashPrefix = user.passwordHash.substring(0, 10) + "..."

        // Testar senha
        if (password) {
          const passwordMatch = await bcrypt.compare(password, user.passwordHash)
          debugInfo.passwordMatch = passwordMatch

          if (!passwordMatch) {
            // Verificar se o hash é válido
            debugInfo.hashIsValid = user.passwordHash.startsWith("$2")
            debugInfo.hashLength = user.passwordHash.length
          }
        }

        // Verificar se tenant está ativo
        if (!user.tenant.active && user.role !== "SUPER_ADMIN") {
          debugInfo.loginBlockedReason = "Tenant inativo"
        }
      }
    } catch (dbError: any) {
      debugInfo.databaseError = dbError.message
      debugInfo.databaseErrorCode = dbError.code
    }

    return NextResponse.json(debugInfo)
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}
