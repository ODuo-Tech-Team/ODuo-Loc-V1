import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUazapiClient } from "@/lib/whatsapp"

// GET - Obter QR Code atual
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const instance = await prisma.whatsAppInstance.findUnique({
      where: { tenantId: session.user.tenantId },
    })

    if (!instance) {
      return NextResponse.json(
        { error: "Nenhuma instância encontrada" },
        { status: 404 }
      )
    }

    // Se já conectado, não precisa de QR
    if (instance.status === "CONNECTED") {
      return NextResponse.json({
        status: "CONNECTED",
        phoneNumber: instance.phoneNumber,
        qrCode: null,
      })
    }

    // Buscar QR Code atualizado da API
    const uazapi = getUazapiClient()
    const result = await uazapi.getQRCode(instance.instanceId)

    // Atualizar no banco
    if (result.qrcode || result.status) {
      await prisma.whatsAppInstance.update({
        where: { id: instance.id },
        data: {
          qrCode: result.qrcode || instance.qrCode,
          status: result.status || instance.status,
        },
      })
    }

    return NextResponse.json({
      status: result.status || instance.status,
      qrCode: result.qrcode || instance.qrCode,
      phoneNumber: instance.phoneNumber,
    })
  } catch (error) {
    console.error("Erro ao buscar QR Code:", error)
    return NextResponse.json(
      { error: "Erro ao buscar QR Code" },
      { status: 500 }
    )
  }
}
