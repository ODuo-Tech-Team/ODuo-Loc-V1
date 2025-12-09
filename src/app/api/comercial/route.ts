import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Listar leads
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status")
    const source = searchParams.get("source")
    const assignedToId = searchParams.get("assignedToId")

    const leads = await prisma.lead.findMany({
      where: {
        tenantId: session.user.tenantId,
        ...(status && { status: status as any }),
        ...(source && { source: source as any }),
        ...(assignedToId && { assignedToId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { company: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        activities: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
        equipmentInterests: {
          include: {
            equipment: {
              select: { id: true, name: true },
            },
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { activities: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(leads, { status: 200 })
  } catch (error) {
    console.error("Erro ao buscar leads:", error)
    return NextResponse.json(
      { error: "Erro ao buscar leads" },
      { status: 500 }
    )
  }
}

// POST - Criar lead
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      // Dados do prospect
      name,
      company,
      email,
      phone,
      whatsapp,
      address,
      city,
      state,
      // Classificação
      status = "NEW",
      source = "DIRECT",
      contactType = "PRESENCIAL",
      // Valores
      expectedValue,
      // Interesse
      interestNotes,
      equipmentIds,
      // Tracking
      nextAction,
      nextActionDate,
      // Atribuição
      assignedToId,
    } = body

    if (!name) {
      return NextResponse.json(
        { error: "Campo obrigatório: name" },
        { status: 400 }
      )
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        company: company || null,
        email: email || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        address: address || null,
        city: city || null,
        state: state || null,
        status,
        source,
        contactType,
        expectedValue: expectedValue ? parseFloat(expectedValue) : null,
        interestNotes: interestNotes || null,
        nextAction: nextAction || null,
        nextActionDate: nextActionDate ? new Date(nextActionDate) : null,
        assignedToId: assignedToId || session.user.id,
        tenantId: session.user.tenantId,
        // Criar interesses em equipamentos se fornecidos
        ...(equipmentIds && equipmentIds.length > 0 && {
          equipmentInterests: {
            create: equipmentIds.map((equipmentId: string) => ({
              equipmentId,
            })),
          },
        }),
      },
      include: {
        activities: true,
        equipmentInterests: {
          include: {
            equipment: {
              select: { id: true, name: true },
            },
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ lead }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar lead:", error)
    return NextResponse.json(
      { error: "Erro ao criar lead" },
      { status: 500 }
    )
  }
}
