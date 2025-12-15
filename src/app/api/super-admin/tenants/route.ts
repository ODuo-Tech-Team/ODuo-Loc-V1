import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/super-admin"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { sendEmail, emailTemplates } from "@/lib/email"

// GET - Listar todos os tenants
export async function GET(request: NextRequest) {
  const authResult = await requireSuperAdmin()
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const url = new URL(request.url)
    const search = url.searchParams.get("search") || ""
    const status = url.searchParams.get("status") // "active", "inactive", "all"
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ]
    }

    if (status === "active") {
      whereClause.active = true
    } else if (status === "inactive") {
      whereClause.active = false
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          email: true,
          phone: true,
          active: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: true,
              equipments: true,
              bookings: true,
              customers: true,
            },
          },
        },
      }),
      prisma.tenant.count({ where: whereClause }),
    ])

    // Buscar receita de TODOS os tenants em UMA query (evita N+1)
    const tenantIds = tenants.map((t) => t.id)
    const revenueByTenant = await prisma.booking.groupBy({
      by: ["tenantId"],
      where: {
        tenantId: { in: tenantIds },
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
      _sum: { totalPrice: true },
    })

    // Mapear receita por tenant
    const revenueMap = new Map(
      revenueByTenant.map((r) => [r.tenantId, Number(r._sum.totalPrice) || 0])
    )

    const tenantsWithRevenue = tenants.map((tenant) => ({
      ...tenant,
      totalRevenue: revenueMap.get(tenant.id) || 0,
    }))

    return NextResponse.json({
      tenants: tenantsWithRevenue,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Erro ao listar tenants:", error)
    return NextResponse.json(
      { error: "Erro ao listar tenants" },
      { status: 500 }
    )
  }
}

// POST - Criar novo tenant (via super admin)
export async function POST(request: NextRequest) {
  const authResult = await requireSuperAdmin()
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const body = await request.json()
    const { name, slug, email, phone, address, adminName, adminEmail, adminPassword } = body

    if (!name || !slug || !email || !phone) {
      return NextResponse.json(
        { error: "Nome, slug, email e telefone são obrigatórios" },
        { status: 400 }
      )
    }

    // Validar dados do admin se fornecidos
    if (adminEmail || adminPassword || adminName) {
      if (!adminName || !adminEmail || !adminPassword) {
        return NextResponse.json(
          { error: "Para criar um admin, nome, email e senha são obrigatórios" },
          { status: 400 }
        )
      }

      if (adminPassword.length < 8) {
        return NextResponse.json(
          { error: "A senha do admin deve ter pelo menos 8 caracteres" },
          { status: 400 }
        )
      }

      // Verificar se email do admin já existe
      const existingUser = await prisma.user.findUnique({
        where: { email: adminEmail },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: "Este email de admin já está em uso" },
          { status: 409 }
        )
      }
    }

    // Verificar se slug já existe
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    })

    if (existingTenant) {
      return NextResponse.json(
        { error: "Este slug já está em uso" },
        { status: 409 }
      )
    }

    // Criar tenant e usuário admin em uma transação
    let verificationToken: string | null = null

    const result = await prisma.$transaction(async (tx) => {
      // Criar tenant
      const tenant = await tx.tenant.create({
        data: {
          name,
          slug,
          email,
          phone,
          address,
          active: true,
        },
      })

      let admin = null

      // Criar usuário admin se dados fornecidos
      if (adminName && adminEmail && adminPassword) {
        const passwordHash = await bcrypt.hash(adminPassword, 10)

        admin = await tx.user.create({
          data: {
            name: adminName,
            email: adminEmail,
            passwordHash,
            role: "ADMIN",
            tenantId: tenant.id,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        })

        // Criar token de verificação de email
        verificationToken = crypto.randomBytes(32).toString("hex")
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas

        await tx.verificationToken.create({
          data: {
            token: verificationToken,
            type: "EMAIL_VERIFICATION",
            userId: admin.id,
            expiresAt,
          },
        })
      }

      return { tenant, admin }
    })

    // Enviar email de verificação se admin foi criado
    if (result.admin && verificationToken) {
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"
      const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
      const verificationUrl = `${protocol}://${rootDomain}/api/auth/verify-email?token=${verificationToken}`

      try {
        const emailContent = emailTemplates.emailVerification({
          userName: result.admin.name,
          verificationUrl,
          expiresIn: "24 horas",
        })

        await sendEmail({
          to: result.admin.email,
          subject: emailContent.subject,
          html: emailContent.html,
        })
      } catch (emailError) {
        console.error("Erro ao enviar email de verificação:", emailError)
        // Não falha a criação se o email não for enviado
      }
    }

    return NextResponse.json({
      ...result.tenant,
      admin: result.admin,
    }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar tenant:", error)
    return NextResponse.json(
      { error: "Erro ao criar tenant" },
      { status: 500 }
    )
  }
}
