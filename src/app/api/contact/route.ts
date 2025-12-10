import { NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"
import * as z from "zod"

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  subject: z.string().min(1),
  message: z.string().min(10),
})

const subjectLabels: Record<string, string> = {
  demo: "Solicitar demonstracao",
  pricing: "Duvidas sobre precos",
  support: "Suporte tecnico",
  partnership: "Parcerias",
  other: "Outro assunto",
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = contactSchema.parse(body)

    const subjectLabel = subjectLabels[data.subject] || data.subject

    // Email para a equipe ODuo
    await sendEmail({
      to: "contato@oduoloc.com.br",
      subject: `[Contato Site] ${subjectLabel} - ${data.name}`,
      replyTo: data.email,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #317AE0 0%, #06b6d4 100%);
                color: white;
                padding: 20px;
                border-radius: 8px 8px 0 0;
                text-align: center;
              }
              .content {
                background: #f9fafb;
                padding: 24px;
                border: 1px solid #e5e7eb;
                border-top: none;
                border-radius: 0 0 8px 8px;
              }
              .field {
                margin-bottom: 16px;
              }
              .label {
                font-size: 12px;
                font-weight: 600;
                color: #6b7280;
                text-transform: uppercase;
                margin-bottom: 4px;
              }
              .value {
                font-size: 14px;
                color: #111827;
                background: white;
                padding: 12px;
                border-radius: 6px;
                border: 1px solid #e5e7eb;
              }
              .message-box {
                white-space: pre-wrap;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0; font-size: 20px;">Nova mensagem do site</h1>
              <p style="margin: 8px 0 0; opacity: 0.9;">${subjectLabel}</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Nome</div>
                <div class="value">${data.name}</div>
              </div>
              <div class="field">
                <div class="label">Email</div>
                <div class="value">${data.email}</div>
              </div>
              ${data.phone ? `
              <div class="field">
                <div class="label">Telefone</div>
                <div class="value">${data.phone}</div>
              </div>
              ` : ''}
              ${data.company ? `
              <div class="field">
                <div class="label">Empresa</div>
                <div class="value">${data.company}</div>
              </div>
              ` : ''}
              <div class="field">
                <div class="label">Mensagem</div>
                <div class="value message-box">${data.message}</div>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    // Email de confirmacao para o remetente
    await sendEmail({
      to: data.email,
      subject: "Recebemos sua mensagem | ODuoLoc",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #e4e4e7;
                background-color: #09090b;
                margin: 0;
                padding: 0;
              }
              .wrapper {
                background: #09090b;
                padding: 40px 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: #18181b;
                border-radius: 16px;
                border: 1px solid rgba(63, 63, 70, 0.5);
                overflow: hidden;
              }
              .header {
                background: linear-gradient(135deg, #317AE0 0%, #06b6d4 100%);
                padding: 32px 24px;
                text-align: center;
              }
              .logo {
                font-size: 28px;
                font-weight: 700;
                color: #ffffff;
                margin: 0;
              }
              .content {
                padding: 32px 24px;
              }
              .greeting {
                font-size: 16px;
                color: #fafafa;
                margin-bottom: 16px;
              }
              .message {
                font-size: 14px;
                color: #a1a1aa;
                margin-bottom: 24px;
              }
              .highlight-box {
                background: rgba(49, 122, 224, 0.1);
                border: 1px solid rgba(49, 122, 224, 0.3);
                border-radius: 12px;
                padding: 20px;
                margin: 24px 0;
                text-align: center;
              }
              .footer {
                background: rgba(9, 9, 11, 0.8);
                padding: 24px;
                text-align: center;
                border-top: 1px solid rgba(63, 63, 70, 0.3);
              }
              .footer-text {
                font-size: 12px;
                color: #52525b;
                margin: 0;
              }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  <h1 class="logo">ODuoLoc</h1>
                  <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Sistema de Gestao para Locadoras</p>
                </div>
                <div class="content">
                  <p class="greeting">Ola <strong>${data.name}</strong>,</p>
                  <p class="message">
                    Recebemos sua mensagem e agradecemos o contato! Nossa equipe ira analisar sua solicitacao e retornara em breve.
                  </p>
                  <div class="highlight-box">
                    <p style="color: #fafafa; margin: 0;">
                      Tempo medio de resposta: <strong>ate 24 horas uteis</strong>
                    </p>
                  </div>
                  <p class="message">
                    Enquanto isso, voce pode explorar nosso site para conhecer todas as funcionalidades do ODuoLoc.
                  </p>
                  <p style="color: #a1a1aa; font-size: 14px; margin-top: 32px;">
                    Atenciosamente,<br>
                    <strong style="color: #fafafa;">Equipe ODuoLoc</strong>
                  </p>
                </div>
                <div class="footer">
                  <p class="footer-text">Este e um email automatico. Por favor, nao responda diretamente.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao processar contato:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados invalidos", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erro ao enviar mensagem" },
      { status: 500 }
    )
  }
}
