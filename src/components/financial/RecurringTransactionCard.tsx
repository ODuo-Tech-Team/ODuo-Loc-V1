"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  Check,
  Calendar,
  Loader2,
  CreditCard,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  color: string | null
}

interface Equipment {
  id: string
  name: string
}

interface RecurringTransaction {
  id: string
  type: "INCOME" | "EXPENSE"
  description: string
  amount: number
  categoryId: string
  category: Category
  equipmentId: string | null
  equipment: Equipment | null
  intervalDays: number
  startDate: string
  endDate: string | null
  nextDueDate: string
  status: "ACTIVE" | "PAUSED" | "CANCELLED" | "COMPLETED"
  _count?: {
    transactions: number
  }
}

interface RecurringTransactionCardProps {
  recurring: RecurringTransaction
  onUpdate?: () => void
}

export function RecurringTransactionCard({
  recurring,
  onUpdate,
}: RecurringTransactionCardProps) {
  const [loading, setLoading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<"pause" | "resume" | "cancel" | "confirm" | "pay" | null>(null)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const getIntervalLabel = (days: number) => {
    switch (days) {
      case 7:
        return "Semanal"
      case 14:
        return "Quinzenal"
      case 30:
        return "Mensal"
      case 60:
        return "Bimestral"
      case 90:
        return "Trimestral"
      case 180:
        return "Semestral"
      case 365:
        return "Anual"
      default:
        return `A cada ${days} dias`
    }
  }

  const getStatusBadge = () => {
    switch (recurring.status) {
      case "ACTIVE":
        return <Badge className="bg-emerald-500/20 text-emerald-500">Ativa</Badge>
      case "PAUSED":
        return <Badge className="bg-amber-500/20 text-amber-500">Pausada</Badge>
      case "CANCELLED":
        return <Badge className="bg-red-500/20 text-red-500">Cancelada</Badge>
      case "COMPLETED":
        return <Badge className="bg-blue-500/20 text-blue-500">Finalizada</Badge>
    }
  }

  const handleAction = async (action: "pause" | "resume" | "cancel" | "confirm" | "pay") => {
    setLoading(true)
    try {
      let endpoint: string
      let method: string = "POST"

      if (action === "cancel") {
        endpoint = `/api/financial/recurring/${recurring.id}`
        method = "DELETE"
      } else if (action === "pay") {
        endpoint = `/api/financial/recurring/${recurring.id}/pay`
      } else {
        endpoint = `/api/financial/recurring/${recurring.id}/${action}`
      }

      const response = await fetch(endpoint, { method })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro na operação")
      }

      const messages = {
        pause: "Recorrência pausada com sucesso",
        resume: "Recorrência retomada com sucesso",
        cancel: "Recorrência cancelada com sucesso",
        confirm: "Transação confirmada com sucesso",
        pay: "Pagamento registrado com sucesso",
      }

      toast.success(messages[action])
      onUpdate?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro na operação")
    } finally {
      setLoading(false)
      setConfirmDialog(null)
    }
  }

  const isActive = recurring.status === "ACTIVE"
  const isPaused = recurring.status === "PAUSED"
  const isExpense = recurring.type === "EXPENSE"

  return (
    <>
      <Card className={cn(
        "transition-all hover:shadow-md",
        isPaused && "opacity-60",
        recurring.status === "CANCELLED" && "opacity-40"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Ícone e Info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                  isExpense ? "bg-red-500/20" : "bg-emerald-500/20"
                )}
              >
                {isExpense ? (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium truncate">{recurring.description}</p>
                  {getStatusBadge()}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  {recurring.category && (
                    <span className="flex items-center gap-1">
                      {recurring.category.color && (
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: recurring.category.color }}
                        />
                      )}
                      {recurring.category.name}
                    </span>
                  )}

                  <span className="flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" />
                    {getIntervalLabel(recurring.intervalDays)}
                  </span>

                  {recurring.equipment && (
                    <span className="text-xs">
                      • {recurring.equipment.name}
                    </span>
                  )}
                </div>

                {isActive && (
                  <div className="flex items-center gap-1 mt-2 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>
                      Próximo vencimento:{" "}
                      <strong>
                        {format(new Date(recurring.nextDueDate), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Valor e Ações */}
            <div className="flex items-start gap-2">
              <div className="text-right">
                <p
                  className={cn(
                    "font-semibold text-lg",
                    isExpense ? "text-red-500" : "text-emerald-500"
                  )}
                >
                  {isExpense ? "-" : "+"}
                  {formatCurrency(recurring.amount)}
                </p>
                {recurring._count && (
                  <p className="text-xs text-muted-foreground">
                    {recurring._count.transactions} transação(ões)
                  </p>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isActive && (
                    <>
                      {isExpense && (
                        <DropdownMenuItem
                          onClick={() => setConfirmDialog("pay")}
                          disabled={loading}
                          className="text-emerald-600 focus:text-emerald-600"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Marcar como Paga
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => setConfirmDialog("confirm")}
                        disabled={loading}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Confirmar Próxima
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setConfirmDialog("pause")}
                        disabled={loading}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pausar
                      </DropdownMenuItem>
                    </>
                  )}

                  {isPaused && (
                    <DropdownMenuItem
                      onClick={() => setConfirmDialog("resume")}
                      disabled={loading}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Retomar
                    </DropdownMenuItem>
                  )}

                  {(isActive || isPaused) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setConfirmDialog("cancel")}
                        disabled={loading}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Cancelar Recorrência
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Confirmação */}
      <AlertDialog
        open={confirmDialog !== null}
        onOpenChange={() => setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog === "pause" && "Pausar Recorrência"}
              {confirmDialog === "resume" && "Retomar Recorrência"}
              {confirmDialog === "cancel" && "Cancelar Recorrência"}
              {confirmDialog === "confirm" && "Confirmar Transação"}
              {confirmDialog === "pay" && "Marcar como Paga"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog === "pause" &&
                "A recorrência será pausada e novas transações não serão criadas até que seja retomada."}
              {confirmDialog === "resume" &&
                "A recorrência será retomada e continuará gerando transações no intervalo configurado."}
              {confirmDialog === "cancel" &&
                "A recorrência será cancelada permanentemente. As transações já criadas não serão afetadas."}
              {confirmDialog === "confirm" &&
                `Criar a transação de ${formatCurrency(recurring.amount)} com vencimento em ${format(
                  new Date(recurring.nextDueDate),
                  "dd/MM/yyyy"
                )}?`}
              {confirmDialog === "pay" &&
                `Registrar o pagamento de ${formatCurrency(recurring.amount)} com vencimento em ${format(
                  new Date(recurring.nextDueDate),
                  "dd/MM/yyyy"
                )}? A transação será criada já como paga.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDialog && handleAction(confirmDialog)}
              disabled={loading}
              className={cn(
                confirmDialog === "cancel" && "bg-red-600 hover:bg-red-700",
                confirmDialog === "pay" && "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirmar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
