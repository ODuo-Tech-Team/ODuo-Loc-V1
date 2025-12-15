import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Buscar módulos habilitados do tenant atual (para sidebar e features)
export async function GET() {
  const defaultModules = {
    nfseEnabled: false,
    stockEnabled: false,
    financialEnabled: false,
    reportsEnabled: false,
    apiEnabled: false,
    webhooksEnabled: false,
    multiUserEnabled: false,
    customDomainsEnabled: false,
    whatsappEnabled: false,
  }

  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      // Retorna módulos padrão para não autenticados
      return NextResponse.json(defaultModules)
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: {
        nfseEnabled: true,
        stockEnabled: true,
        financialEnabled: true,
        reportsEnabled: true,
        apiEnabled: true,
        webhooksEnabled: true,
        multiUserEnabled: true,
        customDomainsEnabled: true,
        subscription: {
          select: {
            plan: {
              select: {
                whatsappEnabled: true,
              },
            },
          },
        },
      },
    })

    if (!tenant) {
      return NextResponse.json(defaultModules)
    }

    // Extrair whatsappEnabled do plano de assinatura
    const whatsappEnabled = tenant.subscription?.plan?.whatsappEnabled ?? false

    return NextResponse.json({
      nfseEnabled: tenant.nfseEnabled,
      stockEnabled: tenant.stockEnabled,
      financialEnabled: tenant.financialEnabled,
      reportsEnabled: tenant.reportsEnabled,
      apiEnabled: tenant.apiEnabled,
      webhooksEnabled: tenant.webhooksEnabled,
      multiUserEnabled: tenant.multiUserEnabled,
      customDomainsEnabled: tenant.customDomainsEnabled,
      whatsappEnabled,
    })
  } catch (error) {
    console.error("Erro ao buscar módulos:", error)
    return NextResponse.json(defaultModules)
  }
}
