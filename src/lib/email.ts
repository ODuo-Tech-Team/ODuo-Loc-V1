import { Resend } from "resend"

// Inicializa Resend apenas se a chave existir
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// Endereços de e-mail por categoria
export const EMAIL_FROM = {
  // E-mails automáticos do sistema (sem resposta)
  NOREPLY: "ODuoLoc <noreply@oduoloc.com.br>",
  // Suporte ao cliente
  SUPORTE: "Suporte ODuoLoc <suporte@oduoloc.com.br>",
  // E-mails financeiros (cobranças, faturas, pagamentos)
  FINANCEIRO: "Financeiro ODuoLoc <financeiro@oduoloc.com.br>",
  // Notificações de reservas e alertas
  NOTIFICACOES: "Notificações ODuoLoc <notificacoes@oduoloc.com.br>",
  // Convites de equipe e usuários
  EQUIPE: "Equipe ODuoLoc <equipe@oduoloc.com.br>",
  // Envio de documentos (contratos, recibos, NFS-e)
  DOCUMENTOS: "Documentos ODuoLoc <documentos@oduoloc.com.br>",
} as const

interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}

export async function sendEmail({
  to,
  subject,
  html,
  from = EMAIL_FROM.NOREPLY,
  replyTo,
}: SendEmailOptions) {
  if (!resend) {
    console.warn("RESEND_API_KEY não configurada. Email não enviado.")
    return { id: "mock-id", message: "Email service not configured" }
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo,
    })

    if (error) {
      console.error("Erro ao enviar email:", error)
      throw new Error(error.message)
    }

    return data
  } catch (error) {
    console.error("Erro ao enviar email:", error)
    throw error
  }
}

// Estilos base da identidade visual ODuoLoc
// Cores: Primary #317AE0, Secondary #195AB4, Accent #06b6d4, Background #04132A
const baseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Montserrat:wght@400;500;600&display=swap');

  body {
    font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #ffffff;
    background-color: #04132A;
    margin: 0;
    padding: 0;
  }
  .wrapper {
    background: linear-gradient(180deg, #04132A 0%, #0a1e3d 50%, #04132A 100%);
    padding: 40px 20px;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background: linear-gradient(180deg, #0a1e3d 0%, #04132A 100%);
    border-radius: 16px;
    border: 1px solid rgba(49, 122, 224, 0.2);
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(49, 122, 224, 0.1);
  }
  .header {
    background: linear-gradient(135deg, #317AE0 0%, #195AB4 100%);
    padding: 32px 24px;
    text-align: center;
  }
  .logo {
    font-family: 'Poppins', sans-serif;
    font-size: 28px;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  .logo-subtitle {
    font-size: 12px;
    color: rgba(255,255,255,0.85);
    margin-top: 4px;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .header-title {
    font-family: 'Poppins', sans-serif;
    font-size: 24px;
    font-weight: 600;
    color: #ffffff;
    margin: 16px 0 0;
  }
  .content {
    padding: 32px 24px;
  }
  .greeting {
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    color: #ffffff;
    margin-bottom: 16px;
  }
  .message {
    font-size: 14px;
    color: #94a3b8;
    margin-bottom: 24px;
  }
  .details-card {
    background: rgba(49, 122, 224, 0.1);
    border: 1px solid rgba(49, 122, 224, 0.25);
    border-radius: 12px;
    padding: 20px;
    margin: 24px 0;
  }
  .details-title {
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #06b6d4;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(6, 182, 212, 0.3);
  }
  .details-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid rgba(49, 122, 224, 0.15);
  }
  .details-row:last-child {
    border-bottom: none;
  }
  .details-label {
    font-size: 13px;
    color: #94a3b8;
  }
  .details-value {
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
  }
  .total-row {
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(49, 122, 224, 0.1) 100%);
    border-radius: 8px;
    padding: 16px;
    margin-top: 12px;
  }
  .total-value {
    font-size: 24px;
    font-weight: 700;
    color: #06b6d4;
  }
  .highlight-box {
    background: linear-gradient(135deg, rgba(49, 122, 224, 0.15) 0%, rgba(25, 90, 180, 0.1) 100%);
    border: 1px solid rgba(49, 122, 224, 0.3);
    border-radius: 12px;
    padding: 20px;
    margin: 24px 0;
    text-align: center;
  }
  .highlight-text {
    font-size: 15px;
    color: #ffffff;
    margin: 0;
  }
  .highlight-text strong {
    color: #06b6d4;
  }
  .warning-box {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-left: 4px solid #f59e0b;
    border-radius: 0 12px 12px 0;
    padding: 20px;
    margin: 24px 0;
  }
  .success-box {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(22, 163, 74, 0.1) 100%);
    border: 1px solid rgba(34, 197, 94, 0.3);
    border-left: 4px solid #22c55e;
    border-radius: 0 12px 12px 0;
    padding: 20px;
    margin: 24px 0;
  }
  .error-box {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-left: 4px solid #ef4444;
    border-radius: 0 12px 12px 0;
    padding: 20px;
    margin: 24px 0;
  }
  .info-box {
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(49, 122, 224, 0.1) 100%);
    border: 1px solid rgba(6, 182, 212, 0.3);
    border-left: 4px solid #06b6d4;
    border-radius: 0 12px 12px 0;
    padding: 20px;
    margin: 24px 0;
  }
  .signature {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid rgba(49, 122, 224, 0.2);
  }
  .signature-text {
    font-size: 14px;
    color: #94a3b8;
  }
  .signature-name {
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
    margin-top: 8px;
  }
  .footer {
    background: rgba(4, 19, 42, 0.9);
    padding: 24px;
    text-align: center;
    border-top: 1px solid rgba(49, 122, 224, 0.2);
  }
  .footer-text {
    font-size: 12px;
    color: #64748b;
    margin: 0;
  }
  .footer-brand {
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #317AE0;
    margin-top: 8px;
  }
  .footer-links {
    margin-top: 12px;
  }
  .footer-link {
    color: #317AE0;
    text-decoration: none;
    font-size: 12px;
    margin: 0 8px;
  }
  .button {
    display: inline-block;
    background: linear-gradient(135deg, #317AE0 0%, #195AB4 100%);
    color: #ffffff;
    text-decoration: none;
    padding: 14px 32px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    margin: 16px 0;
    box-shadow: 0 4px 14px rgba(49, 122, 224, 0.4);
  }
  .button:hover {
    background: linear-gradient(135deg, #4a90ed 0%, #317AE0 100%);
  }
  .button-secondary {
    display: inline-block;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #ffffff;
    text-decoration: none;
    padding: 12px 28px;
    border-radius: 8px;
    font-weight: 500;
    font-size: 14px;
    margin: 8px;
  }
  .price-highlight {
    font-family: 'Poppins', sans-serif;
    font-size: 32px;
    font-weight: 700;
    color: #06b6d4;
    text-align: center;
    margin: 16px 0;
  }
  .badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .badge-success {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
  }
  .badge-warning {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
  }
  .badge-error {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
  .badge-info {
    background: rgba(6, 182, 212, 0.2);
    color: #06b6d4;
  }
`

// Templates de email
export const emailTemplates = {
  // Confirmação de reserva
  bookingConfirmation: (data: {
    customerName: string
    equipmentName: string
    startDate: string
    endDate: string
    totalPrice: number
    tenantName: string
    tenantPhone?: string
    bookingId?: string
  }) => ({
    subject: `Reserva Confirmada - ${data.equipmentName} | ODuoLoc`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyles}</style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1 class="logo">ODuoLoc</h1>
                <p class="logo-subtitle">Sistema de Gestão para Locadoras</p>
                <h2 class="header-title">Reserva Confirmada!</h2>
              </div>

              <div class="content">
                <p class="greeting">Olá <strong>${data.customerName}</strong>,</p>
                <p class="message">Sua reserva foi confirmada com sucesso! Abaixo estão os detalhes:</p>

                <div class="details-card">
                  <h3 class="details-title">Detalhes da Reserva</h3>
                  ${data.bookingId ? `
                  <div class="details-row">
                    <span class="details-label">Nº da Reserva</span>
                    <span class="details-value">#${data.bookingId.slice(-8).toUpperCase()}</span>
                  </div>
                  ` : ''}
                  <div class="details-row">
                    <span class="details-label">Equipamento</span>
                    <span class="details-value">${data.equipmentName}</span>
                  </div>
                  <div class="details-row">
                    <span class="details-label">Data de Início</span>
                    <span class="details-value">${data.startDate}</span>
                  </div>
                  <div class="details-row">
                    <span class="details-label">Data de Término</span>
                    <span class="details-value">${data.endDate}</span>
                  </div>
                  <div class="total-row">
                    <div class="details-row" style="border: none; padding: 0;">
                      <span class="details-label" style="font-size: 14px;">Valor Total</span>
                      <span class="total-value">R$ ${data.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div class="highlight-box">
                  <p class="highlight-text">
                    Em caso de dúvidas, entre em contato conosco${data.tenantPhone ? ` pelo telefone <strong>${data.tenantPhone}</strong>` : ""}.
                  </p>
                </div>

                <div class="signature">
                  <p class="signature-text">Atenciosamente,</p>
                  <p class="signature-name">${data.tenantName}</p>
                </div>
              </div>

              <div class="footer">
                <p class="footer-brand">ODuoLoc</p>
                <p class="footer-text">Sistema de Gestão para Locadoras</p>
                <div class="footer-links">
                  <a href="https://oduoloc.com.br" class="footer-link">oduoloc.com.br</a>
                  <span style="color: #64748b;">|</span>
                  <a href="mailto:suporte@oduoloc.com.br" class="footer-link">suporte@oduoloc.com.br</a>
                </div>
                <p class="footer-text" style="margin-top: 16px; font-size: 11px;">© ${new Date().getFullYear()} ODuo Assessoria. Todos os direitos reservados.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // Lembrete de reserva
  bookingReminder: (data: {
    customerName: string
    equipmentName: string
    startDate: string
    tenantName: string
    tenantPhone?: string
  }) => ({
    subject: `Lembrete: Sua reserva começa amanhã - ${data.equipmentName} | ODuoLoc`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyles}
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1 class="logo">ODuoLoc</h1>
                <p class="logo-subtitle">Sistema de Gestão para Locadoras</p>
                <h2 class="header-title">Lembrete de Reserva</h2>
              </div>

              <div class="content">
                <p class="greeting">Olá <strong>${data.customerName}</strong>,</p>

                <div class="warning-box">
                  <p class="highlight-text">
                    Sua reserva do equipamento <strong>${data.equipmentName}</strong> começa <strong>amanhã (${data.startDate})</strong>!
                  </p>
                </div>

                <p class="message">
                  Por favor, certifique-se de estar disponível para a retirada/entrega do equipamento.
                </p>

                <div class="highlight-box">
                  <p class="highlight-text">
                    Em caso de dúvidas ou necessidade de alteração, entre em contato conosco${data.tenantPhone ? ` pelo telefone <strong>${data.tenantPhone}</strong>` : ""}.
                  </p>
                </div>

                <div class="signature">
                  <p class="signature-text">Atenciosamente,</p>
                  <p class="signature-name">${data.tenantName}</p>
                </div>
              </div>

              <div class="footer">
                <p class="footer-brand">ODuoLoc</p>
                <p class="footer-text">Sistema de Gestão para Locadoras</p>
                <div class="footer-links">
                  <a href="https://oduoloc.com.br" class="footer-link">oduoloc.com.br</a>
                  <span style="color: #64748b;">|</span>
                  <a href="mailto:suporte@oduoloc.com.br" class="footer-link">suporte@oduoloc.com.br</a>
                </div>
                <p class="footer-text" style="margin-top: 16px; font-size: 11px;">© ${new Date().getFullYear()} ODuo Assessoria. Todos os direitos reservados.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // Recibo de pagamento
  paymentReceipt: (data: {
    customerName: string
    equipmentName: string
    bookingId: string
    amount: number
    paymentDate: string
    tenantName: string
    paymentMethod?: string
  }) => ({
    subject: `Pagamento Confirmado - Reserva #${data.bookingId.slice(-6)} | ODuoLoc`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyles}
            .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1 class="logo">ODuoLoc</h1>
                <p class="logo-subtitle">Sistema de Gestão para Locadoras</p>
                <h2 class="header-title">Pagamento Confirmado!</h2>
              </div>

              <div class="content">
                <p class="greeting">Olá <strong>${data.customerName}</strong>,</p>
                <p class="message">Confirmamos o recebimento do seu pagamento.</p>

                <div class="success-box">
                  <div style="text-align: center;">
                    <p style="font-size: 14px; color: #10b981; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Valor Recebido</p>
                    <p style="font-size: 36px; font-weight: 700; color: #10b981; margin: 0;">R$ ${data.amount.toFixed(2)}</p>
                  </div>
                </div>

                <div class="details-card">
                  <h3 class="details-title" style="color: #10b981; border-color: rgba(16, 185, 129, 0.2);">Recibo de Pagamento</h3>
                  <div class="details-row">
                    <span class="details-label">Nº da Reserva</span>
                    <span class="details-value">#${data.bookingId.slice(-8).toUpperCase()}</span>
                  </div>
                  <div class="details-row">
                    <span class="details-label">Equipamento</span>
                    <span class="details-value">${data.equipmentName}</span>
                  </div>
                  <div class="details-row">
                    <span class="details-label">Data do Pagamento</span>
                    <span class="details-value">${data.paymentDate}</span>
                  </div>
                  ${data.paymentMethod ? `
                  <div class="details-row">
                    <span class="details-label">Forma de Pagamento</span>
                    <span class="details-value">${data.paymentMethod}</span>
                  </div>
                  ` : ''}
                </div>

                <div class="highlight-box" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%); border-color: rgba(16, 185, 129, 0.3);">
                  <p class="highlight-text">
                    Guarde este email como comprovante de pagamento.
                  </p>
                </div>

                <div class="signature">
                  <p class="signature-text">Atenciosamente,</p>
                  <p class="signature-name">${data.tenantName}</p>
                </div>
              </div>

              <div class="footer">
                <p class="footer-brand">ODuoLoc</p>
                <p class="footer-text">Sistema de Gestão para Locadoras</p>
                <div class="footer-links">
                  <a href="https://oduoloc.com.br" class="footer-link">oduoloc.com.br</a>
                  <span style="color: #64748b;">|</span>
                  <a href="mailto:suporte@oduoloc.com.br" class="footer-link">suporte@oduoloc.com.br</a>
                </div>
                <p class="footer-text" style="margin-top: 16px; font-size: 11px;">© ${new Date().getFullYear()} ODuo Assessoria. Todos os direitos reservados.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // Reserva cancelada
  bookingCancelled: (data: {
    customerName: string
    equipmentName: string
    startDate: string
    tenantName: string
    tenantPhone?: string
    bookingId?: string
  }) => ({
    subject: `Reserva Cancelada - ${data.equipmentName} | ODuoLoc`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyles}
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1 class="logo">ODuoLoc</h1>
                <p class="logo-subtitle">Sistema de Gestão para Locadoras</p>
                <h2 class="header-title">Reserva Cancelada</h2>
              </div>

              <div class="content">
                <p class="greeting">Olá <strong>${data.customerName}</strong>,</p>

                <div class="error-box">
                  <p class="highlight-text">
                    Sua reserva do equipamento <strong>${data.equipmentName}</strong> prevista para <strong>${data.startDate}</strong> foi cancelada.
                  </p>
                  ${data.bookingId ? `<p style="font-size: 12px; color: #a1a1aa; margin-top: 8px;">Reserva #${data.bookingId.slice(-8).toUpperCase()}</p>` : ''}
                </div>

                <p class="message">
                  Se você não solicitou este cancelamento ou tem alguma dúvida, entre em contato conosco${data.tenantPhone ? ` pelo telefone <strong style="color: #fafafa;">${data.tenantPhone}</strong>` : ""}.
                </p>

                <div class="signature">
                  <p class="signature-text">Atenciosamente,</p>
                  <p class="signature-name">${data.tenantName}</p>
                </div>
              </div>

              <div class="footer">
                <p class="footer-brand">ODuoLoc</p>
                <p class="footer-text">Sistema de Gestão para Locadoras</p>
                <div class="footer-links">
                  <a href="https://oduoloc.com.br" class="footer-link">oduoloc.com.br</a>
                  <span style="color: #64748b;">|</span>
                  <a href="mailto:suporte@oduoloc.com.br" class="footer-link">suporte@oduoloc.com.br</a>
                </div>
                <p class="footer-text" style="margin-top: 16px; font-size: 11px;">© ${new Date().getFullYear()} ODuo Assessoria. Todos os direitos reservados.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // Reserva alterada
  bookingUpdated: (data: {
    customerName: string
    equipmentName: string
    bookingId: string
    changes: string[]
    startDate: string
    endDate: string
    totalPrice: number
    tenantName: string
    tenantPhone?: string
  }) => ({
    subject: `Reserva Atualizada - #${data.bookingId.slice(-6)} | ${data.tenantName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyles}
            .header { background: linear-gradient(135deg, #317AE0 0%, #195AB4 100%); }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1 class="logo">${data.tenantName}</h1>
                <p class="logo-subtitle">Locação de Equipamentos</p>
                <h2 class="header-title">Reserva Atualizada</h2>
              </div>

              <div class="content">
                <p class="greeting">Olá <strong>${data.customerName}</strong>,</p>
                <p class="message">Sua reserva foi atualizada. Confira os detalhes abaixo:</p>

                <div class="highlight-box" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%); border-color: rgba(59, 130, 246, 0.3);">
                  <p class="highlight-text" style="font-size: 13px; text-align: left;">
                    <strong style="color: #3b82f6;">Alterações realizadas:</strong><br>
                    ${data.changes.map(change => `• ${change}`).join('<br>')}
                  </p>
                </div>

                <div class="details-card">
                  <h3 class="details-title" style="color: #3b82f6; border-color: rgba(59, 130, 246, 0.2);">Dados Atualizados</h3>
                  <div class="details-row">
                    <span class="details-label">Nº da Reserva</span>
                    <span class="details-value">#${data.bookingId.slice(-8).toUpperCase()}</span>
                  </div>
                  <div class="details-row">
                    <span class="details-label">Equipamento</span>
                    <span class="details-value">${data.equipmentName}</span>
                  </div>
                  <div class="details-row">
                    <span class="details-label">Data de Início</span>
                    <span class="details-value">${data.startDate}</span>
                  </div>
                  <div class="details-row">
                    <span class="details-label">Data de Término</span>
                    <span class="details-value">${data.endDate}</span>
                  </div>
                  <div class="total-row" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%);">
                    <div class="details-row" style="border: none; padding: 0;">
                      <span class="details-label" style="font-size: 14px;">Valor Total</span>
                      <span class="total-value" style="color: #3b82f6;">R$ ${data.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <p class="message">
                  Em caso de dúvidas sobre as alterações, entre em contato conosco${data.tenantPhone ? ` pelo telefone <strong style="color: #fafafa;">${data.tenantPhone}</strong>` : ''}.
                </p>

                <div class="signature">
                  <p class="signature-text">Atenciosamente,</p>
                  <p class="signature-name">${data.tenantName}</p>
                </div>
              </div>

              <div class="footer">
                <p class="footer-brand">ODuoLoc</p>
                <p class="footer-text">Sistema de Gestão para Locadoras</p>
                <div class="footer-links">
                  <a href="https://oduoloc.com.br" class="footer-link">oduoloc.com.br</a>
                  <span style="color: #64748b;">|</span>
                  <a href="mailto:suporte@oduoloc.com.br" class="footer-link">suporte@oduoloc.com.br</a>
                </div>
                <p class="footer-text" style="margin-top: 16px; font-size: 11px;">© ${new Date().getFullYear()} ODuo Assessoria. Todos os direitos reservados.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // Reset de senha
  passwordReset: (data: {
    userName: string
    resetUrl: string
    expiresIn: string
  }) => ({
    subject: `Redefinir sua senha | ODuoLoc`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyles}
            .header { background: linear-gradient(135deg, #317AE0 0%, #195AB4 100%); }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1 class="logo">ODuoLoc</h1>
                <p class="logo-subtitle">Sistema de Gestão para Locadoras</p>
                <h2 class="header-title">Redefinir Senha</h2>
              </div>

              <div class="content">
                <p class="greeting">Olá <strong>${data.userName}</strong>,</p>
                <p class="message">Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:</p>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${data.resetUrl}" class="button" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);">
                    Redefinir Minha Senha
                  </a>
                </div>

                <div class="warning-box">
                  <p class="highlight-text" style="font-size: 13px;">
                    Este link expira em <strong>${data.expiresIn}</strong>. Se você não solicitou a redefinição de senha, ignore este email.
                  </p>
                </div>

                <p class="message" style="font-size: 12px; color: #71717a;">
                  Se o botão não funcionar, copie e cole o link abaixo no seu navegador:<br>
                  <span style="color: #a1a1aa; word-break: break-all;">${data.resetUrl}</span>
                </p>

                <div class="signature">
                  <p class="signature-text">Atenciosamente,</p>
                  <p class="signature-name">Equipe ODuoLoc</p>
                </div>
              </div>

              <div class="footer">
                <p class="footer-brand">ODuoLoc</p>
                <p class="footer-text">Sistema de Gestão para Locadoras</p>
                <div class="footer-links">
                  <a href="https://oduoloc.com.br" class="footer-link">oduoloc.com.br</a>
                  <span style="color: #64748b;">|</span>
                  <a href="mailto:suporte@oduoloc.com.br" class="footer-link">suporte@oduoloc.com.br</a>
                </div>
                <p class="footer-text" style="margin-top: 16px; font-size: 11px;">© ${new Date().getFullYear()} ODuo Assessoria. Todos os direitos reservados.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // Verificação de email
  emailVerification: (data: {
    userName: string
    verificationUrl: string
    expiresIn: string
  }) => ({
    subject: `Verifique seu email | ODuoLoc`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyles}
            .header { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1 class="logo">ODuoLoc</h1>
                <p class="logo-subtitle">Sistema de Gestão para Locadoras</p>
                <h2 class="header-title">Verificar Email</h2>
              </div>

              <div class="content">
                <p class="greeting">Olá <strong>${data.userName}</strong>,</p>
                <p class="message">Bem-vindo ao ODuoLoc! Para completar seu cadastro, por favor verifique seu email clicando no botão abaixo:</p>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${data.verificationUrl}" class="button" style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); box-shadow: 0 4px 14px rgba(6, 182, 212, 0.3);">
                    Verificar Meu Email
                  </a>
                </div>

                <div class="highlight-box" style="background: linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(8, 145, 178, 0.1) 100%); border-color: rgba(6, 182, 212, 0.3);">
                  <p class="highlight-text" style="font-size: 13px;">
                    Este link expira em <strong>${data.expiresIn}</strong>.
                  </p>
                </div>

                <p class="message" style="font-size: 12px; color: #71717a;">
                  Se o botão não funcionar, copie e cole o link abaixo no seu navegador:<br>
                  <span style="color: #a1a1aa; word-break: break-all;">${data.verificationUrl}</span>
                </p>

                <div class="signature">
                  <p class="signature-text">Atenciosamente,</p>
                  <p class="signature-name">Equipe ODuoLoc</p>
                </div>
              </div>

              <div class="footer">
                <p class="footer-brand">ODuoLoc</p>
                <p class="footer-text">Sistema de Gestão para Locadoras</p>
                <div class="footer-links">
                  <a href="https://oduoloc.com.br" class="footer-link">oduoloc.com.br</a>
                  <span style="color: #64748b;">|</span>
                  <a href="mailto:suporte@oduoloc.com.br" class="footer-link">suporte@oduoloc.com.br</a>
                </div>
                <p class="footer-text" style="margin-top: 16px; font-size: 11px;">© ${new Date().getFullYear()} ODuo Assessoria. Todos os direitos reservados.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // Envio de documento (contrato ou recibo)
  documentSend: (data: {
    customerName: string
    customerEmail: string
    documentType: 'CONTRACT' | 'RECEIPT'
    documentHtml: string
    bookingId: string
    equipmentName: string
    startDate: string
    endDate: string
    totalPrice: number
    tenantName: string
    tenantPhone?: string
    tenantEmail?: string
  }) => {
    const isContract = data.documentType === 'CONTRACT'
    const documentTypeName = isContract ? 'Contrato de Locação' : 'Recibo de Pagamento'
    const headerColor = isContract
      ? 'background: linear-gradient(135deg, #317AE0 0%, #195AB4 100%);'
      : 'background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);'
    const accentColor = isContract ? '#06b6d4' : '#22c55e'

    return {
      subject: `${documentTypeName} - Reserva #${data.bookingId.slice(-8).toUpperCase()} | ${data.tenantName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>${baseStyles}
              .header { ${headerColor} }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  <h1 class="logo">${data.tenantName}</h1>
                  <p class="logo-subtitle">Locação de Equipamentos</p>
                  <h2 class="header-title">${documentTypeName}</h2>
                </div>

                <div class="content">
                  <p class="greeting">Olá <strong>${data.customerName}</strong>,</p>
                  <p class="message">
                    ${isContract
                      ? 'Segue em anexo o contrato de locação referente à sua reserva. Por favor, leia atentamente os termos e condições.'
                      : 'Segue em anexo o recibo de pagamento referente à sua reserva. Guarde este documento para sua referência.'}
                  </p>

                  <div class="details-card">
                    <h3 class="details-title" style="color: ${accentColor}; border-color: ${accentColor}33;">Detalhes da Reserva</h3>
                    <div class="details-row">
                      <span class="details-label">Nº da Reserva</span>
                      <span class="details-value">#${data.bookingId.slice(-8).toUpperCase()}</span>
                    </div>
                    <div class="details-row">
                      <span class="details-label">Equipamento</span>
                      <span class="details-value">${data.equipmentName}</span>
                    </div>
                    <div class="details-row">
                      <span class="details-label">Período</span>
                      <span class="details-value">${data.startDate} a ${data.endDate}</span>
                    </div>
                    <div class="total-row" style="background: linear-gradient(135deg, ${accentColor}1a 0%, ${accentColor}0d 100%);">
                      <div class="details-row" style="border: none; padding: 0;">
                        <span class="details-label" style="font-size: 14px;">Valor Total</span>
                        <span class="total-value" style="color: ${accentColor};">R$ ${data.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div class="highlight-box" style="background: linear-gradient(135deg, ${accentColor}1a 0%, ${accentColor}0d 100%); border-color: ${accentColor}4d;">
                    <p class="highlight-text">
                      ${isContract
                        ? 'O documento completo está disponível abaixo neste email.'
                        : 'Este recibo serve como comprovante de pagamento.'}
                    </p>
                  </div>

                  <p class="message">
                    Em caso de dúvidas, entre em contato conosco${data.tenantPhone ? ` pelo telefone <strong style="color: #fafafa;">${data.tenantPhone}</strong>` : ''}${data.tenantEmail ? ` ou pelo email <strong style="color: #fafafa;">${data.tenantEmail}</strong>` : ''}.
                  </p>

                  <div class="signature">
                    <p class="signature-text">Atenciosamente,</p>
                    <p class="signature-name">${data.tenantName}</p>
                  </div>
                </div>

                <div class="footer">
                  <p class="footer-brand">ODuoLoc</p>
                  <p class="footer-text">Sistema de Gestão para Locadoras</p>
                  <div class="footer-links">
                    <a href="https://oduoloc.com.br" class="footer-link">oduoloc.com.br</a>
                    <span style="color: #64748b;">|</span>
                    <a href="mailto:suporte@oduoloc.com.br" class="footer-link">suporte@oduoloc.com.br</a>
                  </div>
                  <p class="footer-text" style="margin-top: 16px; font-size: 11px;">© ${new Date().getFullYear()} ODuo Assessoria. Todos os direitos reservados.</p>
                </div>
              </div>

              <!-- Documento anexado como HTML inline -->
              <div style="margin-top: 24px; background: #ffffff; border-radius: 8px; overflow: hidden;">
                <div style="background: ${accentColor}; color: white; padding: 12px 16px; font-weight: 600;">
                  📄 ${documentTypeName} - Visualização
                </div>
                <div style="padding: 0;">
                  ${data.documentHtml}
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    }
  },

  // Boas-vindas (após verificação de email)
  welcome: (data: {
    userName: string
    tenantName: string
    loginUrl: string
  }) => ({
    subject: `Bem-vindo ao ODuoLoc! | ${data.tenantName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyles}</style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1 class="logo">ODuoLoc</h1>
                <p class="logo-subtitle">Sistema de Gestão para Locadoras</p>
                <h2 class="header-title">Bem-vindo!</h2>
              </div>

              <div class="content">
                <p class="greeting">Olá <strong>${data.userName}</strong>,</p>
                <p class="message">Seu email foi verificado com sucesso! Agora você tem acesso completo ao painel da <strong>${data.tenantName}</strong>.</p>

                <div class="success-box">
                  <p class="highlight-text">
                    Sua conta está pronta para uso!
                  </p>
                </div>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${data.loginUrl}" class="button">
                    Acessar o Painel
                  </a>
                </div>

                <div class="details-card">
                  <h3 class="details-title">Próximos Passos</h3>
                  <div style="padding: 8px 0;">
                    <p style="font-size: 14px; color: #fafafa; margin: 8px 0;">1. Cadastre seus equipamentos</p>
                    <p style="font-size: 14px; color: #fafafa; margin: 8px 0;">2. Adicione seus clientes</p>
                    <p style="font-size: 14px; color: #fafafa; margin: 8px 0;">3. Comece a criar reservas</p>
                  </div>
                </div>

                <div class="signature">
                  <p class="signature-text">Atenciosamente,</p>
                  <p class="signature-name">Equipe ODuoLoc</p>
                </div>
              </div>

              <div class="footer">
                <p class="footer-brand">ODuoLoc</p>
                <p class="footer-text">Sistema de Gestão para Locadoras</p>
                <div class="footer-links">
                  <a href="https://oduoloc.com.br" class="footer-link">oduoloc.com.br</a>
                  <span style="color: #64748b;">|</span>
                  <a href="mailto:suporte@oduoloc.com.br" class="footer-link">suporte@oduoloc.com.br</a>
                </div>
                <p class="footer-text" style="margin-top: 16px; font-size: 11px;">© ${new Date().getFullYear()} ODuo Assessoria. Todos os direitos reservados.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // Convite para equipe
  userInvitation: (data: {
    inviteeName: string
    inviterName: string
    tenantName: string
    role: string
    inviteUrl: string
    expiresIn: string
  }) => ({
    subject: `Você foi convidado para ${data.tenantName} | ODuoLoc`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyles}
            .header { background: linear-gradient(135deg, #317AE0 0%, #195AB4 100%); }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1 class="logo">ODuoLoc</h1>
                <p class="logo-subtitle">Gestão de Locações</p>
                <h2 class="header-title">Você foi convidado!</h2>
              </div>

              <div class="content">
                <p class="greeting">Olá <strong>${data.inviteeName}</strong>,</p>
                <p class="message"><strong>${data.inviterName}</strong> convidou você para fazer parte da equipe da <strong>${data.tenantName}</strong> no ODuoLoc.</p>

                <div class="details-card">
                  <h3 class="details-title" style="color: #8b5cf6; border-color: rgba(139, 92, 246, 0.2);">Detalhes do Convite</h3>
                  <div class="details-row">
                    <span class="details-label">Empresa</span>
                    <span class="details-value">${data.tenantName}</span>
                  </div>
                  <div class="details-row">
                    <span class="details-label">Função</span>
                    <span class="details-value">${data.role}</span>
                  </div>
                  <div class="details-row">
                    <span class="details-label">Convidado por</span>
                    <span class="details-value">${data.inviterName}</span>
                  </div>
                </div>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${data.inviteUrl}" class="button" style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3);">
                    Aceitar Convite
                  </a>
                </div>

                <div class="warning-box">
                  <p class="highlight-text" style="font-size: 13px;">
                    Este convite expira em <strong>${data.expiresIn}</strong>. Após aceitar, você poderá definir sua senha e acessar o sistema.
                  </p>
                </div>

                <p class="message" style="font-size: 12px; color: #71717a;">
                  Se você não esperava este convite, pode ignorar este email com segurança.
                </p>

                <div class="signature">
                  <p class="signature-text">Atenciosamente,</p>
                  <p class="signature-name">Equipe ODuoLoc</p>
                </div>
              </div>

              <div class="footer">
                <p class="footer-brand">ODuoLoc</p>
                <p class="footer-text">Sistema de Gestão para Locadoras</p>
                <div class="footer-links">
                  <a href="https://oduoloc.com.br" class="footer-link">oduoloc.com.br</a>
                  <span style="color: #64748b;">|</span>
                  <a href="mailto:suporte@oduoloc.com.br" class="footer-link">suporte@oduoloc.com.br</a>
                </div>
                <p class="footer-text" style="margin-top: 16px; font-size: 11px;">© ${new Date().getFullYear()} ODuo Assessoria. Todos os direitos reservados.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // Boas-vindas ao tenant (após cadastro da empresa)
  tenantWelcome: (data: {
    ownerName: string
    tenantName: string
    tenantSlug: string
    loginUrl: string
    planName: string
  }) => ({
    subject: `Bem-vindo ao ODuoLoc, ${data.tenantName}!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyles}</style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1 class="logo">ODuoLoc</h1>
                <p class="logo-subtitle">Gestão de Locações</p>
                <h2 class="header-title">Bem-vindo ao ODuoLoc!</h2>
              </div>

              <div class="content">
                <p class="greeting">Olá <strong>${data.ownerName}</strong>,</p>
                <p class="message">Parabéns! A <strong>${data.tenantName}</strong> agora faz parte do ODuoLoc, a plataforma mais completa para gestão de locadoras de equipamentos.</p>

                <div class="success-box">
                  <p class="highlight-text">
                    🎉 Sua conta está ativa e pronta para uso!
                  </p>
                </div>

                <div class="details-card">
                  <h3 class="details-title">Dados da sua conta</h3>
                  <div class="details-row">
                    <span class="details-label">Empresa</span>
                    <span class="details-value">${data.tenantName}</span>
                  </div>
                  <div class="details-row">
                    <span class="details-label">Seu endereço</span>
                    <span class="details-value">${data.tenantSlug}.oduoloc.com.br</span>
                  </div>
                  <div class="details-row">
                    <span class="details-label">Plano</span>
                    <span class="details-value">${data.planName}</span>
                  </div>
                </div>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${data.loginUrl}" class="button">
                    Acessar Meu Painel
                  </a>
                </div>

                <div class="details-card">
                  <h3 class="details-title">Primeiros passos</h3>
                  <div style="padding: 8px 0;">
                    <p style="font-size: 14px; color: #fafafa; margin: 12px 0;">✅ <strong>1. Configure sua empresa</strong> - Adicione logo, dados fiscais e informações de contato</p>
                    <p style="font-size: 14px; color: #fafafa; margin: 12px 0;">✅ <strong>2. Cadastre equipamentos</strong> - Adicione seu catálogo de equipamentos para locação</p>
                    <p style="font-size: 14px; color: #fafafa; margin: 12px 0;">✅ <strong>3. Adicione clientes</strong> - Importe ou cadastre sua base de clientes</p>
                    <p style="font-size: 14px; color: #fafafa; margin: 12px 0;">✅ <strong>4. Crie reservas</strong> - Comece a gerenciar suas locações!</p>
                  </div>
                </div>

                <div class="highlight-box">
                  <p class="highlight-text">
                    Precisa de ajuda? Nossa equipe está disponível em <strong>suporte@oduoloc.com.br</strong>
                  </p>
                </div>

                <div class="signature">
                  <p class="signature-text">Atenciosamente,</p>
                  <p class="signature-name">Equipe ODuoLoc</p>
                </div>
              </div>

              <div class="footer">
                <p class="footer-brand">ODuoLoc</p>
                <p class="footer-text">Sistema de Gestão para Locadoras</p>
                <div class="footer-links">
                  <a href="https://oduoloc.com.br" class="footer-link">oduoloc.com.br</a>
                  <span style="color: #64748b;">|</span>
                  <a href="mailto:suporte@oduoloc.com.br" class="footer-link">suporte@oduoloc.com.br</a>
                </div>
                <p class="footer-text" style="margin-top: 16px; font-size: 11px;">© ${new Date().getFullYear()} ODuo Assessoria. Todos os direitos reservados.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // Conta desativada
  userDeactivated: (data: {
    userName: string
    tenantName: string
    reason?: string
    supportEmail: string
  }) => ({
    subject: `Sua conta foi desativada | ${data.tenantName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyles}
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1 class="logo">ODuoLoc</h1>
                <p class="logo-subtitle">Gestão de Locações</p>
                <h2 class="header-title">Conta Desativada</h2>
              </div>

              <div class="content">
                <p class="greeting">Olá <strong>${data.userName}</strong>,</p>
                <p class="message">Informamos que sua conta na <strong>${data.tenantName}</strong> foi desativada pelo administrador.</p>

                <div class="error-box">
                  <p class="highlight-text">
                    Você não poderá mais acessar o sistema até que sua conta seja reativada.
                  </p>
                </div>

                ${data.reason ? `
                <div class="details-card">
                  <h3 class="details-title" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.2);">Motivo</h3>
                  <p style="font-size: 14px; color: #a1a1aa; margin: 0;">${data.reason}</p>
                </div>
                ` : ''}

                <div class="highlight-box" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%); border-color: rgba(239, 68, 68, 0.3);">
                  <p class="highlight-text">
                    Se você acredita que isso foi um erro, entre em contato com o administrador da empresa ou com nosso suporte em <strong>${data.supportEmail}</strong>.
                  </p>
                </div>

                <div class="signature">
                  <p class="signature-text">Atenciosamente,</p>
                  <p class="signature-name">Equipe ODuoLoc</p>
                </div>
              </div>

              <div class="footer">
                <p class="footer-brand">ODuoLoc</p>
                <p class="footer-text">Sistema de Gestão para Locadoras</p>
                <div class="footer-links">
                  <a href="https://oduoloc.com.br" class="footer-link">oduoloc.com.br</a>
                  <span style="color: #64748b;">|</span>
                  <a href="mailto:suporte@oduoloc.com.br" class="footer-link">suporte@oduoloc.com.br</a>
                </div>
                <p class="footer-text" style="margin-top: 16px; font-size: 11px;">© ${new Date().getFullYear()} ODuo Assessoria. Todos os direitos reservados.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // Conta reativada
  userReactivated: (data: {
    userName: string
    tenantName: string
    loginUrl: string
  }) => ({
    subject: `Sua conta foi reativada | ${data.tenantName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyles}
            .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1 class="logo">ODuoLoc</h1>
                <p class="logo-subtitle">Gestão de Locações</p>
                <h2 class="header-title">Conta Reativada!</h2>
              </div>

              <div class="content">
                <p class="greeting">Olá <strong>${data.userName}</strong>,</p>
                <p class="message">Ótimas notícias! Sua conta na <strong>${data.tenantName}</strong> foi reativada pelo administrador.</p>

                <div class="success-box">
                  <p class="highlight-text">
                    🎉 Você já pode acessar o sistema normalmente!
                  </p>
                </div>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${data.loginUrl}" class="button" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);">
                    Acessar o Painel
                  </a>
                </div>

                <p class="message">
                  Se você tiver alguma dúvida, entre em contato com o administrador da sua empresa.
                </p>

                <div class="signature">
                  <p class="signature-text">Atenciosamente,</p>
                  <p class="signature-name">Equipe ODuoLoc</p>
                </div>
              </div>

              <div class="footer">
                <p class="footer-brand">ODuoLoc</p>
                <p class="footer-text">Sistema de Gestão para Locadoras</p>
                <div class="footer-links">
                  <a href="https://oduoloc.com.br" class="footer-link">oduoloc.com.br</a>
                  <span style="color: #64748b;">|</span>
                  <a href="mailto:suporte@oduoloc.com.br" class="footer-link">suporte@oduoloc.com.br</a>
                </div>
                <p class="footer-text" style="margin-top: 16px; font-size: 11px;">© ${new Date().getFullYear()} ODuo Assessoria. Todos os direitos reservados.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // Lembrete de devolução
  returnReminder: (data: {
    customerName: string
    equipmentName: string
    endDate: string
    daysUntilReturn: number
    tenantName: string
    tenantPhone?: string
    bookingId?: string
  }) => ({
    subject: `Lembrete: Devolução em ${data.daysUntilReturn} dia${data.daysUntilReturn > 1 ? 's' : ''} - ${data.equipmentName} | ${data.tenantName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyles}
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1 class="logo">${data.tenantName}</h1>
                <p class="logo-subtitle">Locação de Equipamentos</p>
                <h2 class="header-title">Lembrete de Devolução</h2>
              </div>

              <div class="content">
                <p class="greeting">Olá <strong>${data.customerName}</strong>,</p>

                <div class="warning-box">
                  <p class="highlight-text">
                    O prazo de devolução do equipamento <strong>${data.equipmentName}</strong> termina em <strong>${data.daysUntilReturn} dia${data.daysUntilReturn > 1 ? 's' : ''}</strong> (${data.endDate}).
                  </p>
                </div>

                ${data.bookingId ? `
                <div class="details-card">
                  <h3 class="details-title" style="color: #f59e0b; border-color: rgba(245, 158, 11, 0.2);">Detalhes da Locação</h3>
                  <div class="details-row">
                    <span class="details-label">Nº da Reserva</span>
                    <span class="details-value">#${data.bookingId.slice(-8).toUpperCase()}</span>
                  </div>
                  <div class="details-row">
                    <span class="details-label">Equipamento</span>
                    <span class="details-value">${data.equipmentName}</span>
                  </div>
                  <div class="details-row">
                    <span class="details-label">Data de Devolução</span>
                    <span class="details-value">${data.endDate}</span>
                  </div>
                </div>
                ` : ''}

                <p class="message">
                  Por favor, prepare o equipamento para devolução. Caso precise estender o período de locação, entre em contato conosco${data.tenantPhone ? ` pelo telefone <strong style="color: #fafafa;">${data.tenantPhone}</strong>` : ''}.
                </p>

                <div class="highlight-box" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%); border-color: rgba(245, 158, 11, 0.3);">
                  <p class="highlight-text">
                    Lembre-se: equipamentos devolvidos após a data podem incorrer em taxas adicionais.
                  </p>
                </div>

                <div class="signature">
                  <p class="signature-text">Atenciosamente,</p>
                  <p class="signature-name">${data.tenantName}</p>
                </div>
              </div>

              <div class="footer">
                <p class="footer-brand">ODuoLoc</p>
                <p class="footer-text">Sistema de Gestão para Locadoras</p>
                <div class="footer-links">
                  <a href="https://oduoloc.com.br" class="footer-link">oduoloc.com.br</a>
                  <span style="color: #64748b;">|</span>
                  <a href="mailto:suporte@oduoloc.com.br" class="footer-link">suporte@oduoloc.com.br</a>
                </div>
                <p class="footer-text" style="margin-top: 16px; font-size: 11px;">© ${new Date().getFullYear()} ODuo Assessoria. Todos os direitos reservados.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // Pagamento atrasado
  paymentOverdue: (data: {
    customerName: string
    equipmentName: string
    bookingId: string
    amount: number
    dueDate: string
    daysOverdue: number
    tenantName: string
    tenantPhone?: string
  }) => ({
    subject: `URGENTE: Pagamento em atraso - Reserva #${data.bookingId.slice(-6)} | ${data.tenantName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyles}
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1 class="logo">${data.tenantName}</h1>
                <p class="logo-subtitle">Locação de Equipamentos</p>
                <h2 class="header-title">Pagamento em Atraso</h2>
              </div>

              <div class="content">
                <p class="greeting">Olá <strong>${data.customerName}</strong>,</p>

                <div class="error-box">
                  <p class="highlight-text">
                    O pagamento referente à locação do equipamento <strong>${data.equipmentName}</strong> está em atraso há <strong>${data.daysOverdue} dia${data.daysOverdue > 1 ? 's' : ''}</strong>.
                  </p>
                </div>

                <div class="details-card">
                  <h3 class="details-title" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.2);">Detalhes do Débito</h3>
                  <div class="details-row">
                    <span class="details-label">Nº da Reserva</span>
                    <span class="details-value">#${data.bookingId.slice(-8).toUpperCase()}</span>
                  </div>
                  <div class="details-row">
                    <span class="details-label">Equipamento</span>
                    <span class="details-value">${data.equipmentName}</span>
                  </div>
                  <div class="details-row">
                    <span class="details-label">Vencimento</span>
                    <span class="details-value">${data.dueDate}</span>
                  </div>
                  <div class="details-row">
                    <span class="details-label">Dias em Atraso</span>
                    <span class="details-value" style="color: #ef4444;">${data.daysOverdue} dia${data.daysOverdue > 1 ? 's' : ''}</span>
                  </div>
                  <div class="total-row" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%);">
                    <div class="details-row" style="border: none; padding: 0;">
                      <span class="details-label" style="font-size: 14px;">Valor em Aberto</span>
                      <span class="total-value" style="color: #ef4444;">R$ ${data.amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div class="highlight-box" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%); border-color: rgba(239, 68, 68, 0.3);">
                  <p class="highlight-text">
                    <strong>Atenção:</strong> Regularize seu pagamento o mais rápido possível para evitar a suspensão de futuros serviços e possíveis encargos por atraso.
                  </p>
                </div>

                <p class="message">
                  Para efetuar o pagamento ou esclarecer dúvidas, entre em contato conosco${data.tenantPhone ? ` pelo telefone <strong style="color: #fafafa;">${data.tenantPhone}</strong>` : ''}.
                </p>

                <div class="signature">
                  <p class="signature-text">Atenciosamente,</p>
                  <p class="signature-name">${data.tenantName}</p>
                </div>
              </div>

              <div class="footer">
                <p class="footer-brand">ODuoLoc</p>
                <p class="footer-text">Sistema de Gestão para Locadoras</p>
                <div class="footer-links">
                  <a href="https://oduoloc.com.br" class="footer-link">oduoloc.com.br</a>
                  <span style="color: #64748b;">|</span>
                  <a href="mailto:suporte@oduoloc.com.br" class="footer-link">suporte@oduoloc.com.br</a>
                </div>
                <p class="footer-text" style="margin-top: 16px; font-size: 11px;">© ${new Date().getFullYear()} ODuo Assessoria. Todos os direitos reservados.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // Reserva atrasada (equipamento não devolvido)
  bookingOverdue: (data: {
    customerName: string
    equipmentName: string
    endDate: string
    daysOverdue: number
    tenantName: string
    tenantPhone?: string
    bookingId?: string
  }) => ({
    subject: `URGENTE: Equipamento com devolução atrasada - ${data.equipmentName} | ${data.tenantName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyles}
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1 class="logo">${data.tenantName}</h1>
                <p class="logo-subtitle">Locação de Equipamentos</p>
                <h2 class="header-title">Devolução Atrasada</h2>
              </div>

              <div class="content">
                <p class="greeting">Olá <strong>${data.customerName}</strong>,</p>

                <div class="error-box">
                  <p class="highlight-text">
                    O equipamento <strong>${data.equipmentName}</strong> está com a devolução atrasada há <strong>${data.daysOverdue} dia${data.daysOverdue > 1 ? 's' : ''}</strong>.
                  </p>
                </div>

                ${data.bookingId ? `
                <div class="details-card">
                  <h3 class="details-title" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.2);">Detalhes da Locação</h3>
                  <div class="details-row">
                    <span class="details-label">Nº da Reserva</span>
                    <span class="details-value">#${data.bookingId.slice(-8).toUpperCase()}</span>
                  </div>
                  <div class="details-row">
                    <span class="details-label">Equipamento</span>
                    <span class="details-value">${data.equipmentName}</span>
                  </div>
                  <div class="details-row">
                    <span class="details-label">Data Prevista</span>
                    <span class="details-value">${data.endDate}</span>
                  </div>
                  <div class="details-row">
                    <span class="details-label">Dias em Atraso</span>
                    <span class="details-value" style="color: #ef4444;">${data.daysOverdue} dia${data.daysOverdue > 1 ? 's' : ''}</span>
                  </div>
                </div>
                ` : ''}

                <div class="highlight-box" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%); border-color: rgba(239, 68, 68, 0.3);">
                  <p class="highlight-text">
                    <strong>Importante:</strong> Equipamentos em atraso estão sujeitos a cobrança de diárias adicionais. Entre em contato imediatamente para regularizar a situação.
                  </p>
                </div>

                <p class="message">
                  Por favor, entre em contato conosco o mais rápido possível${data.tenantPhone ? ` pelo telefone <strong style="color: #fafafa;">${data.tenantPhone}</strong>` : ''} para agendar a devolução ou renovar a locação.
                </p>

                <div class="signature">
                  <p class="signature-text">Atenciosamente,</p>
                  <p class="signature-name">${data.tenantName}</p>
                </div>
              </div>

              <div class="footer">
                <p class="footer-brand">ODuoLoc</p>
                <p class="footer-text">Sistema de Gestão para Locadoras</p>
                <div class="footer-links">
                  <a href="https://oduoloc.com.br" class="footer-link">oduoloc.com.br</a>
                  <span style="color: #64748b;">|</span>
                  <a href="mailto:suporte@oduoloc.com.br" class="footer-link">suporte@oduoloc.com.br</a>
                </div>
                <p class="footer-text" style="margin-top: 16px; font-size: 11px;">© ${new Date().getFullYear()} ODuo Assessoria. Todos os direitos reservados.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // Assinatura expirando
  subscriptionExpiring: (data: {
    ownerName: string
    tenantName: string
    planName: string
    expirationDate: string
    daysUntilExpiration: number
    renewUrl: string
  }) => ({
    subject: `Sua assinatura expira em ${data.daysUntilExpiration} dia${data.daysUntilExpiration > 1 ? 's' : ''} | ODuoLoc`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyles}
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1 class="logo">ODuoLoc</h1>
                <p class="logo-subtitle">Gestão de Locações</p>
                <h2 class="header-title">Assinatura Expirando</h2>
              </div>

              <div class="content">
                <p class="greeting">Olá <strong>${data.ownerName}</strong>,</p>

                <div class="warning-box">
                  <p class="highlight-text">
                    A assinatura da <strong>${data.tenantName}</strong> expira em <strong>${data.daysUntilExpiration} dia${data.daysUntilExpiration > 1 ? 's' : ''}</strong> (${data.expirationDate}).
                  </p>
                </div>

                <div class="details-card">
                  <h3 class="details-title" style="color: #f59e0b; border-color: rgba(245, 158, 11, 0.2);">Detalhes da Assinatura</h3>
                  <div class="details-row">
                    <span class="details-label">Empresa</span>
                    <span class="details-value">${data.tenantName}</span>
                  </div>
                  <div class="details-row">
                    <span class="details-label">Plano Atual</span>
                    <span class="details-value">${data.planName}</span>
                  </div>
                  <div class="details-row">
                    <span class="details-label">Vencimento</span>
                    <span class="details-value">${data.expirationDate}</span>
                  </div>
                </div>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${data.renewUrl}" class="button" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);">
                    Renovar Assinatura
                  </a>
                </div>

                <div class="highlight-box" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%); border-color: rgba(245, 158, 11, 0.3);">
                  <p class="highlight-text" style="font-size: 13px;">
                    <strong>Importante:</strong> Após o vencimento, o acesso ao sistema será suspenso até a regularização. Renove agora para garantir continuidade no serviço.
                  </p>
                </div>

                <div class="signature">
                  <p class="signature-text">Atenciosamente,</p>
                  <p class="signature-name">Equipe ODuoLoc</p>
                </div>
              </div>

              <div class="footer">
                <p class="footer-brand">ODuoLoc</p>
                <p class="footer-text">Sistema de Gestão para Locadoras</p>
                <div class="footer-links">
                  <a href="https://oduoloc.com.br" class="footer-link">oduoloc.com.br</a>
                  <span style="color: #64748b;">|</span>
                  <a href="mailto:suporte@oduoloc.com.br" class="footer-link">suporte@oduoloc.com.br</a>
                </div>
                <p class="footer-text" style="margin-top: 16px; font-size: 11px;">© ${new Date().getFullYear()} ODuo Assessoria. Todos os direitos reservados.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // NFS-e emitida
  invoiceIssued: (data: {
    customerName: string
    invoiceNumber: string
    bookingId: string
    equipmentName: string
    amount: number
    issueDate: string
    tenantName: string
    verificationUrl?: string
  }) => ({
    subject: `NFS-e Emitida - Nº ${data.invoiceNumber} | ${data.tenantName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyles}
            .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1 class="logo">${data.tenantName}</h1>
                <p class="logo-subtitle">Locação de Equipamentos</p>
                <h2 class="header-title">NFS-e Emitida</h2>
              </div>

              <div class="content">
                <p class="greeting">Olá <strong>${data.customerName}</strong>,</p>
                <p class="message">A Nota Fiscal de Serviço Eletrônica (NFS-e) referente à sua locação foi emitida com sucesso.</p>

                <div class="success-box">
                  <div style="text-align: center;">
                    <p style="font-size: 14px; color: #10b981; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Número da Nota</p>
                    <p style="font-size: 28px; font-weight: 700; color: #10b981; margin: 0;">${data.invoiceNumber}</p>
                  </div>
                </div>

                <div class="details-card">
                  <h3 class="details-title" style="color: #10b981; border-color: rgba(16, 185, 129, 0.2);">Detalhes da NFS-e</h3>
                  <div class="details-row">
                    <span class="details-label">Nº da NFS-e</span>
                    <span class="details-value">${data.invoiceNumber}</span>
                  </div>
                  <div class="details-row">
                    <span class="details-label">Reserva</span>
                    <span class="details-value">#${data.bookingId.slice(-8).toUpperCase()}</span>
                  </div>
                  <div class="details-row">
                    <span class="details-label">Serviço</span>
                    <span class="details-value">${data.equipmentName}</span>
                  </div>
                  <div class="details-row">
                    <span class="details-label">Data de Emissão</span>
                    <span class="details-value">${data.issueDate}</span>
                  </div>
                  <div class="total-row" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%);">
                    <div class="details-row" style="border: none; padding: 0;">
                      <span class="details-label" style="font-size: 14px;">Valor Total</span>
                      <span class="total-value" style="color: #10b981;">R$ ${data.amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                ${data.verificationUrl ? `
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${data.verificationUrl}" class="button" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);">
                    Verificar Autenticidade
                  </a>
                </div>
                ` : ''}

                <div class="highlight-box" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%); border-color: rgba(16, 185, 129, 0.3);">
                  <p class="highlight-text">
                    Guarde este email para sua referência. A NFS-e é um documento fiscal válido.
                  </p>
                </div>

                <div class="signature">
                  <p class="signature-text">Atenciosamente,</p>
                  <p class="signature-name">${data.tenantName}</p>
                </div>
              </div>

              <div class="footer">
                <p class="footer-brand">ODuoLoc</p>
                <p class="footer-text">Sistema de Gestão para Locadoras</p>
                <div class="footer-links">
                  <a href="https://oduoloc.com.br" class="footer-link">oduoloc.com.br</a>
                  <span style="color: #64748b;">|</span>
                  <a href="mailto:suporte@oduoloc.com.br" class="footer-link">suporte@oduoloc.com.br</a>
                </div>
                <p class="footer-text" style="margin-top: 16px; font-size: 11px;">© ${new Date().getFullYear()} ODuo Assessoria. Todos os direitos reservados.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
}
