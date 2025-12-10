"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"
import { QueryClientProvider } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/query-client"
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Activity,
  CreditCard,
  DollarSign,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface SuperAdminLayoutClientProps {
  children: React.ReactNode
  userName: string
  userEmail: string
}

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/super-admin",
    color: "text-blue-400",
  },
  {
    label: "Tenants",
    icon: Building2,
    href: "/super-admin/tenants",
    color: "text-emerald-400",
  },
  {
    label: "Usuários",
    icon: Users,
    href: "/super-admin/users",
    color: "text-purple-400",
  },
  {
    label: "Assinaturas",
    icon: CreditCard,
    href: "/super-admin/subscriptions",
    color: "text-emerald-400",
  },
  {
    label: "Atividades",
    icon: Activity,
    href: "/super-admin/activities",
    color: "text-amber-400",
  },
  {
    label: "Faturamento",
    icon: DollarSign,
    href: "/super-admin/billing",
    color: "text-pink-400",
  },
  {
    label: "Blog",
    icon: FileText,
    href: "/super-admin/blog",
    color: "text-cyan-400",
  },
  {
    label: "Configurações",
    icon: Settings,
    href: "/super-admin/settings",
    color: "text-gray-400",
  },
]

export function SuperAdminLayoutClient({
  children,
  userName,
  userEmail,
}: SuperAdminLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const queryClient = getQueryClient()

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <QueryClientProvider client={queryClient}>
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0"
        )}
      >
        <div className="h-full bg-black/40 backdrop-blur-xl border-r border-red-500/20">
          <div className="px-6 py-6">
            {/* Logo */}
            <Link href="/super-admin" className="flex flex-col gap-2 mb-10">
              <img src="/logo.svg" alt="ODuoLoc" className="h-32 w-auto" />
              <span className="text-xs text-red-400 font-medium">Super Admin Panel</span>
            </Link>

            {/* Navigation */}
            <nav className="space-y-1">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    pathname === route.href
                      ? "bg-red-500/10 text-white border border-red-500/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <route.icon className={cn("h-5 w-5", route.color)} />
                  <span className="font-medium">{route.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="h-5 w-5 text-red-400" />
                <span className="text-sm font-semibold text-white">Modo Super Admin</span>
              </div>
              <p className="text-xs text-gray-400">
                Você tem acesso total ao sistema.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="md:pl-72 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-black/40 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

            {/* Breadcrumb / Title */}
            <div className="hidden md:flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-500" />
              <span className="text-sm text-gray-400">Super Admin Panel</span>
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8 border border-red-500/30">
                    <AvatarFallback className="bg-red-500/20 text-red-400">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white">{userName}</p>
                    <p className="text-xs text-red-400">Super Admin</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Ir para Tenant
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-500 focus:text-red-500"
                  onClick={() => signOut({ callbackUrl: "https://oduoloc.com.br/login" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
    </QueryClientProvider>
  )
}
