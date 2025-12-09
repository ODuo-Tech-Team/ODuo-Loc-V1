"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { Bell, Search, Menu, LogOut, User, Settings, CreditCard, Loader2, Package, Users, Calendar, X, CheckCheck, Trash2, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StockAlertBadge } from "@/components/stock"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

interface Notification {
    id: string
    type: "info" | "warning" | "success"
    title: string
    message: string
    time: string
    link?: string
    isRead?: boolean
}

interface SearchResult {
    type: "equipment" | "customer" | "booking"
    id: string
    title: string
    subtitle: string
    status?: string
    url: string
}

interface HeaderProps {
    user?: {
        name?: string | null
        email?: string | null
        image?: string | null
    }
    onMenuClick?: () => void
}

export function Header({ user, onMenuClick }: HeaderProps) {
    const router = useRouter()
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loadingNotifications, setLoadingNotifications] = useState(true)
    const [showUnreadOnly, setShowUnreadOnly] = useState(false)

    // Search state
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchFocused, setSearchFocused] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 120000)
        return () => clearInterval(interval)
    }, [])

    // Click outside to close search
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setSearchFocused(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Debounced search
    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query)

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }

        if (query.length < 2) {
            setSearchResults([])
            return
        }

        setSearchLoading(true)
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
                if (response.ok) {
                    const data = await response.json()
                    setSearchResults(data.results || [])
                }
            } catch (error) {
                console.error("Erro na busca:", error)
            } finally {
                setSearchLoading(false)
            }
        }, 300)
    }, [])

    const handleResultClick = (result: SearchResult) => {
        router.push(result.url)
        setSearchQuery("")
        setSearchResults([])
        setSearchFocused(false)
    }

    const clearSearch = () => {
        setSearchQuery("")
        setSearchResults([])
    }

    const fetchNotifications = async () => {
        try {
            const response = await fetch("/api/notifications")
            if (response.ok) {
                const data = await response.json()
                setNotifications(data.notifications || [])
                setUnreadCount(data.unreadCount || 0)
            }
        } catch (error) {
            console.error("Erro ao buscar notificações:", error)
        } finally {
            setLoadingNotifications(false)
        }
    }

    const handleLogout = async () => {
        // Usa a URL base do ambiente ou constrói dinamicamente
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                       (typeof window !== 'undefined' ? window.location.origin : 'https://oduoloc.com.br')
        await signOut({ callbackUrl: `${baseUrl}/login` })
    }

    const handleNotificationClick = (notification: Notification) => {
        // Mark as read when clicked
        if (!notification.isRead) {
            markAsRead(notification.id)
        }
        if (notification.link) {
            router.push(notification.link)
            setNotificationsOpen(false)
        }
    }

    const markAsRead = async (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
        // Optionally call API to persist
        try {
            await fetch(`/api/notifications/${id}/read`, { method: "POST" })
        } catch {
            // Silently fail
        }
    }

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
        try {
            await fetch("/api/notifications/read-all", { method: "POST" })
        } catch {
            // Silently fail
        }
    }

    const deleteNotification = async (id: string) => {
        const notificationToDelete = notifications.find(n => n.id === id)
        setNotifications(prev => prev.filter(n => n.id !== id))
        if (notificationToDelete && !notificationToDelete.isRead) {
            setUnreadCount(prev => Math.max(0, prev - 1))
        }
        try {
            await fetch(`/api/notifications/${id}`, { method: "DELETE" })
        } catch {
            // Silently fail
        }
    }

    const filteredNotifications = showUnreadOnly
        ? notifications.filter(n => !n.isRead)
        : notifications

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "warning":
                return "⚠️"
            case "success":
                return "✅"
            default:
                return "ℹ️"
        }
    }

    const getResultIcon = (type: SearchResult["type"]) => {
        switch (type) {
            case "equipment":
                return <Package className="h-4 w-4 text-blue-400" />
            case "customer":
                return <Users className="h-4 w-4 text-green-400" />
            case "booking":
                return <Calendar className="h-4 w-4 text-purple-400" />
        }
    }

    const getResultLabel = (type: SearchResult["type"]) => {
        switch (type) {
            case "equipment":
                return "Equipamento"
            case "customer":
                return "Cliente"
            case "booking":
                return "Orçamento"
        }
    }

    const showResults = searchFocused && (searchResults.length > 0 || searchLoading || searchQuery.length >= 2)

    return (
        <div className="border-b border-white/10 bg-gray-900/50 backdrop-blur-xl h-16 px-4 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="md:hidden text-zinc-400 hover:text-white" onClick={onMenuClick}>
                    <Menu className="h-5 w-5" />
                </Button>

                {/* Search */}
                <div ref={searchRef} className="hidden md:block relative">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Buscar equipamentos, clientes, orçamentos..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            className="pl-9 pr-8 w-80 bg-black/20 border-white/5 focus:border-blue-500/50 focus:bg-black/40 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={clearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Search Results Dropdown */}
                    {showResults && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl overflow-hidden">
                            {searchLoading ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                                    <span className="ml-2 text-sm text-zinc-400">Buscando...</span>
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="max-h-80 overflow-y-auto">
                                    {searchResults.map((result) => (
                                        <button
                                            key={`${result.type}-${result.id}`}
                                            onClick={() => handleResultClick(result)}
                                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-b-0"
                                        >
                                            <div className="p-2 rounded-lg bg-white/5">
                                                {getResultIcon(result.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {result.title}
                                                </p>
                                                <p className="text-xs text-zinc-400 truncate">
                                                    {result.subtitle}
                                                </p>
                                            </div>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-400">
                                                {getResultLabel(result.type)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : searchQuery.length >= 2 ? (
                                <div className="py-6 text-center">
                                    <p className="text-sm text-zinc-400">Nenhum resultado para "{searchQuery}"</p>
                                    <p className="text-xs text-zinc-500 mt-1">Tente buscar por outro termo</p>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Stock Alerts */}
                <StockAlertBadge />

                {/* Notifications */}
                <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                    <SheetTrigger asChild>
                        <Button data-tour="notifications" variant="ghost" size="icon" className="relative text-zinc-400 hover:text-white hover:bg-white/5">
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] flex items-center justify-center text-[10px] font-bold text-white">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="bg-gray-900 border-white/10 flex flex-col">
                        <SheetHeader className="flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <SheetTitle className="text-white">Notificações</SheetTitle>
                                {unreadCount > 0 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                                        {unreadCount} não lida{unreadCount > 1 ? "s" : ""}
                                    </span>
                                )}
                            </div>
                        </SheetHeader>

                        {/* Barra de ações */}
                        {notifications.length > 0 && (
                            <div className="flex items-center justify-between gap-2 mt-4 pb-4 border-b border-white/10 flex-shrink-0">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                                    className={cn(
                                        "text-xs h-8 gap-1.5",
                                        showUnreadOnly ? "text-blue-400 bg-blue-500/10" : "text-zinc-400 hover:text-white"
                                    )}
                                >
                                    <Filter className="h-3.5 w-3.5" />
                                    {showUnreadOnly ? "Mostrar Todas" : "Somente Não Lidas"}
                                </Button>
                                {unreadCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={markAllAsRead}
                                        className="text-xs h-8 gap-1.5 text-zinc-400 hover:text-white"
                                    >
                                        <CheckCheck className="h-3.5 w-3.5" />
                                        Marcar Todas
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Lista de notificações com scroll customizado */}
                        <div className="flex-1 overflow-y-auto sidebar-scroll mt-4 -mr-4 pr-4">
                            <div className="space-y-3">
                                {loadingNotifications ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                                    </div>
                                ) : filteredNotifications.length > 0 ? (
                                    filteredNotifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={cn(
                                                "p-3 rounded-lg transition-all group relative",
                                                notification.type === "warning"
                                                    ? "bg-amber-500/10 border border-amber-500/20"
                                                    : notification.type === "success"
                                                    ? "bg-green-500/10 border border-green-500/20"
                                                    : "bg-white/5 border border-white/5",
                                                !notification.isRead && "ring-1 ring-blue-500/30"
                                            )}
                                        >
                                            {/* Indicador de não lida */}
                                            {!notification.isRead && (
                                                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
                                            )}

                                            <div
                                                onClick={() => handleNotificationClick(notification)}
                                                className="cursor-pointer"
                                            >
                                                <div className="flex justify-between items-start pr-8">
                                                    <div className="flex items-center gap-2">
                                                        <span>{getNotificationIcon(notification.type)}</span>
                                                        <h4 className={cn(
                                                            "font-medium text-sm",
                                                            notification.isRead ? "text-zinc-300" : "text-white"
                                                        )}>
                                                            {notification.title}
                                                        </h4>
                                                    </div>
                                                </div>
                                                <p className={cn(
                                                    "text-sm mt-1 pl-6",
                                                    notification.isRead ? "text-zinc-500" : "text-zinc-400"
                                                )}>
                                                    {notification.message}
                                                </p>
                                            </div>

                                            {/* Footer com hora e ações */}
                                            <div className="flex items-center justify-between mt-2 pl-6">
                                                <span className="text-xs text-zinc-600">{notification.time}</span>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!notification.isRead && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-zinc-500 hover:text-blue-400"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                markAsRead(notification.id)
                                                            }}
                                                            title="Marcar como lida"
                                                        >
                                                            <CheckCheck className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-zinc-500 hover:text-red-400"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            deleteNotification(notification.id)
                                                        }}
                                                        title="Excluir notificação"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : showUnreadOnly && notifications.length > 0 ? (
                                    <div className="text-center py-8">
                                        <CheckCheck className="h-10 w-10 mx-auto text-green-500/50 mb-3" />
                                        <p className="text-zinc-400 text-sm">Todas as notificações foram lidas!</p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowUnreadOnly(false)}
                                            className="mt-2 text-xs text-zinc-500 hover:text-white"
                                        >
                                            Ver todas
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Bell className="h-10 w-10 mx-auto text-zinc-700 mb-3" />
                                        <p className="text-zinc-500">Nenhuma notificação</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>

                <div className="h-8 w-[1px] bg-white/10 mx-2 hidden sm:block" />

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button data-tour="user-menu" variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-white/10 hover:ring-white/20 transition-all p-0 overflow-hidden">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-medium">
                                    {user?.name?.slice(0, 2).toUpperCase() || "US"}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-gray-900/95 backdrop-blur-xl border-white/10 text-zinc-200" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none text-white">{user?.name}</p>
                                <p className="text-xs leading-none text-zinc-400">
                                    {user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
                            <Link href="/configuracoes" className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Perfil
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
                            <Link href="/configuracoes" className="flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                Configurações
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
                            <Link href="/financeiro" className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Faturamento
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer flex items-center gap-2"
                        >
                            <LogOut className="h-4 w-4" />
                            Sair
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
