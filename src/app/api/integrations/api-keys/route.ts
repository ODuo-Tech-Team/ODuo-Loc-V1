import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { auth } from "@/lib/auth"
import crypto from "crypto"

const prisma = new PrismaClient()

// Gerar chave API segura
function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = `sk_live_${crypto.randomBytes(32).toString("hex")}`
  const hash = crypto.createHash("sha256").update(key).digest("hex")
  const prefix = key.substring(0, 12) + "..."
  return { key, hash, prefix }
}

// GET - Listar API Keys do tenant
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        permissions: true,
        lastUsedAt: true,
        expiresAt: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(apiKeys, { status: 200 })
  } catch (error) {
    console.error("Erro ao buscar API Keys:", error)
    return NextResponse.json(
      { error: "Erro ao buscar API Keys" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Criar nova API Key
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, permissions, expiresAt } = body

    if (!name) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      )
    }

    // Gerar a chave
    const { key, hash, prefix } = generateApiKey()

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key: hash, // Armazena o hash, não a chave real
        prefix,
        permissions: permissions || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        tenantId: session.user.tenantId,
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        permissions: true,
        expiresAt: true,
        active: true,
        createdAt: true,
      },
    })

    // Retorna a chave completa apenas na criação (única vez que será mostrada)
    return NextResponse.json(
      {
        ...apiKey,
        key, // Chave completa - mostrar apenas uma vez!
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Erro ao criar API Key:", error)
    return NextResponse.json(
      { error: "Erro ao criar API Key" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
