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
import { ProductInvoiceStatusBadge } from "./ProductInvoiceStatusBadge"
import { ProductInvoiceTypeBadge } from "./ProductInvoiceTypeBadge"
import {
  FileText,
  MoreHorizontal,
  Download,
  XCircle,
  RefreshCw,
  Mail,
  ExternalLink,
  Search,
  ArrowRight,
  AlertCircle,
  Package,
  Edit,
} from "lucide-react"
import { toast } from "sonner"
import { DataPagination } from "@/components/ui/data-pagination"

interface ProductInvoice {
  id: string
  internalRef: string
  type: string
  numero: string | null
  serie: string | null
  chaveAcesso: string | null
  status: string
  naturezaOperacao: string
  cfop: string
  valorProdutos: number
  valorTotal: number
  destNome: string
  destCpfCnpj: string
  xmlUrl: string | null
  pdfUrl: string | null
  emittedAt: string | null
  createdAt: string
  nfeReferenciada: string | null
  booking: {
    id: string
    bookingNumber: string
    startDate: string
    endDate: string
  }
  _count?: {
    items: number
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface ProductInvoiceListProps {
  enabled: boolean
}

export function ProductInvoiceList({ enabled }: ProductInvoiceListProps) {
  const [invoices, setInvoices] = useState<ProductInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Dialogs
  const [cancelInvoiceId, setCancelInvoiceId] = useState<string | null>(null)
  const [cancelJustificativa, setCancelJustificativa] = useState("")
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [creatingRetorno, setCreatingRetorno] = useState<string | null>(null)
  const [cartaCorrecaoId, setCartaCorrecaoId] = useState<string | null>(null)
  const [cartaCorrecaoTexto, setCartaCorrecaoTexto] = useState("")

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (statusFilter !== "all") params.append("status", statusFilter)
      if (typeFilter !== "all") params.append("type", typeFilter)
      if (searchTerm) params.append("search", searchTerm)
      params.append("page", pagination.page.toString())
      params.append("limit", pagination.limit.toString())

      const response = await fetch(`/api/product-invoices?${params}`)
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices || [])
        setPagination(data.pagination || pagination)
      }
    } catch (error) {
      console.error("Erro ao buscar NF-e:", error)
      toast.error("Erro ao carregar notas fiscais")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (enabled) {
      fetchInvoices()
    }
  }, [statusFilter, typeFilter, pagination.page, pagination.limit, enabled])

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchInvoices()
  }

  const handleSync = async (invoiceId: string) => {
    setSyncingId(invoiceId)
    try {
      const response = await fetch(`/api/product-invoices/${invoiceId}/sync`, {
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
      const response = await fetch(`/api/product-invoices/${cancelInvoiceId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ justificativa: cancelJustificativa }),
      })

      if (response.ok) {
        toast.success("NF-e cancelada com sucesso")
        setCancelInvoiceId(null)
        setCancelJustificativa("")
        fetchInvoices()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao cancelar")
      }
    } catch {
      toast.error("Erro ao cancelar NF-e")
    }
  }

  const handleCreateRetorno = async (remessaId: string) => {
    setCreatingRetorno(remessaId)
    try {
      const response = await fetch(`/api/product-invoices/${remessaId}/retorno`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`NF-e de retorno criada: ${data.internalRef}`)
        fetchInvoices()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao criar retorno")
      }
    } catch {
      toast.error("Erro ao criar NF-e de retorno")
    } finally {
      setCreatingRetorno(null)
    }
  }

  const handleCartaCorrecao = async () => {
    if (!cartaCorrecaoId || cartaCorrecaoTexto.length < 15) {
      toast.error("Texto da correção deve ter no mínimo 15 caracteres")
      return
    }

    try {
      const response = await fetch(`/api/product-invoices/${cartaCorrecaoId}/carta-correcao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correcao: cartaCorrecaoTexto }),
      })

      if (response.ok) {
        toast.success("Carta de correção emitida com sucesso")
        setCartaCorrecaoId(null)
        setCartaCorrecaoTexto("")
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao emitir carta de correção")
      }
    } catch {
      toast.error("Erro ao emitir carta de correção")
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

  const truncateChave = (chave: string | null) => {
    if (!chave) return "-"
    return `${chave.slice(0, 8)}...${chave.slice(-8)}`
  }

  if (!enabled) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              NF-e não habilitada
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              A emissão de NF-e de produto não está habilitada para sua conta.
              Configure o certificado digital A1 para habilitar.
            </p>
            <Link href="/configuracoes/fiscal">
              <Button variant="outline" className="gap-2">
                <Package className="h-4 w-4" />
                Configurar Certificado
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline tracking-wide">Filtros</CardTitle>
          <CardDescription>Filtre as NF-e de produto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="w-48">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="REMESSA_LOCACAO">Remessa</SelectItem>
                  <SelectItem value="RETORNO_LOCACAO">Retorno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
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
                  <SelectItem value="DENEGADA">Denegada</SelectItem>
                  <SelectItem value="ERROR">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px] max-w-md">
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar por número, chave, cliente ou reserva..."
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
            {loading ? "Carregando..." : `${pagination.total} NF-e`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Reserva</TableHead>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Emitida em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Carregando NF-e...
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        Nenhuma NF-e encontrada.
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        As NF-e de remessa são geradas a partir das reservas.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div className="font-medium">
                          {invoice.numero || "Pendente"}
                          {invoice.serie && ` - Série ${invoice.serie}`}
                        </div>
                        {invoice.chaveAcesso && (
                          <div className="text-xs text-muted-foreground font-mono">
                            {truncateChave(invoice.chaveAcesso)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <ProductInvoiceTypeBadge type={invoice.type} />
                        {invoice.nfeReferenciada && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Ref: {truncateChave(invoice.nfeReferenciada)}
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
                        <div className="font-medium">{invoice.destNome}</div>
                        <div className="text-xs text-muted-foreground">
                          {invoice.destCpfCnpj}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          {formatCurrency(invoice.valorTotal)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          CFOP {invoice.cfop}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ProductInvoiceStatusBadge status={invoice.status} />
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

                            {/* Criar retorno (apenas para remessa autorizada) */}
                            {invoice.type === "REMESSA_LOCACAO" &&
                              invoice.status === "AUTHORIZED" && (
                                <DropdownMenuItem
                                  onClick={() => handleCreateRetorno(invoice.id)}
                                  disabled={creatingRetorno === invoice.id}
                                >
                                  <ArrowRight
                                    className={`h-4 w-4 mr-2 ${
                                      creatingRetorno === invoice.id
                                        ? "animate-pulse"
                                        : ""
                                    }`}
                                  />
                                  Emitir NF-e de Retorno
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

                            {/* Download PDF/DANFE */}
                            {invoice.pdfUrl && (
                              <DropdownMenuItem asChild>
                                <a
                                  href={invoice.pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Ver DANFE
                                </a>
                              </DropdownMenuItem>
                            )}

                            {/* Carta de correção */}
                            {invoice.status === "AUTHORIZED" && (
                              <DropdownMenuItem
                                onClick={() => setCartaCorrecaoId(invoice.id)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Carta de Correção
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
                                Cancelar NF-e
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
            <DialogTitle>Cancelar NF-e</DialogTitle>
            <DialogDescription>
              Esta ação irá cancelar a NF-e junto à SEFAZ. O prazo para
              cancelamento é de até 24 horas após a autorização.
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

      {/* Carta de Correção Dialog */}
      <Dialog
        open={!!cartaCorrecaoId}
        onOpenChange={() => {
          setCartaCorrecaoId(null)
          setCartaCorrecaoTexto("")
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Carta de Correção</DialogTitle>
            <DialogDescription>
              A carta de correção permite corrigir erros em campos específicos
              da NF-e, exceto valores e destinatário.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="correcao">
                Texto da correção (mínimo 15 caracteres)
              </Label>
              <Textarea
                id="correcao"
                placeholder="Descreva a correção a ser feita..."
                value={cartaCorrecaoTexto}
                onChange={(e) => setCartaCorrecaoTexto(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {cartaCorrecaoTexto.length}/15 caracteres
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCartaCorrecaoId(null)
                setCartaCorrecaoTexto("")
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCartaCorrecao}
              disabled={cartaCorrecaoTexto.length < 15}
            >
              Emitir Carta de Correção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
