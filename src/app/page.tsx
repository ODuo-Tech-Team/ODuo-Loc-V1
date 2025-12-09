import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LandingPageSchemas } from "@/components/seo/JsonLd"
import {
    ArrowRight,
    Check,
    LayoutDashboard,
    Shield,
    Zap,
    Globe,
    Calendar,
    Users,
    Package,
    CreditCard,
    BarChart3,
    Webhook,
    TrendingUp,
    Bell,
    Smartphone,
    Clock,
    HeadphonesIcon,
    ChevronDown
} from "lucide-react"

export default function LandingPage() {
    const faqs = [
        {
            question: "O que é o ODuoLoc?",
            answer: "ODuoLoc é um sistema de gestão completo para locadoras de equipamentos. Com ele você pode gerenciar reservas, controlar estoque, cadastrar clientes, emitir notas fiscais e acompanhar o financeiro da sua empresa em uma única plataforma."
        },
        {
            question: "Quanto custa o sistema para locadora?",
            answer: "O ODuoLoc oferece 3 planos: Starter (R$ 997/mês) para quem está começando, Professional (R$ 1.497/mês) para empresas em crescimento e Enterprise (R$ 2.997/mês) para grandes operações. Todos incluem 14 dias de teste grátis."
        },
        {
            question: "O sistema funciona para qualquer tipo de locadora?",
            answer: "Sim! O ODuoLoc é flexível e atende diversos tipos de locadoras: equipamentos para construção, ferramentas, andaimes, geradores, containers, equipamentos audiovisuais, para eventos e muito mais."
        },
        {
            question: "Como funciona o controle de estoque?",
            answer: "O sistema controla automaticamente a disponibilidade dos equipamentos. Você cadastra a quantidade total e o sistema atualiza em tempo real: disponível, reservado, em manutenção e danificado."
        },
        {
            question: "Posso emitir nota fiscal pelo sistema?",
            answer: "Sim! O ODuoLoc possui integração completa para emissão de NFS-e (Nota Fiscal de Serviço Eletrônica) diretamente pelo sistema."
        },
        {
            question: "Preciso instalar algum programa?",
            answer: "Não! O ODuoLoc é 100% online (cloud). Você acessa pelo navegador de qualquer dispositivo - computador, tablet ou celular."
        },
    ]
    const features = [
        {
            icon: LayoutDashboard,
            title: "Painel de Controle Completo",
            description: "Visualize todas as métricas importantes do seu negócio em tempo real com dashboards intuitivos e personalizáveis."
        },
        {
            icon: Calendar,
            title: "Gestão de Reservas",
            description: "Sistema completo de reservas com calendário integrado, controle de disponibilidade e confirmações automáticas."
        },
        {
            icon: Users,
            title: "Gestão de Clientes",
            description: "Cadastro completo de clientes com histórico de reservas, preferências e comunicação centralizada."
        },
        {
            icon: Package,
            title: "Controle de Equipamentos",
            description: "Gerencie seu inventário com fotos, especificações, preços e status de disponibilidade em tempo real."
        },
        {
            icon: CreditCard,
            title: "Módulo Financeiro",
            description: "Controle completo de receitas, despesas, pagamentos pendentes e relatórios financeiros detalhados."
        },
        {
            icon: BarChart3,
            title: "Relatórios Avançados",
            description: "Análises profundas com gráficos interativos, exportação de dados e insights para tomada de decisão."
        },
        {
            icon: Webhook,
            title: "API & Webhooks",
            description: "Integre com outros sistemas através de nossa API REST completa e webhooks em tempo real."
        },
        {
            icon: TrendingUp,
            title: "Marketing Integrado",
            description: "Ferramentas de marketing para campanhas, cupons de desconto e análise de conversão."
        },
        {
            icon: Bell,
            title: "Notificações Automáticas",
            description: "Envio automático de emails e SMS para confirmações, lembretes e atualizações de status."
        },
        {
            icon: Shield,
            title: "Segurança Avançada",
            description: "Criptografia de ponta a ponta, backups automáticos e conformidade com LGPD."
        },
        {
            icon: Globe,
            title: "Multi-Tenant",
            description: "Gerencie múltiplas filiais ou empresas em uma única plataforma centralizada."
        },
        {
            icon: Smartphone,
            title: "100% Responsivo",
            description: "Acesse de qualquer dispositivo - desktop, tablet ou smartphone com experiência otimizada."
        }
    ]

    const whyChoose = [
        {
            icon: Zap,
            title: "Rápido e Intuitivo",
            description: "Interface moderna e fácil de usar. Sua equipe aprende em minutos, não em dias.",
            color: "text-emerald-400"
        },
        {
            icon: Shield,
            title: "Seguro e Confiável",
            description: "Seus dados protegidos com criptografia de ponta e backups automáticos diários.",
            color: "text-blue-400"
        },
        {
            icon: HeadphonesIcon,
            title: "Suporte Dedicado",
            description: "Equipe especializada pronta para ajudar via chat, email ou telefone.",
            color: "text-cyan-400"
        },
        {
            icon: TrendingUp,
            title: "Crescimento Garantido",
            description: "Automações inteligentes que liberam seu tempo para focar no que realmente importa.",
            color: "text-amber-400"
        }
    ]

    const stats = [
        { value: "99.9%", label: "Uptime Garantido" },
        { value: "100%", label: "Cloud / Online" },
        { value: "14 dias", label: "Teste Grátis" },
        { value: "Suporte", label: "Dedicado" }
    ]

    return (
        <>
        <LandingPageSchemas />
        <div className="min-h-screen bg-[#04132A] text-white overflow-hidden selection:bg-blue-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
                <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[30%] h-[30%] rounded-full bg-cyan-500/5 blur-[100px]" />
            </div>

            {/* Navigation */}
            <nav className="relative z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
                    <Link href="/" className="flex items-center">
                        <img src="/logo.svg" alt="ODuoLoc" className="h-20 w-auto" />
                    </Link>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
                        <Link href="#features" className="hover:text-white transition-colors">Recursos</Link>
                        <Link href="#pricing" className="hover:text-white transition-colors">Preços</Link>
                        <Link href="#why" className="hover:text-white transition-colors">Por quê</Link>
                        <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors hidden sm:block">
                            Entrar
                        </Link>
                        <Link href="/planos">
                            <Button className="bg-white text-black hover:bg-gray-200 border-0">
                                Começar Agora <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 pt-20 pb-32 px-4 sm:px-6 lg:px-8">
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
                        A plataforma completa para gerenciar suas reservas, equipamentos e clientes.
                        Automatize processos e escale seu negócio com a tecnologia mais moderna do mercado.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                        <Link href="/planos" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full h-12 px-8 text-base bg-blue-600 hover:bg-blue-500 shadow-[0_0_30px_-10px_#317AE0]">
                                Começar Gratuitamente
                            </Button>
                        </Link>
                        <Link href="/dashboard" className="w-full sm:w-auto">
                            <Button size="lg" variant="outline" className="w-full h-12 px-8 text-base border-white/10 bg-white/5 hover:bg-white/10 text-white">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Ver Demo
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
            <section id="why" className="relative z-10 py-24">
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
                                <div className={`w-12 h-12 rounded-lg bg-${item.color.replace('text-', '')}/10 flex items-center justify-center mb-4`}>
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
            <section id="features" className="relative z-10 py-24 bg-black/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Tudo que você precisa em um só lugar</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                            Sistema completo com todas as ferramentas para gerenciar sua locadora com eficiência
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, i) => (
                            <div key={i} className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 group">
                                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <feature.icon className="h-6 w-6 text-blue-400" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="relative z-10 py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Planos para todos os tamanhos</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                            Escolha o plano ideal para o tamanho da sua operação
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Starter Plan */}
                        <div className="p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
                                <p className="text-gray-400 text-sm">Ideal para quem está começando</p>
                            </div>
                            <div className="mb-6">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-white">R$ 997</span>
                                    <span className="text-gray-400">/mês</span>
                                </div>
                            </div>
                            <ul className="space-y-3 mb-8 flex-1">
                                {[
                                    "Ate 2 usuarios",
                                    "Ate 50 equipamentos",
                                    "200 reservas/mes",
                                    "5GB de armazenamento",
                                    "Gestao de estoque",
                                    "Multi-usuarios"
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
                                    <span className="text-gray-300">/mês</span>
                                </div>
                            </div>
                            <ul className="space-y-3 mb-8 flex-1">
                                {[
                                    "Ate 5 usuarios",
                                    "Ate 200 equipamentos",
                                    "1000 reservas/mes",
                                    "20GB de armazenamento",
                                    "Emissao de NFS-e",
                                    "Modulo Financeiro",
                                    "Relatorios Avancados",
                                    "API de Integracao",
                                    "Integracao WhatsApp"
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
                                <p className="text-gray-400 text-sm">Solução completa para grandes operações</p>
                            </div>
                            <div className="mb-6">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-white">R$ 2.997</span>
                                    <span className="text-gray-400">/mês</span>
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
                                    "Dominios personalizados"
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

                    {/* Precisa de mais? */}
                    <div className="mt-12 text-center p-8 rounded-2xl border border-white/10 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 max-w-2xl mx-auto">
                        <h3 className="text-xl font-bold text-white mb-2">Precisa de mais?</h3>
                        <p className="text-gray-400 mb-4">
                            Temos soluções personalizadas para operações de grande escala.
                        </p>
                        <a href="mailto:contato@oduoloc.com.br" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium">
                            Fale com nosso time de vendas
                            <ArrowRight className="h-4 w-4" />
                        </a>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500">
                            14 dias grátis • Sem cartão necessário • Cancele a qualquer momento
                        </p>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="relative z-10 py-24 bg-black/20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Perguntas Frequentes</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                            Tire suas dúvidas sobre o sistema para locadora de equipamentos
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
            <section className="relative z-10 py-24 px-4">
                <div className="max-w-4xl mx-auto text-center p-12 rounded-3xl border border-white/10 bg-gradient-to-b from-blue-900/20 to-cyan-900/20 backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0))]" />
                    <div className="relative z-10">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-6">Pronto para transformar sua gestao?</h2>
                        <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                            Modernize os processos da sua locadora com a plataforma mais completa do mercado.
                        </p>
                        <Link href="/planos">
                            <Button size="lg" className="h-14 px-8 text-lg bg-white text-black hover:bg-gray-200 border-0 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
                                Começar Teste Grátis
                            </Button>
                        </Link>
                        <p className="mt-4 text-sm text-gray-500">
                            14 dias grátis • Sem cartão necessário • Cancele a qualquer momento
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/10 bg-black/40 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <Link href="/" className="flex items-center">
                        <img src="/logo.svg" alt="ODuoLoc" className="h-20 w-auto" />
                    </Link>
                    <div className="text-sm text-gray-500">
                        &copy; 2025 ODuo Assessoria. Todos os direitos reservados.
                    </div>
                    <div className="flex gap-6 text-sm text-gray-500">
                        <Link href="#" className="hover:text-white transition-colors">Termos</Link>
                        <Link href="#" className="hover:text-white transition-colors">Privacidade</Link>
                        <Link href="#" className="hover:text-white transition-colors">Contato</Link>
                    </div>
                </div>
            </footer>
        </div>
        </>
    )
}
