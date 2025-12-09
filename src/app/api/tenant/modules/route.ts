import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Buscar módulos habilitados do tenant atual (para sidebar e features)
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      // Retorna módulos padrão para não autenticados
      return NextResponse.json({
        nfseEnabled: false,
        stockEnabled: false,
        financialEnabled: false,
        reportsEnabled: false,
        apiEnabled: false,
        webhooksEnabled: false,
        multiUserEnabled: false,
        customDomainsEnabled: false,
      })
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
      },
    })

    if (!tenant) {
      return NextResponse.json({
        nfseEnabled: false,
        stockEnabled: false,
        financialEnabled: false,
        reportsEnabled: false,
        apiEnabled: false,
        webhooksEnabled: false,
        multiUserEnabled: false,
        customDomainsEnabled: false,
      })
    }

    return NextResponse.json(tenant)
  } catch (error) {
    console.error("Erro ao buscar módulos:", error)
    return NextResponse.json({
      nfseEnabled: false,
      stockEnabled: false,
      financialEnabled: false,
      reportsEnabled: false,
      apiEnabled: false,
      webhooksEnabled: false,
      multiUserEnabled: false,
      customDomainsEnabled: false,
    })
  }
}
