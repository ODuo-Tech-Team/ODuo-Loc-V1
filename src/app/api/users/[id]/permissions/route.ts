import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SystemModule } from "@prisma/client"

// GET - Listar permissões do usuário
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Apenas ADMIN pode ver permissões
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

    const { id } = await params

    // Verificar se o usuário pertence ao mesmo tenant
    const user = await prisma.user.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        modulePermissions: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Retornar permissões organizadas por módulo
    const permissions = Object.values(SystemModule).map((module) => {
      const existing = user.modulePermissions.find((p) => p.module === module)
      return {
        module,
        canView: existing?.canView ?? false,
        canCreate: existing?.canCreate ?? false,
        canEdit: existing?.canEdit ?? false,
        canDelete: existing?.canDelete ?? false,
      }
    })

    return NextResponse.json(permissions, { status: 200 })
  } catch (error) {
    console.error("Erro ao buscar permissões:", error)
    return NextResponse.json(
      { error: "Erro ao buscar permissões" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar permissões do usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Apenas ADMIN pode editar permissões
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { permissions } = body as {
      permissions: Array<{
        module: SystemModule
        canView: boolean
        canCreate: boolean
        canEdit: boolean
        canDelete: boolean
      }>
    }

    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Permissões inválidas" },
        { status: 400 }
      )
    }

    // Verificar se o usuário pertence ao mesmo tenant
    const user = await prisma.user.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Não permitir editar permissões do próprio usuário (ADMIN)
    if (user.id === session.user.id) {
      return NextResponse.json(
        { error: "Você não pode editar suas próprias permissões" },
        { status: 400 }
      )
    }

    // Não permitir editar permissões de outros ADMINs
    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Não é possível editar permissões de administradores" },
        { status: 400 }
      )
    }

    // Atualizar permissões em transação
    await prisma.$transaction(async (tx) => {
      for (const perm of permissions) {
        // Validar módulo
        if (!Object.values(SystemModule).includes(perm.module)) {
          throw new Error(`Módulo inválido: ${perm.module}`)
        }

        await tx.userModulePermission.upsert({
          where: {
            userId_module: {
              userId: id,
              module: perm.module,
            },
          },
          create: {
            userId: id,
            module: perm.module,
            canView: perm.canView,
            canCreate: perm.canCreate,
            canEdit: perm.canEdit,
            canDelete: perm.canDelete,
          },
          update: {
            canView: perm.canView,
            canCreate: perm.canCreate,
            canEdit: perm.canEdit,
            canDelete: perm.canDelete,
          },
        })
      }
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("Erro ao atualizar permissões:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar permissões" },
      { status: 500 }
    )
  }
}
