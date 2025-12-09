import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidateCustomers } from "@/lib/cache/revalidate"

// GET - Buscar cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params

    const customer = await prisma.customer.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        bookings: {
          include: {
            equipment: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(customer, { status: 200 })
  } catch (error) {
    console.error("Erro ao buscar cliente:", error)
    return NextResponse.json(
      { error: "Erro ao buscar cliente" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, email, phone, cpfCnpj, address, city, state, zipCode, notes } = body

    const customer = await prisma.customer.updateMany({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email }),
        ...(phone && { phone }),
        ...(cpfCnpj !== undefined && { cpfCnpj }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(zipCode !== undefined && { zipCode }),
        ...(notes !== undefined && { notes }),
      },
    })

    if (customer.count === 0) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      )
    }

    // Invalidar cache
    revalidateCustomers(session.user.tenantId)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar cliente" },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar status do cliente (ativo/inativo)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Campo isActive é obrigatório e deve ser boolean" },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.updateMany({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      data: {
        isActive,
      },
    })

    if (customer.count === 0) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      )
    }

    // Invalidar cache
    revalidateCustomers(session.user.tenantId)

    return NextResponse.json({
      success: true,
      isActive,
      message: isActive ? "Cliente ativado" : "Cliente bloqueado"
    }, { status: 200 })
  } catch (error) {
    console.error("Erro ao atualizar status do cliente:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar status do cliente" },
      { status: 500 }
    )
  }
}

// DELETE - Deletar cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params

    // Verificar se o cliente tem reservas
    const customerWithBookings = await prisma.customer.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    })

    if (customerWithBookings && customerWithBookings._count.bookings > 0) {
      return NextResponse.json(
        { error: "Não é possível deletar cliente com reservas" },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.deleteMany({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (customer.count === 0) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      )
    }

    // Invalidar cache
    revalidateCustomers(session.user.tenantId)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Erro ao deletar cliente:", error)
    return NextResponse.json(
      { error: "Erro ao deletar cliente" },
      { status: 500 }
    )
  }
}
