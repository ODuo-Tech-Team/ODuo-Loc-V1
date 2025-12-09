import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/super-admin"

// Lista de módulos disponíveis com metadados
export const AVAILABLE_MODULES = [
  {
    key: "nfseEnabled",
    name: "Notas Fiscais (NFS-e)",
    description: "Emissão de notas fiscais de serviço eletrônicas via Focus NFe",
    icon: "FileText",
    category: "fiscal",
    requiresConfig: true,
  },
  {
    key: "stockEnabled",
    name: "Gestão de Estoque",
    description: "Controle de estoque, movimentações e alertas de níveis baixos",
    icon: "Warehouse",
    category: "operacional",
    requiresConfig: false,
  },
  {
    key: "financialEnabled",
    name: "Módulo Financeiro",
    description: "Dashboard financeiro, rentabilidade e análise de custos",
    icon: "DollarSign",
    category: "financeiro",
    requiresConfig: false,
  },
  {
    key: "reportsEnabled",
    name: "Relatórios Avançados",
    description: "Relatórios detalhados e exportação de dados",
    icon: "BarChart3",
    category: "analytics",
    requiresConfig: false,
  },
  {
    key: "apiEnabled",
    name: "API de Integração",
    description: "Acesso à API REST para integrações externas",
    icon: "Code",
    category: "integracao",
    requiresConfig: false,
  },
  {
    key: "webhooksEnabled",
    name: "Webhooks",
    description: "Notificações automáticas para sistemas externos",
    icon: "Webhook",
    category: "integracao",
    requiresConfig: false,
  },
  {
    key: "multiUserEnabled",
    name: "Múltiplos Usuários",
    description: "Permite criar múltiplos usuários com diferentes permissões",
    icon: "Users",
    category: "usuarios",
    requiresConfig: false,
  },
  {
    key: "customDomainsEnabled",
    name: "Domínios Personalizados",
    description: "Usar domínio próprio (ex: locadora.com.br)",
    icon: "Globe",
    category: "avancado",
    requiresConfig: true,
  },
] as const

export type ModuleKey = (typeof AVAILABLE_MODULES)[number]["key"]

// GET - Buscar módulos de um tenant
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
      select: {
        id: true,
        name: true,
        nfseEnabled: true,
        stockEnabled: true,
        financialEnabled: true,
        reportsEnabled: true,
        apiEnabled: true,
        webhooksEnabled: true,
        multiUserEnabled: true,
        customDomainsEnabled: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 })
    }

    // Montar resposta com detalhes de cada módulo
    const modules = AVAILABLE_MODULES.map((module) => ({
      ...module,
      enabled: tenant[module.key as keyof typeof tenant] as boolean,
    }))

    return NextResponse.json({
      tenantId: tenant.id,
      tenantName: tenant.name,
      modules,
    })
  } catch (error) {
    console.error("Erro ao buscar módulos:", error)
    return NextResponse.json({ error: "Erro ao buscar módulos" }, { status: 500 })
  }
}

// PUT - Atualizar módulos de um tenant
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

    // Validar que apenas campos de módulos são atualizados
    const validKeys = AVAILABLE_MODULES.map((m) => m.key)
    const updates: Record<string, boolean> = {}

    for (const [key, value] of Object.entries(body)) {
      if (validKeys.includes(key as ModuleKey) && typeof value === "boolean") {
        updates[key] = value
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Nenhum módulo válido para atualizar" },
        { status: 400 }
      )
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: updates,
      select: {
        id: true,
        name: true,
        nfseEnabled: true,
        stockEnabled: true,
        financialEnabled: true,
        reportsEnabled: true,
        apiEnabled: true,
        webhooksEnabled: true,
        multiUserEnabled: true,
        customDomainsEnabled: true,
      },
    })

    // Log de atividade
    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entity: "TENANT_MODULES",
        entityId: id,
        description: `Módulos atualizados para tenant ${tenant.name}`,
        metadata: {
          changes: updates,
        },
        userId: authResult.session.user.id,
        tenantId: id,
      },
    })

    return NextResponse.json({
      success: true,
      tenant,
      updatedModules: Object.keys(updates),
    })
  } catch (error) {
    console.error("Erro ao atualizar módulos:", error)
    return NextResponse.json({ error: "Erro ao atualizar módulos" }, { status: 500 })
  }
}
