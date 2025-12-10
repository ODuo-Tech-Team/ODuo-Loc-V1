import { Metadata } from "next"
import { Users } from "lucide-react"
import { FeaturePageTemplate } from "@/components/site"

export const metadata: Metadata = {
  title: "Gestão de Clientes | ODuoLoc",
  description: "Cadastro completo de clientes PF e PJ com histórico de reservas, múltiplos endereços de entrega e gestão de documentos.",
  openGraph: {
    title: "Gestão de Clientes | ODuoLoc",
    description: "Centralize todas as informações dos seus clientes em um único lugar.",
  },
}

export default function ClientesPage() {
  return (
    <FeaturePageTemplate
      icon={Users}
      title="Gestão de Clientes"
      subtitle="Conheça seus clientes em detalhes"
      description="Cadastro completo de clientes pessoa física e jurídica com histórico de reservas, múltiplos endereços de entrega, documentos anexados e consulta automática de CNPJ."
      screenshotPlaceholder="Tela de cadastro de clientes"
      features={[
        {
          title: "Cadastro PF e PJ",
          description: "Formulários otimizados para pessoa física e jurídica com todos os campos necessários."
        },
        {
          title: "Consulta Automática de CNPJ",
          description: "Digite o CNPJ e o sistema preenche automaticamente razão social, endereço e dados da empresa."
        },
        {
          title: "Múltiplos Endereços",
          description: "Cadastre vários endereços de entrega por cliente. Ideal para empresas com múltiplas obras ou filiais."
        },
        {
          title: "Documentos Anexados",
          description: "Anexe contratos, documentos de identificação e outros arquivos importantes ao cadastro."
        },
        {
          title: "Histórico Completo",
          description: "Visualize todo o histórico de reservas, pagamentos e interações de cada cliente."
        },
        {
          title: "Busca Avançada",
          description: "Encontre clientes rapidamente por nome, CPF/CNPJ, email ou telefone."
        }
      ]}
      benefits={[
        "Cadastro rápido com consulta de CNPJ",
        "Todas as informações em um só lugar",
        "Histórico completo de relacionamento",
        "Múltiplos endereços de entrega",
        "Documentos sempre acessíveis",
        "Comunicação facilitada"
      ]}
      availableIn={["starter", "professional", "enterprise"]}
      faqs={[
        {
          question: "Posso importar clientes de outro sistema?",
          answer: "Sim! Nossa equipe auxilia na importação de dados durante a implementação. Aceitamos planilhas Excel e CSV."
        },
        {
          question: "Como funciona a consulta de CNPJ?",
          answer: "Ao digitar o CNPJ, o sistema consulta bases públicas e preenche automaticamente os dados da empresa como razão social, endereço e situação cadastral."
        },
        {
          question: "Posso anexar qualquer tipo de documento?",
          answer: "Sim, você pode anexar PDFs, imagens e documentos de texto. O armazenamento depende do seu plano."
        },
        {
          question: "É possível categorizar os clientes?",
          answer: "Sim, você pode adicionar tags e categorias aos clientes para facilitar a organização e filtragem."
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
          description: "Gestão de leads e oportunidades"
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
