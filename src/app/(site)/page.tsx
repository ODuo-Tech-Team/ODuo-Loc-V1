import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LandingPageSchemas } from "@/components/seo/JsonLd"
import {
  ArrowRight,
  Check,
  LayoutDashboard,
  Shield,
  Zap,
  Calendar,
  Users,
  Package,
  CreditCard,
  BarChart3,
  Webhook,
  TrendingUp,
  Bell,
  Smartphone,
  HeadphonesIcon,
  ChevronDown,
  FileText,
  Boxes,
  Target,
  Receipt,
  Plug
} from "lucide-react"

export default function HomePage() {
  const faqs = [
    {
      question: "O que é o ODuoLoc?",
      answer: "ODuoLoc é um sistema de gestão completo para locadoras de equipamentos. Com ele você pode gerenciar reservas, controlar estoque, cadastrar clientes, emitir notas fiscais e acompanhar o financeiro da sua empresa em uma única plataforma."
    },
    {
      question: "Quanto custa o sistema para locadora?",
      answer: "O ODuoLoc oferece 3 planos: Starter (R$ 997/mês) para quem está começando, Professional (R$ 1.497/mês) para empresas em crescimento e Enterprise (R$ 2.997/mês) para grandes operações. Há também uma taxa única de implementação de R$ 2.000."
    },
    {
      question: "O sistema funciona para qualquer tipo de locadora?",
      answer: "Sim! O ODuoLoc é flexível e atende diversos tipos de locadoras: equipamentos para construção, ferramentas, andaimes, geradores, containers, equipamentos audiovisuais, para eventos e muito mais."
    },
    {
      question: "Como funciona o controle de estoque?",
      answer: "O sistema controla automaticamente a disponibilidade dos equipamentos. Você cadastra a quantidade total e o sistema atualiza em tempo real: disponível, reservado, em manutenção e danificado. Suporta tanto controle por quantidade quanto rastreamento por número de série."
    },
    {
      question: "Posso emitir nota fiscal pelo sistema?",
      answer: "Sim! O ODuoLoc possui integração completa para emissão de NFS-e (Nota Fiscal de Serviço Eletrônica) diretamente pelo sistema, disponível nos planos Professional e Enterprise."
    },
    {
      question: "Preciso instalar algum programa?",
      answer: "Não! O ODuoLoc é 100% online (cloud). Você acessa pelo navegador de qualquer dispositivo - computador, tablet ou celular."
    },
    {
      question: "Quanto tempo demora para começar a usar?",
      answer: "Após a contratação, a implementação leva de 3 a 5 dias úteis. Nossa equipe auxilia na configuração inicial, importação de dados e treinamento da sua equipe."
    },
    {
      question: "Tem integração com WhatsApp?",
      answer: "Sim! O sistema permite enviar notificações automáticas para clientes via WhatsApp, incluindo confirmações de reserva, lembretes e atualizações de status."
    },
  ]

  const features = [
    {
      icon: Package,
      title: "Gestão de Equipamentos",
      description: "Cadastre equipamentos com fotos, especificações, preços por periodo e controle de disponibilidade em tempo real.",
      href: "/funcionalidades/equipamentos"
    },
    {
      icon: Calendar,
      title: "Reservas e Calendário",
      description: "Sistema completo de reservas com calendario integrado, orçamentos, contratos e controle de devolução.",
      href: "/funcionalidades/reservas"
    },
    {
      icon: Users,
      title: "Gestão de Clientes",
      description: "Cadastro completo de clientes PF/PJ com histórico de reservas, multiplos endereços de entrega e documentos.",
      href: "/funcionalidades/clientes"
    },
    {
      icon: Boxes,
      title: "Controle de Estoque",
      description: "Rastreamento por quantidade ou número de serie, movimentações, custos e status (disponível, reservado, manutenção).",
      href: "/funcionalidades/estoque"
    },
    {
      icon: CreditCard,
      title: "Módulo Financeiro",
      description: "Controle de receitas, despesas, contas a pagar/receber, fluxo de caixa e conciliação bancária.",
      href: "/funcionalidades/financeiro"
    },
    {
      icon: Target,
      title: "CRM e Comercial",
      description: "Gestão de leads, funil de vendas, pipeline comercial e acompanhamento de oportunidades.",
      href: "/funcionalidades/comercial"
    },
    {
      icon: Receipt,
      title: "Notas Fiscais (NFS-e)",
      description: "Emissão de notas fiscais de servico eletronica integrada diretamente ao sistema de reservas.",
      href: "/funcionalidades/notas-fiscais"
    },
    {
      icon: BarChart3,
      title: "Relatórios Avançados",
      description: "Análises profundas com gráficos interativos, KPIs de desempenho, exportação de dados e insights.",
      href: "/funcionalidades/relatorios"
    },
    {
      icon: Plug,
      title: "API e Integrações",
      description: "API REST completa e webhooks em tempo real para integrar com outros sistemas.",
      href: "/funcionalidades/integracoes"
    },
    {
      icon: Bell,
      title: "Notificações Automaticas",
      description: "Envio automático de emails e mensagens para confirmações, lembretes e atualizações de status.",
      href: "/funcionalidades/equipamentos"
    },
    {
      icon: Shield,
      title: "Segurança e LGPD",
      description: "Criptografia de ponta a ponta, backups automáticos, controle de acesso e conformidade com LGPD.",
      href: "/sobre"
    },
    {
      icon: Smartphone,
      title: "100% Responsivo",
      description: "Acesse de qualquer dispositivo - desktop, tablet ou smartphone com experiencia otimizada.",
      href: "/sobre"
    }
  ]

  const whyChoose = [
    {
      icon: Zap,
      title: "Rápido e Intuitivo",
      description: "Interface moderna e fácil de usar. Sua equipe aprende em minutos, nao em dias.",
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10"
    },
    {
      icon: Shield,
      title: "Seguro e Confiável",
      description: "Seus dados protegidos com criptografia de ponta e backups automáticos diários.",
      color: "text-blue-400",
      bgColor: "bg-blue-400/10"
    },
    {
      icon: HeadphonesIcon,
      title: "Suporte Dedicado",
      description: "Equipe especializada pronta para ajudar via chat, email ou telefone.",
      color: "text-cyan-400",
      bgColor: "bg-cyan-400/10"
    },
    {
      icon: TrendingUp,
      title: "Crescimento Garantido",
      description: "Automações inteligentes que liberam seu tempo para focar no que realmente importa.",
      color: "text-amber-400",
      bgColor: "bg-amber-400/10"
    }
  ]

  const stats = [
    { value: "99.9%", label: "Uptime Garantido" },
    { value: "100%", label: "Cloud / Online" },
    { value: "24/7", label: "Suporte Dedicado" },
    { value: "R$ 2.000", label: "Implementação" }
  ]

  return (
    <>
      <LandingPageSchemas />

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-blue-400 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Plataforma completa para locadoras
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500">
            Gestão de Locação <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400">Reinventada</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            A plataforma completa para gerenciar suas reservas, equipamentos, clientes e financeiro.
            Automatize processos e escale seu negócio com a tecnologia mais moderna do mercado.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/planos" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-12 px-8 text-base bg-blue-600 hover:bg-blue-500 shadow-[0_0_30px_-10px_#317AE0]">
                Comecar Gratuitamente
              </Button>
            </Link>
            <Link href="/funcionalidades" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full h-12 px-8 text-base border-white/10 bg-white/5 hover:bg-white/10 text-white">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Ver Funcionalidades
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section id="why" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Por que escolher a ODuoLoc?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              A plataforma completa para modernizar a gestao da sua locadora de equipamentos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChoose.map((item, i) => (
              <div key={i} className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300">
                <div className={`w-12 h-12 rounded-lg ${item.bgColor} flex items-center justify-center mb-4`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Tudo que você precisa em um so lugar</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Sistema completo com todas as ferramentas para gerenciar sua locadora com eficiencia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <Link
                key={i}
                href={feature.href}
                className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 group block"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition-colors">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </Link>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/funcionalidades">
              <Button variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white">
                Ver todas as funcionalidades <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Planos para todos os tamanhos</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Escolha o plano ideal para o tamanho da sua operacao
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <div className="p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 flex flex-col">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
                <p className="text-gray-400 text-sm">Ideal para quem esta começando</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">R$ 997</span>
                  <span className="text-gray-400">/mes</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "Ate 2 usuarios",
                  "Ate 50 equipamentos",
                  "200 reservas/mes",
                  "5GB de armazenamento",
                  "Gestão de estoque",
                  "Suporte por email"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/planos" className="w-full">
                <Button variant="outline" className="w-full border-white/20 bg-white/5 hover:bg-white/10 text-white">
                  Selecionar Plano <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Professional Plan */}
            <div className="p-8 rounded-2xl border-2 border-blue-500/50 bg-gradient-to-b from-blue-500/10 to-cyan-500/10 hover:border-blue-500/70 transition-all duration-300 flex flex-col relative shadow-[0_0_30px_-10px_#317AE0]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  MAIS POPULAR
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Professional</h3>
                <p className="text-gray-300 text-sm">Para empresas em crescimento</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">R$ 1.497</span>
                  <span className="text-gray-300">/mes</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "Ate 5 usuarios",
                  "Ate 200 equipamentos",
                  "1.000 reservas/mes",
                  "20GB de armazenamento",
                  "Emissão de NFS-e",
                  "Módulo Financeiro",
                  "Relatórios Avançados",
                  "API de Integracao",
                  "Suporte prioritario"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-white">
                    <Check className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/planos" className="w-full">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-0">
                  Selecionar Plano <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 flex flex-col">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
                <p className="text-gray-400 text-sm">Solucao completa para grandes operações</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">R$ 2.997</span>
                  <span className="text-gray-400">/mes</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "Ate 10 usuarios",
                  "Equipamentos ilimitados",
                  "Reservas ilimitadas",
                  "500GB de armazenamento",
                  "Tudo do Professional +",
                  "Webhooks em tempo real",
                  "Suporte 24/7"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/planos" className="w-full">
                <Button variant="outline" className="w-full border-white/20 bg-white/5 hover:bg-white/10 text-white">
                  Selecionar Plano <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Implementation fee */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              Taxa de implementação: <span className="text-white font-semibold">R$ 2.000</span> (única)
            </p>
          </div>

          {/* Precisa de mais? */}
          <div className="mt-12 text-center p-8 rounded-2xl border border-white/10 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-white mb-2">Precisa de mais?</h3>
            <p className="text-gray-400 mb-4">
              Temos solucoes personalizadas para operações de grande escala.
            </p>
            <a href="mailto:contato@oduoloc.com.br" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Fale com nosso time de vendas
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

                  </div>
      </section>

      {/* Testimonials Section (preparado para futuro) */}
      {/*
      <section className="py-24 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">O que nossos clientes dizem</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Locadoras de todo o Brasil ja transformaram sua gestao com o ODuoLoc
            </p>
          </div>
          <!-- Testimonials cards here -->
        </div>
      </section>
      */}

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-black/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Perguntas Frequentes</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Tire suas duvidas sobre o sistema para locadora de equipamentos
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <h3 className="text-lg font-semibold text-white pr-4">{faq.question}</h3>
                  <ChevronDown className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="mt-4 text-gray-400 leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center p-12 rounded-3xl border border-white/10 bg-gradient-to-b from-blue-900/20 to-cyan-900/20 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0))]" />
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Pronto para transformar sua gestão?</h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Modernize os processos da sua locadora com a plataforma mais completa do mercado.
            </p>
            <Link href="/planos">
              <Button size="lg" className="h-14 px-8 text-lg bg-white text-black hover:bg-gray-200 border-0 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
                Começar Agora
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
