"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

function ErrorContent() {
    const searchParams = useSearchParams()
    const error = searchParams.get("error")

    useEffect(() => {
        if (error) {
            console.error("Authentication Error:", error)
        }
    }, [error])

    return (
        <Card className="w-full max-w-md border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">
                    Erro de Autenticação
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
                <p className="text-gray-400">
                    {error === "Configuration" && "Existe um problema com a configuração do servidor."}
                    {error === "AccessDenied" && "Você não tem permissão para acessar este recurso."}
                    {error === "Verification" && "O link de verificação expirou ou já foi usado."}
                    {!error && "Ocorreu um erro desconhecido durante a autenticação."}
                </p>
                <div className="pt-4">
                    <Link href="/login">
                        <Button className="w-full bg-white/10 hover:bg-white/20 text-white border-0">
                            Voltar para Login
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}

export default function AuthErrorPage() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#030712] p-4">
            <Suspense fallback={<div>Carregando...</div>}>
                <ErrorContent />
            </Suspense>
        </div>
    )
}
