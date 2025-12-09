// Templates HTML para geração de PDFs - Identidade Visual ODuo

interface ContractData {
  tenantName: string
  tenantAddress?: string
  tenantPhone?: string
  tenantEmail?: string
  tenantCnpj?: string
  customerName: string
  customerDocument?: string
  customerPhone?: string
  customerEmail?: string
  customerAddress?: string
  equipmentName: string
  equipmentDescription?: string
  startDate: string
  endDate: string
  totalPrice: number
  pricePerDay: number
  totalDays: number
  bookingId: string
  createdAt: string
}

interface ReceiptData {
  tenantName: string
  tenantAddress?: string
  tenantPhone?: string
  tenantCnpj?: string
  customerName: string
  customerDocument?: string
  equipmentName: string
  startDate: string
  endDate: string
  totalPrice: number
  bookingId: string
  paymentDate: string
  paymentMethod?: string
}

// Estilos base para PDFs com identidade visual ODuo
const pdfBaseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #e4e4e7;
    background: linear-gradient(180deg, #09090b 0%, #18181b 100%);
    min-height: 100vh;
    padding: 0;
  }

  .document {
    max-width: 800px;
    margin: 0 auto;
    background: linear-gradient(180deg, #18181b 0%, #09090b 100%);
    border: 1px solid rgba(63, 63, 70, 0.5);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .header {
    background: linear-gradient(135deg, #dc2626 0%, #ea580c 50%, #f97316 100%);
    padding: 30px 40px;
    position: relative;
    overflow: hidden;
  }

  .header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    opacity: 0.3;
  }

  .header-content {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .logo-section {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .logo-icon {
    width: 50px;
    height: 50px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .logo-icon svg {
    width: 28px;
    height: 28px;
    fill: white;
  }

  .logo-text {
    color: white;
  }

  .logo-name {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.5px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .logo-subtitle {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.8);
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-top: 2px;
  }

  .document-info {
    text-align: right;
    color: white;
  }

  .document-type {
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 8px;
  }

  .document-number {
    font-size: 20px;
    font-weight: 800;
    background: rgba(0, 0, 0, 0.2);
    padding: 8px 16px;
    border-radius: 8px;
    display: inline-block;
  }

  .content {
    padding: 40px;
  }

  .section {
    margin-bottom: 28px;
  }

  .section-title {
    font-size: 12px;
    font-weight: 700;
    color: #f97316;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid rgba(249, 115, 22, 0.3);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .section-title::before {
    content: '';
    width: 4px;
    height: 20px;
    background: linear-gradient(180deg, #f97316 0%, #ea580c 100%);
    border-radius: 2px;
  }

  .parties-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 28px;
  }

  .party-card {
    background: linear-gradient(135deg, rgba(39, 39, 42, 0.6) 0%, rgba(24, 24, 27, 0.8) 100%);
    border: 1px solid rgba(63, 63, 70, 0.5);
    border-radius: 12px;
    padding: 20px;
  }

  .party-label {
    font-size: 10px;
    font-weight: 700;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .party-label::before {
    content: '';
    width: 8px;
    height: 8px;
    background: #f97316;
    border-radius: 50%;
  }

  .party-name {
    font-size: 16px;
    font-weight: 700;
    color: #fafafa;
    margin-bottom: 8px;
  }

  .party-info {
    font-size: 11px;
    color: #a1a1aa;
    line-height: 1.7;
  }

  .info-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(63, 63, 70, 0.5);
  }

  .info-table th {
    background: linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.1) 100%);
    padding: 14px 16px;
    font-size: 11px;
    font-weight: 700;
    color: #f97316;
    text-transform: uppercase;
    letter-spacing: 1px;
    text-align: left;
  }

  .info-table td {
    background: rgba(24, 24, 27, 0.6);
    padding: 14px 16px;
    font-size: 12px;
    color: #e4e4e7;
    border-top: 1px solid rgba(63, 63, 70, 0.3);
  }

  .info-table tr:hover td {
    background: rgba(39, 39, 42, 0.6);
  }

  .total-row {
    background: linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.15) 100%) !important;
  }

  .total-row td {
    font-weight: 700;
    color: #f97316;
    font-size: 14px;
  }

  .clause {
    background: rgba(24, 24, 27, 0.6);
    border: 1px solid rgba(63, 63, 70, 0.3);
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 12px;
  }

  .clause-header {
    font-weight: 700;
    color: #fafafa;
    margin-bottom: 8px;
    font-size: 12px;
  }

  .clause-text {
    color: #a1a1aa;
    font-size: 11px;
    text-align: justify;
    line-height: 1.7;
  }

  .clause-items {
    margin-top: 10px;
    padding-left: 16px;
  }

  .clause-item {
    color: #a1a1aa;
    font-size: 11px;
    margin-bottom: 6px;
    position: relative;
    padding-left: 16px;
  }

  .clause-item::before {
    content: '•';
    color: #f97316;
    position: absolute;
    left: 0;
    font-weight: bold;
  }

  .highlight-box {
    background: linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.1) 100%);
    border: 1px solid rgba(249, 115, 22, 0.3);
    border-radius: 12px;
    padding: 20px;
    margin: 24px 0;
  }

  .highlight-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
  }

  .highlight-label {
    font-size: 12px;
    color: #a1a1aa;
  }

  .highlight-value {
    font-size: 14px;
    font-weight: 700;
    color: #f97316;
  }

  .signatures-section {
    margin-top: 50px;
    padding-top: 30px;
    border-top: 1px solid rgba(63, 63, 70, 0.3);
  }

  .signatures-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    margin-top: 30px;
  }

  .signature-box {
    text-align: center;
  }

  .signature-line {
    border-top: 2px solid rgba(249, 115, 22, 0.5);
    margin-bottom: 12px;
    padding-top: 12px;
  }

  .signature-name {
    font-weight: 700;
    color: #fafafa;
    font-size: 13px;
  }

  .signature-role {
    font-size: 11px;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 4px;
  }

  .footer {
    background: rgba(9, 9, 11, 0.8);
    padding: 20px 40px;
    border-top: 1px solid rgba(63, 63, 70, 0.3);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .footer-text {
    font-size: 10px;
    color: #52525b;
  }

  .footer-brand {
    font-size: 12px;
    font-weight: 700;
    color: #f97316;
  }

  /* Receipt specific styles */
  .receipt-amount-box {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%);
    border: 2px solid rgba(16, 185, 129, 0.4);
    border-radius: 16px;
    padding: 30px;
    text-align: center;
    margin: 30px 0;
  }

  .receipt-amount-label {
    font-size: 12px;
    font-weight: 700;
    color: #10b981;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 10px;
  }

  .receipt-amount-value {
    font-size: 42px;
    font-weight: 800;
    color: #10b981;
    line-height: 1;
  }

  .receipt-amount-extenso {
    font-size: 12px;
    color: #6ee7b7;
    margin-top: 12px;
    font-style: italic;
  }

  .receipt-description {
    background: rgba(24, 24, 27, 0.8);
    border: 1px solid rgba(63, 63, 70, 0.5);
    border-radius: 12px;
    padding: 24px;
    margin: 24px 0;
    text-align: center;
  }

  .receipt-description-text {
    font-size: 13px;
    color: #e4e4e7;
    line-height: 1.8;
  }

  .receipt-description-text strong {
    color: #fafafa;
  }

  @media print {
    body {
      background: white;
      color: #000;
    }
    .document {
      box-shadow: none;
      border: none;
    }
  }
`

export const pdfTemplates = {
  // Template de Contrato de Locação
  contract: (data: ContractData) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contrato de Locação - ${data.bookingId.slice(-8).toUpperCase()}</title>
        <style>${pdfBaseStyles}</style>
      </head>
      <body>
        <div class="document">
          <div class="header">
            <div class="header-content">
              <div class="logo-section">
                <div class="logo-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                </div>
                <div class="logo-text">
                  <div class="logo-name">ODuo</div>
                  <div class="logo-subtitle">Gestão de Locações</div>
                </div>
              </div>
              <div class="document-info">
                <div class="document-type">Contrato de Locação</div>
                <div class="document-number">#${data.bookingId.slice(-8).toUpperCase()}</div>
              </div>
            </div>
          </div>

          <div class="content">
            <!-- Partes -->
            <div class="parties-grid">
              <div class="party-card">
                <div class="party-label">Locador</div>
                <div class="party-name">${data.tenantName}</div>
                <div class="party-info">
                  ${data.tenantCnpj ? `CNPJ: ${data.tenantCnpj}<br>` : ''}
                  ${data.tenantAddress ? `${data.tenantAddress}<br>` : ''}
                  ${data.tenantPhone ? `Tel: ${data.tenantPhone}<br>` : ''}
                  ${data.tenantEmail ? `Email: ${data.tenantEmail}` : ''}
                </div>
              </div>
              <div class="party-card">
                <div class="party-label">Locatário</div>
                <div class="party-name">${data.customerName}</div>
                <div class="party-info">
                  ${data.customerDocument ? `CPF/CNPJ: ${data.customerDocument}<br>` : ''}
                  ${data.customerAddress ? `${data.customerAddress}<br>` : ''}
                  ${data.customerPhone ? `Tel: ${data.customerPhone}<br>` : ''}
                  ${data.customerEmail ? `Email: ${data.customerEmail}` : ''}
                </div>
              </div>
            </div>

            <!-- Objeto do Contrato -->
            <div class="section">
              <div class="section-title">Objeto do Contrato</div>
              <table class="info-table">
                <thead>
                  <tr>
                    <th>Equipamento</th>
                    <th>Período</th>
                    <th>Valor/Dia</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>${data.equipmentName}</strong>
                      ${data.equipmentDescription ? `<br><span style="color: #71717a; font-size: 10px;">${data.equipmentDescription}</span>` : ''}
                    </td>
                    <td>${data.startDate} a ${data.endDate}<br><span style="color: #71717a; font-size: 10px;">(${data.totalDays} dias)</span></td>
                    <td>R$ ${data.pricePerDay.toFixed(2)}</td>
                    <td><strong>R$ ${data.totalPrice.toFixed(2)}</strong></td>
                  </tr>
                  <tr class="total-row">
                    <td colspan="3" style="text-align: right;">VALOR TOTAL</td>
                    <td>R$ ${data.totalPrice.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Cláusulas -->
            <div class="section">
              <div class="section-title">Termos e Condições</div>

              <div class="clause">
                <div class="clause-header">Cláusula 1ª - Do Prazo</div>
                <div class="clause-text">
                  A locação terá início em <strong>${data.startDate}</strong> e término em <strong>${data.endDate}</strong>, totalizando <strong>${data.totalDays} dias</strong>.
                </div>
              </div>

              <div class="clause">
                <div class="clause-header">Cláusula 2ª - Do Valor e Pagamento</div>
                <div class="clause-text">
                  O LOCATÁRIO pagará ao LOCADOR o valor total de <strong>R$ ${data.totalPrice.toFixed(2)}</strong> (${extenso(data.totalPrice)}), referente ao período de locação.
                </div>
              </div>

              <div class="clause">
                <div class="clause-header">Cláusula 3ª - Das Obrigações do Locatário</div>
                <div class="clause-text">O LOCATÁRIO se compromete a:</div>
                <div class="clause-items">
                  <div class="clause-item">Utilizar o equipamento de acordo com suas especificações técnicas e finalidade</div>
                  <div class="clause-item">Responsabilizar-se pela guarda e conservação do equipamento</div>
                  <div class="clause-item">Devolver o equipamento nas mesmas condições em que o recebeu</div>
                  <div class="clause-item">Comunicar imediatamente ao LOCADOR qualquer avaria ou defeito</div>
                  <div class="clause-item">Não sublocar ou ceder o equipamento a terceiros</div>
                </div>
              </div>

              <div class="clause">
                <div class="clause-header">Cláusula 4ª - Das Responsabilidades</div>
                <div class="clause-text">
                  O LOCATÁRIO é responsável por quaisquer danos causados ao equipamento durante o período de locação, exceto pelo desgaste natural de uso, comprometendo-se a ressarcir o LOCADOR pelos prejuízos.
                </div>
              </div>

              <div class="clause">
                <div class="clause-header">Cláusula 5ª - Do Foro</div>
                <div class="clause-text">
                  As partes elegem o foro da comarca onde se situa o LOCADOR para dirimir quaisquer dúvidas ou litígios decorrentes deste contrato.
                </div>
              </div>
            </div>

            <div class="highlight-box">
              <div class="highlight-row">
                <span class="highlight-label">Contrato Nº</span>
                <span class="highlight-value">${data.bookingId.slice(-8).toUpperCase()}</span>
              </div>
              <div class="highlight-row">
                <span class="highlight-label">Data de Emissão</span>
                <span class="highlight-value">${data.createdAt}</span>
              </div>
            </div>

            <p style="text-align: center; color: #a1a1aa; font-size: 11px; margin-top: 24px;">
              E por estarem assim justos e contratados, assinam o presente instrumento em duas vias de igual teor e forma.
            </p>

            <!-- Assinaturas -->
            <div class="signatures-section">
              <div class="signatures-grid">
                <div class="signature-box">
                  <div class="signature-line"></div>
                  <div class="signature-name">${data.tenantName}</div>
                  <div class="signature-role">Locador</div>
                </div>
                <div class="signature-box">
                  <div class="signature-line"></div>
                  <div class="signature-name">${data.customerName}</div>
                  <div class="signature-role">Locatário</div>
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="footer-text">Documento gerado eletronicamente em ${data.createdAt}</div>
            <div class="footer-brand">Powered by ODuo</div>
          </div>
        </div>
      </body>
    </html>
  `,

  // Template de Recibo
  receipt: (data: ReceiptData) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recibo de Pagamento - ${data.bookingId.slice(-8).toUpperCase()}</title>
        <style>${pdfBaseStyles}</style>
      </head>
      <body>
        <div class="document">
          <div class="header" style="background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);">
            <div class="header-content">
              <div class="logo-section">
                <div class="logo-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div class="logo-text">
                  <div class="logo-name">ODuo</div>
                  <div class="logo-subtitle">Gestão de Locações</div>
                </div>
              </div>
              <div class="document-info">
                <div class="document-type">Recibo de Pagamento</div>
                <div class="document-number">#${data.bookingId.slice(-8).toUpperCase()}</div>
              </div>
            </div>
          </div>

          <div class="content">
            <!-- Valor -->
            <div class="receipt-amount-box">
              <div class="receipt-amount-label">Valor Recebido</div>
              <div class="receipt-amount-value">R$ ${data.totalPrice.toFixed(2)}</div>
              <div class="receipt-amount-extenso">(${extenso(data.totalPrice)})</div>
            </div>

            <!-- Descrição -->
            <div class="receipt-description">
              <div class="receipt-description-text">
                Recebi de <strong>${data.customerName}</strong>
                ${data.customerDocument ? ` (CPF/CNPJ: ${data.customerDocument})` : ''}
                a importância de <strong>R$ ${data.totalPrice.toFixed(2)}</strong>
                referente à locação do equipamento <strong>${data.equipmentName}</strong>
                no período de <strong>${data.startDate}</strong> a <strong>${data.endDate}</strong>.
              </div>
            </div>

            <!-- Detalhes -->
            <div class="section">
              <div class="section-title" style="color: #10b981; border-color: rgba(16, 185, 129, 0.3);">Detalhes do Pagamento</div>
              <table class="info-table">
                <tbody>
                  <tr>
                    <td style="width: 40%"><strong>Recebido de</strong></td>
                    <td>${data.customerName}</td>
                  </tr>
                  ${data.customerDocument ? `
                  <tr>
                    <td><strong>CPF/CNPJ</strong></td>
                    <td>${data.customerDocument}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td><strong>Equipamento</strong></td>
                    <td>${data.equipmentName}</td>
                  </tr>
                  <tr>
                    <td><strong>Período de Locação</strong></td>
                    <td>${data.startDate} a ${data.endDate}</td>
                  </tr>
                  <tr>
                    <td><strong>Data do Pagamento</strong></td>
                    <td>${data.paymentDate}</td>
                  </tr>
                  ${data.paymentMethod ? `
                  <tr>
                    <td><strong>Forma de Pagamento</strong></td>
                    <td>${data.paymentMethod}</td>
                  </tr>
                  ` : ''}
                  <tr class="total-row" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%) !important;">
                    <td style="color: #10b981;"><strong>VALOR TOTAL</strong></td>
                    <td style="color: #10b981;"><strong>R$ ${data.totalPrice.toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Dados do Emitente -->
            <div class="section">
              <div class="section-title" style="color: #10b981; border-color: rgba(16, 185, 129, 0.3);">Dados do Emitente</div>
              <div class="party-card" style="border-color: rgba(16, 185, 129, 0.3);">
                <div class="party-name">${data.tenantName}</div>
                <div class="party-info">
                  ${data.tenantCnpj ? `CNPJ: ${data.tenantCnpj}<br>` : ''}
                  ${data.tenantAddress ? `${data.tenantAddress}<br>` : ''}
                  ${data.tenantPhone ? `Tel: ${data.tenantPhone}` : ''}
                </div>
              </div>
            </div>

            <!-- Assinatura -->
            <div class="signatures-section">
              <div style="max-width: 300px; margin: 0 auto;">
                <div class="signature-box">
                  <div class="signature-line" style="border-color: rgba(16, 185, 129, 0.5);"></div>
                  <div class="signature-name">${data.tenantName}</div>
                  <div class="signature-role">Assinatura do Recebedor</div>
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="footer-text">Documento gerado em ${data.paymentDate}</div>
            <div class="footer-brand">Powered by ODuo</div>
          </div>
        </div>
      </body>
    </html>
  `,
}

// Função auxiliar para extenso (simplificada)
function extenso(valor: number): string {
  if (valor === 0) return "zero reais"

  const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"]
  const especiais = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"]
  const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"]
  const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"]

  const partes = valor.toFixed(2).split(".")
  const reais = parseInt(partes[0])
  const centavos = parseInt(partes[1])

  let resultado = ""

  if (reais > 0) {
    if (reais === 100) {
      resultado = "cem"
    } else if (reais < 10) {
      resultado = unidades[reais]
    } else if (reais < 20) {
      resultado = especiais[reais - 10]
    } else if (reais < 100) {
      const dezena = Math.floor(reais / 10)
      const unidade = reais % 10
      resultado = dezenas[dezena] + (unidade > 0 ? " e " + unidades[unidade] : "")
    } else if (reais < 1000) {
      const centena = Math.floor(reais / 100)
      const resto = reais % 100
      if (resto === 0) {
        resultado = centenas[centena]
      } else if (resto < 10) {
        resultado = centenas[centena] + " e " + unidades[resto]
      } else if (resto < 20) {
        resultado = centenas[centena] + " e " + especiais[resto - 10]
      } else {
        const dezena = Math.floor(resto / 10)
        const unidade = resto % 10
        resultado = centenas[centena] + " e " + dezenas[dezena] + (unidade > 0 ? " e " + unidades[unidade] : "")
      }
    } else if (reais < 10000) {
      const milhar = Math.floor(reais / 1000)
      const resto = reais % 1000
      if (milhar === 1) {
        resultado = "mil"
      } else {
        resultado = unidades[milhar] + " mil"
      }
      if (resto > 0) {
        if (resto < 100) {
          resultado += " e "
        } else {
          resultado += " "
        }
        // Recursivamente processar o resto
        if (resto < 10) {
          resultado += unidades[resto]
        } else if (resto < 20) {
          resultado += especiais[resto - 10]
        } else if (resto < 100) {
          const dezena = Math.floor(resto / 10)
          const unidade = resto % 10
          resultado += dezenas[dezena] + (unidade > 0 ? " e " + unidades[unidade] : "")
        } else {
          const centena = Math.floor(resto / 100)
          const restoC = resto % 100
          if (restoC === 0) {
            resultado += centenas[centena]
          } else if (restoC < 10) {
            resultado += centenas[centena] + " e " + unidades[restoC]
          } else if (restoC < 20) {
            resultado += centenas[centena] + " e " + especiais[restoC - 10]
          } else {
            const dezena = Math.floor(restoC / 10)
            const unidade = restoC % 10
            resultado += centenas[centena] + " e " + dezenas[dezena] + (unidade > 0 ? " e " + unidades[unidade] : "")
          }
        }
      }
    } else {
      resultado = reais.toLocaleString("pt-BR")
    }

    resultado += reais === 1 ? " real" : " reais"
  }

  if (centavos > 0) {
    if (reais > 0) resultado += " e "
    if (centavos < 10) {
      resultado += unidades[centavos]
    } else if (centavos < 20) {
      resultado += especiais[centavos - 10]
    } else {
      const dezena = Math.floor(centavos / 10)
      const unidade = centavos % 10
      resultado += dezenas[dezena] + (unidade > 0 ? " e " + unidades[unidade] : "")
    }
    resultado += centavos === 1 ? " centavo" : " centavos"
  }

  return resultado
}
