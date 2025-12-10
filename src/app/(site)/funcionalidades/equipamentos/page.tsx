import { Metadata } from "next"
import { Package } from "lucide-react"
import { FeaturePageTemplate } from "@/components/site"

export const metadata: Metadata = {
  title: "Gestão de Equipamentos | ODuoLoc",
  description: "Cadastre e gerencie todos os seus equipamentos com fotos, especificações, preços por período e controle de disponibilidade em tempo real.",
  openGraph: {
    title: "Gestão de Equipamentos | ODuoLoc",
    description: "Sistema completo para gerenciar o catálogo de equipamentos da sua locadora.",
  },
}

export default function EquipamentosPage() {
  return (
    <FeaturePageTemplate
      icon={Package}
      title="Gestão de Equipamentos"
      subtitle="O coração do seu catálogo de locação"
      description="Cadastre e gerencie todos os seus equipamentos em um único lugar. Com fotos, especificações técnicas, preços por período e controle de disponibilidade em tempo real, você tem visão completa do seu inventário."
      screenshotPlaceholder="Tela de cadastro de equipamentos"
      features={[
        {
          title: "Cadastro Completo",
          description: "Adicione fotos, descrições detalhadas, especificações técnicas e toda informação relevante dos seus equipamentos."
        },
        {
          title: "Preços por Período",
          description: "Configure preços diferenciados para diária, semanal, quinzenal e mensal. O sistema calcula automaticamente o melhor valor."
        },
        {
          title: "Categorias e Filtros",
          description: "Organize seus equipamentos em categorias e subcategorias para facilitar a busca e navegação."
        },
        {
          title: "Disponibilidade em Tempo Real",
          description: "Veja instantaneamente quantas unidades estão disponíveis, reservadas, em manutenção ou indisponíveis."
        },
        {
          title: "Galeria de Imagens",
          description: "Adicione múltiplas fotos por equipamento. As imagens são otimizadas automaticamente para web."
        },
        {
          title: "Histórico de Locações",
          description: "Acompanhe o histórico completo de locações de cada equipamento, incluindo clientes e períodos."
        }
      ]}
      benefits={[
        "Catálogo profissional e organizado",
        "Precificação flexível por período",
        "Controle de disponibilidade automático",
        "Redução de erros em reservas",
        "Histórico completo para análise",
        "Busca rápida por categoria ou nome"
      ]}
      availableIn={["starter", "professional", "enterprise"]}
      faqs={[
        {
          question: "Quantos equipamentos posso cadastrar?",
          answer: "Depende do seu plano: Starter permite até 50 equipamentos, Professional até 200, e Enterprise é ilimitado."
        },
        {
          question: "Posso importar meus equipamentos de uma planilha?",
          answer: "Sim! Nossa equipe pode auxiliar na importação de dados durante a implementação do sistema."
        },
        {
          question: "Como funciona o cálculo de preço por período?",
          answer: "Você cadastra os preços para cada período (diária, semanal, etc) e o sistema automaticamente calcula e sugere o melhor valor para o cliente baseado na duração da locação."
        },
        {
          question: "Posso ter equipamentos com preços diferentes por categoria?",
          answer: "Sim, cada equipamento tem sua própria configuração de preços, independente da categoria."
        }
      ]}
      relatedModules={[
        {
          title: "Controle de Estoque",
          href: "/funcionalidades/estoque",
          description: "Rastreie unidades por série e gerencie movimentações"
        },
        {
          title: "Reservas",
          href: "/funcionalidades/reservas",
          description: "Gerencie reservas e orçamentos dos equipamentos"
        },
        {
          title: "Relatórios",
          href: "/funcionalidades/relatorios",
          description: "Analise o desempenho dos seus equipamentos"
        }
      ]}
    />
  )
}
