import { Metadata } from "next"
import { Boxes } from "lucide-react"
import { FeaturePageTemplate } from "@/components/site"

export const metadata: Metadata = {
  title: "Gestao de Estoque | ODuoLoc",
  description: "Controle de estoque avancado com rastreamento por quantidade ou numero de serie, movimentacoes e custos.",
  openGraph: {
    title: "Gestao de Estoque | ODuoLoc",
    description: "Tenha controle total do seu inventario de equipamentos.",
  },
}

export default function EstoquePage() {
  return (
    <FeaturePageTemplate
      icon={Boxes}
      title="Gestao de Estoque"
      subtitle="Controle total do seu inventario"
      description="Sistema avancado de controle de estoque com rastreamento por quantidade ou numero de serie. Acompanhe movimentacoes, custos de aquisicao e status de cada unidade em tempo real."
      screenshotPlaceholder="Tela de gestao de estoque"
      features={[
        {
          title: "Rastreamento por Quantidade",
          description: "Ideal para equipamentos identicos. Controle quantidade total, disponivel, reservada e em manutencao."
        },
        {
          title: "Rastreamento por Serie",
          description: "Para equipamentos unicos. Cada unidade tem seu proprio numero de serie e historico individual."
        },
        {
          title: "Movimentacoes de Estoque",
          description: "Registre entradas, saidas, transferencias e ajustes. Historico completo de todas as movimentacoes."
        },
        {
          title: "Status por Unidade",
          description: "Acompanhe o status de cada equipamento: disponivel, reservado, em manutencao, danificado."
        },
        {
          title: "Custos de Aquisicao",
          description: "Registre o valor de compra de cada equipamento. Calcule depreciacao e retorno sobre investimento."
        },
        {
          title: "Alertas de Estoque",
          description: "Receba notificacoes quando o estoque atingir niveis minimos definidos por voce."
        }
      ]}
      benefits={[
        "Visao em tempo real do inventario",
        "Rastreamento individual por serie",
        "Historico completo de movimentacoes",
        "Controle de custos de aquisicao",
        "Alertas automaticos de estoque baixo",
        "Reducao de perdas e extravio"
      ]}
      availableIn={["starter", "professional", "enterprise"]}
      faqs={[
        {
          question: "Qual a diferenca entre rastreamento por quantidade e por serie?",
          answer: "Por quantidade e usado quando voce tem varios itens identicos (ex: 10 betoneiras iguais). Por serie e usado quando cada unidade e unica e precisa ser rastreada individualmente (ex: geradores com numero de serie)."
        },
        {
          question: "Posso mudar o tipo de rastreamento depois?",
          answer: "Sim, mas recomendamos definir corretamente desde o inicio para manter o historico consistente."
        },
        {
          question: "Como funciona o status de manutencao?",
          answer: "Voce pode marcar unidades como 'em manutencao' para que nao aparecam como disponiveis para reserva ate serem liberadas."
        },
        {
          question: "O sistema calcula depreciacao automaticamente?",
          answer: "Com os dados de custo de aquisicao, voce pode gerar relatorios de depreciacao baseados no uso ou tempo."
        }
      ]}
      relatedModules={[
        {
          title: "Equipamentos",
          href: "/funcionalidades/equipamentos",
          description: "Cadastro e especificacoes dos equipamentos"
        },
        {
          title: "Relatorios",
          href: "/funcionalidades/relatorios",
          description: "Analise de desempenho do estoque"
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
