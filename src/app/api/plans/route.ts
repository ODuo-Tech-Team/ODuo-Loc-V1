import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Listar planos ativos
export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: {
        active: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        monthlyPrice: true,
        annualPrice: true,
        maxUsers: true,
        maxEquipments: true,
        maxBookingsPerMonth: true,
        storageGb: true,
        nfseEnabled: true,
        stockEnabled: true,
        financialEnabled: true,
        reportsEnabled: true,
        apiEnabled: true,
        webhooksEnabled: true,
        multiUserEnabled: true,
        customDomainsEnabled: true,
        whatsappEnabled: true,
        featured: true,
      },
    })

    // Adicionar lista de features para exibição
    const plansWithFeatures = plans.map(plan => ({
      ...plan,
      features: [
        `Até ${plan.maxUsers} usuário${plan.maxUsers > 1 ? "s" : ""}`,
        `Até ${plan.maxEquipments} equipamentos`,
        `${plan.maxBookingsPerMonth} reservas/mês`,
        `${plan.storageGb}GB de armazenamento`,
        ...(plan.stockEnabled ? ["Gestão de Estoque"] : []),
        ...(plan.financialEnabled ? ["Módulo Financeiro"] : []),
        ...(plan.nfseEnabled ? ["Emissão de NFS-e"] : []),
        ...(plan.reportsEnabled ? ["Relatórios Avançados"] : []),
        ...(plan.multiUserEnabled ? ["Múltiplos Usuários"] : []),
        ...(plan.whatsappEnabled ? ["Integração WhatsApp"] : []),
        ...(plan.apiEnabled ? ["API de Integração"] : []),
        ...(plan.webhooksEnabled ? ["Webhooks"] : []),
        ...(plan.customDomainsEnabled ? ["Domínio Personalizado"] : []),
      ],
    }))

    return NextResponse.json({ plans: plansWithFeatures })
  } catch (error) {
    console.error("Erro ao listar planos:", error)
    return NextResponse.json(
      { error: "Erro ao listar planos" },
      { status: 500 }
    )
  }
}
