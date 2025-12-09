import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET - Detalhes do site
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; siteId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id: customerId, siteId } = await params

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

    const site = await prisma.customerSite.findFirst({
      where: {
        id: siteId,
        customerId,
      },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    })

    if (!site) {
      return NextResponse.json({ error: "Local não encontrado" }, { status: 404 })
    }

    return NextResponse.json(site, { status: 200 })
  } catch (error) {
    console.error("Erro ao buscar local:", error)
    return NextResponse.json(
      { error: "Erro ao buscar local" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar site
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; siteId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id: customerId, siteId } = await params

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

    // Verificar se o site existe
    const existingSite = await prisma.customerSite.findFirst({
      where: {
        id: siteId,
        customerId,
      },
    })

    if (!existingSite) {
      return NextResponse.json({ error: "Local não encontrado" }, { status: 404 })
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
      isActive,
      isDefault,
    } = body

    // Se este site for o padrão, remover o padrão dos outros
    if (isDefault && !existingSite.isDefault) {
      await prisma.customerSite.updateMany({
        where: { customerId, id: { not: siteId } },
        data: { isDefault: false },
      })
    }

    const site = await prisma.customerSite.update({
      where: { id: siteId },
      data: {
        ...(name !== undefined && { name }),
        ...(street !== undefined && { street: street || null }),
        ...(number !== undefined && { number: number || null }),
        ...(complement !== undefined && { complement: complement || null }),
        ...(neighborhood !== undefined && { neighborhood: neighborhood || null }),
        ...(city !== undefined && { city: city || null }),
        ...(state !== undefined && { state: state || null }),
        ...(zipCode !== undefined && { zipCode: zipCode || null }),
        ...(ibgeCode !== undefined && { ibgeCode: ibgeCode || null }),
        ...(contactName !== undefined && { contactName: contactName || null }),
        ...(contactPhone !== undefined && { contactPhone: contactPhone || null }),
        ...(isActive !== undefined && { isActive }),
        ...(isDefault !== undefined && { isDefault }),
      },
    })

    return NextResponse.json({ site }, { status: 200 })
  } catch (error) {
    console.error("Erro ao atualizar local:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar local" },
      { status: 500 }
    )
  }
}

// DELETE - Desativar site (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; siteId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id: customerId, siteId } = await params

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

    // Verificar se o site existe
    const existingSite = await prisma.customerSite.findFirst({
      where: {
        id: siteId,
        customerId,
      },
    })

    if (!existingSite) {
      return NextResponse.json({ error: "Local não encontrado" }, { status: 404 })
    }

    // Verificar se há orçamentos vinculados
    const bookingsCount = await prisma.booking.count({
      where: { customerSiteId: siteId },
    })

    if (bookingsCount > 0) {
      // Soft delete se houver orçamentos vinculados
      await prisma.customerSite.update({
        where: { id: siteId },
        data: { isActive: false },
      })
      return NextResponse.json(
        { message: "Local desativado (possui orçamentos vinculados)" },
        { status: 200 }
      )
    }

    // Hard delete se não houver orçamentos vinculados
    await prisma.customerSite.delete({
      where: { id: siteId },
    })

    return NextResponse.json(
      { message: "Local excluído com sucesso" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Erro ao excluir local:", error)
    return NextResponse.json(
      { error: "Erro ao excluir local" },
      { status: 500 }
    )
  }
}
