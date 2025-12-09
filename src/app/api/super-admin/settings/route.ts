import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/super-admin"
import bcrypt from "bcryptjs"

// GET - Buscar informações do sistema
export async function GET(request: NextRequest) {
  const authResult = await requireSuperAdmin()
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    // Buscar super admins
    const superAdmins = await prisma.user.findMany({
      where: { role: "SUPER_ADMIN" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        tenant: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    // Estatísticas do sistema
    const stats = await prisma.$transaction([
      prisma.tenant.count(),
      prisma.user.count(),
      prisma.equipment.count(),
      prisma.booking.count(),
      prisma.customer.count(),
      prisma.activityLog.count(),
    ])

    // Informações do ambiente
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || "development",
      databaseUrl: process.env.DATABASE_URL ? "Configurado" : "Não configurado",
      authSecret: process.env.AUTH_SECRET ? "Configurado" : "Não configurado",
      rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN || "Não configurado",
    }

    return NextResponse.json({
      superAdmins,
      stats: {
        tenants: stats[0],
        users: stats[1],
        equipments: stats[2],
        bookings: stats[3],
        customers: stats[4],
        activityLogs: stats[5],
      },
      systemInfo,
    })
  } catch (error) {
    console.error("Erro ao buscar configurações:", error)
    return NextResponse.json(
      { error: "Erro ao buscar configurações" },
      { status: 500 }
    )
  }
}

// POST - Criar novo super admin
export async function POST(request: NextRequest) {
  const authResult = await requireSuperAdmin()
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, email e senha são obrigatórios" },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 400 }
      )
    }

    // Buscar ou criar tenant do sistema (para super admins)
    let systemTenant = await prisma.tenant.findFirst({
      where: { slug: "oduo-system" },
    })

    if (!systemTenant) {
      systemTenant = await prisma.tenant.create({
        data: {
          name: "ODuo System",
          slug: "oduo-system",
          email: "system@oduoloc.com.br",
          phone: "00000000000",
          active: true,
        },
      })
    }

    // Criar super admin
    const passwordHash = await bcrypt.hash(password, 10)
    const newSuperAdmin = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "SUPER_ADMIN",
        tenantId: systemTenant.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(newSuperAdmin, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar super admin:", error)
    return NextResponse.json(
      { error: "Erro ao criar super admin" },
      { status: 500 }
    )
  }
}

// DELETE - Remover super admin
export async function DELETE(request: NextRequest) {
  const authResult = await requireSuperAdmin()
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se é o próprio usuário
    if (userId === authResult.session.user.id) {
      return NextResponse.json(
        { error: "Você não pode remover a si mesmo" },
        { status: 400 }
      )
    }

    // Verificar se existe mais de um super admin
    const superAdminCount = await prisma.user.count({
      where: { role: "SUPER_ADMIN" },
    })

    if (superAdminCount <= 1) {
      return NextResponse.json(
        { error: "Deve existir pelo menos um super admin no sistema" },
        { status: 400 }
      )
    }

    // Verificar se o usuário é super admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Usuário não encontrado ou não é super admin" },
        { status: 404 }
      )
    }

    // Deletar super admin
    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao remover super admin:", error)
    return NextResponse.json(
      { error: "Erro ao remover super admin" },
      { status: 500 }
    )
  }
}
