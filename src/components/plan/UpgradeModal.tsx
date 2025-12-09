"use client"

import { useRouter } from "next/navigation"
import { AlertTriangle, ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  limitType: "users" | "equipments" | "bookings"
  currentPlan?: string
}

const limitMessages = {
  users: {
    title: "Limite de usuários atingido",
    description: "Você atingiu o limite máximo de usuários do seu plano atual.",
    action: "adicionar mais usuários",
  },
  equipments: {
    title: "Limite de equipamentos atingido",
    description: "Você atingiu o limite máximo de equipamentos do seu plano atual.",
    action: "cadastrar mais equipamentos",
  },
  bookings: {
    title: "Limite de reservas atingido",
    description: "Você atingiu o limite máximo de reservas deste mês.",
    action: "criar mais reservas",
  },
}

export function UpgradeModal({
  isOpen,
  onClose,
  limitType,
  currentPlan,
}: UpgradeModalProps) {
  const router = useRouter()
  const message = limitMessages[limitType]

  const handleUpgrade = () => {
    onClose()
    router.push("/renovar")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-red-500/10">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <DialogTitle className="text-xl">{message.title}</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {message.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Para {message.action}, você precisa fazer upgrade para um plano superior.
          </p>

          {currentPlan && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <span className="text-muted-foreground">Plano atual:</span>{" "}
              <span className="font-medium">{currentPlan}</span>
            </div>
          )}

          <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
            <p className="text-sm font-medium mb-1">
              Faça upgrade e desbloqueie mais recursos:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Mais usuários para sua equipe</li>
              <li>• Mais equipamentos no catálogo</li>
              <li>• Mais reservas por mês</li>
              <li>• Recursos avançados</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={handleUpgrade}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            Ver Planos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
