"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  ArrowLeft,
  Building2,
  Users,
  Package,
  Calendar,
  DollarSign,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Edit,
  Save,
  X,
  ExternalLink,
  Settings,
  FileText,
  Warehouse,
  BarChart3,
  Code,
  Webhook,
  LucideIcon,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CreditCard, Check } from "lucide-react"

interface Plan {
  id: string
  name: string
  slug: string
  description: string | null
  monthlyPrice: number
  annualPrice: number | null
  maxUsers: number
  maxEquipments: number
  maxBookingsPerMonth: number
  active: boolean
  _count?: {
    subscriptions: number
  }
}

interface Subscription {
  id: string
  planId: string
  status: string
  startDate: string
  trialEndsAt: string | null
  currentPeriodStart: string
  currentPeriodEnd: string
  billingCycle: string
  nextBillingDate: string
  plan: Plan
}

interface TenantDetails {
  id: string
  name: string
  slug: string
  email: string
  phone: string
  address: string | null
  active: boolean
  createdAt: string
  updatedAt: string
  users: Array<{
    id: string
    name: string
    email: string
    role: string
    createdAt: string
  }>
  equipments: Array<{
    id: string
    name: string
    category: string
    pricePerDay: number
    status: string
  }>
  bookings: Array<{
    id: string
    bookingNumber: string
    status: string
    totalPrice: number
    startDate: string
    endDate: string
    customer: {
      name: string
    }
  }>
  _count: {
    users: number
    equipments: number
    bookings: number
    customers: number
  }
  totalRevenue: number
}

interface ModuleInfo {
  key: string
  name: string
  description: string
  icon: string
  category: string
  requiresConfig: boolean
  enabled: boolean
}

interface ModulesData {
  tenantId: string
  tenantName: string
  modules: ModuleInfo[]
}

// Mapa de ícones para os módulos
const moduleIcons: Record<string, LucideIcon> = {
  FileText: FileText,
  Warehouse: Warehouse,
  DollarSign: DollarSign,
  BarChart3: BarChart3,
  Code: Code,
  Webhook: Webhook,
  Users: Users,
  Globe: Globe,
}

// Cores por categoria
const categoryColors: Record<string, string> = {
  fiscal: "text-green-400 border-green-400/30 bg-green-400/10",
  operacional: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  financeiro: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  analytics: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  integracao: "text-purple-400 border-purple-400/30 bg-purple-400/10",
  usuarios: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  avancado: "text-red-400 border-red-400/30 bg-red-400/10",
}

const categoryLabels: Record<string, string> = {
  fiscal: "Fiscal",
  operacional: "Operacional",
  financeiro: "Financeiro",
  analytics: "Analytics",
  integracao: "Integração",
  usuarios: "Usuários",
  avancado: "Avançado",
}

export default function TenantDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [tenant, setTenant] = useState<TenantDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })

  // Estado para módulos
  const [modulesData, setModulesData] = useState<ModulesData | null>(null)
  const [loadingModules, setLoadingModules] = useState(false)
  const [togglingModule, setTogglingModule] = useState<string | null>(null)

  // Estado para assinatura
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingSubscription, setLoadingSubscription] = useState(false)
  const [changingPlan, setChangingPlan] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string>("")
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<string>("MONTHLY")
  const [showPlanDialog, setShowPlanDialog] = useState(false)

  useEffect(() => {
    fetchTenant()
    fetchModules()
    fetchSubscription()
    fetchPlans()
  }, [resolvedParams.id])

  const fetchTenant = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/super-admin/tenants/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setTenant(data)
        setEditData({
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address || "",
        })
      } else {
        toast.error("Tenant não encontrado")
        router.push("/super-admin/tenants")
      }
    } catch (error) {
      console.error("Erro ao buscar tenant:", error)
      toast.error("Erro ao carregar tenant")
    } finally {
      setLoading(false)
    }
  }

  const fetchModules = async () => {
    try {
      setLoadingModules(true)
      const response = await fetch(`/api/super-admin/tenants/${resolvedParams.id}/modules`)
      if (response.ok) {
        const data = await response.json()
        setModulesData(data)
      }
    } catch (error) {
      console.error("Erro ao buscar módulos:", error)
    } finally {
      setLoadingModules(false)
    }
  }

  const fetchSubscription = async () => {
    try {
      setLoadingSubscription(true)
      const response = await fetch(`/api/super-admin/tenants/${resolvedParams.id}/subscription`)
      if (response.ok) {
        const data = await response.json()
        setSubscription(data)
        if (data) {
          setSelectedPlanId(data.planId)
          setSelectedBillingCycle(data.billingCycle)
        }
      }
    } catch (error) {
      console.error("Erro ao buscar assinatura:", error)
    } finally {
      setLoadingSubscription(false)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/super-admin/plans")
      if (response.ok) {
        const data = await response.json()
        setPlans(data)
      }
    } catch (error) {
      console.error("Erro ao buscar planos:", error)
    }
  }

  const handleChangePlan = async () => {
    if (!selectedPlanId) {
      toast.error("Selecione um plano")
      return
    }

    setChangingPlan(true)
    try {
      // Use POST para criar nova subscription, PUT para alterar existente
      const method = subscription ? "PUT" : "POST"
      const response = await fetch(`/api/super-admin/tenants/${resolvedParams.id}/subscription`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlanId,
          billingCycle: selectedBillingCycle,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao processar solicitação")
      }

      toast.success(subscription ? "Plano alterado com sucesso!" : "Assinatura criada com sucesso!")
      setShowPlanDialog(false)
      fetchSubscription()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao processar solicitação")
    } finally {
      setChangingPlan(false)
    }
  }

  const handleToggleModule = async (moduleKey: string, enabled: boolean) => {
    setTogglingModule(moduleKey)
    try {
      const response = await fetch(`/api/super-admin/tenants/${resolvedParams.id}/modules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [moduleKey]: enabled }),
      })

      if (response.ok) {
        toast.success(enabled ? "Módulo ativado!" : "Módulo desativado!")
        fetchModules()
      } else {
        toast.error("Erro ao atualizar módulo")
      }
    } catch (error) {
      console.error("Erro ao atualizar módulo:", error)
      toast.error("Erro ao atualizar módulo")
    } finally {
      setTogglingModule(null)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/super-admin/tenants/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      })

      if (!response.ok) throw new Error("Erro ao salvar")

      toast.success("Tenant atualizado com sucesso!")
      setEditing(false)
      fetchTenant()
    } catch (error) {
      toast.error("Erro ao salvar alterações")
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!tenant) return

    try {
      const response = await fetch(`/api/super-admin/tenants/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !tenant.active }),
      })

      if (!response.ok) throw new Error("Erro ao atualizar")

      toast.success(tenant.active ? "Tenant desativado" : "Tenant ativado")
      fetchTenant()
    } catch (error) {
      toast.error("Erro ao atualizar status")
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR")
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "text-amber-400 border-amber-400/30 bg-amber-400/10",
      CONFIRMED: "text-blue-400 border-blue-400/30 bg-blue-400/10",
      COMPLETED: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
      CANCELLED: "text-red-400 border-red-400/30 bg-red-400/10",
    }
    return colors[status] || "text-gray-400 border-gray-400/30 bg-gray-400/10"
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "Pendente",
      CONFIRMED: "Confirmada",
      COMPLETED: "Concluída",
      CANCELLED: "Cancelada",
    }
    return labels[status] || status
  }

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    MANAGER: "Gerente",
    OPERATOR: "Operador",
    VIEWER: "Visualizador",
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    )
  }

  if (!tenant) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <Link href="/super-admin/tenants">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{tenant.name}</h1>
              <Badge
                variant="outline"
                className={
                  tenant.active
                    ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                    : "text-red-400 border-red-400/30 bg-red-400/10"
                }
              >
                {tenant.active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <p className="text-gray-400 mt-1 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {tenant.slug}.oduoloc.com.br
              <a
                href={`https://${tenant.slug}.oduoloc.com.br`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleToggleStatus}
            className={tenant.active ? "text-red-400 hover:text-red-300" : "text-emerald-400 hover:text-emerald-300"}
          >
            {tenant.active ? "Desativar" : "Ativar"}
          </Button>
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Usuários</p>
                <p className="text-2xl font-bold text-white">{tenant._count.users}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Package className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Equipamentos</p>
                <p className="text-2xl font-bold text-white">{tenant._count.equipments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Reservas</p>
                <p className="text-2xl font-bold text-white">{tenant._count.bookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Receita Total</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(tenant.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="subscription">
            <CreditCard className="h-4 w-4 mr-1" />
            Assinatura
          </TabsTrigger>
          <TabsTrigger value="modules">
            <Settings className="h-4 w-4 mr-1" />
            Módulos
          </TabsTrigger>
          <TabsTrigger value="users">Usuários ({tenant._count.users})</TabsTrigger>
          <TabsTrigger value="equipments">Equipamentos ({tenant._count.equipments})</TabsTrigger>
          <TabsTrigger value="bookings">Reservas ({tenant._count.bookings})</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Informações do Tenant</CardTitle>
              <CardDescription>Dados cadastrais da locadora</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {editing ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Endereço</Label>
                    <Input
                      value={editData.address}
                      onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Nome</p>
                      <p className="text-white">{tenant.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="text-white">{tenant.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Telefone</p>
                      <p className="text-white">{tenant.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Endereço</p>
                      <p className="text-white">{tenant.address || "Não informado"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Slug</p>
                      <p className="text-white">{tenant.slug}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Criado em</p>
                      <p className="text-white">{formatDate(tenant.createdAt)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Assinatura e Plano
              </CardTitle>
              <CardDescription>
                Gerencie o plano e assinatura deste tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSubscription ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : subscription ? (
                <div className="space-y-6">
                  {/* Current Plan Info */}
                  <div className="p-6 rounded-lg border border-white/10 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-white">{subscription.plan.name}</h3>
                          <Badge
                            variant="outline"
                            className={
                              subscription.status === "ACTIVE"
                                ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                                : subscription.status === "TRIALING"
                                ? "text-blue-400 border-blue-400/30 bg-blue-400/10"
                                : "text-red-400 border-red-400/30 bg-red-400/10"
                            }
                          >
                            {subscription.status === "ACTIVE"
                              ? "Ativo"
                              : subscription.status === "TRIALING"
                              ? "Período de Teste"
                              : subscription.status === "CANCELLED"
                              ? "Cancelado"
                              : subscription.status}
                          </Badge>
                        </div>
                        {subscription.plan.description && (
                          <p className="text-gray-400 mb-4">{subscription.plan.description}</p>
                        )}

                        {/* Plan Features/Limits */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-emerald-400" />
                            <span className="text-sm text-gray-300">
                              {subscription.plan.maxUsers} usuários
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-emerald-400" />
                            <span className="text-sm text-gray-300">
                              {subscription.plan.maxEquipments} equipamentos
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-emerald-400" />
                            <span className="text-sm text-gray-300">
                              {subscription.plan.maxBookingsPerMonth} reservas/mês
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-emerald-400" />
                            <span className="text-sm text-gray-300">
                              {formatCurrency(
                                subscription.billingCycle === "MONTHLY"
                                  ? subscription.plan.monthlyPrice
                                  : subscription.plan.annualPrice || subscription.plan.monthlyPrice
                              )}
                              /{subscription.billingCycle === "MONTHLY" ? "mês" : "ano"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button onClick={() => setShowPlanDialog(true)}>Alterar Plano</Button>
                    </div>
                  </div>

                  {/* Billing Information */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="bg-white/5 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white text-sm">Ciclo de Cobrança</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-400 text-sm">Tipo</p>
                        <p className="text-white font-medium">
                          {subscription.billingCycle === "MONTHLY" ? "Mensal" : "Anual"}
                        </p>
                        <p className="text-gray-400 text-sm mt-3">Próxima cobrança</p>
                        <p className="text-white font-medium">{formatDate(subscription.nextBillingDate)}</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/5 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white text-sm">Período Atual</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-400 text-sm">Início</p>
                        <p className="text-white font-medium">{formatDate(subscription.currentPeriodStart)}</p>
                        <p className="text-gray-400 text-sm mt-3">Fim</p>
                        <p className="text-white font-medium">{formatDate(subscription.currentPeriodEnd)}</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/5 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white text-sm">Data de Início</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-white font-medium">{formatDate(subscription.startDate)}</p>
                        {subscription.trialEndsAt && (
                          <>
                            <p className="text-gray-400 text-sm mt-3">Teste termina em</p>
                            <p className="text-blue-400 font-medium">{formatDate(subscription.trialEndsAt)}</p>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-white/5 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white text-sm">Valor do Plano</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-emerald-400 text-2xl font-bold">
                          {formatCurrency(
                            subscription.billingCycle === "MONTHLY"
                              ? subscription.plan.monthlyPrice
                              : subscription.plan.annualPrice || subscription.plan.monthlyPrice
                          )}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          por {subscription.billingCycle === "MONTHLY" ? "mês" : "ano"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">Este tenant não possui assinatura ativa</p>
                  <Button onClick={() => setShowPlanDialog(true)}>
                    Criar Assinatura
                  </Button>
                </div>
              )}

              {/* Dialog de seleção de plano - disponível tanto para criar quanto alterar */}
              <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
                <DialogContent className="bg-gray-900 border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-white">
                      {subscription ? "Alterar Plano de Assinatura" : "Criar Assinatura"}
                    </DialogTitle>
                    <DialogDescription>
                      Selecione um novo plano e ciclo de cobrança
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label className="text-white">Plano</Label>
                      <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue placeholder="Selecione um plano" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/10">
                          {plans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.name} - {formatCurrency(plan.monthlyPrice)}/mês
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Ciclo de Cobrança</Label>
                      <Select value={selectedBillingCycle} onValueChange={setSelectedBillingCycle}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/10">
                          <SelectItem value="MONTHLY">Mensal</SelectItem>
                          <SelectItem value="ANNUAL">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedPlanId && (
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-sm text-gray-400 mb-2">Resumo da alteração:</p>
                        {(() => {
                          const newPlan = plans.find((p) => p.id === selectedPlanId)
                          if (!newPlan) return null
                          return (
                            <>
                              <p className="text-white font-medium">{newPlan.name}</p>
                              <p className="text-sm text-gray-300 mt-1">
                                {formatCurrency(
                                  selectedBillingCycle === "MONTHLY"
                                    ? newPlan.monthlyPrice
                                    : newPlan.annualPrice || newPlan.monthlyPrice
                                )}
                                /{selectedBillingCycle === "MONTHLY" ? "mês" : "ano"}
                              </p>
                              <div className="mt-3 space-y-1">
                                <p className="text-xs text-gray-400">
                                  • {newPlan.maxUsers} usuários
                                </p>
                                <p className="text-xs text-gray-400">
                                  • {newPlan.maxEquipments} equipamentos
                                </p>
                                <p className="text-xs text-gray-400">
                                  • {newPlan.maxBookingsPerMonth} reservas/mês
                                </p>
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowPlanDialog(false)}
                      disabled={changingPlan}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleChangePlan} disabled={changingPlan}>
                      {changingPlan ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Confirmar {subscription ? "Alteração" : "Criação"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Módulos do Sistema
              </CardTitle>
              <CardDescription>
                Ative ou desative funcionalidades para este tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingModules ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : modulesData ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {modulesData.modules.map((module) => {
                    const IconComponent = moduleIcons[module.icon] || Settings
                    return (
                      <div
                        key={module.key}
                        className={`p-4 rounded-lg border transition-all ${
                          module.enabled
                            ? "bg-white/5 border-white/20"
                            : "bg-white/[0.02] border-white/5 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                                module.enabled ? "bg-white/10" : "bg-white/5"
                              }`}
                            >
                              <IconComponent
                                className={`h-5 w-5 ${
                                  module.enabled ? "text-white" : "text-gray-500"
                                }`}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4
                                  className={`font-medium ${
                                    module.enabled ? "text-white" : "text-gray-400"
                                  }`}
                                >
                                  {module.name}
                                </h4>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${categoryColors[module.category]}`}
                                >
                                  {categoryLabels[module.category]}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-400 mt-1">
                                {module.description}
                              </p>
                              {module.requiresConfig && module.enabled && (
                                <p className="text-xs text-amber-400 mt-2">
                                  Requer configuração adicional
                                </p>
                              )}
                            </div>
                          </div>
                          <Switch
                            checked={module.enabled}
                            onCheckedChange={(checked) =>
                              handleToggleModule(module.key, checked)
                            }
                            disabled={togglingModule === module.key}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-400">
                  Erro ao carregar módulos
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Usuários</CardTitle>
              <CardDescription>Usuários cadastrados neste tenant</CardDescription>
            </CardHeader>
            <CardContent>
              {tenant.users.length === 0 ? (
                <p className="text-center py-8 text-gray-400">Nenhum usuário cadastrado</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-gray-400">Nome</TableHead>
                      <TableHead className="text-gray-400">Email</TableHead>
                      <TableHead className="text-gray-400">Role</TableHead>
                      <TableHead className="text-gray-400 text-right">Criado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenant.users.map((user) => (
                      <TableRow key={user.id} className="border-white/5">
                        <TableCell className="text-white font-medium">{user.name}</TableCell>
                        <TableCell className="text-gray-400">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-purple-400 border-purple-400/30 bg-purple-400/10">
                            {roleLabels[user.role] || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-gray-400">{formatDate(user.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipments Tab */}
        <TabsContent value="equipments">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Equipamentos</CardTitle>
              <CardDescription>Equipamentos cadastrados neste tenant</CardDescription>
            </CardHeader>
            <CardContent>
              {tenant.equipments.length === 0 ? (
                <p className="text-center py-8 text-gray-400">Nenhum equipamento cadastrado</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-gray-400">Nome</TableHead>
                      <TableHead className="text-gray-400">Categoria</TableHead>
                      <TableHead className="text-gray-400 text-right">Diária</TableHead>
                      <TableHead className="text-gray-400 text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenant.equipments.slice(0, 10).map((equipment) => (
                      <TableRow key={equipment.id} className="border-white/5">
                        <TableCell className="text-white font-medium">{equipment.name}</TableCell>
                        <TableCell className="text-gray-400">{equipment.category}</TableCell>
                        <TableCell className="text-right text-emerald-400">{formatCurrency(equipment.pricePerDay)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={getStatusColor(equipment.status)}>
                            {equipment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Reservas</CardTitle>
              <CardDescription>Últimas reservas deste tenant</CardDescription>
            </CardHeader>
            <CardContent>
              {tenant.bookings.length === 0 ? (
                <p className="text-center py-8 text-gray-400">Nenhuma reserva encontrada</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-gray-400">Número</TableHead>
                      <TableHead className="text-gray-400">Cliente</TableHead>
                      <TableHead className="text-gray-400">Período</TableHead>
                      <TableHead className="text-gray-400 text-right">Valor</TableHead>
                      <TableHead className="text-gray-400 text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenant.bookings.slice(0, 10).map((booking) => (
                      <TableRow key={booking.id} className="border-white/5">
                        <TableCell className="text-white font-medium">#{booking.bookingNumber}</TableCell>
                        <TableCell className="text-gray-400">{booking.customer.name}</TableCell>
                        <TableCell className="text-gray-400">
                          {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                        </TableCell>
                        <TableCell className="text-right text-emerald-400">{formatCurrency(booking.totalPrice)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={getStatusColor(booking.status)}>
                            {getStatusLabel(booking.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
