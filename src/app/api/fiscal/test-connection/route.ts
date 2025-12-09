import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission, type Role } from '@/lib/permissions'
import { createFocusNfeClient, decryptToken, type FocusNfeEnvironment } from '@/lib/fiscal'

// POST - Testar conexão com Focus NFe
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role as Role, 'MANAGE_INTEGRATIONS')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const { token, environment } = body

    // Se recebeu token no body, testar com ele (ainda não salvo)
    // Senão, testar com o token salvo
    let testToken: string
    let testEnvironment: FocusNfeEnvironment

    if (token) {
      // Token novo sendo testado antes de salvar
      testToken = token
      testEnvironment = (environment || 'HOMOLOGACAO') as FocusNfeEnvironment
    } else {
      // Usar token salvo
      const fiscalConfig = await prisma.tenantFiscalConfig.findUnique({
        where: { tenantId: session.user.tenantId },
        select: {
          focusNfeToken: true,
          focusNfeEnvironment: true,
        },
      })

      if (!fiscalConfig?.focusNfeToken) {
        return NextResponse.json(
          { error: 'Token do Focus NFe não configurado' },
          { status: 400 }
        )
      }

      testToken = decryptToken(fiscalConfig.focusNfeToken)
      testEnvironment = (fiscalConfig.focusNfeEnvironment || 'HOMOLOGACAO') as FocusNfeEnvironment
    }

    // Criar cliente e testar conexão
    const client = createFocusNfeClient(testToken, testEnvironment)
    const isConnected = await client.testarConexao()

    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'Conexão com Focus NFe estabelecida com sucesso',
        environment: testEnvironment,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Não foi possível conectar ao Focus NFe. Verifique o token.',
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Erro ao testar conexão Focus NFe:', error)

    const message = error instanceof Error ? error.message : 'Erro desconhecido'

    return NextResponse.json(
      {
        success: false,
        error: `Erro ao testar conexão: ${message}`,
      },
      { status: 500 }
    )
  }
}
