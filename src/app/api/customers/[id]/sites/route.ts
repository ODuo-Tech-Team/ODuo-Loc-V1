import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET - Listar sites do cliente
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id: customerId } = await params

    // Verificar se o cliente pertence ao tenant
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId: session.user.tenantId,
      },
    })

    if (!customer) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get("activeOnly") !== "false"

    const sites = await prisma.customerSite.findMany({
      where: {
        customerId,
        ...(activeOnly && { isActive: true }),
      },
      orderBy: [
        { isDefault: "desc" },
        { name: "asc" },
      ],
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    })

    return NextResponse.json(sites, { status: 200 })
  } catch (error) {
    console.error("Erro ao buscar locais:", error)
    return NextResponse.json(
      { error: "Erro ao buscar locais" },
      { status: 500 }
    )
  }
}

// POST - Criar site
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id: customerId } = await params

    // Verificar se o cliente pertence ao tenant
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId: session.user.tenantId,
      },
    })

    if (!customer) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    const body = await request.json()
    const {
      name,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
      ibgeCode,
      contactName,
      contactPhone,
      isDefault = false,
    } = body

    if (!name) {
      return NextResponse.json(
        { error: "Campo obrigatório: name" },
        { status: 400 }
      )
    }

    // Se este site for o padrão, remover o padrão dos outros
    if (isDefault) {
      await prisma.customerSite.updateMany({
        where: { customerId },
        data: { isDefault: false },
      })
    }

    const site = await prisma.customerSite.create({
      data: {
        name,
        street: street || null,
        number: number || null,
        complement: complement || null,
        neighborhood: neighborhood || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        ibgeCode: ibgeCode || null,
        contactName: contactName || null,
        contactPhone: contactPhone || null,
        isDefault,
        customerId,
      },
    })

    return NextResponse.json({ site }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar local:", error)
    return NextResponse.json(
      { error: "Erro ao criar local" },
      { status: 500 }
    )
  }
}
