// Engine para processar templates de descrição do serviço

import type { TemplateVariables } from './types'

/**
 * Template padrão para descrição do serviço na NFS-e
 */
export const DEFAULT_DESCRIPTION_TEMPLATE = `Locação de equipamentos conforme reserva #{bookingNumber}.
Período: {startDate} a {endDate} ({totalDays} dias).

Itens:
{itemsList}

Valor total: R$ {totalPrice}`

/**
 * Variáveis disponíveis para o template
 */
export const TEMPLATE_VARIABLES = [
  { key: 'bookingNumber', label: 'Número da Reserva', example: 'RES-001' },
  { key: 'startDate', label: 'Data de Início', example: '01/12/2025' },
  { key: 'endDate', label: 'Data de Fim', example: '05/12/2025' },
  { key: 'totalDays', label: 'Total de Dias', example: '5' },
  { key: 'customerName', label: 'Nome do Cliente', example: 'João da Silva' },
  { key: 'itemsList', label: 'Lista de Itens', example: '- Gerador 50kVA (2x) - R$ 500,00\n- Compressor (1x) - R$ 200,00' },
  { key: 'totalPrice', label: 'Valor Total', example: '1.200,00' },
] as const

/**
 * Remove tags HTML de uma string, preservando quebras de linha
 * @param html - String com possíveis tags HTML
 * @returns Texto sem tags HTML
 */
export function stripHtml(html: string): string {
  // Substitui <br>, <br/>, </p>, </div> por quebras de linha
  let text = html.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/p>/gi, '\n')
  text = text.replace(/<\/div>/gi, '\n')
  text = text.replace(/<\/li>/gi, '\n')

  // Remove todas as outras tags HTML
  text = text.replace(/<[^>]*>/g, '')

  // Decodifica entidades HTML comuns
  text = text.replace(/&nbsp;/gi, ' ')
  text = text.replace(/&amp;/gi, '&')
  text = text.replace(/&lt;/gi, '<')
  text = text.replace(/&gt;/gi, '>')
  text = text.replace(/&quot;/gi, '"')
  text = text.replace(/&#39;/gi, "'")

  // Remove múltiplas quebras de linha consecutivas
  text = text.replace(/\n{3,}/g, '\n\n')

  // Remove espaços extras no início e fim
  return text.trim()
}

/**
 * Processa um template substituindo as variáveis pelos valores
 * Remove tags HTML automaticamente (NFS-e requer texto puro)
 * @param template - Template com variáveis no formato {variavel}
 * @param variables - Objeto com os valores das variáveis
 * @returns Texto processado (sem HTML)
 */
export function processTemplate(
  template: string,
  variables: TemplateVariables
): string {
  // Primeiro, remove tags HTML do template
  let result = stripHtml(template)

  // Substitui cada variável
  for (const [key, value] of Object.entries(variables)) {
    // Suporta {variavel} e #{variavel}
    const regex = new RegExp(`#?\\{${key}\\}`, 'g')
    result = result.replace(regex, String(value))
  }

  return result
}

/**
 * Valida se um template contém apenas variáveis válidas
 * @param template - Template a ser validado
 * @returns Lista de variáveis inválidas encontradas
 */
export function validateTemplate(template: string): string[] {
  const validKeys = TEMPLATE_VARIABLES.map(v => v.key)
  const invalidVariables: string[] = []

  // Encontra todas as variáveis no template
  const regex = /#?\{(\w+)\}/g
  let match

  while ((match = regex.exec(template)) !== null) {
    const variableName = match[1]
    if (!validKeys.includes(variableName as typeof validKeys[number])) {
      invalidVariables.push(variableName)
    }
  }

  return invalidVariables
}

/**
 * Gera um preview do template com dados de exemplo
 * @param template - Template a ser processado
 * @returns Texto com preview usando dados de exemplo
 */
export function previewTemplate(template: string): string {
  const exampleVariables: TemplateVariables = {
    bookingNumber: 'RES-001',
    startDate: '01/12/2025',
    endDate: '05/12/2025',
    totalDays: 5,
    customerName: 'João da Silva',
    itemsList: '- Gerador 50kVA (2x) - R$ 500,00\n- Compressor (1x) - R$ 200,00',
    totalPrice: '1.200,00',
  }

  return processTemplate(template, exampleVariables)
}

/**
 * Formata um valor monetário para exibição
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Formata uma data para exibição
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR')
}

/**
 * Calcula o número de dias entre duas datas
 */
export function calculateDays(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1 // Inclui o dia inicial
}

/**
 * Formata a lista de itens para o template
 */
export function formatItemsList(
  items: Array<{
    equipmentName: string
    quantity: number
    totalPrice: number
  }>
): string {
  return items
    .map(item => `- ${item.equipmentName} (${item.quantity}x) - R$ ${formatCurrency(item.totalPrice)}`)
    .join('\n')
}
