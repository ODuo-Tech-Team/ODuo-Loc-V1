import { Metadata } from "next"
import { Boxes } from "lucide-react"
import { FeaturePageTemplate } from "@/components/site"

export const metadata: Metadata = {
  title: "Gestão de Estoque | ODuoLoc",
  description: "Controle de estoque avançado com rastreamento por quantidade ou número de série, movimentações e custos.",
  openGraph: {
    title: "Gestão de Estoque | ODuoLoc",
    description: "Tenha controle total do seu inventário de equipamentos.",
  },
}

export default function EstoquePage() {
  return (
    <FeaturePageTemplate
      icon={Boxes}
      title="Gestão de Estoque"
      subtitle="Controle total do seu inventário"
      description="Sistema avançado de controle de estoque com rastreamento por quantidade ou número de série. Acompanhe movimentações, custos de aquisição e status de cada unidade em tempo real."
      screenshotPlaceholder="Tela de gestão de estoque"
      features={[
        {
          title: "Rastreamento por Quantidade",
          description: "Ideal para equipamentos idênticos. Controle quantidade total, disponível, reservada e em manutenção."
        },
        {
          title: "Rastreamento por Série",
          description: "Para equipamentos únicos. Cada unidade tem seu próprio número de série e histórico individual."
        },
        {
          title: "Movimentações de Estoque",
          description: "Registre entradas, saídas, transferências e ajustes. Histórico completo de todas as movimentações."
        },
        {
          title: "Status por Unidade",
          description: "Acompanhe o status de cada equipamento: disponível, reservado, em manutenção, danificado."
        },
        {
          title: "Custos de Aquisição",
          description: "Registre o valor de compra de cada equipamento. Calcule depreciação e retorno sobre investimento."
        },
        {
          title: "Alertas de Estoque",
          description: "Receba notificações quando o estoque atingir níveis mínimos definidos por você."
        }
      ]}
      benefits={[
        "Visão em tempo real do inventário",
        "Rastreamento individual por série",
        "Histórico completo de movimentações",
        "Controle de custos de aquisição",
        "Alertas automáticos de estoque baixo",
        "Redução de perdas e extravio"
      ]}
      availableIn={["starter", "professional", "enterprise"]}
      faqs={[
        {
          question: "Qual a diferença entre rastreamento por quantidade e por série?",
          answer: "Por quantidade é usado quando você tem vários itens idênticos (ex: 10 betoneiras iguais). Por série é usado quando cada unidade é única e precisa ser rastreada individualmente (ex: geradores com número de série)."
        },
        {
          question: "Posso mudar o tipo de rastreamento depois?",
          answer: "Sim, mas recomendamos definir corretamente desde o início para manter o histórico consistente."
        },
        {
          question: "Como funciona o status de manutenção?",
          answer: "Você pode marcar unidades como 'em manutenção' para que não apareçam como disponíveis para reserva até serem liberadas."
        },
        {
          question: "O sistema calcula depreciação automaticamente?",
          answer: "Com os dados de custo de aquisição, você pode gerar relatórios de depreciação baseados no uso ou tempo."
        }
      ]}
      relatedModules={[
        {
          title: "Equipamentos",
          href: "/funcionalidades/equipamentos",
          description: "Cadastro e especificações dos equipamentos"
        },
        {
          title: "Relatórios",
          href: "/funcionalidades/relatorios",
          description: "Análise de desempenho do estoque"
        },
        {
          title: "Reservas",
          href: "/funcionalidades/reservas",
          description: "Reservas automaticamente atualizam o estoque"
        }
      ]}
    />
  )
}
