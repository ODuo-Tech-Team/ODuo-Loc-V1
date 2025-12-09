import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Ajustar sample rate baseado no ambiente
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,
  // Reduzido de 0.1 para 0.02 para economizar bandwidth e melhorar performance
  replaysSessionSampleRate: 0.02,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Ignorar erros conhecidos
  ignoreErrors: [
    // Erros de navegadores
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
    // Erros de extensões de navegador
    "top.GLOBALS",
    "chrome-extension://",
    "moz-extension://",
  ],

  // Filter de URLs sensíveis
  beforeSend(event, hint) {
    // Não enviar informações sensíveis
    if (event.request) {
      delete event.request.cookies

      // Mascarar tokens e senhas nas URLs
      if (event.request.url) {
        event.request.url = event.request.url.replace(/([?&])(token|password|api_key)=[^&]*/gi, "$1$2=***")
      }
    }

    return event
  },

  // Enriquecer contexto
  beforeBreadcrumb(breadcrumb) {
    // Não capturar cliques em elementos sensíveis
    if (breadcrumb.category === "ui.click") {
      const target = breadcrumb.message
      if (target && (target.includes("password") || target.includes("token"))) {
        return null
      }
    }
    return breadcrumb
  },
})
