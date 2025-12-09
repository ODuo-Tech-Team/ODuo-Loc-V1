import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import crypto from "crypto"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, tenantName, tenantSlug, phone } = body

    // Validação básica
    if (!name || !email || !password || !tenantName || !tenantSlug || !phone) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      )
    }

    // Validar formato do slug
    if (!/^[a-z0-9-]+$/.test(tenantSlug)) {
      return NextResponse.json(
        { error: "Slug deve conter apenas letras minúsculas, números e hífens" },
        { status: 400 }
      )
    }

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está cadastrado" },
        { status: 400 }
      )
    }

    // Verificar se o slug já existe
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    })

    if (existingTenant) {
      return NextResponse.json(
        { error: "Este endereço já está em uso. Tente outro." },
        { status: 400 }
      )
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10)

    // Criar tenant e usuário em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar o tenant
      const tenant = await tx.tenant.create({
        data: {
          slug: tenantSlug,
          name: tenantName,
          email: email,
          phone: phone,
          active: true,
        },
      })

      // Criar o usuário admin
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "ADMIN",
          tenantId: tenant.id,
        },
      })

      // Criar token de auto-login
      const token = crypto.randomBytes(32).toString("hex")
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos

      const autoLoginToken = await tx.autoLoginToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      })

      // Criar log de atividade
      await tx.activityLog.create({
        data: {
          action: "CREATE",
          entity: "USER",
          entityId: user.id,
          description: `Usuário ${user.name} criou conta no sistema`,
          userId: user.id,
          tenantId: tenant.id,
        },
      })

      return { tenant, user, autoLoginToken: autoLoginToken.token }
    })

    return NextResponse.json(
      {
        success: true,
        message: "Conta criada com sucesso!",
        tenant: {
          id: result.tenant.id,
          slug: result.tenant.slug,
          name: result.tenant.name,
        },
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
        },
        autoLoginToken: result.autoLoginToken,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Erro ao criar conta:", error)
    return NextResponse.json(
      { error: "Erro ao criar conta. Tente novamente." },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
