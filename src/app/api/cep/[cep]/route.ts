import { NextRequest, NextResponse } from "next/server"
import { consultarCEP, cleanCEP, isValidCEPFormat } from "@/lib/services/cep-service"

// Cache de 7 dias (CEPs não mudam frequentemente)
export const revalidate = 604800

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cep: string }> }
) {
  try {
    const { cep } = await params
    const cleanedCEP = cleanCEP(cep)

    if (!isValidCEPFormat(cleanedCEP)) {
      return NextResponse.json(
        { error: true, message: "CEP deve ter 8 dígitos", code: "INVALID_FORMAT" },
        { status: 400 }
      )
    }

    const result = await consultarCEP(cleanedCEP)

    if ("error" in result && result.error) {
      const status = result.code === "NOT_FOUND" ? 404 : 500
      return NextResponse.json(result, { status })
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
      },
    })
  } catch (error) {
    console.error("Erro na API de CEP:", error)
    return NextResponse.json(
      { error: true, message: "Erro interno ao consultar CEP", code: "INTERNAL_ERROR" },
      { status: 500 }
    )
  }
}
