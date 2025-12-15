"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Mail, ArrowLeft, Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const resendSchema = z.object({
  email: z.string().email("Email inválido"),
})

type ResendFormData = z.infer<typeof resendSchema>

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const success = searchParams.get("success") === "true"
  const error = searchParams.get("error")
  const tenant = searchParams.get("tenant")

  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResendFormData>({
    resolver: zodResolver(resendSchema),
  })

  const onResend = async (data: ResendFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error)
      }

      setEmailSent(true)
      toast.success("Email reenviado com sucesso!")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao reenviar email"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  // Sucesso na verificação
  if (success) {
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"
    const loginUrl = tenant ? `https://${tenant}.${rootDomain}/login` : "/login"

    return (
      <Card className="w-full border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <CheckCircle className="h-6 w-6 text-emerald-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            Email Verificado!
          </CardTitle>
          <CardDescription className="text-gray-400">
            Seu email foi verificado com sucesso. Agora você pode fazer login e acessar o sistema.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col space-y-4">
          <Link href={loginUrl} className="w-full">
            <Button className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600">
              Fazer Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  // Erro na verificação
  if (error) {
    const errorMessages: Record<string, string> = {
      token_missing: "Token de verificação não encontrado",
      invalid_token: "O link de verificação é inválido ou expirou",
      server_error: "Erro ao processar verificação",
    }

    return (
      <Card className="w-full border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
            <XCircle className="h-6 w-6 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            Erro na Verificação
          </CardTitle>
          <CardDescription className="text-gray-400">
            {errorMessages[error] || "Ocorreu um erro ao verificar seu email"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-400 text-center">
            Você pode solicitar um novo email de verificação abaixo:
          </p>
          <form onSubmit={handleSubmit(onResend)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                disabled={isLoading}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reenviando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reenviar Email
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 border-t border-white/5 pt-6">
          <Link
            href="/login"
            className="flex items-center text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Login
          </Link>
        </CardFooter>
      </Card>
    )
  }

  // Página padrão - solicitar reenvio
  if (emailSent) {
    return (
      <Card className="w-full border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/20">
            <Mail className="h-6 w-6 text-cyan-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            Email Enviado!
          </CardTitle>
          <CardDescription className="text-gray-400">
            Se o email estiver cadastrado e não verificado, você receberá um novo link de verificação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-sm text-gray-400">
              Verifique sua caixa de entrada e spam. O link expira em 24 horas.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
      <CardHeader className="space-y-2 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/20">
          <Mail className="h-6 w-6 text-cyan-500" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-white">
          Verificar Email
        </CardTitle>
        <CardDescription className="text-gray-400">
          Digite seu email para receber um novo link de verificação
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onResend)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              disabled={isLoading}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-0"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar Link de Verificação"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 border-t border-white/5 pt-6">
        <Link
          href="/login"
          className="flex items-center text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Login
        </Link>
      </CardFooter>
    </Card>
  )
}

export default function VerificarEmailPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#030712]">
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md p-4 z-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            ODuo Locação
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Sistema de Gestão para Locadoras</p>
        </div>

        <Suspense
          fallback={
            <Card className="w-full border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
              <CardContent className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
              </CardContent>
            </Card>
          }
        >
          <VerifyEmailContent />
        </Suspense>

        <div className="mt-8 text-center text-xs text-gray-600">
          &copy; 2025 ODuo Assessoria. Todos os direitos reservados.
        </div>
      </div>
    </div>
  )
}
