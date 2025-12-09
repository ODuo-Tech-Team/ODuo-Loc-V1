"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  FileText,
  Upload,
  Trash2,
  Download,
  Plus,
  File,
  FileCheck,
  Shield,
  Receipt,
  HelpCircle,
  Loader2,
  X,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { EquipmentTabs, DocumentosPageSkeleton } from "@/components/equipment"

interface Document {
  id: string
  name: string
  type: string
  url: string
  fileSize: number | null
  uploadedAt: string
}

interface Equipment {
  id: string
  name: string
  category: string
}

const docTypeLabels: Record<string, string> = {
  MANUAL: "Manual",
  WARRANTY: "Garantia",
  CERTIFICATE: "Certificado",
  INVOICE: "Nota Fiscal",
  OTHER: "Outro",
}

const docTypeIcons: Record<string, React.ReactNode> = {
  MANUAL: <FileText className="h-4 w-4" />,
  WARRANTY: <Shield className="h-4 w-4" />,
  CERTIFICATE: <FileCheck className="h-4 w-4" />,
  INVOICE: <Receipt className="h-4 w-4" />,
  OTHER: <HelpCircle className="h-4 w-4" />,
}

export default function DocumentosEquipamentoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [docName, setDocName] = useState("")
  const [docType, setDocType] = useState<string>("OTHER")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Buscar equipamento
      const eqResponse = await fetch(`/api/equipments/${resolvedParams.id}`)
      if (!eqResponse.ok) {
        throw new Error("Equipamento não encontrado")
      }
      const eqData = await eqResponse.json()
      setEquipment(eqData)

      // Buscar documentos
      const docsResponse = await fetch(
        `/api/equipments/${resolvedParams.id}/documents`
      )
      if (docsResponse.ok) {
        const docsData = await docsResponse.json()
        setDocuments(Array.isArray(docsData) ? docsData : [])
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao carregar dados"
      toast.error(message)
      router.push("/equipamentos")
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamanho (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo: 10MB")
        return
      }
      setSelectedFile(file)
      // Auto-preencher nome se estiver vazio
      if (!docName) {
        setDocName(file.name.replace(/\.[^/.]+$/, ""))
      }
    }
  }

  const handleAddDocument = async () => {
    if (!docName || !selectedFile) {
      toast.error("Selecione um arquivo e preencha o nome")
      return
    }

    setIsSubmitting(true)
    setIsUploading(true)
    setUploadProgress("Enviando arquivo...")

    try {
      // 1. Upload do arquivo
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("folder", "equipamentos/documentos")

      const uploadResponse = await fetch("/api/upload/document", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        throw new Error(error.error || "Erro ao fazer upload do arquivo")
      }

      const uploadResult = await uploadResponse.json()
      setUploadProgress("Salvando documento...")

      // 2. Salvar referência do documento
      const response = await fetch(
        `/api/equipments/${resolvedParams.id}/documents`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: docName,
            type: docType,
            url: uploadResult.url,
            fileSize: uploadResult.fileSize,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao adicionar documento")
      }

      toast.success("Documento adicionado com sucesso!")
      setDialogOpen(false)
      resetForm()
      fetchData()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao adicionar documento"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
      setIsUploading(false)
      setUploadProgress("")
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    try {
      const response = await fetch(
        `/api/equipments/${resolvedParams.id}/documents/${docId}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        throw new Error("Erro ao excluir documento")
      }

      toast.success("Documento excluído com sucesso!")
      fetchData()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao excluir documento"
      toast.error(message)
    }
  }

  const resetForm = () => {
    setDocName("")
    setDocType("OTHER")
    setSelectedFile(null)
    setUploadProgress("")
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  if (loading) {
    return <DocumentosPageSkeleton />
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Documentos"
        description={`${equipment?.name} - ${equipment?.category}`}
        icon={FileText}
        iconColor="text-blue-400"
        backHref={`/equipamentos/${resolvedParams.id}`}
        backLabel="Voltar ao Equipamento"
      >
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 transition-colors">
              <Plus className="h-4 w-4" />
              Adicionar Documento
            </Button>
          </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Documento</DialogTitle>
                <DialogDescription>
                  Adicione um documento ao equipamento (manual, garantia, etc.)
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Upload de Arquivo */}
                <div className="space-y-2">
                  <Label>Arquivo *</Label>
                  {!selectedFile ? (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        id="fileUpload"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                        onChange={handleFileSelect}
                        disabled={isSubmitting}
                      />
                      <label htmlFor="fileUpload" className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">Clique para selecionar</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, WebP (max. 10MB)
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                      <File className="h-8 w-8 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="docName">Nome do Documento *</Label>
                  <Input
                    id="docName"
                    placeholder="Ex: Manual do Usuário"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="docType">Tipo *</Label>
                  <Select value={docType} onValueChange={setDocType} disabled={isSubmitting}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANUAL">Manual</SelectItem>
                      <SelectItem value="WARRANTY">Garantia</SelectItem>
                      <SelectItem value="CERTIFICATE">Certificado</SelectItem>
                      <SelectItem value="INVOICE">Nota Fiscal</SelectItem>
                      <SelectItem value="OTHER">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Progress indicator */}
                {isUploading && uploadProgress && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {uploadProgress}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false)
                    resetForm()
                  }}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddDocument}
                  disabled={isSubmitting || !selectedFile}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isUploading ? "Enviando..." : "Salvando..."}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Enviar Documento
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      </AdminPageHeader>

      {/* Navigation Tabs */}
      <EquipmentTabs equipmentId={resolvedParams.id} activeTab="documentos" />

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline tracking-wide flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos Anexados
          </CardTitle>
          <CardDescription>
            Manuais, garantias, certificados e outros documentos do equipamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum documento anexado</p>
              <p className="text-sm">
                Clique em &quot;Adicionar Documento&quot; para começar
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Data Upload</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {docTypeIcons[doc.type]}
                        {docTypeLabels[doc.type] || doc.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                    <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(doc.url, "_blank")}
                        >
                          <Download className="h-4 w-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Excluir documento?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O documento
                                será removido permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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
