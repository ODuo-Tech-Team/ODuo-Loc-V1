"use client"

import { Suspense, useState, useEffect } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { getTenantUrl, getRootUrl } from "@/lib/redirect-utils"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { Sparkles } from "lucide-react"

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
  const [tenantSlug, setTenantSlug] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    setTenantSlug(getTenantSlug())
  }, [])

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
        // Mensagem mais específica se estiver em subdomínio
        if (tenantSlug) {
          toast.error("Usuário não encontrado nesta empresa ou senha incorreta")
        } else {
          toast.error("Email ou senha incorretos")
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
      <CardContent>
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
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              disabled={isLoading}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary/50 focus:ring-primary/20"
              {...register("password")}
            />
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
