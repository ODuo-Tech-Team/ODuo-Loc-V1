"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { LeadForm } from "./lead-form"
import { cn } from "@/lib/utils"

interface QuickAddLeadProps {
  onCreated?: (lead: any) => void
  className?: string
}

export function QuickAddLead({ onCreated, className }: QuickAddLeadProps) {
  const [open, setOpen] = useState(false)

  const handleSuccess = (lead: any) => {
    onCreated?.(lead)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className={cn("gap-2", className)}>
          <Plus className="h-5 w-5" />
          Novo Lead
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Novo Lead</DialogTitle>
          <DialogDescription>
            Cadastre um novo prospect para acompanhar
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(90vh-120px)] overflow-y-auto px-6 pb-6">
          <LeadForm
            onSuccess={handleSuccess}
            onCancel={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
