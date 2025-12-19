"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InvoiceStatusBadge } from "@/components/fiscal/InvoiceStatusBadge"
import { ProductInvoiceList } from "@/components/fiscal/ProductInvoiceList"
import {
  FileText,
  MoreHorizontal,
  Download,
  XCircle,
  RefreshCw,
  Mail,
  ExternalLink,
  Search,
  Settings,
  AlertCircle,
  Receipt,
  Package,
} from "lucide-react"
import { toast } from "sonner"
import { DataPagination } from "@/components/ui/data-pagination"

interface Invoice {
  id: string
  internalRef: string
  numero: string | null
  serie: string | null
  codigoVerificacao: string | null
  status: string
  valorTotal: number
  tomadorNome: string
  tomadorCpfCnpj: string | null
  xmlUrl: string | null
  pdfUrl: string | null
  emittedAt: string | null
  createdAt: string
  booking: {
    id: string
    bookingNumber: string
    startDate: string
    endDate: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface FiscalConfig {
  nfseEnabled: boolean
  nfeEnabled: boolean
}

export default function NotasFiscaisPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [fiscalConfig, setFiscalConfig] = useState<FiscalConfig | null>(null)
  const [activeTab, setActiveTab] = useState<string>("nfse")

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Dialogs
  const [cancelInvoiceId, setCancelInvoiceId] = useState<string | null>(null)
  const [cancelJustificativa, setCancelJustificativa] = useState("")
  const [syncingId, setSyncingId] = useState<string | null>(null)

  // Verificar configuração fiscal
  useEffect(() => {
    async function checkFiscalConfig() {
      try {
        const response = await fetch("/api/fiscal/config")
        if (response.ok) {
          const data = await response.json()
          setFiscalConfig({
            nfseEnabled: data.nfseEnabled || false,
            nfeEnabled: data.nfeEnabled || false,
          })
          // Se NFS-e não está habilitada mas NF-e está, mudar para aba NF-e
          if (!data.nfseEnabled && data.nfeEnabled) {
            setActiveTab("nfe")
          }
        }
      } catch {
        setFiscalConfig({ nfseEnabled: false, nfeEnabled: false })
      }
    }
    checkFiscalConfig()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (statusFilter !== "all") params.append("status", statusFilter)
      if (searchTerm) params.append("search", searchTerm)
      params.append("page", pagination.page.toString())
      params.append("limit", pagination.limit.toString())

      const response = await fetch(`/api/invoices?${params}`)
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices || [])
        setPagination(data.pagination || pagination)
      }
    } catch (error) {
      console.error("Erro ao buscar NFS-e:", error)
      toast.error("Erro ao carregar notas fiscais")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (fiscalConfig?.nfseEnabled && activeTab === "nfse") {
      fetchInvoices()
    }
  }, [statusFilter, pagination.page, pagination.limit, fiscalConfig, activeTab])

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchInvoices()
  }

  const handleSync = async (invoiceId: string) => {
    setSyncingId(invoiceId)
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/sync`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Status atualizado: ${data.currentStatus}`)
        fetchInvoices()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao sincronizar")
      }
    } catch {
      toast.error("Erro ao sincronizar status")
    } finally {
      setSyncingId(null)
    }
  }

  const handleCancel = async () => {
    if (!cancelInvoiceId || cancelJustificativa.length < 15) {
      toast.error("Justificativa deve ter no mínimo 15 caracteres")
      return
    }

    try {
      const response = await fetch(`/api/invoices/${cancelInvoiceId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ justificativa: cancelJustificativa }),
      })

      if (response.ok) {
        toast.success("NFS-e cancelada com sucesso")
        setCancelInvoiceId(null)
        setCancelJustificativa("")
        fetchInvoices()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao cancelar")
      }
    } catch {
      toast.error("Erro ao cancelar NFS-e")
    }
  }

  const handleResendEmail = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/resend`, {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Email reenviado com sucesso")
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao reenviar email")
      }
    } catch {
      toast.error("Erro ao reenviar email")
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

  // Loading inicial
  if (fiscalConfig === null) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  // Se nenhuma nota fiscal está habilitada
  if (!fiscalConfig.nfseEnabled && !fiscalConfig.nfeEnabled) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-headline tracking-wide">
              Notas Fiscais
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas notas fiscais
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Notas Fiscais não habilitadas
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                A emissão de notas fiscais não está habilitada para sua conta.
                Configure as integrações fiscais para começar a emitir.
              </p>
              <Link href="/configuracoes/fiscal">
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Ver Configurações Fiscais
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-headline tracking-wide">
            Notas Fiscais
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas notas fiscais eletrônicas
          </p>
        </div>
        <Link href="/configuracoes/fiscal">
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Configurações Fiscais
          </Button>
        </Link>
      </div>

      {/* Tabs para NFS-e e NF-e */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="nfse" className="gap-2" disabled={!fiscalConfig.nfseEnabled}>
            <Receipt className="h-4 w-4" />
            NFS-e (Serviços)
          </TabsTrigger>
          <TabsTrigger value="nfe" className="gap-2" disabled={!fiscalConfig.nfeEnabled}>
            <Package className="h-4 w-4" />
            NF-e (Produtos)
          </TabsTrigger>
        </TabsList>

        {/* Tab NFS-e */}
        <TabsContent value="nfse" className="space-y-6">
          {!fiscalConfig.nfseEnabled ? (
            <Card>
              <CardContent className="py-16">
                <div className="flex flex-col items-center justify-center text-center">
                  <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">
                    NFS-e não habilitada
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    A emissão de NFS-e de serviço não está habilitada.
                    Configure a integração com a prefeitura.
                  </p>
                  <Link href="/configuracoes/fiscal">
                    <Button variant="outline" className="gap-2">
                      <Settings className="h-4 w-4" />
                      Configurar NFS-e
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline tracking-wide">Filtros</CardTitle>
                  <CardDescription>Filtre as NFS-e de serviço</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 flex-wrap">
                    <div className="w-64">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="PENDING">Pendente</SelectItem>
                          <SelectItem value="PROCESSING">Processando</SelectItem>
                          <SelectItem value="AUTHORIZED">Autorizada</SelectItem>
                          <SelectItem value="REJECTED">Rejeitada</SelectItem>
                          <SelectItem value="CANCELLED">Cancelada</SelectItem>
                          <SelectItem value="ERROR">Erro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[200px] max-w-md">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Buscar por número, cliente ou reserva..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                        <Button variant="outline" size="icon" onClick={handleSearch}>
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invoices Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline tracking-wide">
                    {loading ? "Carregando..." : `${pagination.total} NFS-e`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Reserva</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Emitida em</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              Carregando notas fiscais...
                            </TableCell>
                          </TableRow>
                        ) : invoices.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                              <p className="text-muted-foreground">
                                Nenhuma NFS-e encontrada.
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                As NFS-e são geradas a partir das reservas.
                              </p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                              <TableCell>
                                <div className="font-medium">
                                  {invoice.numero || "Pendente"}
                                </div>
                                {invoice.codigoVerificacao && (
                                  <div className="text-xs text-muted-foreground">
                                    {invoice.codigoVerificacao}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <Link
                                  href={`/reservas/${invoice.booking.id}`}
                                  className="text-primary hover:underline"
                                >
                                  #{invoice.booking.bookingNumber.slice(-8)}
                                </Link>
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(invoice.booking.startDate)} -{" "}
                                  {formatDate(invoice.booking.endDate)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{invoice.tomadorNome}</div>
                                {invoice.tomadorCpfCnpj && (
                                  <div className="text-xs text-muted-foreground">
                                    {invoice.tomadorCpfCnpj}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="font-semibold">
                                  {formatCurrency(invoice.valorTotal)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <InvoiceStatusBadge status={invoice.status} />
                              </TableCell>
                              <TableCell>
                                {invoice.emittedAt
                                  ? formatDate(invoice.emittedAt)
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                    <DropdownMenuSeparator />

                                    {/* Sincronizar status */}
                                    {["PENDING", "PROCESSING"].includes(
                                      invoice.status
                                    ) && (
                                      <DropdownMenuItem
                                        onClick={() => handleSync(invoice.id)}
                                        disabled={syncingId === invoice.id}
                                      >
                                        <RefreshCw
                                          className={`h-4 w-4 mr-2 ${
                                            syncingId === invoice.id
                                              ? "animate-spin"
                                              : ""
                                          }`}
                                        />
                                        Atualizar Status
                                      </DropdownMenuItem>
                                    )}

                                    {/* Download XML */}
                                    {invoice.xmlUrl && (
                                      <DropdownMenuItem asChild>
                                        <a
                                          href={invoice.xmlUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <Download className="h-4 w-4 mr-2" />
                                          Baixar XML
                                        </a>
                                      </DropdownMenuItem>
                                    )}

                                    {/* Download PDF */}
                                    {invoice.pdfUrl && (
                                      <DropdownMenuItem asChild>
                                        <a
                                          href={invoice.pdfUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <ExternalLink className="h-4 w-4 mr-2" />
                                          Ver DANFSE
                                        </a>
                                      </DropdownMenuItem>
                                    )}

                                    {/* Reenviar email */}
                                    {invoice.status === "AUTHORIZED" && (
                                      <DropdownMenuItem
                                        onClick={() => handleResendEmail(invoice.id)}
                                      >
                                        <Mail className="h-4 w-4 mr-2" />
                                        Reenviar Email
                                      </DropdownMenuItem>
                                    )}

                                    <DropdownMenuSeparator />

                                    {/* Cancelar */}
                                    {invoice.status === "AUTHORIZED" && (
                                      <DropdownMenuItem
                                        onClick={() => setCancelInvoiceId(invoice.id)}
                                        className="text-destructive"
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Cancelar NFS-e
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginação */}
                  <DataPagination
                    currentPage={pagination.page}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                    onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
                    onItemsPerPageChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Tab NF-e */}
        <TabsContent value="nfe" className="space-y-6">
          <ProductInvoiceList enabled={fiscalConfig.nfeEnabled} />
        </TabsContent>
      </Tabs>

      {/* Cancel Dialog */}
      <Dialog
        open={!!cancelInvoiceId}
        onOpenChange={() => {
          setCancelInvoiceId(null)
          setCancelJustificativa("")
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar NFS-e</DialogTitle>
            <DialogDescription>
              Esta ação irá cancelar a NFS-e junto à prefeitura. Informe a
              justificativa do cancelamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="justificativa">
                Justificativa (mínimo 15 caracteres)
              </Label>
              <Textarea
                id="justificativa"
                placeholder="Informe o motivo do cancelamento..."
                value={cancelJustificativa}
                onChange={(e) => setCancelJustificativa(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {cancelJustificativa.length}/15 caracteres
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelInvoiceId(null)
                setCancelJustificativa("")
              }}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelJustificativa.length < 15}
            >
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
