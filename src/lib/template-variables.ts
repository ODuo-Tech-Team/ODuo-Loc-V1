// Sistema de variáveis para templates de contrato e recibo

export interface TemplateVariable {
  key: string
  label: string
  description: string
  category: 'cliente' | 'reserva' | 'equipamento' | 'empresa' | 'outros'
  example: string
}

// Lista de todas as variáveis disponíveis para templates
export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  // Cliente
  { key: 'clienteNome', label: 'Nome do Cliente', description: 'Nome completo do cliente', category: 'cliente', example: 'João da Silva' },
  { key: 'clienteCpfCnpj', label: 'CPF/CNPJ', description: 'Documento do cliente', category: 'cliente', example: '123.456.789-00' },
  { key: 'clienteEmail', label: 'Email', description: 'Email do cliente', category: 'cliente', example: 'joao@email.com' },
  { key: 'clienteTelefone', label: 'Telefone', description: 'Telefone do cliente', category: 'cliente', example: '(11) 99999-9999' },
  { key: 'clienteEndereco', label: 'Endereço', description: 'Endereço completo do cliente', category: 'cliente', example: 'Rua das Flores, 123 - Centro, São Paulo/SP' },

  // Reserva
  { key: 'reservaNumero', label: 'Número da Reserva', description: 'Identificador único da reserva', category: 'reserva', example: 'RES-12345678' },
  { key: 'dataInicio', label: 'Data de Início', description: 'Data de início da locação', category: 'reserva', example: '15/12/2025' },
  { key: 'dataFim', label: 'Data de Fim', description: 'Data de término da locação', category: 'reserva', example: '20/12/2025' },
  { key: 'totalDias', label: 'Total de Dias', description: 'Quantidade total de dias da locação', category: 'reserva', example: '5' },
  { key: 'valorTotal', label: 'Valor Total', description: 'Valor total formatado em reais', category: 'reserva', example: 'R$ 500,00' },
  { key: 'valorExtenso', label: 'Valor por Extenso', description: 'Valor total escrito por extenso', category: 'reserva', example: 'quinhentos reais' },

  // Equipamento
  { key: 'listaEquipamentos', label: 'Lista de Equipamentos', description: 'Lista formatada com todos os equipamentos', category: 'equipamento', example: '- Betoneira 400L (1x) - R$ 100,00/dia' },
  { key: 'equipamentoNome', label: 'Nome do Equipamento', description: 'Nome do equipamento principal', category: 'equipamento', example: 'Betoneira 400L' },
  { key: 'equipamentoDescricao', label: 'Descrição', description: 'Descrição do equipamento', category: 'equipamento', example: 'Betoneira elétrica 400 litros' },
  { key: 'equipamentoValorDiaria', label: 'Valor da Diária', description: 'Preço por dia do equipamento', category: 'equipamento', example: 'R$ 100,00' },

  // Empresa
  { key: 'empresaNome', label: 'Nome da Empresa', description: 'Nome da locadora', category: 'empresa', example: 'Locadora ABC Ltda' },
  { key: 'empresaCnpj', label: 'CNPJ', description: 'CNPJ da locadora', category: 'empresa', example: '12.345.678/0001-90' },
  { key: 'empresaEndereco', label: 'Endereço', description: 'Endereço da locadora', category: 'empresa', example: 'Av. Principal, 1000 - Industrial, Campinas/SP' },
  { key: 'empresaTelefone', label: 'Telefone', description: 'Telefone da locadora', category: 'empresa', example: '(19) 3333-4444' },
  { key: 'empresaEmail', label: 'Email', description: 'Email da locadora', category: 'empresa', example: 'contato@locadora.com.br' },

  // Outros
  { key: 'dataAtual', label: 'Data Atual', description: 'Data de geração do documento', category: 'outros', example: '28/11/2025' },
  { key: 'horaAtual', label: 'Hora Atual', description: 'Hora de geração do documento', category: 'outros', example: '14:30' },
]

// Agrupa variáveis por categoria
export const VARIABLES_BY_CATEGORY = {
  cliente: TEMPLATE_VARIABLES.filter(v => v.category === 'cliente'),
  reserva: TEMPLATE_VARIABLES.filter(v => v.category === 'reserva'),
  equipamento: TEMPLATE_VARIABLES.filter(v => v.category === 'equipamento'),
  empresa: TEMPLATE_VARIABLES.filter(v => v.category === 'empresa'),
  outros: TEMPLATE_VARIABLES.filter(v => v.category === 'outros'),
}

export const CATEGORY_LABELS: Record<string, string> = {
  cliente: 'Dados do Cliente',
  reserva: 'Dados da Reserva',
  equipamento: 'Equipamentos',
  empresa: 'Dados da Empresa',
  outros: 'Outros',
}

// Interface para dados de processamento
export interface TemplateData {
  // Cliente
  clienteNome: string
  clienteCpfCnpj?: string
  clienteEmail?: string
  clienteTelefone?: string
  clienteEndereco?: string

  // Reserva
  reservaNumero: string
  dataInicio: string
  dataFim: string
  totalDias: number
  valorTotal: number

  // Equipamentos
  equipamentos: Array<{
    nome: string
    descricao?: string
    quantidade: number
    valorDiaria: number
    valorTotal: number
  }>

  // Empresa
  empresaNome: string
  empresaCnpj?: string
  empresaEndereco?: string
  empresaTelefone?: string
  empresaEmail?: string
}

// Função para converter valor em extenso
export function valorExtenso(valor: number): string {
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
    } else {
      const milhar = Math.floor(reais / 1000)
      const resto = reais % 1000
      resultado = milhar === 1 ? "mil" : unidades[milhar] + " mil"
      if (resto > 0) {
        resultado += resto < 100 ? " e " : " "
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

// Formata valor em reais
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Formata data
export function formatarData(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Formata hora
export function formatarHora(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Gera lista formatada de equipamentos
export function formatarListaEquipamentos(equipamentos: TemplateData['equipamentos']): string {
  return equipamentos
    .map(eq => `- ${eq.nome} (${eq.quantidade}x) - ${formatarMoeda(eq.valorDiaria)}/dia`)
    .join('\n')
}

// Processa template substituindo variáveis
export function processTemplate(template: string, data: TemplateData): string {
  const now = new Date()

  // Equipamento principal (primeiro da lista)
  const mainEquipment = data.equipamentos[0]

  // Mapa de substituições
  const replacements: Record<string, string> = {
    // Cliente
    clienteNome: data.clienteNome,
    clienteCpfCnpj: data.clienteCpfCnpj || '',
    clienteEmail: data.clienteEmail || '',
    clienteTelefone: data.clienteTelefone || '',
    clienteEndereco: data.clienteEndereco || '',

    // Reserva
    reservaNumero: data.reservaNumero,
    dataInicio: data.dataInicio,
    dataFim: data.dataFim,
    totalDias: String(data.totalDias),
    valorTotal: formatarMoeda(data.valorTotal),
    valorExtenso: valorExtenso(data.valorTotal),

    // Equipamento
    listaEquipamentos: formatarListaEquipamentos(data.equipamentos),
    equipamentoNome: mainEquipment?.nome || '',
    equipamentoDescricao: mainEquipment?.descricao || '',
    equipamentoValorDiaria: mainEquipment ? formatarMoeda(mainEquipment.valorDiaria) : '',

    // Empresa
    empresaNome: data.empresaNome,
    empresaCnpj: data.empresaCnpj || '',
    empresaEndereco: data.empresaEndereco || '',
    empresaTelefone: data.empresaTelefone || '',
    empresaEmail: data.empresaEmail || '',

    // Outros
    dataAtual: formatarData(now),
    horaAtual: formatarHora(now),
  }

  // Substituir todas as variáveis no formato {variavel}
  let result = template
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g')
    result = result.replace(regex, value)
  }

  return result
}

// Gera dados de exemplo para preview
export function getExampleData(): TemplateData {
  return {
    clienteNome: 'João da Silva',
    clienteCpfCnpj: '123.456.789-00',
    clienteEmail: 'joao@email.com',
    clienteTelefone: '(11) 99999-9999',
    clienteEndereco: 'Rua das Flores, 123 - Centro, São Paulo/SP',

    reservaNumero: 'RES-12345678',
    dataInicio: '15/12/2025',
    dataFim: '20/12/2025',
    totalDias: 5,
    valorTotal: 500,

    equipamentos: [
      {
        nome: 'Betoneira 400L',
        descricao: 'Betoneira elétrica 400 litros',
        quantidade: 1,
        valorDiaria: 100,
        valorTotal: 500,
      },
    ],

    empresaNome: 'Locadora ABC Ltda',
    empresaCnpj: '12.345.678/0001-90',
    empresaEndereco: 'Av. Principal, 1000 - Industrial, Campinas/SP',
    empresaTelefone: '(19) 3333-4444',
    empresaEmail: 'contato@locadora.com.br',
  }
}

// Valida se o template contém apenas variáveis válidas
export function validateTemplate(template: string): { valid: boolean; invalidVars: string[] } {
  const validKeys = TEMPLATE_VARIABLES.map(v => v.key)
  const varPattern = /\{([a-zA-Z]+)\}/g
  const matches = template.matchAll(varPattern)

  const invalidVars: string[] = []
  for (const match of matches) {
    if (!validKeys.includes(match[1])) {
      invalidVars.push(match[1])
    }
  }

  return {
    valid: invalidVars.length === 0,
    invalidVars,
  }
}
