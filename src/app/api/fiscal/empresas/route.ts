import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createFocusNfeClient } from '@/lib/fiscal'
import { decryptToken } from '@/lib/fiscal/encryption'
import { prisma } from '@/lib/prisma'

// GET - Listar empresas cadastradas no Focus NFe
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar configuração fiscal do tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      include: { fiscalConfig: true },
    })

    if (!tenant?.fiscalConfig?.focusNfeToken) {
      return NextResponse.json(
        { error: 'Token do Focus NFe não configurado' },
        { status: 400 }
      )
    }

    // Descriptografar token
    const decryptedToken = decryptToken(tenant.fiscalConfig.focusNfeToken)

    // Criar cliente Focus NFe
    const client = createFocusNfeClient(
      decryptedToken,
      (tenant.fiscalConfig.focusNfeEnvironment || 'HOMOLOGACAO') as any
    )

    // Buscar empresas
    const response = await client.request<any>('GET', '/empresas')

    // Transformar resposta para formato mais amigável
    const empresas = Array.isArray(response) ? response : [response]

    return NextResponse.json(empresas)
  } catch (error) {
    console.error('Erro ao buscar empresas do Focus NFe:', error)
    return NextResponse.json(
      {
        error: 'Erro ao buscar empresas',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
