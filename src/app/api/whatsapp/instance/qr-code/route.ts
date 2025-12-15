import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUazapiClient, normalizeInstanceStatus } from "@/lib/whatsapp"
import { WhatsAppInstanceStatus } from "@prisma/client"

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

    // Se não tem token, não consegue buscar QR
    if (!instance.apiToken) {
      return NextResponse.json({
        status: instance.status,
        qrCode: instance.qrCode,
        phoneNumber: instance.phoneNumber,
        error: "Token da instância não encontrado",
      })
    }

    // Chamar /instance/connect com o token da instância para obter QR atualizado
    // Na Uazapi, este endpoint retorna o QR code atual ou gera um novo
    const uazapi = getUazapiClient()

    try {
      const result = await uazapi.connectInstance(instance.apiToken)

      console.log("[WhatsApp QR] Resposta connect:", JSON.stringify(result, null, 2))

      // Normalizar status da Uazapi (lowercase) para nosso enum (uppercase)
      const normalizedStatus = normalizeInstanceStatus(result.status)

      // Atualizar no banco
      const updateData: { qrCode?: string | null; status?: WhatsAppInstanceStatus } = {}

      if (result.qrcode) {
        updateData.qrCode = result.qrcode
      }

      // Só atualiza status se for CONNECTED (conectou!)
      // Mantém CONNECTING enquanto aguarda o usuário escanear
      if (normalizedStatus === "CONNECTED") {
        updateData.status = "CONNECTED"
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.whatsAppInstance.update({
          where: { id: instance.id },
          data: updateData,
        })
      }

      // Retorna status atual do banco (CONNECTING) ou CONNECTED se conectou
      const returnStatus = normalizedStatus === "CONNECTED" ? "CONNECTED" : instance.status

      return NextResponse.json({
        status: returnStatus,
        qrCode: result.qrcode || instance.qrCode,
        phoneNumber: instance.phoneNumber,
      })
    } catch (apiError) {
      console.error("[WhatsApp QR] Erro ao buscar QR:", apiError)

      // Retorna QR do banco se existir
      return NextResponse.json({
        status: instance.status,
        qrCode: instance.qrCode,
        phoneNumber: instance.phoneNumber,
      })
    }
  } catch (error) {
    console.error("Erro ao buscar QR Code:", error)
    return NextResponse.json(
      { error: "Erro ao buscar QR Code" },
      { status: 500 }
    )
  }
}
