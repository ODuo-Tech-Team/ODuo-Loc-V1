"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Loader2,
  Check,
  ArrowLeft,
  CreditCard,
  QrCode,
  Shield,
  Copy,
  CheckCircle,
  Clock,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"

interface RenewalData {
  planId: string
  planSlug: string
  planName: string
  billingCycle: "MONTHLY" | "ANNUAL"
  price: number
  monthlyEquivalent: number
  savings: number
  timestamp: number
}

interface PixData {
  paymentId: string
  qrCodeImage: string
  qrCodeText: string
  expirationDate: string
}

const cardSchema = z.object({
  cardNumber: z.string().min(16, "Número do cartão inválido").max(19),
  cardName: z.string().min(3, "Nome no cartão deve ter pelo menos 3 caracteres"),
  cardExpiry: z.string().regex(/^\d{2}\/\d{2}$/, "Validade inválida (MM/AA)"),
  cardCvv: z.string().min(3, "CVV inválido").max(4),
  cpfCnpj: z.string().min(11, "CPF/CNPJ inválido"),
  postalCode: z.string().min(8, "CEP inválido"),
  addressNumber: z.string().min(1, "Número obrigatório"),
})

const pixSchema = z.object({
  cpfCnpj: z.string().min(11, "CPF/CNPJ inválido"),
})

type CardFormData = z.infer<typeof cardSchema>
type PixFormData = z.infer<typeof pixSchema>

export default function CheckoutPage() {
  const router = useRouter()
  const [renewalData, setRenewalData] = useState<RenewalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD">("PIX")
  const [processing, setProcessing] = useState(false)
  const [pixData, setPixData] = useState<PixData | null>(null)
  const [pixCopied, setPixCopied] = useState(false)
  const [checkingPayment, setCheckingPayment] = useState(false)

  const {
    register: registerCard,
    handleSubmit: handleSubmitCard,
    formState: { errors: cardErrors },
    setValue: setCardValue,
  } = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
  })

  const {
    register: registerPix,
    handleSubmit: handleSubmitPix,
    formState: { errors: pixErrors },
    setValue: setPixValue,
  } = useForm<PixFormData>({
    resolver: zodResolver(pixSchema),
  })

  useEffect(() => {
    // Carregar dados do localStorage
    const data = localStorage.getItem("renewalData")
    if (!data) {
      toast.error("Sessão expirada. Por favor, selecione um plano novamente.")
      router.push("/renovar")
      return
    }

    const parsedData = JSON.parse(data) as RenewalData

    // Verificar se os dados não expiraram (30 minutos)
    if (Date.now() - parsedData.timestamp > 30 * 60 * 1000) {
      localStorage.removeItem("renewalData")
      toast.error("Sessão expirada. Por favor, selecione um plano novamente.")
      router.push("/renovar")
      return
    }

    setRenewalData(parsedData)
    setLoading(false)
  }, [router])

  // Polling para verificar pagamento PIX
  useEffect(() => {
    if (!pixData) return

    const checkPayment = async () => {
      setCheckingPayment(true)
      try {
        const response = await fetch(`/api/subscription/pix/${pixData.paymentId}/status`)
        const data = await response.json()

        if (data.status === "RECEIVED" || data.status === "CONFIRMED") {
          localStorage.removeItem("renewalData")
          toast.success("Pagamento confirmado!")
          router.push("/renovar/sucesso")
        }
      } catch (error) {
        console.error("Erro ao verificar pagamento:", error)
      } finally {
        setCheckingPayment(false)
      }
    }

    // Verificar a cada 5 segundos
    const interval = setInterval(checkPayment, 5000)

    return () => clearInterval(interval)
  }, [pixData, router])

  const handlePixPayment = async (formData: PixFormData) => {
    if (!renewalData) return

    setProcessing(true)
    try {
      const response = await fetch("/api/subscription/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: renewalData.planId,
          billingCycle: renewalData.billingCycle,
          paymentMethod: "PIX",
          cpfCnpj: formData.cpfCnpj.replace(/\D/g, ""),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar PIX")
      }

      setPixData({
        paymentId: data.paymentId,
        qrCodeImage: data.qrCodeImage,
        qrCodeText: data.qrCodeText,
        expirationDate: data.expirationDate,
      })

      toast.success("QR Code PIX gerado com sucesso!")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao gerar PIX"
      toast.error(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  const handleCardPayment = async (formData: CardFormData) => {
    if (!renewalData) return

    setProcessing(true)
    try {
      const response = await fetch("/api/subscription/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: renewalData.planId,
          billingCycle: renewalData.billingCycle,
          paymentMethod: "CREDIT_CARD",
          creditCard: {
            holderName: formData.cardName,
            number: formData.cardNumber.replace(/\s/g, ""),
            expiryMonth: formData.cardExpiry.split("/")[0],
            expiryYear: "20" + formData.cardExpiry.split("/")[1],
            ccv: formData.cardCvv,
          },
          creditCardHolderInfo: {
            name: formData.cardName,
            cpfCnpj: formData.cpfCnpj.replace(/\D/g, ""),
            postalCode: formData.postalCode.replace(/\D/g, ""),
            addressNumber: formData.addressNumber,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar pagamento")
      }

      localStorage.removeItem("renewalData")
      toast.success("Pagamento processado com sucesso!")
      router.push("/renovar/sucesso")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao processar pagamento"
      toast.error(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  const copyPixCode = () => {
    if (pixData?.qrCodeText) {
      navigator.clipboard.writeText(pixData.qrCodeText)
      setPixCopied(true)
      toast.success("Código PIX copiado!")
      setTimeout(() => setPixCopied(false), 3000)
    }
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s/g, "").replace(/\D/g, "")
    const matches = v.match(/.{1,4}/g)
    return matches ? matches.join(" ") : v
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, "")
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4)
    }
    return v
  }

  const formatCpfCnpj = (value: string) => {
    const v = value.replace(/\D/g, "")
    if (v.length <= 11) {
      // CPF: 000.000.000-00
      return v
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    } else {
      // CNPJ: 00.000.000/0000-00
      return v
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2")
    }
  }

  const formatCep = (value: string) => {
    const v = value.replace(/\D/g, "")
    return v.replace(/(\d{5})(\d)/, "$1-$2")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!renewalData) {
    return null
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/renovar">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-wide">
            Finalizar Pagamento
          </h1>
          <p className="text-sm text-muted-foreground">
            Etapa 2 de 3 - Dados de pagamento
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">
            <Check className="h-4 w-4" />
          </div>
          <span className="text-sm text-green-600 font-medium hidden sm:inline">Plano</span>
        </div>
        <div className="w-12 h-0.5 bg-green-600" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
            2
          </div>
          <span className="text-sm font-medium hidden sm:inline">Pagamento</span>
        </div>
        <div className="w-12 h-0.5 bg-muted" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
            3
          </div>
          <span className="text-sm text-muted-foreground hidden sm:inline">Confirmação</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Resumo do Pedido */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Pedido</CardTitle>
            <CardDescription>Confira os detalhes da sua assinatura</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Plano</span>
              <span className="font-medium">{renewalData.planName}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Ciclo</span>
              <span className="font-medium">
                {renewalData.billingCycle === "ANNUAL" ? "Anual" : "Mensal"}
              </span>
            </div>
            {renewalData.billingCycle === "ANNUAL" && (
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Valor mensal equivalente</span>
                <span className="font-medium">
                  R$ {renewalData.monthlyEquivalent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            {renewalData.savings > 0 && (
              <div className="flex justify-between items-center py-2 border-b text-green-600">
                <span>Economia</span>
                <span className="font-medium">
                  - R$ {renewalData.savings.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-3 text-lg">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-2xl">
                R$ {renewalData.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Método de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle>Método de Pagamento</CardTitle>
            <CardDescription>Escolha como deseja pagar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seleção de Método */}
            {!pixData && (
              <div className="flex gap-4">
                <Button
                  variant={paymentMethod === "PIX" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("PIX")}
                  className="flex-1 h-16 flex-col gap-1"
                  disabled={processing}
                >
                  <QrCode className="h-5 w-5" />
                  <span>PIX</span>
                </Button>
                <Button
                  variant={paymentMethod === "CREDIT_CARD" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("CREDIT_CARD")}
                  className="flex-1 h-16 flex-col gap-1"
                  disabled={processing}
                >
                  <CreditCard className="h-5 w-5" />
                  <span>Cartão</span>
                </Button>
              </div>
            )}

            {/* PIX */}
            {paymentMethod === "PIX" && !pixData && (
              <form onSubmit={handleSubmitPix(handlePixPayment)} className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <p className="text-sm font-medium">Pagamento via PIX</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500" />
                      Aprovação instantânea
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500" />
                      Sem taxa adicional
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500" />
                      QR Code válido por 30 minutos
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pixCpfCnpj">CPF/CNPJ</Label>
                  <Input
                    id="pixCpfCnpj"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    maxLength={18}
                    {...registerPix("cpfCnpj")}
                    onChange={(e) => {
                      const formatted = formatCpfCnpj(e.target.value)
                      e.target.value = formatted
                      setPixValue("cpfCnpj", formatted)
                    }}
                  />
                  {pixErrors.cpfCnpj && (
                    <p className="text-sm text-red-500">{pixErrors.cpfCnpj.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando PIX...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Gerar QR Code PIX
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* QR Code PIX Gerado */}
            {pixData && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg">
                  {pixData.qrCodeImage && (
                    <Image
                      src={`data:image/png;base64,${pixData.qrCodeImage}`}
                      alt="QR Code PIX"
                      width={200}
                      height={200}
                      className="rounded-lg"
                    />
                  )}
                  <p className="text-sm text-center text-muted-foreground">
                    Escaneie o QR Code com o app do seu banco
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Ou copie o código PIX:</Label>
                  <div className="flex gap-2">
                    <Input
                      value={pixData.qrCodeText}
                      readOnly
                      className="text-xs font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyPixCode}
                    >
                      {pixCopied ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-600">
                    QR Code expira em: {new Date(pixData.expirationDate).toLocaleTimeString("pt-BR")}
                  </span>
                </div>

                {checkingPayment && (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Aguardando confirmação do pagamento...
                    </span>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setPixData(null)}
                >
                  Gerar novo QR Code
                </Button>
              </div>
            )}

            {/* Cartão de Crédito */}
            {paymentMethod === "CREDIT_CARD" && (
              <form onSubmit={handleSubmitCard(handleCardPayment)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Número do Cartão</Label>
                  <Input
                    id="cardNumber"
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    {...registerCard("cardNumber")}
                    onChange={(e) => {
                      const formatted = formatCardNumber(e.target.value)
                      e.target.value = formatted
                      setCardValue("cardNumber", formatted)
                    }}
                  />
                  {cardErrors.cardNumber && (
                    <p className="text-sm text-red-500">{cardErrors.cardNumber.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardName">Nome no Cartão</Label>
                  <Input
                    id="cardName"
                    placeholder="Como está no cartão"
                    {...registerCard("cardName")}
                  />
                  {cardErrors.cardName && (
                    <p className="text-sm text-red-500">{cardErrors.cardName.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardExpiry">Validade</Label>
                    <Input
                      id="cardExpiry"
                      placeholder="MM/AA"
                      maxLength={5}
                      {...registerCard("cardExpiry")}
                      onChange={(e) => {
                        const formatted = formatExpiry(e.target.value)
                        e.target.value = formatted
                        setCardValue("cardExpiry", formatted)
                      }}
                    />
                    {cardErrors.cardExpiry && (
                      <p className="text-sm text-red-500">{cardErrors.cardExpiry.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardCvv">CVV</Label>
                    <Input
                      id="cardCvv"
                      placeholder="123"
                      maxLength={4}
                      type="password"
                      {...registerCard("cardCvv")}
                    />
                    {cardErrors.cardCvv && (
                      <p className="text-sm text-red-500">{cardErrors.cardCvv.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                  <Input
                    id="cpfCnpj"
                    placeholder="000.000.000-00"
                    maxLength={18}
                    {...registerCard("cpfCnpj")}
                    onChange={(e) => {
                      const formatted = formatCpfCnpj(e.target.value)
                      e.target.value = formatted
                      setCardValue("cpfCnpj", formatted)
                    }}
                  />
                  {cardErrors.cpfCnpj && (
                    <p className="text-sm text-red-500">{cardErrors.cpfCnpj.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">CEP</Label>
                    <Input
                      id="postalCode"
                      placeholder="00000-000"
                      maxLength={9}
                      {...registerCard("postalCode")}
                      onChange={(e) => {
                        const formatted = formatCep(e.target.value)
                        e.target.value = formatted
                        setCardValue("postalCode", formatted)
                      }}
                    />
                    {cardErrors.postalCode && (
                      <p className="text-sm text-red-500">{cardErrors.postalCode.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressNumber">Número</Label>
                    <Input
                      id="addressNumber"
                      placeholder="123"
                      {...registerCard("addressNumber")}
                    />
                    {cardErrors.addressNumber && (
                      <p className="text-sm text-red-500">{cardErrors.addressNumber.message}</p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Pagar R$ {renewalData.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Segurança */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4">
              <Shield className="h-3 w-3" />
              <span>Pagamento seguro e criptografado</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
