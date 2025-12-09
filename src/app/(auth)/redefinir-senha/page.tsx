"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Lock, ArrowLeft, Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react"

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

const resetPasswordSchema = z.object({
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const [userName, setUserName] = useState("")
  const [success, setSuccess] = useState(false)
  const [tenantSlug, setTenantSlug] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    if (!token) {
      setIsValidating(false)
      setIsValid(false)
      return
    }

    // Validar token
    fetch(`/api/auth/reset-password?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        setIsValid(data.valid)
        if (data.valid) {
          setUserName(data.userName)
        }
      })
      .catch(() => {
        setIsValid(false)
      })
      .finally(() => {
        setIsValidating(false)
      })
  }, [token])

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error)
      }

      setSuccess(true)
      setTenantSlug(result.tenantSlug)
      toast.success("Senha alterada com sucesso!")
    } catch (error: any) {
      toast.error(error.message || "Erro ao redefinir senha")
    } finally {
      setIsLoading(false)
    }
  }

  // Estado de carregamento
  if (isValidating) {
    return (
      <Card className="w-full border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </CardContent>
      </Card>
    )
  }

  // Token inválido
  if (!isValid) {
    return (
      <Card className="w-full border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
            <XCircle className="h-6 w-6 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            Link Inválido
          </CardTitle>
          <CardDescription className="text-gray-400">
            Este link de redefinição de senha é inválido ou expirou. Solicite um novo link.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col space-y-4">
          <Link href="/recuperar-senha" className="w-full">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600">
              Solicitar Novo Link
            </Button>
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Login
          </Link>
        </CardFooter>
      </Card>
    )
  }

  // Sucesso
  if (success) {
    return (
      <Card className="w-full border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <CheckCircle className="h-6 w-6 text-emerald-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            Senha Alterada!
          </CardTitle>
          <CardDescription className="text-gray-400">
            Sua senha foi alterada com sucesso. Agora você pode fazer login com sua nova senha.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col space-y-4">
          <Link href="/login" className="w-full">
            <Button className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600">
              Fazer Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  // Formulário de redefinição
  return (
    <Card className="w-full border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
      <CardHeader className="space-y-2 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 ring-1 ring-purple-500/20">
          <Lock className="h-6 w-6 text-purple-500" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-white">
          Nova Senha
        </CardTitle>
        <CardDescription className="text-gray-400">
          Olá, <span className="text-white font-medium">{userName}</span>! Digite sua nova senha abaixo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">Nova Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                disabled={isLoading}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20 pr-10"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-400">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-gray-300">Confirmar Senha</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Digite novamente"
                disabled={isLoading}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20 pr-10"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-purple-500/20 transition-all duration-300 hover:scale-[1.02]"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Redefinindo...
              </>
            ) : (
              "Redefinir Senha"
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

export default function RedefinirSenhaPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#030712]">
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
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
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              </CardContent>
            </Card>
          }
        >
          <ResetPasswordForm />
        </Suspense>

        <div className="mt-8 text-center text-xs text-gray-600">
          &copy; 2025 ODuo Assessoria. Todos os direitos reservados.
        </div>
      </div>
    </div>
  )
}
