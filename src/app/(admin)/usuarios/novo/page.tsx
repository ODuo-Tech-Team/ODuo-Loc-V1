"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
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
import { ArrowLeft, Save } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { type Role } from "@/lib/permissions"

const userSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  role: z.enum(["ADMIN", "MANAGER", "OPERATOR", "VIEWER"]),
})

type UserForm = z.infer<typeof userSchema>

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  OPERATOR: "Operador",
  VIEWER: "Visualizador",
}

const roleDescriptions: Record<string, string> = {
  ADMIN: "Controle total do sistema (exceto gestão de tenants)",
  MANAGER: "Pode criar e editar, mas não deletar",
  OPERATOR: "Cria reservas e visualiza clientes e equipamentos",
  VIEWER: "Apenas visualização de dados",
}

export default function NovoUsuarioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
  })

  const onSubmit = async (data: UserForm) => {
    try {
      setLoading(true)

      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        router.push("/usuarios")
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || "Erro ao criar usuário")
      }
    } catch (error) {
      console.error("Error creating user:", error)
      alert("Erro ao criar usuário")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/usuarios">
          <Button variant="ghost" size="icon" aria-label="Voltar para lista de usuários">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground font-headline tracking-wide">Novo Usuário</h1>
          <p className="text-muted-foreground mt-1">
            Adicione um novo membro à sua equipe
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline tracking-wide">Informações Básicas</CardTitle>
            <CardDescription>
              Dados do usuário para acesso ao sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome Completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Nome do usuário"
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="usuario@exemplo.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Senha <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="Mínimo 6 caracteres"
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Função e Permissões */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline tracking-wide">Função e Permissões</CardTitle>
            <CardDescription>
              Defina o nível de acesso do usuário no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">
                Função <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma função" />
                    </SelectTrigger>
                    <SelectContent>
                      {(["ADMIN", "MANAGER", "OPERATOR", "VIEWER"] as const).map(
                        (role) => (
                          <SelectItem key={role} value={role}>
                            <div className="flex flex-col gap-1">
                              <div className="font-medium">{roleLabels[role]}</div>
                              <div className="text-xs text-muted-foreground">
                                {roleDescriptions[role]}
                              </div>
                            </div>
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && (
                <p className="text-sm text-destructive">
                  {errors.role.message}
                </p>
              )}
            </div>

            {/* Info Box */}
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 dark:border-primary/40 dark:bg-primary/20">
              <p className="text-sm text-foreground">
                <strong>Nota:</strong> O usuário receberá um email com as
                credenciais de acesso após a criação da conta.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/usuarios">
            <Button type="button" variant="outline" disabled={loading}>
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="gap-2">
            <Save className="h-4 w-4" />
            {loading ? "Criando..." : "Criar Usuário"}
          </Button>
        </div>
      </form>
    </div>
  )
}
