// API Route: /api/fiscal/certificate/validate
// GET - Verificar status do certificado digital

import { auth } from '@/lib/auth'
import { certificateService } from '@/lib/fiscal'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const status = await certificateService.getCertificateStatus(session.user.tenantId)

    return NextResponse.json(status)
  } catch (error) {
    console.error('[API] Erro ao validar certificado:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao validar certificado' },
      { status: 500 }
    )
  }
}
