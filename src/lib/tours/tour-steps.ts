import { DriveStep } from "driver.js"

/**
 * Tour principal do sistema - apresenta a interface
 */
export const systemTourSteps: DriveStep[] = [
  {
    element: '[data-tour="sidebar"]',
    popover: {
      title: "Menu Principal",
      description: "Este é seu menu de navegação. Acesse todas as funcionalidades do sistema por aqui.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="nav-dashboard"]',
    popover: {
      title: "Dashboard",
      description: "Visão geral do seu negócio: reservas ativas, faturamento, equipamentos disponíveis e alertas importantes.",
      side: "right",
      align: "center",
    },
  },
  {
    element: '[data-tour="nav-orcamentos"]',
    popover: {
      title: "Orçamentos",
      description: "Gerencie todas as suas locações. Crie orçamentos, acompanhe status e converta em contratos.",
      side: "right",
      align: "center",
    },
  },
  {
    element: '[data-tour="nav-calendario"]',
    popover: {
      title: "Calendário",
      description: "Visualize sua agenda de locações em formato de calendário. Veja disponibilidade e conflitos.",
      side: "right",
      align: "center",
    },
  },
  {
    element: '[data-tour="nav-clientes"]',
    popover: {
      title: "Clientes",
      description: "Cadastro completo de clientes PF e PJ. Busca automática por CNPJ e histórico de locações.",
      side: "right",
      align: "center",
    },
  },
  {
    element: '[data-tour="nav-comercial"]',
    popover: {
      title: "Comercial",
      description: "CRM para prospecção. Gerencie leads, acompanhe o funil de vendas e aumente suas conversões.",
      side: "right",
      align: "center",
    },
  },
  {
    element: '[data-tour="nav-equipamentos"]',
    popover: {
      title: "Equipamentos",
      description: "Seu catálogo completo. Cadastre equipamentos, gerencie unidades, controle estoque e manutenções.",
      side: "right",
      align: "center",
    },
  },
  {
    element: '[data-tour="nav-financeiro"]',
    popover: {
      title: "Financeiro",
      description: "Controle de pagamentos, cobranças e inadimplência. Acompanhe o fluxo de caixa da sua locadora.",
      side: "right",
      align: "center",
    },
  },
  {
    element: '[data-tour="nav-relatorios"]',
    popover: {
      title: "Relatórios",
      description: "Análises e métricas do seu negócio. Exporte dados e tome decisões baseadas em informações.",
      side: "right",
      align: "center",
    },
  },
  {
    element: '[data-tour="nav-configuracoes"]',
    popover: {
      title: "Configurações",
      description: "Personalize o sistema. Configure sua empresa, integrações, templates e preferências.",
      side: "right",
      align: "center",
    },
  },
  {
    element: '[data-tour="nav-ajuda"]',
    popover: {
      title: "Ajuda",
      description: "Documentação completa, tutoriais e suporte. Tire suas dúvidas a qualquer momento.",
      side: "right",
      align: "center",
    },
  },
  {
    element: '[data-tour="notifications"]',
    popover: {
      title: "Notificações",
      description: "Alertas importantes: manutenções pendentes, reservas para hoje, pagamentos atrasados e mais.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: '[data-tour="user-menu"]',
    popover: {
      title: "Seu Perfil",
      description: "Acesse suas configurações pessoais, altere sua senha e faça logout quando precisar.",
      side: "bottom",
      align: "end",
    },
  },
]

/**
 * Tour de cadastro de equipamento
 */
export const equipmentTourSteps: DriveStep[] = [
  {
    element: '[data-tour="equipment-name"]',
    popover: {
      title: "Nome do Equipamento",
      description: "Digite um nome claro e descritivo. Ex: 'Betoneira 400L', 'Andaime Fachadeiro 1,5m'",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="equipment-category"]',
    popover: {
      title: "Categoria",
      description: "Organize seus equipamentos por tipo: Construção, Jardinagem, Festa, Industrial, etc.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="equipment-tracking"]',
    popover: {
      title: "Tipo de Controle",
      description: "Serializado: cada unidade tem número único (máquinas). Quantidade: controle por total (mesas, cadeiras).",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="equipment-images"]',
    popover: {
      title: "Imagens",
      description: "Adicione fotos do equipamento. Boas imagens ajudam na apresentação para o cliente.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="equipment-periods"]',
    popover: {
      title: "Períodos de Locação",
      description: "Configure os preços por período: diária, semanal, quinzenal, mensal. Você pode ter múltiplos períodos.",
      side: "top",
      align: "start",
    },
  },
]

/**
 * Tour de cadastro de cliente
 */
export const customerTourSteps: DriveStep[] = [
  {
    element: '[data-tour="customer-type"]',
    popover: {
      title: "Tipo de Pessoa",
      description: "Selecione PJ para empresas (com CNPJ) ou PF para pessoas físicas (com CPF).",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="customer-document"]',
    popover: {
      title: "CNPJ / CPF",
      description: "Para empresas, clique na lupa após digitar o CNPJ para buscar os dados automaticamente na Receita Federal!",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="customer-contact"]',
    popover: {
      title: "Dados de Contato",
      description: "Preencha telefone, celular e WhatsApp. O WhatsApp facilita a comunicação rápida com o cliente.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="customer-address"]',
    popover: {
      title: "Endereço",
      description: "Digite o CEP e clique na lupa para preencher o endereço automaticamente. Depois complete com número e complemento.",
      side: "top",
      align: "start",
    },
  },
]

/**
 * Tour de criação de orçamento
 */
export const bookingTourSteps: DriveStep[] = [
  {
    element: '[data-tour="booking-customer"]',
    popover: {
      title: "Selecione o Cliente",
      description: "Escolha um cliente existente ou clique em '+' para cadastrar um novo cliente rapidamente.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="booking-equipment"]',
    popover: {
      title: "Selecione o Equipamento",
      description: "Escolha o equipamento que será alugado. Você pode adicionar mais equipamentos depois.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="booking-dates"]',
    popover: {
      title: "Período da Locação",
      description: "Defina as datas de início e fim. O sistema calculará o preço automaticamente baseado nos períodos configurados.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="booking-freight"]',
    popover: {
      title: "Frete",
      description: "Configure a entrega: grátis, valor fixo ou por região. Você pode cadastrar regiões de frete nas configurações.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="booking-discount"]',
    popover: {
      title: "Desconto",
      description: "Aplique descontos em porcentagem ou valor fixo. Útil para clientes recorrentes ou negociações.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="booking-total"]',
    popover: {
      title: "Valor Total",
      description: "Aqui você vê o valor calculado da locação, com frete e descontos aplicados.",
      side: "top",
      align: "start",
    },
  },
]

/**
 * Tour de configurações
 */
export const settingsTourSteps: DriveStep[] = [
  {
    element: '[data-tour="settings-logo"]',
    popover: {
      title: "Logo da Empresa",
      description: "Faça upload do logo da sua locadora. Ele aparecerá nos orçamentos, contratos e documentos.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="settings-color"]',
    popover: {
      title: "Cor Principal",
      description: "Escolha a cor que representa sua marca. Ela será usada em documentos e alguns elementos do sistema.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="settings-company"]',
    popover: {
      title: "Dados da Empresa",
      description: "Preencha nome, email, telefone e endereço. Essas informações aparecerão nos documentos gerados.",
      side: "top",
      align: "start",
    },
  },
]

// Configuração padrão do driver.js
export const defaultDriverConfig = {
  showProgress: true,
  progressText: "{{current}} de {{total}}",
  nextBtnText: "Próximo",
  prevBtnText: "Anterior",
  doneBtnText: "Finalizar",
  animate: true,
  allowClose: true,
  overlayOpacity: 0.75,
  stagePadding: 8,
  stageRadius: 10,
  disableActiveInteraction: false,
}
