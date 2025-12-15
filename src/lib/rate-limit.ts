import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Rate Limiting com Upstash Redis
 *
 * Uso:
 * ```typescript
 * const { success } = await ratelimit.limit(identifier)
 * if (!success) {
 *   return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 * }
 * ```
 */

// Verificar se as variáveis de ambiente estão configuradas
const UPSTASH_CONFIGURED = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
)

// Redis client - só inicializa se configurado
const redis = UPSTASH_CONFIGURED
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

/**
 * Rate limiter padrão: 10 requisições por 10 segundos
 * Usado para endpoints de API gerais
 */
export const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '10 s'),
      analytics: true,
      prefix: 'ratelimit:general',
    })
  : null

/**
 * Rate limiter para autenticação: 5 requisições por minuto
 * Usado para login, registro, reset de senha
 */
export const authRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: 'ratelimit:auth',
    })
  : null

/**
 * Rate limiter restrito: 3 requisições por minuto
 * Usado para operações sensíveis como envio de e-mail, webhooks
 */
export const strictRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 m'),
      analytics: true,
      prefix: 'ratelimit:strict',
    })
  : null

/**
 * Rate limiter para API: 100 requisições por minuto
 * Usado para endpoints de API pública
 */
export const apiRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'ratelimit:api',
    })
  : null

/**
 * Obtém o identificador do cliente para rate limiting
 * Usa o IP da requisição ou fallback para o header X-Forwarded-For
 */
export function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown'
  return ip
}

/**
 * Resposta de rate limit excedido com headers apropriados
 */
export function rateLimitExceeded(
  resetTime?: number,
  remaining?: number
): NextResponse {
  const response = NextResponse.json(
    {
      error: 'Muitas requisições. Por favor, aguarde alguns instantes.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    { status: 429 }
  )

  if (resetTime) {
    response.headers.set('X-RateLimit-Reset', resetTime.toString())
  }
  if (remaining !== undefined) {
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
  }
  response.headers.set('Retry-After', '60')

  return response
}

/**
 * Helper para aplicar rate limiting em API routes
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = await applyRateLimit(request, 'auth')
 *   if (rateLimitResult) return rateLimitResult
 *
 *   // ... resto do código
 * }
 * ```
 */
export async function applyRateLimit(
  request: NextRequest,
  type: 'general' | 'auth' | 'strict' | 'api' = 'general'
): Promise<NextResponse | null> {
  // Se Upstash não está configurado, permitir requisição
  if (!UPSTASH_CONFIGURED) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[RateLimit] Upstash não configurado - rate limiting desabilitado')
    }
    return null
  }

  const limiter = {
    general: ratelimit,
    auth: authRatelimit,
    strict: strictRatelimit,
    api: apiRatelimit,
  }[type]

  if (!limiter) {
    return null
  }

  const identifier = getClientIdentifier(request)

  try {
    const { success, reset, remaining } = await limiter.limit(identifier)

    if (!success) {
      console.warn(`[RateLimit] Limite excedido para ${identifier} (tipo: ${type})`)
      return rateLimitExceeded(reset, remaining)
    }

    return null
  } catch (error) {
    // Em caso de erro do Redis, permite a requisição
    console.error('[RateLimit] Erro ao verificar rate limit:', error)
    return null
  }
}

/**
 * Verifica se o rate limiting está configurado e funcionando
 */
export function isRateLimitConfigured(): boolean {
  return UPSTASH_CONFIGURED
}
