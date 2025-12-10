import { Metadata } from "next"
import { Users } from "lucide-react"
import { FeaturePageTemplate } from "@/components/site"

export const metadata: Metadata = {
  title: "Gestao de Clientes | ODuoLoc",
  description: "Cadastro completo de clientes PF e PJ com historico de reservas, multiplos enderecos de entrega e gestao de documentos.",
  openGraph: {
    title: "Gestao de Clientes | ODuoLoc",
    description: "Centralize todas as informacoes dos seus clientes em um unico lugar.",
  },
}

export default function ClientesPage() {
  return (
    <FeaturePageTemplate
      icon={Users}
      title="Gestao de Clientes"
      subtitle="Conheca seus clientes em detalhes"
      description="Cadastro completo de clientes pessoa fisica e juridica com historico de reservas, multiplos enderecos de entrega, documentos anexados e consulta automatica de CNPJ."
      screenshotPlaceholder="Tela de cadastro de clientes"
      features={[
        {
          title: "Cadastro PF e PJ",
          description: "Formularios otimizados para pessoa fisica e juridica com todos os campos necessarios."
        },
        {
          title: "Consulta Automatica de CNPJ",
          description: "Digite o CNPJ e o sistema preenche automaticamente razao social, endereco e dados da empresa."
        },
        {
          title: "Multiplos Enderecos",
          description: "Cadastre varios enderecos de entrega por cliente. Ideal para empresas com multiplas obras ou filiais."
        },
        {
          title: "Documentos Anexados",
          description: "Anexe contratos, documentos de identificacao e outros arquivos importantes ao cadastro."
        },
        {
          title: "Historico Completo",
          description: "Visualize todo o historico de reservas, pagamentos e interacoes de cada cliente."
        },
        {
          title: "Busca Avancada",
          description: "Encontre clientes rapidamente por nome, CPF/CNPJ, email ou telefone."
        }
      ]}
      benefits={[
        "Cadastro rapido com consulta de CNPJ",
        "Todas as informacoes em um so lugar",
        "Historico completo de relacionamento",
        "Multiplos enderecos de entrega",
        "Documentos sempre acessiveis",
        "Comunicacao facilitada"
      ]}
      availableIn={["starter", "professional", "enterprise"]}
      faqs={[
        {
          question: "Posso importar clientes de outro sistema?",
          answer: "Sim! Nossa equipe auxilia na importacao de dados durante a implementacao. Aceitamos planilhas Excel e CSV."
        },
        {
          question: "Como funciona a consulta de CNPJ?",
          answer: "Ao digitar o CNPJ, o sistema consulta bases publicas e preenche automaticamente os dados da empresa como razao social, endereco e situacao cadastral."
        },
        {
          question: "Posso anexar qualquer tipo de documento?",
          answer: "Sim, voce pode anexar PDFs, imagens e documentos de texto. O armazenamento depende do seu plano."
        },
        {
          question: "E possivel categorizar os clientes?",
          answer: "Sim, voce pode adicionar tags e categorias aos clientes para facilitar a organizacao e filtragem."
        }
      ]}
      relatedModules={[
        {
          title: "Reservas",
          href: "/funcionalidades/reservas",
          description: "Crie reservas vinculadas aos clientes"
        },
        {
          title: "CRM Comercial",
          href: "/funcionalidades/comercial",
          description: "Gestao de leads e oportunidades"
        },
        {
          title: "Financeiro",
          href: "/funcionalidades/financeiro",
          description: "Contas a receber dos clientes"
        }
      ]}
    />
  )
}
