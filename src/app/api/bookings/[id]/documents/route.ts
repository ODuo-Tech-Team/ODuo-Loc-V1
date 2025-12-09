import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { pdfTemplates } from "@/lib/pdf-templates"
import { processTemplate, type TemplateData } from "@/lib/template-variables"
import { DEFAULT_CONTRACT_TEMPLATE, DEFAULT_RECEIPT_TEMPLATE } from "@/lib/default-templates"

// GET - Listar documentos da reserva
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const tenantId = session.user.tenantId

    // Verificar se a reserva pertence ao tenant
    const booking = await prisma.booking.findFirst({
      where: { id, tenantId },
      select: { id: true },
    })

    if (!booking) {
      return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 })
    }

    const documents = await prisma.bookingDocument.findMany({
      where: { bookingId: id },
      orderBy: { generatedAt: "desc" },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error("Erro ao buscar documentos:", error)
    return NextResponse.json({ error: "Erro ao buscar documentos" }, { status: 500 })
  }
}

// POST - Gerar documento (contrato ou recibo)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const tenantId = session.user.tenantId
    const body = await request.json()
    const { type } = body // CONTRACT, RECEIPT, INVOICE

    if (!type || !["CONTRACT", "RECEIPT", "INVOICE"].includes(type)) {
      return NextResponse.json({ error: "Tipo de documento inválido" }, { status: 400 })
    }

    // Buscar reserva com dados relacionados
    const booking = await prisma.booking.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        equipment: true,
        tenant: {
          select: {
            name: true,
            address: true,
            phone: true,
            email: true,
            cnpj: true,
            contractTemplate: true,
            receiptTemplate: true,
          },
        },
        items: {
          include: {
            equipment: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 })
    }

    // Determinar equipamento principal (legado ou primeiro item)
    const mainEquipment = booking.equipment || booking.items[0]?.equipment
    if (!mainEquipment) {
      return NextResponse.json({ error: "Reserva sem equipamento associado" }, { status: 400 })
    }

    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    }

    const totalDays = Math.ceil(
      (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )

    let htmlContent = ""

    // Preparar dados para o template customizável
    const templateData: TemplateData = {
      // Cliente
      clienteNome: booking.customer.name,
      clienteCpfCnpj: booking.customer.cpfCnpj || undefined,
      clienteEmail: booking.customer.email || undefined,
      clienteTelefone: booking.customer.phone || undefined,
      clienteEndereco: booking.customer.address || undefined,

      // Reserva
      reservaNumero: `RES-${booking.id.slice(-8).toUpperCase()}`,
      dataInicio: formatDate(booking.startDate),
      dataFim: formatDate(booking.endDate),
      totalDias: totalDays,
      valorTotal: booking.totalPrice,

      // Equipamentos
      equipamentos: booking.items.length > 0
        ? booking.items.map((item) => ({
            nome: item.equipment.name,
            descricao: item.equipment.description || undefined,
            quantidade: item.quantity,
            valorDiaria: item.equipment.pricePerDay,
            valorTotal: item.totalPrice,
          }))
        : [{
            nome: mainEquipment.name,
            descricao: mainEquipment.description || undefined,
            quantidade: 1,
            valorDiaria: mainEquipment.pricePerDay,
            valorTotal: booking.totalPrice,
          }],

      // Empresa
      empresaNome: booking.tenant.name,
      empresaCnpj: booking.tenant.cnpj || undefined,
      empresaEndereco: booking.tenant.address || undefined,
      empresaTelefone: booking.tenant.phone || undefined,
      empresaEmail: booking.tenant.email || undefined,
    }

    if (type === "CONTRACT") {
      // Verificar se tem template customizado
      if (booking.tenant.contractTemplate) {
        htmlContent = processTemplate(booking.tenant.contractTemplate, templateData)
      } else {
        // Usar template padrão do sistema de variáveis
        htmlContent = processTemplate(DEFAULT_CONTRACT_TEMPLATE, templateData)
      }
    } else if (type === "RECEIPT") {
      // Verificar se tem template customizado
      if (booking.tenant.receiptTemplate) {
        htmlContent = processTemplate(booking.tenant.receiptTemplate, templateData)
      } else {
        // Usar template padrão do sistema de variáveis
        htmlContent = processTemplate(DEFAULT_RECEIPT_TEMPLATE, templateData)
      }
    }

    // Retornar o HTML para renderização no cliente
    // Em produção, você pode usar um serviço como Puppeteer, html-pdf-node, etc.
    // para converter HTML em PDF real

    // Salvar registro do documento
    const document = await prisma.bookingDocument.create({
      data: {
        type: type as "CONTRACT" | "RECEIPT" | "INVOICE",
        url: "", // Será preenchido após upload do PDF
        bookingId: id,
      },
    })

    return NextResponse.json({
      document,
      html: htmlContent,
      message: "Documento gerado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao gerar documento:", error)
    return NextResponse.json({ error: "Erro ao gerar documento" }, { status: 500 })
  }
}
