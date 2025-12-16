import { prisma } from "@/lib/prisma"
import { getUazapiClient } from "./uazapi-client"

interface FollowUpTrigger {
  type: "inactivity"
  days: number
  onlyIfNoReply?: boolean
  tags?: string[]
}

interface FollowUpAction {
  message: string
  includeContext?: boolean
}

interface FollowUpRule {
  id: string
  name: string
  enabled: boolean
  trigger: FollowUpTrigger
  action: FollowUpAction
  maxAttempts: number
  tenantId: string
}

/**
 * Processa follow-ups pendentes para um tenant
 */
export async function processFollowUps(tenantId: string): Promise<{
  processed: number
  sent: number
  errors: number
}> {
  const stats = { processed: 0, sent: 0, errors: 0 }

  try {
    // Buscar regras ativas do tenant
    const rules = await prisma.whatsAppFollowUpRule.findMany({
      where: {
        tenantId,
        enabled: true,
      },
    })

    if (rules.length === 0) {
      console.log(`[FollowUp] No active rules for tenant ${tenantId}`)
      return stats
    }

    // Buscar instancia do WhatsApp
    const instance = await prisma.whatsAppInstance.findFirst({
      where: {
        tenantId,
        status: "CONNECTED",
      },
    })

    if (!instance) {
      console.log(`[FollowUp] No connected instance for tenant ${tenantId}`)
      return stats
    }

    // Para cada regra, processar conversas elegiveis
    for (const rule of rules) {
      const trigger = rule.trigger as unknown as FollowUpTrigger
      const action = rule.action as unknown as FollowUpAction

      if (trigger.type === "inactivity") {
        await processInactivityRule(
          tenantId,
          instance,
          {
            ...rule,
            trigger,
            action,
          } as FollowUpRule,
          stats
        )
      }
    }
  } catch (error) {
    console.error(`[FollowUp] Error processing tenant ${tenantId}:`, error)
    stats.errors++
  }

  return stats
}

/**
 * Processa regra de inatividade
 */
async function processInactivityRule(
  tenantId: string,
  instance: { id: string; apiToken: string | null },
  rule: FollowUpRule,
  stats: { processed: number; sent: number; errors: number }
) {
  const trigger = rule.trigger
  const action = rule.action

  // Calcular data limite de inatividade
  const inactiveDate = new Date()
  inactiveDate.setDate(inactiveDate.getDate() - trigger.days)

  // Buscar conversas inativas
  const whereConditions: Record<string, unknown> = {
    tenantId,
    status: { in: ["OPEN", "PENDING"] },
    lastMessageAt: { lt: inactiveDate },
    isBot: false, // Apenas conversas com atendimento humano
  }

  // Filtro por tags se especificado
  if (trigger.tags && trigger.tags.length > 0) {
    whereConditions.tags = { hasSome: trigger.tags }
  }

  const conversations = await prisma.whatsAppConversation.findMany({
    where: whereConditions,
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      scheduledMessages: {
        where: {
          type: "FOLLOW_UP",
          status: { in: ["PENDING", "SENT"] },
        },
      },
    },
    take: 50, // Limitar para nao sobrecarregar
  })

  console.log(
    `[FollowUp] Found ${conversations.length} inactive conversations for rule "${rule.name}"`
  )

  for (const conv of conversations) {
    stats.processed++

    try {
      // Verificar se ja atingiu limite de follow-ups
      const sentFollowUps = conv.scheduledMessages.filter(
        (m) => m.status === "SENT"
      ).length

      if (sentFollowUps >= rule.maxAttempts) {
        console.log(
          `[FollowUp] Conversation ${conv.id} reached max attempts (${rule.maxAttempts})`
        )
        continue
      }

      // Verificar se ultima mensagem foi do cliente (se onlyIfNoReply)
      if (trigger.onlyIfNoReply && conv.messages[0]?.direction === "OUTBOUND") {
        console.log(
          `[FollowUp] Skipping ${conv.id} - last message was outbound`
        )
        continue
      }

      // Verificar se ja tem follow-up pendente
      const pendingFollowUp = conv.scheduledMessages.find(
        (m) => m.status === "PENDING"
      )
      if (pendingFollowUp) {
        console.log(`[FollowUp] Conversation ${conv.id} already has pending follow-up`)
        continue
      }

      // Preparar mensagem
      let message = action.message

      // Substituir variaveis
      message = message.replace("{{nome}}", conv.contactName || "")
      message = message.replace("{{telefone}}", conv.contactPhone)

      // Incluir contexto da ultima mensagem se configurado
      if (action.includeContext && conv.messages[0]?.content) {
        message = message.replace(
          "{{ultima_mensagem}}",
          conv.messages[0].content.substring(0, 100)
        )
      }

      // Enviar mensagem
      if (!instance.apiToken) {
        console.error(`[FollowUp] Instance ${instance.id} has no apiToken`)
        stats.errors++
        continue
      }

      const uazapi = getUazapiClient()
      await uazapi.sendTextMessage(instance.apiToken, {
        phone: conv.contactPhone,
        message,
      })

      // Registrar no banco
      await prisma.whatsAppScheduledMessage.create({
        data: {
          conversationId: conv.id,
          tenantId,
          type: "FOLLOW_UP",
          content: message,
          scheduledFor: new Date(),
          sentAt: new Date(),
          status: "SENT",
          conditions: {
            ruleId: rule.id,
            ruleName: rule.name,
            triggerDays: trigger.days,
          },
        },
      })

      // Criar mensagem na conversa
      await prisma.whatsAppMessage.create({
        data: {
          conversationId: conv.id,
          direction: "OUTBOUND",
          type: "TEXT",
          content: message,
          status: "SENT",
          sentAt: new Date(),
          isFromBot: true,
          metadata: {
            followUp: true,
            ruleId: rule.id,
          },
        },
      })

      // Atualizar conversa
      await prisma.whatsAppConversation.update({
        where: { id: conv.id },
        data: {
          lastMessage: message.substring(0, 100),
          lastMessageAt: new Date(),
        },
      })

      stats.sent++
      console.log(`[FollowUp] Sent follow-up to conversation ${conv.id}`)
    } catch (error) {
      console.error(`[FollowUp] Error processing conversation ${conv.id}:`, error)
      stats.errors++

      // Registrar falha
      await prisma.whatsAppScheduledMessage.create({
        data: {
          conversationId: conv.id,
          tenantId,
          type: "FOLLOW_UP",
          content: action.message,
          scheduledFor: new Date(),
          status: "FAILED",
          error: error instanceof Error ? error.message : "Unknown error",
          conditions: {
            ruleId: rule.id,
          },
        },
      })
    }
  }
}

/**
 * Processa todos os tenants com regras de follow-up ativas
 */
export async function processAllFollowUps(): Promise<{
  tenants: number
  totalProcessed: number
  totalSent: number
  totalErrors: number
}> {
  const totalStats = {
    tenants: 0,
    totalProcessed: 0,
    totalSent: 0,
    totalErrors: 0,
  }

  // Buscar todos os tenants com regras ativas
  const tenantsWithRules = await prisma.whatsAppFollowUpRule.findMany({
    where: { enabled: true },
    select: { tenantId: true },
    distinct: ["tenantId"],
  })

  console.log(`[FollowUp] Processing ${tenantsWithRules.length} tenants with active rules`)

  for (const { tenantId } of tenantsWithRules) {
    totalStats.tenants++

    const stats = await processFollowUps(tenantId)
    totalStats.totalProcessed += stats.processed
    totalStats.totalSent += stats.sent
    totalStats.totalErrors += stats.errors
  }

  console.log(`[FollowUp] Completed:`, totalStats)
  return totalStats
}

/**
 * Agenda uma mensagem de follow-up manual
 */
export async function scheduleFollowUp(
  conversationId: string,
  tenantId: string,
  content: string,
  scheduledFor: Date
): Promise<{ id: string }> {
  const scheduled = await prisma.whatsAppScheduledMessage.create({
    data: {
      conversationId,
      tenantId,
      type: "REMINDER",
      content,
      scheduledFor,
      status: "PENDING",
    },
  })

  return { id: scheduled.id }
}

/**
 * Cancela um follow-up agendado
 */
export async function cancelFollowUp(
  id: string,
  tenantId: string
): Promise<boolean> {
  const result = await prisma.whatsAppScheduledMessage.updateMany({
    where: {
      id,
      tenantId,
      status: "PENDING",
    },
    data: {
      status: "CANCELLED",
    },
  })

  return result.count > 0
}
