import { Metadata } from "next"
import { Plug } from "lucide-react"
import { FeaturePageTemplate } from "@/components/site"

export const metadata: Metadata = {
  title: "API e Integracoes | ODuoLoc",
  description: "API REST completa e webhooks em tempo real para integrar com ERPs, e-commerces e outros sistemas.",
  openGraph: {
    title: "API e Integracoes | ODuoLoc",
    description: "Integre o ODuoLoc com seus outros sistemas.",
  },
}

export default function IntegracoesPage() {
  return (
    <FeaturePageTemplate
      icon={Plug}
      title="API e Integracoes"
      subtitle="Conecte seus sistemas"
      description="API REST completa e documentada para integrar o ODuoLoc com ERPs, e-commerces, sistemas de contabilidade e outras ferramentas. Webhooks em tempo real para automacoes avancadas."
      screenshotPlaceholder="Documentacao da API"
      features={[
        {
          title: "API REST Documentada",
          description: "API completa com documentacao interativa (Swagger/OpenAPI) para todas as operacoes do sistema."
        },
        {
          title: "Webhooks em Tempo Real",
          description: "Receba notificacoes automaticas quando eventos ocorrerem: nova reserva, pagamento, etc."
        },
        {
          title: "Integracao com WhatsApp",
          description: "Envie notificacoes automaticas para clientes via WhatsApp em eventos importantes."
        },
        {
          title: "Chaves de API Seguras",
          description: "Gere e gerencie multiplas chaves de API com diferentes permissoes."
        },
        {
          title: "Rate Limiting Configuravel",
          description: "Controle o numero de requisicoes por minuto para cada integracao."
        },
        {
          title: "Logs de Integracao",
          description: "Acompanhe todas as chamadas de API e webhooks com logs detalhados."
        }
      ]}
      benefits={[
        "Automacao de processos",
        "Integracao com sistemas existentes",
        "Sincronizacao de dados",
        "Notificacoes em tempo real",
        "Economia de tempo",
        "Flexibilidade total"
      ]}
      availableIn={["professional", "enterprise"]}
      faqs={[
        {
          question: "Qual o formato da API?",
          answer: "API REST com respostas em JSON. Autenticacao via Bearer Token (API Key)."
        },
        {
          question: "Quais operacoes estao disponiveis na API?",
          answer: "Todas: equipamentos, clientes, reservas, financeiro, estoque. Consulte a documentacao completa."
        },
        {
          question: "Posso integrar com meu ERP?",
          answer: "Sim, a API permite sincronizar dados com qualquer sistema que suporte integracoes REST."
        },
        {
          question: "Os webhooks tem retry automatico?",
          answer: "Sim, em caso de falha, o sistema tenta reenviar o webhook ate 3 vezes com intervalo crescente."
        }
      ]}
      relatedModules={[
        {
          title: "Reservas",
          href: "/funcionalidades/reservas",
          description: "Crie reservas via API"
        },
        {
          title: "Clientes",
          href: "/funcionalidades/clientes",
          description: "Sincronize dados de clientes"
        },
        {
          title: "Financeiro",
          href: "/funcionalidades/financeiro",
          description: "Integre com sistemas contabeis"
        }
      ]}
    />
  )
}
