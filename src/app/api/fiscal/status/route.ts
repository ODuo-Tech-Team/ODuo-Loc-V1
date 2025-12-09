import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Verificar se NFS-e está habilitada (endpoint leve para sidebar)
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ nfseEnabled: false })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { nfseEnabled: true },
    })

    return NextResponse.json({
      nfseEnabled: tenant?.nfseEnabled || false,
    })
  } catch (error) {
    console.error('Erro ao verificar status NFS-e:', error)
    return NextResponse.json({ nfseEnabled: false })
  }
}
