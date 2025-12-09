"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import {
  Loader2,
  Save,
  User,
  Lock,
  Bell,
  Eye,
  EyeOff,
  Settings,
  Mail,
  Smartphone,
  Calendar
} from "lucide-react"
import { ConfigTabs } from "@/components/config"
import { Separator } from "@/components/ui/separator"

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().min(8, "Nova senha deve ter no mínimo 8 caracteres"),
  confirmPassword: z.string().min(1, "Confirmação é obrigatória"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
})

type PasswordFormData = z.infer<typeof passwordSchema>

interface UserProfile {
  id: string
  name: string
  email: string
  createdAt: string
}

interface NotificationSettings {
  emailNewBooking: boolean
  emailBookingConfirmed: boolean
  emailPaymentReceived: boolean
  emailMaintenanceDue: boolean
  emailDailyReport: boolean
  emailWeeklyReport: boolean
  pushEnabled: boolean
  pushNewBooking: boolean
  pushPaymentReceived: boolean
}

export default function ContaPage() {
  const [loading, setLoading] = useState(true)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingNotifications, setSavingNotifications] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNewBooking: true,
    emailBookingConfirmed: true,
    emailPaymentReceived: true,
    emailMaintenanceDue: true,
    emailDailyReport: false,
    emailWeeklyReport: true,
    pushEnabled: true,
    pushNewBooking: true,
    pushPaymentReceived: true,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/user/profile")

      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        if (data.notifications) {
          setNotifications(data.notifications)
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("Erro ao carregar perfil")
    } finally {
      setLoading(false)
    }
  }

  const onSubmitPassword = async (data: PasswordFormData) => {
    setSavingPassword(true)

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao alterar senha")
      }

      toast.success("Senha alterada com sucesso!")
      reset()
    } catch (error: any) {
      console.error("Error changing password:", error)
      toast.error(error.message || "Erro ao alterar senha")
    } finally {
      setSavingPassword(false)
    }
  }

  const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const saveNotifications = async () => {
    setSavingNotifications(true)

    try {
      const response = await fetch("/api/user/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifications),
      })

      if (!response.ok) {
        throw new Error("Erro ao salvar preferências")
      }

      toast.success("Preferências de notificação salvas!")
    } catch (error: any) {
      console.error("Error saving notifications:", error)
      toast.error(error.message || "Erro ao salvar preferências")
    } finally {
      setSavingNotifications(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold font-headline tracking-wide flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            Configurações
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">
            Gerencie sua conta e preferências
          </p>
        </div>
      </div>

      {/* Tabs */}
      <ConfigTabs activeTab="conta" />

      {/* Informações do Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline tracking-wide flex items-center gap-2">
            <User className="h-5 w-5" />
            Meu Perfil
          </CardTitle>
          <CardDescription>
            Suas informações de conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Nome</Label>
              <p className="font-medium">{profile?.name || "-"}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Email</Label>
              <p className="font-medium">{profile?.email || "-"}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Membro desde</Label>
              <p className="font-medium">
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("pt-BR")
                  : "-"
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alterar Senha */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline tracking-wide flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Atualize sua senha de acesso ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
            {/* Senha Atual */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">
                Senha Atual <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  {...register("currentPassword")}
                  placeholder="Digite sua senha atual"
                  disabled={savingPassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
              )}
            </div>

            {/* Nova Senha */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">
                Nova Senha <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  {...register("newPassword")}
                  placeholder="Digite a nova senha (mín. 8 caracteres)"
                  disabled={savingPassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-destructive">{errors.newPassword.message}</p>
              )}
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirmar Nova Senha <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  placeholder="Confirme a nova senha"
                  disabled={savingPassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={savingPassword} className="gap-2">
                {savingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Alterando...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Alterar Senha
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline tracking-wide flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
          <CardDescription>
            Configure quais notificações você deseja receber
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notificações por Email */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Notificações por Email</h3>
            </div>

            <div className="space-y-4 ml-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Novo orçamento</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber email quando um novo orçamento for criado
                  </p>
                </div>
                <Switch
                  checked={notifications.emailNewBooking}
                  onCheckedChange={(checked) => handleNotificationChange("emailNewBooking", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Orçamento confirmado</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber email quando um orçamento for confirmado
                  </p>
                </div>
                <Switch
                  checked={notifications.emailBookingConfirmed}
                  onCheckedChange={(checked) => handleNotificationChange("emailBookingConfirmed", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Pagamento recebido</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber email quando um pagamento for registrado
                  </p>
                </div>
                <Switch
                  checked={notifications.emailPaymentReceived}
                  onCheckedChange={(checked) => handleNotificationChange("emailPaymentReceived", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Manutenção próxima</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber email quando uma manutenção estiver próxima
                  </p>
                </div>
                <Switch
                  checked={notifications.emailMaintenanceDue}
                  onCheckedChange={(checked) => handleNotificationChange("emailMaintenanceDue", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Relatório diário
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receber um resumo diário das atividades
                  </p>
                </div>
                <Switch
                  checked={notifications.emailDailyReport}
                  onCheckedChange={(checked) => handleNotificationChange("emailDailyReport", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Relatório semanal
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receber um resumo semanal das atividades
                  </p>
                </div>
                <Switch
                  checked={notifications.emailWeeklyReport}
                  onCheckedChange={(checked) => handleNotificationChange("emailWeeklyReport", checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notificações Push */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Notificações Push (navegador)</h3>
            </div>

            <div className="space-y-4 ml-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ativar notificações push</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações em tempo real no navegador
                  </p>
                </div>
                <Switch
                  checked={notifications.pushEnabled}
                  onCheckedChange={(checked) => handleNotificationChange("pushEnabled", checked)}
                />
              </div>

              {notifications.pushEnabled && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Novo orçamento</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificação quando um orçamento for criado
                      </p>
                    </div>
                    <Switch
                      checked={notifications.pushNewBooking}
                      onCheckedChange={(checked) => handleNotificationChange("pushNewBooking", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Pagamento recebido</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificação quando um pagamento for registrado
                      </p>
                    </div>
                    <Switch
                      checked={notifications.pushPaymentReceived}
                      onCheckedChange={(checked) => handleNotificationChange("pushPaymentReceived", checked)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={saveNotifications}
              disabled={savingNotifications}
              className="gap-2"
            >
              {savingNotifications ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Preferências
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
