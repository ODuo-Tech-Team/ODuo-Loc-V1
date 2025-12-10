import { Metadata } from "next"
import { Plug } from "lucide-react"
import { FeaturePageTemplate } from "@/components/site"

export const metadata: Metadata = {
  title: "API e Integrações | ODuoLoc",
  description: "API REST completa e webhooks em tempo real para integrar com ERPs, e-commerces e outros sistemas.",
  openGraph: {
    title: "API e Integrações | ODuoLoc",
    description: "Integre o ODuoLoc com seus outros sistemas.",
  },
}

export default function IntegracoesPage() {
  return (
    <FeaturePageTemplate
      icon={Plug}
      title="API e Integrações"
      subtitle="Conecte seus sistemas"
      description="API REST completa e documentada para integrar o ODuoLoc com ERPs, e-commerces, sistemas de contabilidade e outras ferramentas. Webhooks em tempo real para automações avançadas."
      screenshotPlaceholder="Documentação da API"
      features={[
        {
          title: "API REST Documentada",
          description: "API completa com documentação interativa (Swagger/OpenAPI) para todas as operações do sistema."
        },
        {
          title: "Webhooks em Tempo Real",
          description: "Receba notificações automáticas quando eventos ocorrerem: nova reserva, pagamento, etc."
        },
        {
          title: "Integração com WhatsApp",
          description: "Envie notificações automáticas para clientes via WhatsApp em eventos importantes."
        },
        {
          title: "Chaves de API Seguras",
          description: "Gere e gerencie múltiplas chaves de API com diferentes permissões."
        },
        {
          title: "Rate Limiting Configurável",
          description: "Controle o número de requisições por minuto para cada integração."
        },
        {
          title: "Logs de Integração",
          description: "Acompanhe todas as chamadas de API e webhooks com logs detalhados."
        }
      ]}
      benefits={[
        "Automação de processos",
        "Integração com sistemas existentes",
        "Sincronização de dados",
        "Notificações em tempo real",
        "Economia de tempo",
        "Flexibilidade total"
      ]}
      availableIn={["professional", "enterprise"]}
      faqs={[
        {
          question: "Qual o formato da API?",
          answer: "API REST com respostas em JSON. Autenticação via Bearer Token (API Key)."
        },
        {
          question: "Quais operações estão disponíveis na API?",
          answer: "Todas: equipamentos, clientes, reservas, financeiro, estoque. Consulte a documentação completa."
        },
        {
          question: "Posso integrar com meu ERP?",
          answer: "Sim, a API permite sincronizar dados com qualquer sistema que suporte integrações REST."
        },
        {
          question: "Os webhooks têm retry automático?",
          answer: "Sim, em caso de falha, o sistema tenta reenviar o webhook até 3 vezes com intervalo crescente."
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
          description: "Integre com sistemas contábeis"
        }
      ]}
    />
  )
}
