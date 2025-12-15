import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail, emailTemplates, EMAIL_FROM } from "@/lib/email"

// PATCH - Ativar/Desativar usuário
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Apenas ADMIN pode alterar status de usuários
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { active, reason } = body

    // Verificar se usuário existe e pertence ao tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        tenant: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Não permitir alterar status de SUPER_ADMIN ou ADMIN
    if (existingUser.role === "SUPER_ADMIN" || existingUser.role === "ADMIN") {
      return NextResponse.json(
        { error: "Não é possível alterar status de administradores" },
        { status: 400 }
      )
    }

    // Não permitir desativar a si mesmo
    if (existingUser.id === session.user.id) {
      return NextResponse.json(
        { error: "Você não pode desativar sua própria conta" },
        { status: 400 }
      )
    }

    // Atualizar status do usuário
    const user = await prisma.user.update({
      where: { id },
      data: {
        active: active,
        deactivatedAt: active ? null : new Date(),
        deactivatedReason: active ? null : (reason || null),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        deactivatedAt: true,
        deactivatedReason: true,
        updatedAt: true,
      },
    })

    // Enviar e-mail de notificação (não bloqueia a resposta)
    try {
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "oduoloc.com.br"
      const loginUrl = `https://${existingUser.tenant.slug}.${rootDomain}/login`

      if (active) {
        // Usuário foi reativado
        const emailContent = emailTemplates.userReactivated({
          userName: user.name,
          tenantName: existingUser.tenant.name,
          loginUrl,
        })
        await sendEmail({
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
          from: EMAIL_FROM.NOREPLY,
        })
        console.log(`[EMAIL] E-mail de reativação enviado para ${user.email}`)
      } else {
        // Usuário foi desativado
        const emailContent = emailTemplates.userDeactivated({
          userName: user.name,
          tenantName: existingUser.tenant.name,
          reason: reason || undefined,
          supportEmail: "suporte@oduoloc.com.br",
        })
        await sendEmail({
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
          from: EMAIL_FROM.NOREPLY,
        })
        console.log(`[EMAIL] E-mail de desativação enviado para ${user.email}`)
      }
    } catch (emailError) {
      // Log do erro mas não falha a operação principal
      console.error("[EMAIL] Erro ao enviar e-mail de status:", emailError)
    }

    return NextResponse.json(user, { status: 200 })
  } catch (error) {
    console.error("Erro ao alterar status do usuário:", error)
    return NextResponse.json(
      { error: "Erro ao alterar status do usuário" },
      { status: 500 }
    )
  }
}
