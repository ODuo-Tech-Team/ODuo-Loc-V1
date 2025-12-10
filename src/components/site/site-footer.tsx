import Link from "next/link"
import { Mail, Phone, MapPin } from "lucide-react"

const footerNavigation = {
  produto: [
    { name: "Funcionalidades", href: "/funcionalidades" },
    { name: "Precos", href: "/planos" },
    { name: "Equipamentos", href: "/funcionalidades/equipamentos" },
    { name: "Reservas", href: "/funcionalidades/reservas" },
    { name: "Financeiro", href: "/funcionalidades/financeiro" },
    { name: "Relatorios", href: "/funcionalidades/relatorios" },
  ],
  recursos: [
    { name: "Blog", href: "/blog" },
    { name: "Central de Ajuda", href: "/ajuda" },
    { name: "API Docs", href: "/api-docs" },
    { name: "Status", href: "https://status.oduoloc.com.br", external: true },
  ],
  empresa: [
    { name: "Sobre Nos", href: "/sobre" },
    { name: "Contato", href: "/contato" },
    { name: "Carreiras", href: "/carreiras" },
  ],
  legal: [
    { name: "Termos de Uso", href: "/termos" },
    { name: "Privacidade", href: "/privacidade" },
    { name: "Cookies", href: "/cookies" },
  ],
}

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Logo e descricao */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center mb-4">
              <img src="/logo.svg" alt="ODuoLoc" className="h-16 w-auto" />
            </Link>
            <p className="text-sm text-gray-400 mb-6 max-w-xs">
              A plataforma mais completa para gestao de locadoras de equipamentos. Simplifique sua operacao e escale seu negocio.
            </p>
            <div className="space-y-2">
              <a
                href="mailto:contato@oduoloc.com.br"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <Mail className="h-4 w-4" />
                contato@oduoloc.com.br
              </a>
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <Phone className="h-4 w-4" />
                (11) 99999-9999
              </a>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="h-4 w-4" />
                Sao Paulo, Brasil
              </div>
            </div>
          </div>

          {/* Produto */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Produto</h3>
            <ul className="space-y-3">
              {footerNavigation.produto.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Recursos</h3>
            <ul className="space-y-3">
              {footerNavigation.recursos.map((item) => (
                <li key={item.name}>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {item.name}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Empresa</h3>
            <ul className="space-y-3">
              {footerNavigation.empresa.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerNavigation.legal.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} ODuo Assessoria. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-600">
              CNPJ: 00.000.000/0001-00
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
