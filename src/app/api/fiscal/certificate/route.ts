// API Route: /api/fiscal/certificate
// POST - Upload de certificado digital A1
// DELETE - Remover certificado

import { auth } from '@/lib/auth'
import { certificateService } from '@/lib/fiscal'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Apenas administradores podem gerenciar certificados' },
        { status: 403 }
      )
    }

    // Processar multipart form data
    const formData = await request.formData()
    const file = formData.get('certificate') as File | null
    const senha = formData.get('senha') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo do certificado é obrigatório' },
        { status: 400 }
      )
    }

    if (!senha) {
      return NextResponse.json(
        { error: 'Senha do certificado é obrigatória' },
        { status: 400 }
      )
    }

    // Verificar extensão
    if (!file.name.toLowerCase().endsWith('.pfx') && !file.name.toLowerCase().endsWith('.p12')) {
      return NextResponse.json(
        { error: 'Arquivo deve ser um certificado .pfx ou .p12' },
        { status: 400 }
      )
    }

    // Converter para Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Fazer upload
    const result = await certificateService.uploadCertificate(
      session.user.tenantId,
      buffer,
      senha
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      validade: result.validade,
      cnpj: result.cnpj,
    })
  } catch (error) {
    console.error('[API] Erro ao fazer upload de certificado:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao processar certificado' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Apenas administradores podem gerenciar certificados' },
        { status: 403 }
      )
    }

    await certificateService.removeCertificate(session.user.tenantId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Erro ao remover certificado:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao remover certificado' },
      { status: 500 }
    )
  }
}
