"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import {
  Receipt,
  FileText,
  Download,
  FileCheck,
  Loader2,
  ExternalLink,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdminPageHeader } from "@/components/admin"
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
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { BookingTabs } from "@/components/booking"
import { downloadDocumentAsPDF } from "@/lib/pdf-generator"

interface Booking {
  id: string
  bookingNumber: string
  status: string
  totalPrice: number
  customer: {
    name: string
    email: string | null
  }
  equipment: {
    name: string
  }
}

interface Invoice {
  id: string
  internalRef: string
  numero: string | null
  status: string
  valorTotal: number
  emittedAt: string | null
  pdfUrl: string | null
  xmlUrl: string | null
  createdAt: string
}

export default function DocumentosOrcamentoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingContract, setGeneratingContract] = useState(false)
  const [generatingReceipt, setGeneratingReceipt] = useState(false)
  const [generatingNFSe, setGeneratingNFSe] = useState(false)

  useEffect(() => {
    fetchData()
  }, [resolvedParams.id])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Buscar booking
      const bookingRes = await fetch(`/api/bookings/${resolvedParams.id}`)
      if (!bookingRes.ok) throw new Error("Orçamento não encontrado")
      const bookingData = await bookingRes.json()
      setBooking(bookingData)

      // Buscar invoices (NFS-e)
      const invoicesRes = await fetch(`/api/bookings/${resolvedParams.id}/invoice`)
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json()
        setInvoices(invoicesData.invoices || [])
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados")
      router.push("/reservas")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateDocument = async (type: "CONTRACT" | "RECEIPT") => {
    if (type === "CONTRACT") setGeneratingContract(true)
    else setGeneratingReceipt(true)

    try {
      const response = await fetch(`/api/bookings/${resolvedParams.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })

      if (response.ok) {
        const data = await response.json()
        const printWindow = window.open("", "_blank")
        if (printWindow) {
          printWindow.document.write(data.html)
          printWindow.document.close()
          printWindow.focus()
        }
        toast.success("Documento gerado com sucesso!")
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Erro ao gerar documento")
      }
    } catch (error) {
      console.error("Error generating document:", error)
      toast.error("Erro ao gerar documento")
    } finally {
      if (type === "CONTRACT") setGeneratingContract(false)
      else setGeneratingReceipt(false)
    }
  }

  const handleDownloadPDF = async (type: "CONTRACT" | "RECEIPT") => {
    try {
      toast.info("Gerando PDF...")
      await downloadDocumentAsPDF(resolvedParams.id, type)
      toast.success("PDF baixado com sucesso!")
    } catch (error) {
      console.error("Error downloading PDF:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao baixar PDF")
    }
  }

  const handleEmitirNFSe = async () => {
    if (!booking || !["CONFIRMED", "COMPLETED"].includes(booking.status)) {
      toast.error("Só é possível emitir NFS-e para orçamentos confirmados ou concluídos")
      return
    }

    setGeneratingNFSe(true)
    try {
      const response = await fetch(`/api/bookings/${resolvedParams.id}/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendEmail: true }),
      })

      if (response.ok) {
        toast.success("NFS-e gerada com sucesso!")
        fetchData()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || errorData.details || "Erro ao gerar NFS-e", {
          duration: 8000,
        })
      }
    } catch (error) {
      console.error("Error generating NFS-e:", error)
      toast.error("Erro ao gerar NFS-e")
    } finally {
      setGeneratingNFSe(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!booking) {
    return null
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Documentos & Notas Fiscais"
        description={`${booking.customer.name} - ${booking.equipment.name}`}
        icon={Receipt}
        iconColor="text-purple-400"
        backHref="/reservas"
        backLabel="Voltar para Orçamentos"
      />

      {/* Navigation Tabs */}
      <BookingTabs bookingId={resolvedParams.id} activeTab="documentos" />

      {/* Gerar Documentos */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="font-headline tracking-wide flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerar Documentos
          </CardTitle>
          <CardDescription>
            Gere contratos, recibos e notas fiscais do orçamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Contrato */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-400" />
                    <h3 className="font-medium">Contrato</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Contrato de locação com todos os termos
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateDocument("CONTRACT")}
                      disabled={generatingContract}
                    >
                      {generatingContract ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                      <span className="ml-1">Visualizar</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF("CONTRACT")}
                    >
                      <Download className="h-4 w-4" />
                      <span className="ml-1">PDF</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recibo */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-green-400" />
                    <h3 className="font-medium">Recibo</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Recibo de pagamento da locação
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateDocument("RECEIPT")}
                      disabled={generatingReceipt}
                    >
                      {generatingReceipt ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                      <span className="ml-1">Visualizar</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF("RECEIPT")}
                    >
                      <Download className="h-4 w-4" />
                      <span className="ml-1">PDF</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* NFS-e */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-amber-400" />
                    <h3 className="font-medium">NFS-e</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nota Fiscal de Serviço Eletrônica
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEmitirNFSe}
                      disabled={generatingNFSe || !["CONFIRMED", "COMPLETED"].includes(booking.status)}
                    >
                      {generatingNFSe ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileCheck className="h-4 w-4" />
                      )}
                      <span className="ml-1">Emitir NFS-e</span>
                    </Button>
                  </div>
                  {!["CONFIRMED", "COMPLETED"].includes(booking.status) && (
                    <p className="text-xs text-amber-400">
                      Confirme o orçamento para emitir NFS-e
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Notas Fiscais Emitidas */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="font-headline tracking-wide flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Notas Fiscais Emitidas
          </CardTitle>
          <CardDescription>
            Histórico de notas fiscais geradas para este orçamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma nota fiscal emitida</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead>Ref. Interna</TableHead>
                  <TableHead>NFS-e</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data Emissão</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="border-zinc-800">
                    <TableCell className="font-medium font-mono text-xs">
                      {invoice.internalRef}
                    </TableCell>
                    <TableCell>
                      {invoice.numero || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invoice.status === "AUTHORIZED" ? "default" :
                          invoice.status === "REJECTED" || invoice.status === "ERROR" ? "destructive" :
                          invoice.status === "CANCELLED" ? "outline" :
                          "secondary"
                        }
                      >
                        {invoice.status === "AUTHORIZED" ? "Autorizada" :
                         invoice.status === "PENDING" ? "Pendente" :
                         invoice.status === "PROCESSING" ? "Processando" :
                         invoice.status === "REJECTED" ? "Rejeitada" :
                         invoice.status === "CANCELLED" ? "Cancelada" :
                         invoice.status === "ERROR" ? "Erro" : invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.valorTotal)}</TableCell>
                    <TableCell>{invoice.emittedAt ? formatDate(invoice.emittedAt) : formatDate(invoice.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      {invoice.pdfUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(invoice.pdfUrl!, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
