import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidateCustomers } from "@/lib/cache/revalidate"

// GET - Listar clientes
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status") // "active" | "inactive" | "all" | null
    const activeOnly = searchParams.get("activeOnly") === "true" // Para manter compatibilidade

    // Determinar filtro de status
    let isActiveFilter: boolean | undefined = undefined
    if (status === "active" || activeOnly) {
      isActiveFilter = true
    } else if (status === "inactive") {
      isActiveFilter = false
    }

    const customers = await prisma.customer.findMany({
      where: {
        tenantId: session.user.tenantId,
        ...(isActiveFilter !== undefined && { isActive: isActiveFilter }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { tradeName: { contains: search, mode: "insensitive" } },
            { cpfCnpj: { contains: search } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
          ],
        }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { bookings: true, sites: true },
        },
        sites: {
          where: { isActive: true },
          orderBy: { isDefault: "desc" },
        },
      },
    })

    return NextResponse.json(customers, { status: 200 })
  } catch (error) {
    console.error("Erro ao buscar clientes:", error)
    return NextResponse.json(
      { error: "Erro ao buscar clientes" },
      { status: 500 }
    )
  }
}

// POST - Criar cliente
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      // Tipo de pessoa
      personType = "PJ",
      // Dados básicos
      name,
      tradeName,
      // Documentos
      cpfCnpj,
      inscricaoEstadual,
      inscricaoMunicipal,
      isIsentoIE = false,
      // Contatos
      email,
      phone,
      phoneSecondary,
      whatsapp,
      contactName,
      // Endereço expandido
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
      ibgeCode,
      // Legado
      address,
      // Outros
      notes,
    } = body

    if (!name) {
      return NextResponse.json(
        { error: "Campo obrigatório: name" },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.create({
      data: {
        personType,
        name,
        tradeName: tradeName || null,
        cpfCnpj: cpfCnpj || null,
        inscricaoEstadual: inscricaoEstadual || null,
        inscricaoMunicipal: inscricaoMunicipal || null,
        isIsentoIE,
        email: email || null,
        phone: phone || null,
        phoneSecondary: phoneSecondary || null,
        whatsapp: whatsapp || null,
        contactName: contactName || null,
        street: street || null,
        number: number || null,
        complement: complement || null,
        neighborhood: neighborhood || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        ibgeCode: ibgeCode || null,
        address: address || null, // campo legado
        notes: notes || null,
        tenantId: session.user.tenantId,
      },
      include: {
        sites: true,
      },
    })

    // Invalidar cache
    revalidateCustomers(session.user.tenantId)

    return NextResponse.json({ customer }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar cliente:", error)
    return NextResponse.json(
      { error: "Erro ao criar cliente" },
      { status: 500 }
    )
  }
}
