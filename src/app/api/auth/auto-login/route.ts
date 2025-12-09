import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const autoLoginSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = autoLoginSchema.parse(body)

    // Find and validate token
    const autoLoginToken = await prisma.autoLoginToken.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            tenant: {
              select: {
                id: true,
                slug: true,
                name: true,
                active: true,
              },
            },
          },
        },
      },
    })

    // Check if token exists
    if (!autoLoginToken) {
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 401 }
      )
    }

    // Check if token is already used
    if (autoLoginToken.used) {
      return NextResponse.json(
        { error: "Token já foi utilizado" },
        { status: 401 }
      )
    }

    // Check if token is expired
    if (new Date() > autoLoginToken.expiresAt) {
      return NextResponse.json(
        { error: "Token expirado" },
        { status: 401 }
      )
    }

    // Check if tenant is active
    if (!autoLoginToken.user.tenant.active) {
      return NextResponse.json(
        { error: "Conta inativa" },
        { status: 401 }
      )
    }

    // Mark token as used
    await prisma.autoLoginToken.update({
      where: { id: autoLoginToken.id },
      data: { used: true },
    })

    // Return user data for NextAuth
    return NextResponse.json(
      {
        user: {
          id: autoLoginToken.user.id,
          email: autoLoginToken.user.email,
          name: autoLoginToken.user.name,
          role: autoLoginToken.user.role,
          tenantId: autoLoginToken.user.tenantId,
          tenantSlug: autoLoginToken.user.tenant.slug,
          tenantName: autoLoginToken.user.tenant.name,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Auto-login error:", error)
    return NextResponse.json(
      { error: "Erro ao processar auto-login" },
      { status: 500 }
    )
  }
}
