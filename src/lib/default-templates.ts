// Templates padrão para contrato e recibo
// Estes templates usam variáveis no formato {variavel} que serão substituídas

export const DEFAULT_CONTRACT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #333;
      padding: 40px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #333;
    }
    .empresa-nome {
      font-size: 20pt;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .empresa-info {
      font-size: 10pt;
      color: #666;
    }
    .titulo {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      margin: 30px 0;
      text-transform: uppercase;
    }
    .numero-contrato {
      text-align: center;
      font-size: 11pt;
      color: #666;
      margin-bottom: 30px;
    }
    .secao {
      margin-bottom: 25px;
    }
    .secao-titulo {
      font-weight: bold;
      font-size: 12pt;
      margin-bottom: 10px;
      color: #444;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    .partes {
      display: flex;
      justify-content: space-between;
      gap: 30px;
      margin-bottom: 30px;
    }
    .parte {
      flex: 1;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 5px;
    }
    .parte-titulo {
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 10px;
      color: #666;
      text-transform: uppercase;
    }
    .parte-nome {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .parte-info {
      font-size: 10pt;
      color: #666;
      line-height: 1.5;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    th {
      background: #f5f5f5;
      font-weight: bold;
    }
    .valor-total {
      font-size: 14pt;
      font-weight: bold;
      text-align: right;
      margin: 20px 0;
    }
    .clausula {
      margin-bottom: 15px;
    }
    .clausula-titulo {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .clausula-texto {
      text-align: justify;
    }
    .assinaturas {
      display: flex;
      justify-content: space-between;
      margin-top: 60px;
      padding-top: 30px;
    }
    .assinatura {
      text-align: center;
      width: 45%;
    }
    .assinatura-linha {
      border-top: 1px solid #333;
      margin-bottom: 5px;
      padding-top: 10px;
    }
    .assinatura-nome {
      font-weight: bold;
    }
    .assinatura-papel {
      font-size: 10pt;
      color: #666;
    }
    .rodape {
      margin-top: 40px;
      text-align: center;
      font-size: 9pt;
      color: #999;
      border-top: 1px solid #ddd;
      padding-top: 15px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="empresa-nome">{empresaNome}</div>
    <div class="empresa-info">
      CNPJ: {empresaCnpj}<br>
      {empresaEndereco}<br>
      Tel: {empresaTelefone} | Email: {empresaEmail}
    </div>
  </div>

  <div class="titulo">Contrato de Locação de Equipamentos</div>
  <div class="numero-contrato">Contrato Nº {reservaNumero}</div>

  <div class="partes">
    <div class="parte">
      <div class="parte-titulo">Locador</div>
      <div class="parte-nome">{empresaNome}</div>
      <div class="parte-info">
        CNPJ: {empresaCnpj}<br>
        {empresaEndereco}<br>
        Tel: {empresaTelefone}
      </div>
    </div>
    <div class="parte">
      <div class="parte-titulo">Locatário</div>
      <div class="parte-nome">{clienteNome}</div>
      <div class="parte-info">
        CPF/CNPJ: {clienteCpfCnpj}<br>
        {clienteEndereco}<br>
        Tel: {clienteTelefone}
      </div>
    </div>
  </div>

  <div class="secao">
    <div class="secao-titulo">Objeto do Contrato</div>
    <table>
      <thead>
        <tr>
          <th>Equipamento</th>
          <th>Período</th>
          <th>Dias</th>
          <th>Valor/Dia</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{equipamentoNome}</td>
          <td>{dataInicio} a {dataFim}</td>
          <td>{totalDias}</td>
          <td>{equipamentoValorDiaria}</td>
        </tr>
      </tbody>
    </table>
    <div class="valor-total">Valor Total: {valorTotal} ({valorExtenso})</div>
  </div>

  <div class="secao">
    <div class="secao-titulo">Cláusulas</div>

    <div class="clausula">
      <div class="clausula-titulo">Cláusula 1ª - Do Prazo</div>
      <div class="clausula-texto">
        A locação terá início em {dataInicio} e término em {dataFim}, totalizando {totalDias} dias.
      </div>
    </div>

    <div class="clausula">
      <div class="clausula-titulo">Cláusula 2ª - Do Valor e Pagamento</div>
      <div class="clausula-texto">
        O LOCATÁRIO pagará ao LOCADOR o valor total de {valorTotal} ({valorExtenso}), referente ao período de locação.
      </div>
    </div>

    <div class="clausula">
      <div class="clausula-titulo">Cláusula 3ª - Das Obrigações do Locatário</div>
      <div class="clausula-texto">
        O LOCATÁRIO compromete-se a: utilizar o equipamento conforme suas especificações técnicas; responsabilizar-se pela guarda e conservação; devolver nas mesmas condições em que recebeu; comunicar imediatamente qualquer avaria; não sublocar ou ceder a terceiros.
      </div>
    </div>

    <div class="clausula">
      <div class="clausula-titulo">Cláusula 4ª - Das Responsabilidades</div>
      <div class="clausula-texto">
        O LOCATÁRIO é responsável por quaisquer danos causados ao equipamento durante o período de locação, exceto pelo desgaste natural de uso.
      </div>
    </div>

    <div class="clausula">
      <div class="clausula-titulo">Cláusula 5ª - Do Foro</div>
      <div class="clausula-texto">
        As partes elegem o foro da comarca onde se situa o LOCADOR para dirimir quaisquer dúvidas decorrentes deste contrato.
      </div>
    </div>
  </div>

  <p style="text-align: center; margin-top: 30px;">
    E por estarem assim justos e contratados, assinam o presente instrumento em duas vias de igual teor.
  </p>

  <div class="assinaturas">
    <div class="assinatura">
      <div class="assinatura-linha">{empresaNome}</div>
      <div class="assinatura-papel">Locador</div>
    </div>
    <div class="assinatura">
      <div class="assinatura-linha">{clienteNome}</div>
      <div class="assinatura-papel">Locatário</div>
    </div>
  </div>

  <div class="rodape">
    Documento gerado em {dataAtual} às {horaAtual}
  </div>
</body>
</html>`

export const DEFAULT_RECEIPT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #333;
      padding: 40px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #2e7d32;
    }
    .empresa-nome {
      font-size: 20pt;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .empresa-info {
      font-size: 10pt;
      color: #666;
    }
    .titulo {
      text-align: center;
      font-size: 18pt;
      font-weight: bold;
      margin: 30px 0;
      color: #2e7d32;
    }
    .numero-recibo {
      text-align: center;
      font-size: 12pt;
      background: #e8f5e9;
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 30px;
    }
    .valor-destaque {
      text-align: center;
      font-size: 24pt;
      font-weight: bold;
      color: #2e7d32;
      margin: 30px 0;
      padding: 20px;
      background: #f1f8e9;
      border-radius: 10px;
    }
    .valor-extenso {
      text-align: center;
      font-size: 11pt;
      color: #666;
      font-style: italic;
      margin-bottom: 30px;
    }
    .info-box {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .info-titulo {
      font-weight: bold;
      font-size: 11pt;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .info-conteudo {
      font-size: 12pt;
    }
    .info-linha {
      margin-bottom: 5px;
    }
    .info-label {
      color: #666;
    }
    .declaracao {
      text-align: justify;
      margin: 30px 0;
      padding: 20px;
      border-left: 4px solid #2e7d32;
      background: #fafafa;
    }
    .assinatura {
      text-align: center;
      margin-top: 60px;
    }
    .assinatura-linha {
      border-top: 1px solid #333;
      width: 300px;
      margin: 0 auto 10px;
      padding-top: 10px;
    }
    .assinatura-nome {
      font-weight: bold;
    }
    .assinatura-papel {
      font-size: 10pt;
      color: #666;
    }
    .rodape {
      margin-top: 40px;
      text-align: center;
      font-size: 9pt;
      color: #999;
      border-top: 1px solid #ddd;
      padding-top: 15px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="empresa-nome">{empresaNome}</div>
    <div class="empresa-info">
      CNPJ: {empresaCnpj}<br>
      {empresaEndereco}<br>
      Tel: {empresaTelefone}
    </div>
  </div>

  <div class="titulo">Recibo de Pagamento</div>
  <div class="numero-recibo">Recibo Nº {reservaNumero}</div>

  <div class="valor-destaque">{valorTotal}</div>
  <div class="valor-extenso">({valorExtenso})</div>

  <div class="declaracao">
    Recebemos de <strong>{clienteNome}</strong>, portador do CPF/CNPJ <strong>{clienteCpfCnpj}</strong>,
    a importância de <strong>{valorTotal}</strong> ({valorExtenso}), referente à locação de equipamento(s)
    no período de <strong>{dataInicio}</strong> a <strong>{dataFim}</strong>.
  </div>

  <div class="info-box">
    <div class="info-titulo">Dados do Pagador</div>
    <div class="info-conteudo">
      <div class="info-linha"><span class="info-label">Nome:</span> {clienteNome}</div>
      <div class="info-linha"><span class="info-label">CPF/CNPJ:</span> {clienteCpfCnpj}</div>
      <div class="info-linha"><span class="info-label">Telefone:</span> {clienteTelefone}</div>
      <div class="info-linha"><span class="info-label">Email:</span> {clienteEmail}</div>
    </div>
  </div>

  <div class="info-box">
    <div class="info-titulo">Detalhes da Locação</div>
    <div class="info-conteudo">
      <div class="info-linha"><span class="info-label">Reserva:</span> {reservaNumero}</div>
      <div class="info-linha"><span class="info-label">Período:</span> {dataInicio} a {dataFim} ({totalDias} dias)</div>
      <div class="info-linha"><span class="info-label">Equipamento:</span> {equipamentoNome}</div>
    </div>
  </div>

  <div class="assinatura">
    <div class="assinatura-linha">{empresaNome}</div>
    <div class="assinatura-papel">Recebedor</div>
  </div>

  <div class="rodape">
    Documento gerado em {dataAtual} às {horaAtual}
  </div>
</body>
</html>`
