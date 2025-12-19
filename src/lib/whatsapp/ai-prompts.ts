// System prompts e helpers para o bot de IA

/**
 * Prompt padrão do sistema
 */
const DEFAULT_SYSTEM_PROMPT = `Você é um assistente virtual de atendimento de uma locadora de equipamentos. Seu papel é:

1. Responder perguntas sobre os equipamentos disponíveis
2. Informar sobre preços e condições de locação
3. Ajudar clientes a encontrar o equipamento ideal para suas necessidades
4. Coletar informações de contato quando houver interesse
5. Agendar visitas ou orçamentos quando solicitado

Regras importantes:
- Seja cordial, profissional e objetivo
- Responda em português brasileiro
- Mantenha as respostas concisas (máximo 3-4 parágrafos)
- Se não souber a resposta, diga que vai transferir para um atendente
- Nunca invente informações sobre equipamentos ou preços
- Quando o cliente demonstrar interesse concreto, pergunte se deseja falar com um atendente humano

Informações da empresa:
{company_info}

{catalog}`

/**
 * Gera o system prompt completo
 * Suporta variáveis em múltiplos formatos:
 * - {catalog} / {catalogo} / {{catalogo}} - Catálogo de equipamentos
 * - {company_info} / {empresa} / {{empresa}} - Informações da empresa
 */
export function getSystemPrompt(
  customPrompt: string | null,
  companyName: string,
  catalogContext: string
): string {
  const basePrompt = customPrompt || DEFAULT_SYSTEM_PROMPT

  // Substituir variáveis de catálogo (múltiplos formatos)
  let result = basePrompt
    .replace(/\{catalog\}/gi, catalogContext)
    .replace(/\{catalogo\}/gi, catalogContext)
    .replace(/\{\{catalogo\}\}/gi, catalogContext)
    .replace(/\{\{catalog\}\}/gi, catalogContext)

  // Substituir variáveis de empresa (múltiplos formatos)
  const companyInfo = `Nome: ${companyName}`
  result = result
    .replace(/\{company_info\}/gi, companyInfo)
    .replace(/\{empresa\}/gi, companyName)
    .replace(/\{\{empresa\}\}/gi, companyName)
    .replace(/\{\{company_info\}\}/gi, companyInfo)

  return result
}

/**
 * Verifica se a mensagem contém palavras-chave para transferir para humano
 */
export function shouldTransferToHuman(
  message: string,
  transferKeywords: string[]
): boolean {
  const messageLower = message.toLowerCase()

  for (const keyword of transferKeywords) {
    if (messageLower.includes(keyword.toLowerCase())) {
      return true
    }
  }

  return false
}

/**
 * Verifica se está dentro do horário comercial
 * @param businessHours JSON com horários por dia da semana
 * Formato: { "mon": { "start": "08:00", "end": "18:00" }, "tue": { ... }, ... }
 */
export function isWithinBusinessHours(
  businessHours: Record<string, { start: string; end: string } | null>
): boolean {
  const now = new Date()
  const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
  const currentDay = dayNames[now.getDay()]

  const hours = businessHours[currentDay]

  // Se não há configuração para o dia, considerar fechado
  if (!hours || !hours.start || !hours.end) {
    return false
  }

  const currentTime = now.getHours() * 60 + now.getMinutes()

  const [startHour, startMinute] = hours.start.split(":").map(Number)
  const [endHour, endMinute] = hours.end.split(":").map(Number)

  const startTime = startHour * 60 + startMinute
  const endTime = endHour * 60 + endMinute

  return currentTime >= startTime && currentTime <= endTime
}

/**
 * Templates de mensagens automáticas padrão
 */
export const DEFAULT_MESSAGES = {
  welcome: `Olá! 👋 Bem-vindo à nossa locadora!

Sou o assistente virtual e estou aqui para ajudar você a encontrar o equipamento ideal.

Como posso ajudar?`,

  away: `Olá! Obrigado por entrar em contato.

Nosso horário de atendimento é de segunda a sexta, das 8h às 18h.

Deixe sua mensagem que retornaremos assim que possível! 📞`,

  transfer: `Entendi! Vou transferir você para um de nossos atendentes.

Aguarde um momento, em breve alguém da nossa equipe vai continuar o atendimento. 👨‍💼`,

  closing: `Foi um prazer ajudar você! 😊

Se precisar de algo mais, é só chamar.

Até breve! 👋`,
}

/**
 * Extrai intenção da mensagem (simplificado)
 */
export function detectIntent(message: string): string {
  const messageLower = message.toLowerCase()

  if (messageLower.match(/pre[çc]o|valor|quanto custa|or[çc]amento/)) {
    return "pricing"
  }

  if (messageLower.match(/disponível|tem|possui|aluga/)) {
    return "availability"
  }

  if (messageLower.match(/horário|funciona|abre|fecha/)) {
    return "hours"
  }

  if (messageLower.match(/endere[çc]o|onde fica|localiza[çc][ãa]o/)) {
    return "location"
  }

  if (messageLower.match(/ol[áa]|oi|bom dia|boa tarde|boa noite/)) {
    return "greeting"
  }

  if (messageLower.match(/obrigad[oa]|valeu|tchau|até/)) {
    return "goodbye"
  }

  return "general"
}
