import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Ajustar sample rate baseado no ambiente
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Configurar ambiente
  environment: process.env.NODE_ENV || "development",

  // Adicionar tags globais
  initialScope: {
    tags: {
      app: "saas-locacao",
      platform: "server",
    },
  },

  // Filter de informações sensíveis
  beforeSend(event, hint) {
    // Remover cookies e headers sensíveis
    if (event.request) {
      delete event.request.cookies

      if (event.request.headers) {
        delete event.request.headers["authorization"]
        delete event.request.headers["cookie"]
      }
    }

    // Remover variáveis de ambiente sensíveis do contexto
    if (event.contexts?.runtime?.env) {
      const env = event.contexts.runtime.env as Record<string, any>
      Object.keys(env).forEach((key) => {
        if (
          key.includes("PASSWORD") ||
          key.includes("SECRET") ||
          key.includes("KEY") ||
          key.includes("TOKEN")
        ) {
          env[key] = "***"
        }
      })
    }

    return event
  },

  // Ignorar erros conhecidos
  ignoreErrors: [
    // Prisma client errors que não são críticos
    "PrismaClientKnownRequestError",
    // Validação do Zod (já tratada no app)
    "ZodError",
  ],
})
