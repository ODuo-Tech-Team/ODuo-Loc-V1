import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Senha atual e nova senha são obrigatórias" },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Nova senha deve ter no mínimo 8 caracteres" },
        { status: 400 }
      )
    }

    // Buscar usuário com a senha
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        passwordHash: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Verificar senha atual
    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash)

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Senha atual incorreta" },
        { status: 400 }
      )
    }

    // Verificar se nova senha é diferente da atual
    const samePassword = await bcrypt.compare(newPassword, user.passwordHash)
    if (samePassword) {
      return NextResponse.json(
        { error: "Nova senha deve ser diferente da atual" },
        { status: 400 }
      )
    }

    // Hash da nova senha
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // Atualizar senha
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newPasswordHash },
    })

    return NextResponse.json({
      message: "Senha alterada com sucesso",
    })
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json(
      { error: "Erro ao alterar senha" },
      { status: 500 }
    )
  }
}
