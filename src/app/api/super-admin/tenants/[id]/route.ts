import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/super-admin"

// GET - Detalhes de um tenant específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireSuperAdmin()
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const { id } = await params

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        equipments: {
          select: {
            id: true,
            name: true,
            category: true,
            pricePerDay: true,
            status: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        bookings: {
          select: {
            id: true,
            bookingNumber: true,
            status: true,
            totalPrice: true,
            startDate: true,
            endDate: true,
            customer: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            users: true,
            equipments: true,
            bookings: true,
            customers: true,
          },
        },
      },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant não encontrado" },
        { status: 404 }
      )
    }

    // Buscar receita total
    const revenue = await prisma.booking.aggregate({
      _sum: { totalPrice: true },
      where: {
        tenantId: id,
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
    })

    return NextResponse.json({
      ...tenant,
      totalRevenue: revenue._sum.totalPrice || 0,
    })
  } catch (error) {
    console.error("Erro ao buscar tenant:", error)
    return NextResponse.json(
      { error: "Erro ao buscar tenant" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar tenant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireSuperAdmin()
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, phone, address, active } = body

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(address !== undefined && { address }),
        ...(active !== undefined && { active }),
      },
    })

    return NextResponse.json(tenant)
  } catch (error) {
    console.error("Erro ao atualizar tenant:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar tenant" },
      { status: 500 }
    )
  }
}

// DELETE - Deletar tenant (cuidado!)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireSuperAdmin()
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const { id } = await params
    const url = new URL(request.url)
    const confirm = url.searchParams.get("confirm")

    // Requer confirmação para deletar
    if (confirm !== "DELETE_TENANT") {
      return NextResponse.json(
        { error: "Confirmação necessária. Adicione ?confirm=DELETE_TENANT" },
        { status: 400 }
      )
    }

    // Verificar se tenant existe
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: { bookings: true, equipments: true, customers: true },
        },
      },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant não encontrado" },
        { status: 404 }
      )
    }

    // Deletar tenant (cascade vai deletar tudo relacionado)
    await prisma.tenant.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: `Tenant "${tenant.name}" deletado com sucesso`,
      deleted: {
        bookings: tenant._count.bookings,
        equipments: tenant._count.equipments,
        customers: tenant._count.customers,
      },
    })
  } catch (error) {
    console.error("Erro ao deletar tenant:", error)
    return NextResponse.json(
      { error: "Erro ao deletar tenant" },
      { status: 500 }
    )
  }
}
