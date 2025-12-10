import { Metadata } from "next"
import { Package } from "lucide-react"
import { FeaturePageTemplate } from "@/components/site"

export const metadata: Metadata = {
  title: "Gestao de Equipamentos | ODuoLoc",
  description: "Cadastre e gerencie todos os seus equipamentos com fotos, especificacoes, precos por periodo e controle de disponibilidade em tempo real.",
  openGraph: {
    title: "Gestao de Equipamentos | ODuoLoc",
    description: "Sistema completo para gerenciar o catalogo de equipamentos da sua locadora.",
  },
}

export default function EquipamentosPage() {
  return (
    <FeaturePageTemplate
      icon={Package}
      title="Gestao de Equipamentos"
      subtitle="O coracao do seu catalogo de locacao"
      description="Cadastre e gerencie todos os seus equipamentos em um unico lugar. Com fotos, especificacoes tecnicas, precos por periodo e controle de disponibilidade em tempo real, voce tem visao completa do seu inventario."
      screenshotPlaceholder="Tela de cadastro de equipamentos"
      features={[
        {
          title: "Cadastro Completo",
          description: "Adicione fotos, descricoes detalhadas, especificacoes tecnicas e toda informacao relevante dos seus equipamentos."
        },
        {
          title: "Precos por Periodo",
          description: "Configure precos diferenciados para diaria, semanal, quinzenal e mensal. O sistema calcula automaticamente o melhor valor."
        },
        {
          title: "Categorias e Filtros",
          description: "Organize seus equipamentos em categorias e subcategorias para facilitar a busca e navegacao."
        },
        {
          title: "Disponibilidade em Tempo Real",
          description: "Veja instantaneamente quantas unidades estao disponiveis, reservadas, em manutencao ou indisponiveis."
        },
        {
          title: "Galeria de Imagens",
          description: "Adicione multiplas fotos por equipamento. As imagens sao otimizadas automaticamente para web."
        },
        {
          title: "Historico de Locacoes",
          description: "Acompanhe o historico completo de locacoes de cada equipamento, incluindo clientes e periodos."
        }
      ]}
      benefits={[
        "Catalogo profissional e organizado",
        "Precificacao flexivel por periodo",
        "Controle de disponibilidade automatico",
        "Reducao de erros em reservas",
        "Historico completo para analise",
        "Busca rapida por categoria ou nome"
      ]}
      availableIn={["starter", "professional", "enterprise"]}
      faqs={[
        {
          question: "Quantos equipamentos posso cadastrar?",
          answer: "Depende do seu plano: Starter permite ate 50 equipamentos, Professional ate 200, e Enterprise e ilimitado."
        },
        {
          question: "Posso importar meus equipamentos de uma planilha?",
          answer: "Sim! Nossa equipe pode auxiliar na importacao de dados durante a implementacao do sistema."
        },
        {
          question: "Como funciona o calculo de preco por periodo?",
          answer: "Voce cadastra os precos para cada periodo (diaria, semanal, etc) e o sistema automaticamente calcula e sugere o melhor valor para o cliente baseado na duracao da locacao."
        },
        {
          question: "Posso ter equipamentos com precos diferentes por categoria?",
          answer: "Sim, cada equipamento tem sua propria configuracao de precos, independente da categoria."
        }
      ]}
      relatedModules={[
        {
          title: "Controle de Estoque",
          href: "/funcionalidades/estoque",
          description: "Rastreie unidades por serie e gerencie movimentacoes"
        },
        {
          title: "Reservas",
          href: "/funcionalidades/reservas",
          description: "Gerencie reservas e orcamentos dos equipamentos"
        },
        {
          title: "Relatorios",
          href: "/funcionalidades/relatorios",
          description: "Analise o desempenho dos seus equipamentos"
        }
      ]}
    />
  )
}
