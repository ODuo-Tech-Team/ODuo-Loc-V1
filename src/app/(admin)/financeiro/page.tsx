"use client"

import { useState, useEffect } from "react"
import { Plus, DollarSign, TrendingUp, TrendingDown, Calendar, CreditCard, AlertCircle, CheckCircle, FileText, Download, Loader2, RefreshCw } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AdminPageHeader,
  AdminStatsCard,
  AdminStatsGrid,
  AdminTabs,
  AdminTabsContent,
} from "@/components/admin"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { TransactionDialog } from "@/components/financial/TransactionDialog"
import { RecurringTransactionCard } from "@/components/financial/RecurringTransactionCard"
import { DataPagination } from "@/components/ui/data-pagination"

interface Transaction {
  id: string
  bookingId?: string
  type: "income" | "expense"
  category: string
  description: string
  amount: number
  date: string
  status: "paid" | "pending" | "overdue"
  dueDate?: string
  paymentMethod?: string
}

interface DREData {
  receitas: { label: string; value: number }[]
  despesas: { label: string; value: number }[]
}

interface FinancialStats {
  transactions: Transaction[]
  dre: DREData
  summary: {
    totalIncome: number
    totalExpense: number
    balance: number
    pendingIncome: number
    pendingExpense: number
    overdueCount: number
    totalReceitas: number
    totalDespesas: number
    lucroLiquido: number
    margemLucro: string
  }
}

interface RecurringTransaction {
  id: string
  type: "INCOME" | "EXPENSE"
  description: string
  amount: number
  categoryId: string
  category: { id: string; name: string; color: string | null }
  equipmentId: string | null
  equipment: { id: string; name: string } | null
  intervalDays: number
  startDate: string
  endDate: string | null
  nextDueDate: string
  status: "ACTIVE" | "PAUSED" | "CANCELLED" | "COMPLETED"
  _count?: { transactions: number }
}

export default function FinanceiroPage() {
  const [stats, setStats] = useState<FinancialStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [createDialog, setCreateDialog] = useState(false)
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([])

  // Estado para dialog de recebimento
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [processingPayment, setProcessingPayment] = useState(false)

  // Estado para dialog de pagamento de despesas
  const [expensePaymentDialog, setExpensePaymentDialog] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Transaction | null>(null)
  const [processingExpensePayment, setProcessingExpensePayment] = useState(false)

  // Paginação para cada aba
  const [cashflowPage, setCashflowPage] = useState(1)
  const [cashflowItemsPerPage, setCashflowItemsPerPage] = useState(10)
  const [receivablesPage, setReceivablesPage] = useState(1)
  const [receivablesItemsPerPage, setReceivablesItemsPerPage] = useState(10)
  const [payablesPage, setPayablesPage] = useState(1)
  const [payablesItemsPerPage, setPayablesItemsPerPage] = useState(10)
  const [recurringPage, setRecurringPage] = useState(1)
  const [recurringItemsPerPage, setRecurringItemsPerPage] = useState(10)

  useEffect(() => {
    fetchFinancialData()
    fetchRecurringTransactions()
  }, [])

  const fetchFinancialData = async () => {
    try {
      const response = await fetch("/api/financial/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Erro ao buscar dados financeiros:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecurringTransactions = async () => {
    try {
      const response = await fetch("/api/financial/recurring")
      if (response.ok) {
        const data = await response.json()
        setRecurringTransactions(data.recurring || [])
      }
    } catch (error) {
      console.error("Erro ao buscar recorrências:", error)
    }
  }

  const handleTransactionSuccess = () => {
    fetchFinancialData()
    fetchRecurringTransactions()
  }

  const openPaymentDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setPaymentMethod("")
    setPaymentDialog(true)
  }

  const openExpensePaymentDialog = (transaction: Transaction) => {
    setSelectedExpense(transaction)
    setExpensePaymentDialog(true)
  }

  const handlePayExpense = async () => {
    if (!selectedExpense) {
      toast.error("Transação inválida")
      return
    }

    setProcessingExpensePayment(true)
    try {
      const response = await fetch(`/api/financial/transactions/${selectedExpense.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao registrar pagamento")
      }

      toast.success(data.message || "Pagamento registrado com sucesso!")
      setExpensePaymentDialog(false)
      setSelectedExpense(null)

      // Recarregar dados
      fetchFinancialData()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao registrar pagamento"
      toast.error(errorMessage)
    } finally {
      setProcessingExpensePayment(false)
    }
  }

  const handleReceivePayment = async () => {
    if (!selectedTransaction?.bookingId) {
      toast.error("Transação inválida")
      return
    }

    setProcessingPayment(true)
    try {
      const response = await fetch(`/api/bookings/${selectedTransaction.bookingId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao registrar pagamento")
      }

      toast.success(data.message || "Pagamento registrado com sucesso!")
      setPaymentDialog(false)
      setSelectedTransaction(null)

      // Recarregar dados
      fetchFinancialData()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao registrar pagamento"
      toast.error(errorMessage)
    } finally {
      setProcessingPayment(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-600">Pago</Badge>
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>
      case "overdue":
        return <Badge variant="destructive">Vencido</Badge>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  const transactions = stats?.transactions || []

  // Filtrar transações por tipo para cada aba
  const receivableTransactions = transactions.filter(t => t.type === "income" && t.status === "pending")
  const payableTransactions = transactions.filter(t => t.type === "expense" && (t.status === "pending" || t.status === "overdue"))

  // Filtrar recorrências de despesas ativas para mostrar em Contas a Pagar
  const activeExpenseRecurring = recurringTransactions.filter(r => r.type === "EXPENSE" && r.status === "ACTIVE")

  // Paginação - Fluxo de Caixa
  const cashflowStartIndex = (cashflowPage - 1) * cashflowItemsPerPage
  const paginatedCashflow = transactions.slice(cashflowStartIndex, cashflowStartIndex + cashflowItemsPerPage)

  // Paginação - Contas a Receber
  const receivablesStartIndex = (receivablesPage - 1) * receivablesItemsPerPage
  const paginatedReceivables = receivableTransactions.slice(receivablesStartIndex, receivablesStartIndex + receivablesItemsPerPage)

  // Paginação - Contas a Pagar
  const payablesStartIndex = (payablesPage - 1) * payablesItemsPerPage
  const paginatedPayables = payableTransactions.slice(payablesStartIndex, payablesStartIndex + payablesItemsPerPage)

  // Paginação - Recorrências
  const recurringStartIndex = (recurringPage - 1) * recurringItemsPerPage
  const paginatedRecurring = recurringTransactions.slice(recurringStartIndex, recurringStartIndex + recurringItemsPerPage)

  const dre = stats?.dre || { receitas: [], despesas: [] }
  const summary = stats?.summary || {
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    pendingIncome: 0,
    pendingExpense: 0,
    overdueCount: 0,
    totalReceitas: 0,
    totalDespesas: 0,
    lucroLiquido: 0,
    margemLucro: "0",
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="ODuo Finance"
        description="Gestão Financeira Completa"
        icon={DollarSign}
        iconColor="text-pink-400"
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-auto hover:bg-zinc-800 transition-colors">
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
          <Button className="w-full sm:w-auto transition-colors" onClick={() => setCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Transação
          </Button>
        </div>
      </AdminPageHeader>

      {/* Dialog de Nova Transação */}
      <TransactionDialog
        open={createDialog}
        onOpenChange={setCreateDialog}
        onSuccess={handleTransactionSuccess}
      />

      {/* Financial Overview */}
      <AdminStatsGrid columns={4}>
        <AdminStatsCard
          label="Saldo"
          value={`R$ ${summary.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          subtitle={summary.balance >= 0 ? "Positivo" : "Negativo"}
          colorClass={summary.balance >= 0 ? "text-emerald-400" : "text-red-400"}
        />
        <AdminStatsCard
          label="Receitas"
          value={`R$ ${summary.totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          subtitle={`A receber: R$ ${summary.pendingIncome.toLocaleString("pt-BR")}`}
          colorClass="text-emerald-400"
        />
        <AdminStatsCard
          label="Despesas"
          value={`R$ ${summary.totalExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={TrendingDown}
          subtitle={`A pagar: R$ ${summary.pendingExpense.toLocaleString("pt-BR")}`}
          colorClass="text-red-400"
        />
        <AdminStatsCard
          label="Alertas"
          value={summary.overdueCount.toString()}
          icon={AlertCircle}
          subtitle={summary.overdueCount === 1 ? "Conta vencida" : "Contas vencidas"}
          colorClass="text-orange-400"
        />
      </AdminStatsGrid>

      {/* Main Content Tabs */}
      <AdminTabs
        tabs={[
          { value: "cashflow", label: "Fluxo de Caixa", shortLabel: "Fluxo", icon: Calendar },
          { value: "receivables", label: "Contas a Receber", shortLabel: "Receber", icon: TrendingUp },
          { value: "payables", label: "Contas a Pagar", shortLabel: "Pagar", icon: TrendingDown },
          { value: "recurring", label: "Recorrências", shortLabel: "Recorr.", icon: RefreshCw },
          { value: "dre", label: "DRE", icon: FileText },
        ]}
        defaultValue="cashflow"
      >

        {/* Fluxo de Caixa */}
        <AdminTabsContent value="cashflow" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg font-headline tracking-wide">Fluxo de Caixa</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Todas as movimentações financeiras</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="space-y-3">
                  {paginatedCashflow.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div
                          className={`p-2 rounded-full flex-shrink-0 ${
                            transaction.type === "income"
                              ? "bg-green-100 dark:bg-green-900"
                              : "bg-red-100 dark:bg-red-900"
                          }`}
                        >
                          {transaction.type === "income" ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <h3 className="font-medium text-sm sm:text-base truncate">{transaction.description}</h3>
                            {getStatusBadge(transaction.status)}
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-muted-foreground">
                            <span>{transaction.category}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>
                              {new Date(transaction.date).toLocaleDateString("pt-BR")}
                            </span>
                            {transaction.dueDate && transaction.status !== "paid" && (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <span className="text-[10px] sm:text-xs">
                                  Vence:{" "}
                                  {new Date(transaction.dueDate).toLocaleDateString("pt-BR")}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`text-base sm:text-lg font-bold text-right sm:text-left ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}R${" "}
                        {transaction.amount.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Paginação */}
                  <DataPagination
                    currentPage={cashflowPage}
                    totalItems={transactions.length}
                    itemsPerPage={cashflowItemsPerPage}
                    onPageChange={setCashflowPage}
                    onItemsPerPageChange={setCashflowItemsPerPage}
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma transação encontrada</p>
                  <p className="text-sm mt-2">As transações aparecerão aqui quando houver reservas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </AdminTabsContent>

        {/* Contas a Receber */}
        <AdminTabsContent value="receivables" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg font-headline tracking-wide">Contas a Receber</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Total: R$ {summary.pendingIncome.toLocaleString("pt-BR")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paginatedReceivables.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm sm:text-base mb-1 truncate">{transaction.description}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Vencimento:{" "}
                        {transaction.dueDate
                          ? new Date(transaction.dueDate).toLocaleDateString("pt-BR")
                          : "N/A"}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                      <div className="text-base sm:text-lg font-bold text-green-600">
                        R${" "}
                        {transaction.amount.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => openPaymentDialog(transaction)}
                        className="text-xs sm:text-sm"
                      >
                        <CheckCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Receber</span>
                        <span className="sm:hidden">✓</span>
                      </Button>
                    </div>
                  </div>
                ))}
                {receivableTransactions.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">
                    Nenhuma conta a receber
                  </p>
                )}

                {/* Paginação */}
                <DataPagination
                  currentPage={receivablesPage}
                  totalItems={receivableTransactions.length}
                  itemsPerPage={receivablesItemsPerPage}
                  onPageChange={setReceivablesPage}
                  onItemsPerPageChange={setReceivablesItemsPerPage}
                />
              </div>
            </CardContent>
          </Card>
        </AdminTabsContent>

        {/* Contas a Pagar */}
        <AdminTabsContent value="payables" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg font-headline tracking-wide">Contas a Pagar</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Total: R$ {summary.pendingExpense.toLocaleString("pt-BR")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paginatedPayables.map((transaction) => (
                  <div
                    key={transaction.id}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg ${
                      transaction.status === "overdue"
                        ? "border-red-300 bg-red-50 dark:bg-red-950"
                        : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                        <h3 className="font-medium text-sm sm:text-base truncate">{transaction.description}</h3>
                        {getStatusBadge(transaction.status)}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Vencimento:{" "}
                        {transaction.dueDate
                          ? new Date(transaction.dueDate).toLocaleDateString("pt-BR")
                          : "N/A"}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                      <div className="text-base sm:text-lg font-bold text-red-600">
                        R${" "}
                        {transaction.amount.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      <Button
                        size="sm"
                        variant={transaction.status === "overdue" ? "destructive" : "default"}
                        onClick={() => openExpensePaymentDialog(transaction)}
                        className="text-xs sm:text-sm"
                      >
                        <CreditCard className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Pagar</span>
                        <span className="sm:hidden">Pagar</span>
                      </Button>
                    </div>
                  </div>
                ))}
                {payableTransactions.length === 0 && activeExpenseRecurring.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">
                    Nenhuma conta a pagar
                  </p>
                )}

                {/* Paginação */}
                <DataPagination
                  currentPage={payablesPage}
                  totalItems={payableTransactions.length}
                  itemsPerPage={payablesItemsPerPage}
                  onPageChange={setPayablesPage}
                  onItemsPerPageChange={setPayablesItemsPerPage}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cobranças Recorrentes */}
          {activeExpenseRecurring.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg font-headline tracking-wide flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
                  Cobranças Recorrentes
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Despesas que se repetem periodicamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeExpenseRecurring.map((recurring) => (
                    <RecurringTransactionCard
                      key={recurring.id}
                      recurring={recurring}
                      onUpdate={() => {
                        fetchFinancialData()
                        fetchRecurringTransactions()
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </AdminTabsContent>

        {/* Recorrências */}
        <AdminTabsContent value="recurring" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg font-headline tracking-wide">Transações Recorrentes</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Gerencie suas despesas e receitas que se repetem periodicamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recurringTransactions.length > 0 ? (
                <div className="space-y-3">
                  {paginatedRecurring.map((recurring) => (
                    <RecurringTransactionCard
                      key={recurring.id}
                      recurring={recurring}
                      onUpdate={() => {
                        fetchFinancialData()
                        fetchRecurringTransactions()
                      }}
                    />
                  ))}

                  {/* Paginação */}
                  <DataPagination
                    currentPage={recurringPage}
                    totalItems={recurringTransactions.length}
                    itemsPerPage={recurringItemsPerPage}
                    onPageChange={setRecurringPage}
                    onItemsPerPageChange={setRecurringItemsPerPage}
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma transação recorrente</p>
                  <p className="text-sm mt-2">
                    Crie uma transação recorrente clicando em &quot;Nova Transação&quot; e ativando a opção de recorrência
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setCreateDialog(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Transação Recorrente
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </AdminTabsContent>

        {/* DRE */}
        <AdminTabsContent value="dre" className="space-y-4 mt-6">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-xs sm:text-sm font-medium">Receitas Totais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  R$ {summary.totalReceitas.toLocaleString("pt-BR")}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xs sm:text-sm font-medium">Despesas Totais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-red-600">
                  R$ {summary.totalDespesas.toLocaleString("pt-BR")}
                </div>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-xs sm:text-sm font-medium">Lucro Líquido</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-xl sm:text-2xl font-bold ${
                    summary.lucroLiquido >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  R$ {summary.lucroLiquido.toLocaleString("pt-BR")}
                </div>
                <p className="text-xs text-muted-foreground">
                  Margem: {summary.margemLucro}%
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg font-headline tracking-wide">Receitas</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Detalhamento das receitas</CardDescription>
              </CardHeader>
              <CardContent>
                {dre.receitas.length > 0 ? (
                  <div className="space-y-4">
                    {dre.receitas.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs sm:text-sm">
                          <span className="font-medium sm:font-normal">{item.label}</span>
                          <span className="font-medium text-green-600">
                            R$ {item.value.toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-600"
                            style={{
                              width: `${summary.totalReceitas > 0 ? (item.value / summary.totalReceitas) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-muted-foreground">Nenhuma receita registrada</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg font-headline tracking-wide">Despesas</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Detalhamento das despesas</CardDescription>
              </CardHeader>
              <CardContent>
                {dre.despesas.length > 0 ? (
                  <div className="space-y-4">
                    {dre.despesas.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs sm:text-sm">
                          <span className="font-medium sm:font-normal">{item.label}</span>
                          <span className="font-medium text-red-600">
                            R$ {item.value.toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-600"
                            style={{
                              width: `${summary.totalDespesas > 0 ? (item.value / summary.totalDespesas) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-muted-foreground">Nenhuma despesa registrada</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-primary/10 dark:bg-primary/20 border-primary/30 dark:border-primary/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                Análise de Saúde Financeira
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs sm:text-sm space-y-2 text-foreground">
              <p>
                ✓ Sua empresa está com fluxo de caixa {summary.balance >= 0 ? "positivo" : "negativo"}
              </p>
              <p>
                ✓ Margem de lucro de {summary.margemLucro}%{" "}
                {parseFloat(summary.margemLucro) > 15 ? "(saudável)" : "(atenção necessária)"}
              </p>
              <p>
                {summary.overdueCount > 0
                  ? `⚠ Atenção: ${summary.overdueCount} conta(s) vencida(s)`
                  : "✓ Nenhuma conta vencida"}
              </p>
              <p className="break-words">
                ✓ Previsão de caixa para próximo mês: R${" "}
                {(summary.balance + summary.pendingIncome - summary.pendingExpense).toLocaleString("pt-BR")}
              </p>
            </CardContent>
          </Card>
        </AdminTabsContent>
      </AdminTabs>

      {/* Dialog de Recebimento de Pagamento */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Confirme o recebimento do pagamento
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4 py-4">
              {/* Informações da transação */}
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="font-medium">{selectedTransaction.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valor:</span>
                  <span className="text-lg font-bold text-green-600">
                    R$ {selectedTransaction.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {selectedTransaction.dueDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Vencimento:</span>
                    <span className="text-sm">
                      {new Date(selectedTransaction.dueDate).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                )}
              </div>

              {/* Método de pagamento */}
              <div className="space-y-2">
                <Label>Método de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                    <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                    <SelectItem value="Transferência">Transferência Bancária</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setPaymentDialog(false)}
              disabled={processingPayment}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReceivePayment}
              disabled={processingPayment}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingPayment ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Recebimento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Pagamento de Despesa */}
      <Dialog open={expensePaymentDialog} onOpenChange={setExpensePaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
            <DialogDescription>
              Confirme o pagamento desta despesa
            </DialogDescription>
          </DialogHeader>

          {selectedExpense && (
            <div className="space-y-4 py-4">
              {/* Informações da transação */}
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="font-medium">{selectedExpense.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valor:</span>
                  <span className="text-lg font-bold text-red-600">
                    R$ {selectedExpense.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {selectedExpense.dueDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Vencimento:</span>
                    <span className="text-sm">
                      {new Date(selectedExpense.dueDate).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Categoria:</span>
                  <span className="text-sm">{selectedExpense.category}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Ao confirmar, esta despesa será marcada como paga e não aparecerá mais nas contas a pagar.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setExpensePaymentDialog(false)}
              disabled={processingExpensePayment}
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePayExpense}
              disabled={processingExpensePayment}
              className="bg-red-600 hover:bg-red-700"
            >
              {processingExpensePayment ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Confirmar Pagamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
