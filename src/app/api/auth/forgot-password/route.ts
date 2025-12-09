import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail, emailTemplates } from "@/lib/email"
import crypto from "crypto"

// POST - Solicitar reset de senha
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      )
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    })

    // Sempre retornar sucesso para não expor se email existe
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Se o email existir, você receberá instruções de reset",
      })
    }

    // Verificar se tenant está ativo (exceto SUPER_ADMIN)
    if (user.role !== "SUPER_ADMIN" && !user.tenant.active) {
      return NextResponse.json({
        success: true,
        message: "Se o email existir, você receberá instruções de reset",
      })
    }

    // Invalidar tokens anteriores de reset
    await prisma.verificationToken.updateMany({
      where: {
        userId: user.id,
        type: "PASSWORD_RESET",
        used: false,
      },
      data: { used: true },
    })

    // Gerar novo token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    await prisma.verificationToken.create({
      data: {
        token,
        type: "PASSWORD_RESET",
        userId: user.id,
        expiresAt,
      },
    })

    // Construir URL de reset
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
    const resetUrl = `${protocol}://${rootDomain}/redefinir-senha?token=${token}`

    // Enviar email
    const emailContent = emailTemplates.passwordReset({
      userName: user.name,
      resetUrl,
      expiresIn: "1 hora",
    })

    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    })

    return NextResponse.json({
      success: true,
      message: "Se o email existir, você receberá instruções de reset",
    })
  } catch (error) {
    console.error("Erro ao solicitar reset de senha:", error)
    return NextResponse.json(
      { error: "Erro ao processar solicitação" },
      { status: 500 }
    )
  }
}
