"use client"

import { useEffect, useState } from "react"
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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CreditCard,
  DollarSign,
  Building2,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Package,
} from "lucide-react"
import { toast } from "sonner"

interface Subscription {
  id: string
  status: string
  billingCycle: string
  nextBillingDate: string
  createdAt: string
  tenant: {
    id: string
    name: string
    email: string
    slug: string
  }
  plan: {
    id: string
    name: string
    monthlyPrice: number
    annualPrice: number | null
  }
  _count: {
    payments: number
  }
}

const statusConfig = {
  TRIAL: { label: "Trial", color: "bg-blue-500", icon: Clock },
  ACTIVE: { label: "Ativo", color: "bg-green-500", icon: CheckCircle },
  PAST_DUE: { label: "Vencido", color: "bg-orange-500", icon: AlertCircle },
  CANCELLED: { label: "Cancelado", color: "bg-red-500", icon: XCircle },
  SUSPENDED: { label: "Suspenso", color: "bg-gray-500", icon: XCircle },
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/super-admin/subscriptions")
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data)
      } else {
        toast.error("Erro ao carregar assinaturas")
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
      toast.error("Erro ao carregar assinaturas")
    } finally {
      setLoading(false)
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

  const getMonthlyRevenue = () => {
    return subscriptions
      .filter(s => s.status === "ACTIVE" && s.billingCycle === "MONTHLY")
      .reduce((sum, s) => sum + s.plan.monthlyPrice, 0)
  }

  const getAnnualRevenue = () => {
    return subscriptions
      .filter(s => s.status === "ACTIVE" && s.billingCycle === "ANNUAL")
      .reduce((sum, s) => sum + (s.plan.annualPrice || 0), 0)
  }

  const activeCount = subscriptions.filter(s => s.status === "ACTIVE").length
  const trialCount = subscriptions.filter(s => s.status === "TRIAL").length
  const pastDueCount = subscriptions.filter(s => s.status === "PAST_DUE").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Assinaturas
        </h1>
        <p className="text-gray-400 mt-2">
          Gerencie as assinaturas dos tenants
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Assinaturas Ativas
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{activeCount}</div>
            <p className="text-xs text-gray-400">
              {trialCount} em trial, {pastDueCount} vencidas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              MRR (Receita Mensal)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(getMonthlyRevenue())}
            </div>
            <p className="text-xs text-gray-400">
              Receita recorrente mensal
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              ARR (Receita Anual)
            </CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(getMonthlyRevenue() * 12 + getAnnualRevenue())}
            </div>
            <p className="text-xs text-gray-400">
              Receita recorrente anual projetada
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Total de Tenants
            </CardTitle>
            <Building2 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {subscriptions.length}
            </div>
            <p className="text-xs text-gray-400">
              Com assinaturas cadastradas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">
            {loading ? "Carregando..." : `${subscriptions.length} assinaturas`}
          </CardTitle>
          <CardDescription className="text-gray-400">
            Lista de todas as assinaturas do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-700">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-gray-800/50">
                  <TableHead className="text-gray-300">Tenant</TableHead>
                  <TableHead className="text-gray-300">Plano</TableHead>
                  <TableHead className="text-gray-300">Ciclo</TableHead>
                  <TableHead className="text-gray-300">Valor</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Próxima Cobrança</TableHead>
                  <TableHead className="text-gray-300">Pagamentos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                    </TableCell>
                  </TableRow>
                ) : subscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                      Nenhuma assinatura encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  subscriptions.map((subscription) => {
                    const statusInfo = statusConfig[subscription.status as keyof typeof statusConfig]
                    const StatusIcon = statusInfo?.icon || AlertCircle

                    return (
                      <TableRow key={subscription.id} className="border-gray-700 hover:bg-gray-800/50">
                        <TableCell>
                          <div className="flex items-start gap-2">
                            <Building2 className="h-4 w-4 mt-1 text-gray-400" />
                            <div>
                              <div className="font-medium text-white">
                                {subscription.tenant.name}
                              </div>
                              <div className="text-sm text-gray-400">
                                {subscription.tenant.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span className="text-white">{subscription.plan.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-300">
                            {subscription.billingCycle === "MONTHLY" ? "Mensal" : "Anual"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-white">
                            {formatCurrency(
                              subscription.billingCycle === "MONTHLY"
                                ? subscription.plan.monthlyPrice
                                : subscription.plan.annualPrice || 0
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${statusInfo?.color} text-white`}
                            variant="secondary"
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo?.label || subscription.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {formatDate(subscription.nextBillingDate)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {subscription._count.payments}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
