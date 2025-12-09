import { NextRequest, NextResponse } from "next/server"
import { consultarCNPJ, cleanCNPJ, isValidCNPJFormat } from "@/lib/services/cnpj-service"

// Cache de 24 horas
export const revalidate = 86400

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cnpj: string }> }
) {
  console.log("[CNPJ API] Recebendo requisição...")
  console.log("[CNPJ API] Request URL:", request.url)
  console.log("[CNPJ API] Request headers:", Object.fromEntries(request.headers.entries()))

  try {
    const { cnpj } = await params
    console.log("[CNPJ API] CNPJ recebido:", cnpj)

    const cleanedCNPJ = cleanCNPJ(cnpj)
    console.log("[CNPJ API] CNPJ limpo:", cleanedCNPJ)

    if (!isValidCNPJFormat(cleanedCNPJ)) {
      console.log("[CNPJ API] Formato inválido")
      return NextResponse.json(
        { error: true, message: "CNPJ deve ter 14 dígitos", code: "INVALID_FORMAT" },
        { status: 400 }
      )
    }

    console.log("[CNPJ API] Chamando consultarCNPJ...")
    const result = await consultarCNPJ(cleanedCNPJ)
    console.log("[CNPJ API] Resultado:", JSON.stringify(result, null, 2))

    if ("error" in result && result.error) {
      const status = result.code === "NOT_FOUND" ? 404 :
                     result.code === "FORBIDDEN" ? 403 : 500
      console.log("[CNPJ API] Retornando erro com status:", status)
      return NextResponse.json(result, { status })
    }

    console.log("[CNPJ API] Sucesso! Retornando dados...")
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
      },
    })
  } catch (error) {
    console.error("[CNPJ API] Erro não tratado:", error)
    return NextResponse.json(
      { error: true, message: "Erro interno ao consultar CNPJ", code: "INTERNAL_ERROR" },
      { status: 500 }
    )
  }
}
