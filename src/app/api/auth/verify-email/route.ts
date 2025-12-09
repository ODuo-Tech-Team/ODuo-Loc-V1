import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail, emailTemplates } from "@/lib/email"

// GET - Verificar email via token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.redirect(
        new URL("/verificar-email?error=token_missing", request.url)
      )
    }

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        type: "EMAIL_VERIFICATION",
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
      return NextResponse.redirect(
        new URL("/verificar-email?error=invalid_token", request.url)
      )
    }

    // Marcar email como verificado e token como usado
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      }),
      prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: { used: true },
      }),
    ])

    // Enviar email de boas-vindas
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
    const loginUrl = `${protocol}://${verificationToken.user.tenant.slug}.${rootDomain}/login`

    const emailContent = emailTemplates.welcome({
      userName: verificationToken.user.name,
      tenantName: verificationToken.user.tenant.name,
      loginUrl,
    })

    await sendEmail({
      to: verificationToken.user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    })

    // Redirecionar para página de sucesso
    return NextResponse.redirect(
      new URL(`/verificar-email?success=true&tenant=${verificationToken.user.tenant.slug}`, request.url)
    )
  } catch (error) {
    console.error("Erro ao verificar email:", error)
    return NextResponse.redirect(
      new URL("/verificar-email?error=server_error", request.url)
    )
  }
}

// POST - Reenviar email de verificação
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

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    })

    // Sempre retornar sucesso para não expor se email existe
    if (!user || user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: "Se o email existir e não estiver verificado, você receberá um novo link",
      })
    }

    // Invalidar tokens anteriores
    await prisma.verificationToken.updateMany({
      where: {
        userId: user.id,
        type: "EMAIL_VERIFICATION",
        used: false,
      },
      data: { used: true },
    })

    // Gerar novo token
    const crypto = await import("crypto")
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas

    await prisma.verificationToken.create({
      data: {
        token,
        type: "EMAIL_VERIFICATION",
        userId: user.id,
        expiresAt,
      },
    })

    // Enviar email
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
    const verificationUrl = `${protocol}://${rootDomain}/api/auth/verify-email?token=${token}`

    const emailContent = emailTemplates.emailVerification({
      userName: user.name,
      verificationUrl,
      expiresIn: "24 horas",
    })

    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    })

    return NextResponse.json({
      success: true,
      message: "Se o email existir e não estiver verificado, você receberá um novo link",
    })
  } catch (error) {
    console.error("Erro ao reenviar verificação:", error)
    return NextResponse.json(
      { error: "Erro ao processar solicitação" },
      { status: 500 }
    )
  }
}
