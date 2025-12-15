import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { sendEmail, emailTemplates, EMAIL_FROM } from "@/lib/email"

// GET - Listar usuários do tenant
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Apenas ADMIN pode listar usuários
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        active: true,
        deactivatedAt: true,
        deactivatedReason: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(users, { status: 200 })
  } catch (error) {
    console.error("Erro ao buscar usuários:", error)
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 }
    )
  }
}

// POST - Criar novo usuário
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Apenas ADMIN pode criar usuários
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, password, role } = body

    // Validações
    if (!name || name.length < 3) {
      return NextResponse.json(
        { error: "Nome deve ter no mínimo 3 caracteres" },
        { status: 400 }
      )
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      )
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Senha deve ter no mínimo 8 caracteres" },
        { status: 400 }
      )
    }

    if (!role || !["ADMIN", "MANAGER", "OPERATOR", "VIEWER"].includes(role)) {
      return NextResponse.json(
        { error: "Função inválida" },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está em uso" },
        { status: 409 }
      )
    }

    // Buscar dados do tenant para o e-mail
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { name: true, slug: true },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant não encontrado" },
        { status: 404 }
      )
    }

    // Buscar nome do admin que está criando
    const inviter = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    })

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10)

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        tenantId: session.user.tenantId,
        emailVerified: true, // Usuários criados pelo admin já são verificados
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    // Enviar e-mail de boas-vindas (não bloqueia a resposta)
    try {
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "oduoloc.com.br"
      const loginUrl = `https://${tenant.slug}.${rootDomain}/login`

      // Traduzir role para português
      const roleLabels: Record<string, string> = {
        ADMIN: "Administrador",
        MANAGER: "Gerente",
        OPERATOR: "Operador",
        VIEWER: "Visualizador",
      }

      const emailContent = emailTemplates.userInvitation({
        inviteeName: name,
        inviterName: inviter?.name || "Administrador",
        tenantName: tenant.name,
        role: roleLabels[role] || role,
        inviteUrl: loginUrl,
        expiresIn: "imediatamente disponível",
      })

      await sendEmail({
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
        from: EMAIL_FROM.EQUIPE,
      })
      console.log(`[EMAIL] E-mail de convite enviado para ${email}`)
    } catch (emailError) {
      // Log do erro mas não falha a operação principal
      console.error("[EMAIL] Erro ao enviar e-mail de convite:", emailError)
    }

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar usuário:", error)
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    )
  }
}
