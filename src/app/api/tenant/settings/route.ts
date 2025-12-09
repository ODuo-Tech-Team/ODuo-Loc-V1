import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Buscar configurações do tenant
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        address: true,
        logo: true,
        primaryColor: true,
        active: true,
        domain: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 })
    }

    return NextResponse.json(tenant, { status: 200 })
  } catch (error) {
    console.error("Erro ao buscar configurações:", error)
    return NextResponse.json(
      { error: "Erro ao buscar configurações" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar configurações do tenant
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone, address, logo, primaryColor, domain } = body

    const tenant = await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(logo !== undefined && { logo }),
        ...(primaryColor !== undefined && { primaryColor }),
        ...(domain !== undefined && { domain }),
      },
    })

    return NextResponse.json(tenant, { status: 200 })
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar configurações" },
      { status: 500 }
    )
  }
}
