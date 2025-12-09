import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// POST - Confirmar reset de senha
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token e senha são obrigatórios" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      )
    }

    // Buscar token válido
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        type: "PASSWORD_RESET",
        used: false,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: { tenant: true },
        },
      },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Link inválido ou expirado. Solicite um novo reset de senha." },
        { status: 400 }
      )
    }

    // Hash da nova senha
    const passwordHash = await bcrypt.hash(password, 10)

    // Atualizar senha e marcar token como usado
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { passwordHash },
      }),
      prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: { used: true },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: "Senha alterada com sucesso!",
      tenantSlug: verificationToken.user.tenant.slug,
    })
  } catch (error) {
    console.error("Erro ao redefinir senha:", error)
    return NextResponse.json(
      { error: "Erro ao redefinir senha" },
      { status: 500 }
    )
  }
}

// GET - Verificar se token é válido
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Token não fornecido" },
        { status: 400 }
      )
    }

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        type: "PASSWORD_RESET",
        used: false,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    })

    if (!verificationToken) {
      return NextResponse.json({
        valid: false,
        error: "Link inválido ou expirado",
      })
    }

    return NextResponse.json({
      valid: true,
      userName: verificationToken.user.name,
      userEmail: verificationToken.user.email,
    })
  } catch (error) {
    console.error("Erro ao verificar token:", error)
    return NextResponse.json(
      { valid: false, error: "Erro ao verificar token" },
      { status: 500 }
    )
  }
}
