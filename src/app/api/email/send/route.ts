import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail, emailTemplates } from "@/lib/email"
import { processTemplate, type TemplateData } from "@/lib/template-variables"
import { DEFAULT_CONTRACT_TEMPLATE, DEFAULT_RECEIPT_TEMPLATE } from "@/lib/default-templates"

// POST - Enviar email
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar se RESEND_API_KEY está configurada
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY não configurada")
      return NextResponse.json(
        { error: "Serviço de email não configurado. Configure RESEND_API_KEY nas variáveis de ambiente." },
        { status: 503 }
      )
    }

    const tenantId = session.user.tenantId
    const body = await request.json()
    const { type, bookingId, customEmail } = body

    // Buscar tenant para informações
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, phone: true, email: true },
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 })
    }

    // Se for email customizado
    if (customEmail) {
      await sendEmail({
        to: customEmail.to,
        subject: customEmail.subject,
        html: customEmail.html,
        from: `${tenant.name} <noreply@resend.dev>`,
        replyTo: tenant.email || undefined,
      })

      return NextResponse.json({ success: true, message: "Email enviado com sucesso" })
    }

    // Se for email baseado em reserva
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId é obrigatório" }, { status: 400 })
    }

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
            cpfCnpj: true,
            address: true,
          },
        },
        equipment: {
          select: {
            name: true,
            description: true,
            pricePerDay: true,
          },
        },
        items: {
          include: {
            equipment: {
              select: {
                name: true,
                description: true,
                pricePerDay: true,
              },
            },
          },
        },
        tenant: {
          select: {
            contractTemplate: true,
            receiptTemplate: true,
            cnpj: true,
            address: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 })
    }

    if (!booking.customer.email) {
      return NextResponse.json({ error: "Cliente não possui email cadastrado" }, { status: 400 })
    }

    // Determinar equipamento principal
    const equipmentName = booking.equipment?.name || booking.items[0]?.equipment?.name || "Equipamento"

    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    }

    let emailData
    switch (type) {
      case "confirmation":
        emailData = emailTemplates.bookingConfirmation({
          customerName: booking.customer.name,
          equipmentName,
          startDate: formatDate(booking.startDate),
          endDate: formatDate(booking.endDate),
          totalPrice: booking.totalPrice,
          tenantName: tenant.name,
          tenantPhone: tenant.phone || undefined,
        })

        // Marcar como enviado
        await prisma.booking.update({
          where: { id: bookingId },
          data: { confirmationSent: true },
        })
        break

      case "reminder":
        emailData = emailTemplates.bookingReminder({
          customerName: booking.customer.name,
          equipmentName,
          startDate: formatDate(booking.startDate),
          tenantName: tenant.name,
          tenantPhone: tenant.phone || undefined,
        })

        // Marcar lembrete como enviado
        await prisma.booking.update({
          where: { id: bookingId },
          data: { reminderSent: true },
        })
        break

      case "receipt":
        emailData = emailTemplates.paymentReceipt({
          customerName: booking.customer.name,
          equipmentName,
          bookingId: booking.id,
          amount: booking.totalPrice,
          paymentDate: formatDate(new Date()),
          tenantName: tenant.name,
        })
        break

      case "cancelled":
        emailData = emailTemplates.bookingCancelled({
          customerName: booking.customer.name,
          equipmentName,
          startDate: formatDate(booking.startDate),
          tenantName: tenant.name,
          tenantPhone: tenant.phone || undefined,
        })
        break

      case "contract":
      case "receiptDocument": {
        // Calcular total de dias
        const totalDays = Math.ceil(
          (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )

        // Determinar equipamento principal para dados detalhados
        const mainEquipment = booking.equipment || booking.items[0]?.equipment

        // Preparar dados para o template
        const templateData: TemplateData = {
          clienteNome: booking.customer.name,
          clienteCpfCnpj: booking.customer.cpfCnpj || undefined,
          clienteEmail: booking.customer.email || undefined,
          clienteTelefone: booking.customer.phone || undefined,
          clienteEndereco: booking.customer.address || undefined,
          reservaNumero: `RES-${booking.id.slice(-8).toUpperCase()}`,
          dataInicio: formatDate(booking.startDate),
          dataFim: formatDate(booking.endDate),
          totalDias: totalDays,
          valorTotal: booking.totalPrice,
          equipamentos: booking.items.length > 0
            ? booking.items.map((item) => ({
                nome: item.equipment.name,
                descricao: item.equipment.description || undefined,
                quantidade: item.quantity,
                valorDiaria: item.equipment.pricePerDay,
                valorTotal: item.totalPrice,
              }))
            : mainEquipment
              ? [{
                  nome: mainEquipment.name,
                  descricao: mainEquipment.description || undefined,
                  quantidade: 1,
                  valorDiaria: mainEquipment.pricePerDay,
                  valorTotal: booking.totalPrice,
                }]
              : [],
          empresaNome: tenant.name,
          empresaCnpj: booking.tenant?.cnpj || undefined,
          empresaEndereco: booking.tenant?.address || undefined,
          empresaTelefone: tenant.phone || undefined,
          empresaEmail: tenant.email || undefined,
        }

        // Gerar HTML do documento
        let documentHtml: string
        const isContract = type === "contract"

        if (isContract) {
          documentHtml = booking.tenant?.contractTemplate
            ? processTemplate(booking.tenant.contractTemplate, templateData)
            : processTemplate(DEFAULT_CONTRACT_TEMPLATE, templateData)
        } else {
          documentHtml = booking.tenant?.receiptTemplate
            ? processTemplate(booking.tenant.receiptTemplate, templateData)
            : processTemplate(DEFAULT_RECEIPT_TEMPLATE, templateData)
        }

        emailData = emailTemplates.documentSend({
          customerName: booking.customer.name,
          customerEmail: booking.customer.email!,
          documentType: isContract ? "CONTRACT" : "RECEIPT",
          documentHtml,
          bookingId: booking.id,
          equipmentName,
          startDate: formatDate(booking.startDate),
          endDate: formatDate(booking.endDate),
          totalPrice: booking.totalPrice,
          tenantName: tenant.name,
          tenantPhone: tenant.phone || undefined,
          tenantEmail: tenant.email || undefined,
        })
        break
      }

      default:
        return NextResponse.json({ error: "Tipo de email inválido" }, { status: 400 })
    }

    await sendEmail({
      to: booking.customer.email,
      subject: emailData.subject,
      html: emailData.html,
      from: `${tenant.name} <noreply@resend.dev>`,
      replyTo: tenant.email || undefined,
    })

    return NextResponse.json({ success: true, message: "Email enviado com sucesso" })
  } catch (error: any) {
    console.error("Erro ao enviar email:", error)

    // Mensagem de erro mais específica
    let errorMessage = "Erro ao enviar email"
    if (error?.message) {
      if (error.message.includes("domain")) {
        errorMessage = "Domínio de email não verificado no Resend. Use noreply@resend.dev ou verifique seu domínio."
      } else if (error.message.includes("API key")) {
        errorMessage = "Chave de API do Resend inválida"
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
