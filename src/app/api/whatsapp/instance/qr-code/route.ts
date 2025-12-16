import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUazapiClient, normalizeInstanceStatus } from "@/lib/whatsapp"
import { WhatsAppInstanceStatus } from "@prisma/client"

// GET - Obter status e QR Code atual (polling - NÃO gera novo QR)
// Use ?refresh=true para forçar novo QR code
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get("refresh") === "true"

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

    // Se não tem token, não consegue buscar status
    if (!instance.apiToken) {
      return NextResponse.json({
        status: instance.status,
        qrCode: instance.qrCode,
        phoneNumber: instance.phoneNumber,
        error: "Token da instância não encontrado",
      })
    }

    const uazapi = getUazapiClient()

    // Se NÃO é refresh, apenas verificar status sem gerar novo QR
    if (!forceRefresh) {
      try {
        // Verificar status atual da conexão (usa apiToken, não instanceId)
        const statusResult = await uazapi.getConnectionStatus(instance.apiToken)
        console.log("[WhatsApp QR] Status check:", JSON.stringify(statusResult, null, 2))

        const normalizedStatus = normalizeInstanceStatus(statusResult.status)

        // Se conectou, atualizar banco
        if (normalizedStatus === "CONNECTED") {
          await prisma.whatsAppInstance.update({
            where: { id: instance.id },
            data: {
              status: "CONNECTED",
              phoneNumber: statusResult.phone || null,
            },
          })

          return NextResponse.json({
            status: "CONNECTED",
            phoneNumber: statusResult.phone,
            qrCode: null,
          })
        }

        // Ainda não conectou - retornar QR do banco (sem gerar novo)
        return NextResponse.json({
          status: instance.status,
          qrCode: instance.qrCode,
          phoneNumber: instance.phoneNumber,
        })
      } catch (apiError) {
        console.error("[WhatsApp QR] Erro ao verificar status:", apiError)
        // Em caso de erro, retornar dados do banco
        return NextResponse.json({
          status: instance.status,
          qrCode: instance.qrCode,
          phoneNumber: instance.phoneNumber,
        })
      }
    }

    // REFRESH = true: Gerar novo QR code
    try {
      console.log("[WhatsApp QR] Gerando novo QR code (refresh=true)")
      const result = await uazapi.connectInstance(instance.apiToken)

      console.log("[WhatsApp QR] Novo QR gerado:", result.qrcode ? "Sim" : "Não")

      // Normalizar status da Uazapi (lowercase) para nosso enum (uppercase)
      const normalizedStatus = normalizeInstanceStatus(result.status)

      // Atualizar no banco
      const updateData: { qrCode?: string | null; status?: WhatsAppInstanceStatus; phoneNumber?: string | null } = {}

      if (result.qrcode) {
        updateData.qrCode = result.qrcode
      }

      if (normalizedStatus === "CONNECTED") {
        updateData.status = "CONNECTED"
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.whatsAppInstance.update({
          where: { id: instance.id },
          data: updateData,
        })
      }

      const returnStatus = normalizedStatus === "CONNECTED" ? "CONNECTED" : instance.status

      return NextResponse.json({
        status: returnStatus,
        qrCode: result.qrcode || instance.qrCode,
        phoneNumber: instance.phoneNumber,
      })
    } catch (apiError) {
      console.error("[WhatsApp QR] Erro ao gerar novo QR:", apiError)

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
