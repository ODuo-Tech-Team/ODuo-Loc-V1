import { Resend } from "resend"

// Inicializa Resend apenas se a chave existir
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

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
  from = "ODuo <noreply@resend.dev>",
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

// Estilos base da identidade visual ODuo
const baseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #e4e4e7;
    background-color: #09090b;
    margin: 0;
    padding: 0;
  }
  .wrapper {
    background: linear-gradient(135deg, #09090b 0%, #18181b 50%, #09090b 100%);
    padding: 40px 20px;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background: linear-gradient(180deg, rgba(24, 24, 27, 0.95) 0%, rgba(9, 9, 11, 0.98) 100%);
    border-radius: 16px;
    border: 1px solid rgba(63, 63, 70, 0.5);
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }
  .header {
    background: linear-gradient(135deg, #dc2626 0%, #ea580c 50%, #f97316 100%);
    padding: 32px 24px;
    text-align: center;
  }
  .logo {
    font-size: 28px;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  .logo-subtitle {
    font-size: 12px;
    color: rgba(255,255,255,0.8);
    margin-top: 4px;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .header-title {
    font-size: 24px;
    font-weight: 600;
    color: #ffffff;
    margin: 16px 0 0;
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
  .details-card {
    background: linear-gradient(135deg, rgba(39, 39, 42, 0.6) 0%, rgba(24, 24, 27, 0.8) 100%);
    border: 1px solid rgba(63, 63, 70, 0.5);
    border-radius: 12px;
    padding: 20px;
    margin: 24px 0;
  }
  .details-title {
    font-size: 14px;
    font-weight: 600;
    color: #f97316;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(249, 115, 22, 0.2);
  }
  .details-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid rgba(63, 63, 70, 0.3);
  }
  .details-row:last-child {
    border-bottom: none;
  }
  .details-label {
    font-size: 13px;
    color: #71717a;
  }
  .details-value {
    font-size: 14px;
    font-weight: 600;
    color: #fafafa;
  }
  .total-row {
    background: linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%);
    border-radius: 8px;
    padding: 16px;
    margin-top: 12px;
  }
  .total-value {
    font-size: 24px;
    font-weight: 700;
    color: #f97316;
  }
  .highlight-box {
    background: linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.1) 100%);
    border: 1px solid rgba(249, 115, 22, 0.3);
    border-radius: 12px;
    padding: 20px;
    margin: 24px 0;
    text-align: center;
  }
  .highlight-text {
    font-size: 15px;
    color: #fafafa;
    margin: 0;
  }
  .highlight-text strong {
    color: #f97316;
  }
  .warning-box {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: 12px;
    padding: 20px;
    margin: 24px 0;
  }
  .success-box {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 12px;
    padding: 20px;
    margin: 24px 0;
  }
  .error-box {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 12px;
    padding: 20px;
    margin: 24px 0;
  }
  .signature {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid rgba(63, 63, 70, 0.3);
  }
  .signature-text {
    font-size: 14px;
    color: #a1a1aa;
  }
  .signature-name {
    font-size: 16px;
    font-weight: 600;
    color: #fafafa;
    margin-top: 8px;
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
  .footer-brand {
    font-size: 14px;
    font-weight: 600;
    color: #f97316;
    margin-top: 8px;
  }
  .button {
    display: inline-block;
    background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%);
    color: #ffffff;
    text-decoration: none;
    padding: 14px 32px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    margin: 16px 0;
    box-shadow: 0 4px 14px rgba(220, 38, 38, 0.3);
  }
  .button:hover {
    background: linear-gradient(135deg, #b91c1c 0%, #c2410c 100%);
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
    subject: `Reserva Confirmada - ${data.equipmentName} | ODuo`,
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
                <h1 class="logo">ODuo</h1>
                <p class="logo-subtitle">Gestão de Locações</p>
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
                <p class="footer-text">Este é um email automático, por favor não responda.</p>
                <p class="footer-brand">Powered by ODuo</p>
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
    subject: `Lembrete: Sua reserva começa amanhã - ${data.equipmentName} | ODuo`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyles}
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%); }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1 class="logo">ODuo</h1>
                <p class="logo-subtitle">Gestão de Locações</p>
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
                <p class="footer-text">Este é um email automático, por favor não responda.</p>
                <p class="footer-brand">Powered by ODuo</p>
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
    subject: `Pagamento Confirmado - Reserva #${data.bookingId.slice(-6)} | ODuo`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyles}
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%); }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1 class="logo">ODuo</h1>
                <p class="logo-subtitle">Gestão de Locações</p>
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
                <p class="footer-text">Este é um email automático, por favor não responda.</p>
                <p class="footer-brand">Powered by ODuo</p>
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
    subject: `Reserva Cancelada - ${data.equipmentName} | ODuo`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyles}
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%); }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1 class="logo">ODuo</h1>
                <p class="logo-subtitle">Gestão de Locações</p>
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
                <p class="footer-text">Este é um email automático, por favor não responda.</p>
                <p class="footer-brand">Powered by ODuo</p>
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
    subject: `Redefinir sua senha | ODuo`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyles}
            .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1 class="logo">ODuo</h1>
                <p class="logo-subtitle">Gestão de Locações</p>
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
                  <p class="signature-name">Equipe ODuo</p>
                </div>
              </div>

              <div class="footer">
                <p class="footer-text">Este é um email automático, por favor não responda.</p>
                <p class="footer-brand">Powered by ODuo</p>
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
    subject: `Verifique seu email | ODuo`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyles}
            .header { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%); }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1 class="logo">ODuo</h1>
                <p class="logo-subtitle">Gestão de Locações</p>
                <h2 class="header-title">Verificar Email</h2>
              </div>

              <div class="content">
                <p class="greeting">Olá <strong>${data.userName}</strong>,</p>
                <p class="message">Bem-vindo ao ODuo! Para completar seu cadastro, por favor verifique seu email clicando no botão abaixo:</p>

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
                  <p class="signature-name">Equipe ODuo</p>
                </div>
              </div>

              <div class="footer">
                <p class="footer-text">Este é um email automático, por favor não responda.</p>
                <p class="footer-brand">Powered by ODuo</p>
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
      ? 'background: linear-gradient(135deg, #dc2626 0%, #ea580c 50%, #f97316 100%);'
      : 'background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);'
    const accentColor = isContract ? '#f97316' : '#10b981'

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
                  <p class="footer-text">Este é um email automático, por favor não responda.</p>
                  <p class="footer-brand">Powered by ODuo</p>
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
    subject: `Bem-vindo ao ODuo! | ${data.tenantName}`,
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
                <h1 class="logo">ODuo</h1>
                <p class="logo-subtitle">Gestão de Locações</p>
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
                  <p class="signature-name">Equipe ODuo</p>
                </div>
              </div>

              <div class="footer">
                <p class="footer-text">Este é um email automático, por favor não responda.</p>
                <p class="footer-brand">Powered by ODuo</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
}
