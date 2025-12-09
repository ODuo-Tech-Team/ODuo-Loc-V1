import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// GET - Buscar usuário por ID
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

    const user = await prisma.user.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(user, { status: 200 })
  } catch (error) {
    console.error("Erro ao buscar usuário:", error)
    return NextResponse.json(
      { error: "Erro ao buscar usuário" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Apenas ADMIN pode editar usuários
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, email, password, role } = body

    // Verificar se usuário existe e pertence ao tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Não permitir editar SUPER_ADMIN
    if (existingUser.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Não é possível editar Super Admin" },
        { status: 400 }
      )
    }

    // Validações
    if (name && name.length < 3) {
      return NextResponse.json(
        { error: "Nome deve ter no mínimo 3 caracteres" },
        { status: 400 }
      )
    }

    if (email && !email.includes("@")) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      )
    }

    if (password && password.length < 6) {
      return NextResponse.json(
        { error: "Senha deve ter no mínimo 6 caracteres" },
        { status: 400 }
      )
    }

    // Verificar se novo email já existe (se mudou)
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      })

      if (emailExists) {
        return NextResponse.json(
          { error: "Este email já está em uso" },
          { status: 409 }
        )
      }
    }

    // Preparar dados para atualização
    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (role) updateData.role = role
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10)
    }

    // Atualizar usuário
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(user, { status: 200 })
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar usuário" },
      { status: 500 }
    )
  }
}

// DELETE - Remover usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Apenas ADMIN pode deletar usuários
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

    const { id } = await params

    // Verificar se usuário existe e pertence ao tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Não permitir deletar SUPER_ADMIN ou ADMIN
    if (existingUser.role === "SUPER_ADMIN" || existingUser.role === "ADMIN") {
      return NextResponse.json(
        { error: "Não é possível remover administradores" },
        { status: 400 }
      )
    }

    // Não permitir deletar a si mesmo
    if (existingUser.id === session.user.id) {
      return NextResponse.json(
        { error: "Você não pode remover sua própria conta" },
        { status: 400 }
      )
    }

    // Deletar usuário
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Erro ao remover usuário:", error)
    return NextResponse.json(
      { error: "Erro ao remover usuário" },
      { status: 500 }
    )
  }
}
