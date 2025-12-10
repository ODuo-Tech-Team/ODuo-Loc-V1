import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Check,
  Package,
  Calendar,
  Users,
  Boxes,
  CreditCard,
  Target,
  Receipt,
  BarChart3,
  Plug,
  CalendarDays
} from "lucide-react"

export const metadata: Metadata = {
  title: "Funcionalidades | ODuoLoc - Sistema para Locadoras",
  description: "Conheça todas as funcionalidades do ODuoLoc: gestão de equipamentos, reservas, clientes, estoque, financeiro, NFS-e, relatórios e muito mais.",
  openGraph: {
    title: "Funcionalidades | ODuoLoc",
    description: "Sistema completo para locadoras de equipamentos com todas as ferramentas que você precisa.",
  },
}

const modules = [
  {
    icon: Package,
    title: "Gestão de Equipamentos",
    slug: "equipamentos",
    description: "Cadastre e gerencie todos os seus equipamentos com fotos, especificações, preços por período e controle de disponibilidade.",
    features: [
      "Cadastro completo com fotos e especificações",
      "Preços por período (diária, semanal, mensal)",
      "Categorias e subcategorias",
      "Controle de disponibilidade em tempo real",
      "Histórico de locações por equipamento"
    ],
    plans: ["starter", "professional", "enterprise"]
  },
  {
    icon: Calendar,
    title: "Reservas e Orçamentos",
    slug: "reservas",
    description: "Sistema completo de reservas com calendário integrado, orçamentos automáticos, contratos digitais e controle de devolução.",
    features: [
      "Calendário visual de reservas",
      "Orçamentos automáticos",
      "Contratos digitais personalizáveis",
      "Checklists de entrega e devolução",
      "Status de reserva em tempo real"
    ],
    plans: ["starter", "professional", "enterprise"]
  },
  {
    icon: Users,
    title: "Gestão de Clientes",
    slug: "clientes",
    description: "Cadastro completo de clientes PF e PJ com histórico de reservas, múltiplos endereços de entrega e gestão de documentos.",
    features: [
      "Cadastro PF e PJ",
      "Múltiplos endereços de entrega",
      "Histórico completo de reservas",
      "Documentos anexados",
      "Consulta automática de CNPJ"
    ],
    plans: ["starter", "professional", "enterprise"]
  },
  {
    icon: CalendarDays,
    title: "Calendário Integrado",
    slug: "calendario",
    description: "Visualize todas as reservas em um calendário intuitivo com diferentes visualizações e filtros avançados.",
    features: [
      "Visualização diária, semanal e mensal",
      "Filtros por equipamento e cliente",
      "Drag and drop para reagendar",
      "Cores por status de reserva",
      "Exportação de agenda"
    ],
    plans: ["starter", "professional", "enterprise"]
  },
  {
    icon: Boxes,
    title: "Gestão de Estoque",
    slug: "estoque",
    description: "Controle de estoque avançado com rastreamento por quantidade ou número de série, movimentações e custos.",
    features: [
      "Rastreamento por quantidade ou série",
      "Movimentações de entrada e saída",
      "Status: disponível, reservado, manutenção",
      "Controle de custos de aquisição",
      "Alertas de estoque baixo"
    ],
    plans: ["starter", "professional", "enterprise"]
  },
  {
    icon: Target,
    title: "CRM e Comercial",
    slug: "comercial",
    description: "Gestão de leads e oportunidades com funil de vendas, pipeline comercial e acompanhamento de conversões.",
    features: [
      "Cadastro de leads",
      "Funil de vendas visual",
      "Pipeline comercial",
      "Histórico de interações",
      "Conversão de lead para cliente"
    ],
    plans: ["professional", "enterprise"]
  },
  {
    icon: CreditCard,
    title: "Módulo Financeiro",
    slug: "financeiro",
    description: "Controle financeiro completo com contas a pagar e receber, fluxo de caixa, categorias e relatórios.",
    features: [
      "Contas a pagar e receber",
      "Fluxo de caixa",
      "Categorias de transações",
      "Conciliação bancária",
      "Relatórios financeiros"
    ],
    plans: ["professional", "enterprise"]
  },
  {
    icon: Receipt,
    title: "Notas Fiscais (NFS-e)",
    slug: "notas-fiscais",
    description: "Emissão de Nota Fiscal de Serviço Eletrônica integrada diretamente ao sistema de reservas.",
    features: [
      "Emissão de NFS-e automática",
      "Integração com prefeituras",
      "Configuração de impostos",
      "Cancelamento de notas",
      "Relatórios fiscais"
    ],
    plans: ["professional", "enterprise"]
  },
  {
    icon: BarChart3,
    title: "Relatórios Avançados",
    slug: "relatorios",
    description: "Análises profundas com gráficos interativos, KPIs de desempenho, exportação de dados e insights.",
    features: [
      "Dashboard com KPIs",
      "Gráficos interativos",
      "Relatórios personalizados",
      "Exportação em Excel/PDF",
      "Comparativos de período"
    ],
    plans: ["professional", "enterprise"]
  },
  {
    icon: Plug,
    title: "API e Integrações",
    slug: "integracoes",
    description: "API REST completa e webhooks em tempo real para integrar com ERPs, e-commerces e outros sistemas.",
    features: [
      "API REST documentada",
      "Webhooks em tempo real",
      "Integração com WhatsApp",
      "Chaves de API seguras",
      "Rate limiting configurável"
    ],
    plans: ["professional", "enterprise"]
  },
]

const planFeatures = {
  starter: {
    name: "Starter",
    price: "R$ 997",
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/20"
  },
  professional: {
    name: "Professional",
    price: "R$ 1.497",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20"
  },
  enterprise: {
    name: "Enterprise",
    price: "R$ 2.997",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20"
  }
}

export default function FuncionalidadesPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Todas as{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
              Funcionalidades
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            O ODuoLoc oferece um conjunto completo de ferramentas para gerenciar
            todos os aspectos da sua locadora de equipamentos.
          </p>
        </div>
      </section>

      {/* Modules Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-8">
            {modules.map((module, index) => (
              <div
                key={index}
                className="p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/[0.07] transition-all duration-300"
              >
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Info */}
                  <div className="lg:col-span-2">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <module.icon className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold mb-2">{module.title}</h2>
                        <p className="text-gray-400">{module.description}</p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-gray-300 mb-3">
                        Principais recursos:
                      </h3>
                      <ul className="grid sm:grid-cols-2 gap-2">
                        {module.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                            <Check className="h-4 w-4 text-blue-400 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6">
                      <Link href={`/funcionalidades/${module.slug}`}>
                        <Button variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white">
                          Ver detalhes <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Plans */}
                  <div className="lg:border-l lg:border-white/10 lg:pl-8">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">
                      Disponível em:
                    </h3>
                    <div className="space-y-3">
                      {(["starter", "professional", "enterprise"] as const).map((plan) => {
                        const included = module.plans.includes(plan)
                        const planInfo = planFeatures[plan]
                        return (
                          <div
                            key={plan}
                            className={`p-3 rounded-lg border ${
                              included
                                ? `${planInfo.bgColor} ${planInfo.borderColor}`
                                : "bg-white/5 border-white/5 opacity-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={included ? planInfo.color : "text-gray-500"}>
                                {planInfo.name}
                              </span>
                              {included ? (
                                <Check className={`h-4 w-4 ${planInfo.color}`} />
                              ) : (
                                <span className="text-xs text-gray-500">Não incluso</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Comparativo de Planos</h2>
            <p className="text-gray-400">Veja o que cada plano oferece</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">Módulo</th>
                  <th className="text-center py-4 px-4">
                    <div className="text-gray-400 font-medium">Starter</div>
                    <div className="text-xl font-bold text-white">R$ 997</div>
                    <div className="text-xs text-gray-500">/mês</div>
                  </th>
                  <th className="text-center py-4 px-4">
                    <div className="text-blue-400 font-medium">Professional</div>
                    <div className="text-xl font-bold text-white">R$ 1.497</div>
                    <div className="text-xs text-gray-500">/mês</div>
                  </th>
                  <th className="text-center py-4 px-4">
                    <div className="text-cyan-400 font-medium">Enterprise</div>
                    <div className="text-xl font-bold text-white">R$ 2.997</div>
                    <div className="text-xs text-gray-500">/mês</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {modules.map((module, index) => (
                  <tr key={index} className="border-b border-white/5">
                    <td className="py-4 px-4 text-gray-300">{module.title}</td>
                    <td className="text-center py-4 px-4">
                      {module.plans.includes("starter") ? (
                        <Check className="h-5 w-5 text-green-400 mx-auto" />
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      {module.plans.includes("professional") ? (
                        <Check className="h-5 w-5 text-green-400 mx-auto" />
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      {module.plans.includes("enterprise") ? (
                        <Check className="h-5 w-5 text-green-400 mx-auto" />
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {/* Limites */}
                <tr className="border-b border-white/5 bg-white/5">
                  <td className="py-4 px-4 text-gray-300 font-medium">Usuários</td>
                  <td className="text-center py-4 px-4 text-gray-300">Até 2</td>
                  <td className="text-center py-4 px-4 text-gray-300">Até 5</td>
                  <td className="text-center py-4 px-4 text-gray-300">Até 10</td>
                </tr>
                <tr className="border-b border-white/5 bg-white/5">
                  <td className="py-4 px-4 text-gray-300 font-medium">Equipamentos</td>
                  <td className="text-center py-4 px-4 text-gray-300">Até 50</td>
                  <td className="text-center py-4 px-4 text-gray-300">Até 200</td>
                  <td className="text-center py-4 px-4 text-gray-300">Ilimitado</td>
                </tr>
                <tr className="border-b border-white/5 bg-white/5">
                  <td className="py-4 px-4 text-gray-300 font-medium">Reservas/mês</td>
                  <td className="text-center py-4 px-4 text-gray-300">200</td>
                  <td className="text-center py-4 px-4 text-gray-300">1.000</td>
                  <td className="text-center py-4 px-4 text-gray-300">Ilimitado</td>
                </tr>
                <tr className="bg-white/5">
                  <td className="py-4 px-4 text-gray-300 font-medium">Armazenamento</td>
                  <td className="text-center py-4 px-4 text-gray-300">5GB</td>
                  <td className="text-center py-4 px-4 text-gray-300">20GB</td>
                  <td className="text-center py-4 px-4 text-gray-300">500GB</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-4">
              Taxa de implementação: R$ 2.000 (única)
            </p>
            <Link href="/planos">
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white">
                Ver planos detalhados <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center p-12 rounded-3xl border border-white/10 bg-gradient-to-b from-blue-900/20 to-cyan-900/20">
          <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Descubra como o ODuoLoc pode transformar a gestão da sua locadora.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/planos">
              <Button size="lg" className="bg-white text-black hover:bg-gray-200">
                Começar Agora <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contato">
              <Button size="lg" variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white">
                Agendar Demonstração
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
