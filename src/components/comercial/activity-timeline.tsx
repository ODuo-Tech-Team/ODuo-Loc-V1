"use client"

import { formatDistanceToNow, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  Users,
  FileText,
  MoreHorizontal,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"

type ActivityType = "VISIT" | "CALL" | "WHATSAPP" | "EMAIL" | "MEETING" | "PROPOSAL" | "OTHER"

const activityConfig: Record<ActivityType, { icon: any; color: string; label: string }> = {
  VISIT: { icon: MapPin, color: "text-green-400 bg-green-500/20", label: "Visita" },
  CALL: { icon: Phone, color: "text-blue-400 bg-blue-500/20", label: "Ligacao" },
  WHATSAPP: { icon: MessageCircle, color: "text-emerald-400 bg-emerald-500/20", label: "WhatsApp" },
  EMAIL: { icon: Mail, color: "text-purple-400 bg-purple-500/20", label: "Email" },
  MEETING: { icon: Users, color: "text-orange-400 bg-orange-500/20", label: "Reuniao" },
  PROPOSAL: { icon: FileText, color: "text-amber-400 bg-amber-500/20", label: "Proposta" },
  OTHER: { icon: MoreHorizontal, color: "text-zinc-400 bg-zinc-500/20", label: "Outro" },
}

interface Activity {
  id: string
  type: ActivityType
  description: string
  photos?: string[]
  scheduledAt?: string | null
  completedAt?: string | null
  createdAt: string
  user?: {
    id: string
    name: string | null
    email: string | null
  } | null
}

interface ActivityTimelineProps {
  activities: Activity[]
  className?: string
}

export function ActivityTimeline({ activities, className }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className={cn("text-center py-8 text-zinc-500", className)}>
        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhuma atividade registrada</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {activities.map((activity, index) => {
        const config = activityConfig[activity.type]
        const Icon = config.icon
        const isLast = index === activities.length - 1

        return (
          <div key={activity.id} className="relative flex gap-4">
            {/* Linha conectora */}
            {!isLast && (
              <div className="absolute left-5 top-10 w-0.5 h-full bg-zinc-800 -z-10" />
            )}

            {/* Icone */}
            <div
              className={cn(
                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                config.color
              )}
            >
              <Icon className="h-5 w-5" />
            </div>

            {/* Conteudo */}
            <div className="flex-1 min-w-0 pb-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-white">
                    {config.label}
                  </span>
                  {activity.user && (
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {activity.user.name || activity.user.email}
                    </span>
                  )}
                </div>
                <span className="text-xs text-zinc-500 whitespace-nowrap">
                  {formatDistanceToNow(new Date(activity.createdAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>

              {/* Data completa */}
              <p className="text-xs text-zinc-600 mb-2">
                {format(new Date(activity.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>

              {/* Descricao */}
              <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words">
                {activity.description}
              </p>

              {/* Fotos */}
              {activity.photos && activity.photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {activity.photos.map((photo, photoIndex) => (
                    <a
                      key={photoIndex}
                      href={photo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-16 h-16 rounded-md overflow-hidden bg-zinc-800 hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={photo}
                        alt={`Foto ${photoIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
