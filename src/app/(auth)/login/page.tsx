"use client"

import { Suspense, useState, useEffect } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { getTenantUrl, getRootUrl } from "@/lib/redirect-utils"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { Sparkles, Eye, EyeOff } from "lucide-react"

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

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
})

type LoginFormData = z.infer<typeof loginSchema>

/**
 * Extrai o subdomínio (tenant slug) do hostname atual
 */
function getTenantSlug(): string | null {
  if (typeof window === "undefined") return null

  const hostname = window.location.hostname
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.split(":")[0] || ""

  // Desenvolvimento local
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return null
  }

  // Domínio principal
  if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
    return null
  }

  // Extrai subdomínio
  const subdomain = hostname.replace(`.${rootDomain}`, "")
  if (subdomain === hostname || subdomain === "www") {
    return null
  }

  return subdomain
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false)
  const [tenantSlug, setTenantSlug] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const errorParam = searchParams.get("error")

  useEffect(() => {
    setTenantSlug(getTenantSlug())
  }, [])

  // Tratar erros de login via URL (ex: Google OAuth)
  useEffect(() => {
    if (errorParam) {
      switch (errorParam) {
        case "NoAccount":
          toast.error("Esta conta Google não está cadastrada. Peça um convite ao administrador.")
          break
        case "TenantInactive":
          toast.error("Esta empresa está com a conta suspensa. Entre em contato com o suporte.")
          break
        case "UserInactive":
          toast.error("Sua conta foi desativada. Entre em contato com o administrador.")
          break
        case "OAuthAccountNotLinked":
          toast.error("Este email já está cadastrado com senha. Use seu email e senha para entrar.")
          break
        default:
          toast.error("Erro ao fazer login. Tente novamente.")
      }
      // Limpar o erro da URL
      router.replace("/login")
    }
  }, [errorParam, router])

  // Verificar se usuário já está logado e redirecionar para o subdomínio correto
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const session = await getSession()
        if (session?.user) {
          if (session.user.role === "SUPER_ADMIN") {
            // Super admin vai para o painel no domínio raiz
            window.location.href = getRootUrl("/super-admin")
          } else if (session.user.tenantSlug) {
            // Usuário de tenant vai para o subdomínio correto
            window.location.href = getTenantUrl(session.user.tenantSlug, "/dashboard")
          } else {
            router.push("/dashboard")
          }
        } else {
          setCheckingSession(false)
        }
      } catch {
        setCheckingSession(false)
      }
    }

    checkExistingSession()
  }, [router])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        tenantSlug: tenantSlug || undefined,
        redirect: false,
        callbackUrl: callbackUrl,
      })

      if (result?.error) {
        // Verificar se o usuário está inativo
        try {
          const statusRes = await fetch("/api/auth/check-user-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: data.email }),
          })
          const statusData = await statusRes.json()

          if (statusData.status === "user_inactive") {
            toast.error(statusData.message || "Sua conta foi desativada. Entre em contato com o administrador.")
          } else if (statusData.status === "tenant_inactive") {
            toast.error(statusData.message || "Esta empresa está com a conta suspensa.")
          } else if (tenantSlug) {
            toast.error("Usuário não encontrado nesta empresa ou senha incorreta")
          } else {
            toast.error("Email ou senha incorretos")
          }
        } catch {
          // Fallback para mensagem genérica
          if (tenantSlug) {
            toast.error("Usuário não encontrado nesta empresa ou senha incorreta")
          } else {
            toast.error("Email ou senha incorretos")
          }
        }
        setIsLoading(false)
      } else {
        // Buscar sessão para verificar o role do usuário
        const newSession = await getSession()

        // Redirecionar super admin para painel de super admin (domínio raiz)
        if (newSession?.user?.role === "SUPER_ADMIN") {
          window.location.href = getRootUrl("/super-admin")
        } else if (newSession?.user?.tenantSlug) {
          // Redirecionar tenant para seu subdomínio correto
          window.location.href = getTenantUrl(newSession.user.tenantSlug, "/dashboard")
        } else {
          router.push(callbackUrl)
          router.refresh()
        }
      }
    } catch {
      toast.error("Erro ao fazer login. Tente novamente.")
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoadingGoogle(true)
    try {
      await signIn("google", { callbackUrl: callbackUrl })
    } catch {
      toast.error("Erro ao iniciar login com Google")
      setIsLoadingGoogle(false)
    }
  }

  // Mostrar loading enquanto verifica sessão existente
  if (checkingSession) {
    return (
      <Card className="w-full border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-gray-400 text-sm">Verificando sessão...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
      <CardHeader className="space-y-2 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-white">
          Bem-vindo de volta
        </CardTitle>
        <CardDescription className="text-gray-400">
          Entre com suas credenciais para acessar o painel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Botão Google */}
        <Button
          type="button"
          variant="outline"
          className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white gap-3"
          onClick={handleGoogleLogin}
          disabled={isLoadingGoogle || isLoading}
        >
          {isLoadingGoogle ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          {isLoadingGoogle ? "Conectando..." : "Continuar com Google"}
        </Button>

        {/* Separador */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-black/40 px-2 text-gray-500">ou</span>
          </div>
        </div>

        {/* Formulário de email/senha */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              disabled={isLoading}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary/50 focus:ring-primary/20"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-gray-300">Senha</Label>
              <Link
                href="/recuperar-senha"
                className="text-xs text-primary hover:text-primary/80 hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                disabled={isLoading}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary/50 focus:ring-primary/20 pr-10"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                disabled={isLoading}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-400">{errors.password.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-0 shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02]"
            disabled={isLoading}
          >
            {isLoading ? "Entrando..." : "Entrar na Plataforma"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 border-t border-white/5 pt-6">
        <div className="text-sm text-gray-400 text-center">
          Não tem uma conta?{" "}
          <Link href="/cadastro" className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors">
            Criar conta gratuitamente
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#030712]">
      {/* Background Effects */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md p-4 z-10">
        <div className="mb-8 text-center">
          <img src="/logo.svg" alt="ODuoLoc" className="h-36 w-auto mx-auto mb-4" />
          <p className="text-gray-500 mt-2 text-sm">Sistema de Gestão para Locadoras</p>
        </div>

        <Suspense fallback={
          <div className="w-full h-[400px] rounded-xl border border-white/10 bg-white/5 animate-pulse" />
        }>
          <LoginForm />
        </Suspense>

        <div className="mt-8 text-center text-xs text-gray-600">
          &copy; 2025 ODuo Assessoria. Todos os direitos reservados.
        </div>
      </div>
    </div>
  )
}
