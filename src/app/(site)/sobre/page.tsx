import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Target,
  Eye,
  Heart,
  Shield,
  Zap,
  Users,
  Award,
  Clock,
  CheckCircle2
} from "lucide-react"

export const metadata: Metadata = {
  title: "Sobre Nós - Quem Somos | ODuoLoc",
  description: "Conheça a ODuo Assessoria, empresa por trás do ODuoLoc - o sistema de gestão mais completo para locadoras de equipamentos do Brasil.",
  openGraph: {
    title: "Sobre Nós | ODuoLoc",
    description: "Conheça a história e os valores da ODuo Assessoria.",
  },
}

export default function SobrePage() {
  const values = [
    {
      icon: Target,
      title: "Foco no Cliente",
      description: "Cada funcionalidade e decisão é pensada para resolver problemas reais das locadoras."
    },
    {
      icon: Zap,
      title: "Inovação Contínua",
      description: "Estamos sempre evoluindo o sistema com novas funcionalidades e melhorias."
    },
    {
      icon: Shield,
      title: "Segurança e Confiança",
      description: "Seus dados são protegidos com os mais altos padrões de segurança."
    },
    {
      icon: Heart,
      title: "Parceria de Longo Prazo",
      description: "Não somos apenas um fornecedor, somos parceiros no crescimento do seu negócio."
    }
  ]

  const milestones = [
    {
      year: "2023",
      title: "Início da Jornada",
      description: "Começamos a desenvolver o ODuoLoc após identificar a falta de sistemas modernos para locadoras."
    },
    {
      year: "2024",
      title: "Lançamento Beta",
      description: "Primeiros clientes testam a plataforma e ajudam a moldar as funcionalidades."
    },
    {
      year: "2025",
      title: "Versão 1.0",
      description: "Lançamento oficial com todas as funcionalidades core: reservas, estoque, financeiro e NFS-e."
    }
  ]

  const differentials = [
    "Sistema 100% cloud - acesse de qualquer lugar",
    "Interface moderna e intuitiva",
    "Suporte humanizado e dedicado",
    "Atualizações constantes sem custo adicional",
    "Integração com NFS-e e sistemas fiscais",
    "API completa para integrações",
    "Multi-tenant com dados isolados",
    "Backups automáticos diários"
  ]

  return (
    <>
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Sobre a{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
              ODuo
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Somos uma empresa de tecnologia focada em criar soluções que transformam
            a forma como locadoras de equipamentos gerenciam seus negócios.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Missão */}
            <div className="p-8 rounded-2xl border border-white/10 bg-white/5">
              <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                <Target className="h-7 w-7 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Nossa Missão</h2>
              <p className="text-gray-400 leading-relaxed">
                Democratizar o acesso à tecnologia de gestão para locadoras de equipamentos
                de todos os tamanhos, oferecendo uma plataforma completa, acessível e fácil de usar
                que permita aos empresários focarem no crescimento do negócio.
              </p>
            </div>

            {/* Visão */}
            <div className="p-8 rounded-2xl border border-white/10 bg-white/5">
              <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6">
                <Eye className="h-7 w-7 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Nossa Visão</h2>
              <p className="text-gray-400 leading-relaxed">
                Ser a plataforma de gestão mais utilizada por locadoras de equipamentos no Brasil,
                reconhecida pela inovação, qualidade e pelo impacto positivo que geramos
                na eficiência operacional dos nossos clientes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nossa Historia */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Nossa História</h2>
            <p className="text-gray-400 text-lg">
              Uma jornada de inovação e parceria
            </p>
          </div>

          <div className="space-y-8">
            {milestones.map((milestone, i) => (
              <div key={i} className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-blue-400">{milestone.year}</span>
                  </div>
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-semibold mb-2">{milestone.title}</h3>
                  <p className="text-gray-400">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nossos Valores */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Nossos Valores</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Os princípios que guiam todas as nossas decisões
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                  <value.icon className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-400 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Por que ODuoLoc */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Por que escolher o ODuoLoc?
              </h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Desenvolvemos o ODuoLoc com base na experiência real de locadoras de equipamentos.
                Cada funcionalidade foi pensada para resolver problemas do dia a dia
                e otimizar a operação do seu negócio.
              </p>
              <ul className="space-y-3">
                {differentials.map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-6xl font-bold text-white mb-4">100%</div>
                  <div className="text-xl text-gray-300 mb-2">Focado em Locadoras</div>
                  <p className="text-gray-400 text-sm">
                    Sistema desenvolvido exclusivamente para o mercado de locação de equipamentos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-2xl border border-white/10 bg-white/5">
              <Users className="h-8 w-8 text-blue-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-1">100+</div>
              <div className="text-sm text-gray-400">Clientes Ativos</div>
            </div>
            <div className="text-center p-6 rounded-2xl border border-white/10 bg-white/5">
              <Award className="h-8 w-8 text-cyan-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-1">99.9%</div>
              <div className="text-sm text-gray-400">Uptime</div>
            </div>
            <div className="text-center p-6 rounded-2xl border border-white/10 bg-white/5">
              <Clock className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-1">24/7</div>
              <div className="text-sm text-gray-400">Sistema Online</div>
            </div>
            <div className="text-center p-6 rounded-2xl border border-white/10 bg-white/5">
              <Shield className="h-8 w-8 text-amber-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-1">LGPD</div>
              <div className="text-sm text-gray-400">Compliance</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center p-12 rounded-3xl border border-white/10 bg-gradient-to-b from-blue-900/20 to-cyan-900/20">
          <h2 className="text-3xl font-bold mb-4">Pronto para conhecer o ODuoLoc?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Descubra como podemos transformar a gestão da sua locadora.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/planos">
              <Button size="lg" className="bg-white text-black hover:bg-gray-200">
                Começar Agora <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contato">
              <Button size="lg" variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white">
                Falar com Especialista
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
