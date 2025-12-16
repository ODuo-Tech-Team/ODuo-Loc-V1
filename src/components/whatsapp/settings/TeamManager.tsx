"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Trash2,
  Users,
  UserPlus,
  Loader2,
  Settings2,
  X,
} from "lucide-react"
import { toast } from "sonner"

interface Team {
  id: string
  name: string
  description?: string
  color?: string
  autoAssign: boolean
  assignmentMode: string
  members: TeamMember[]
  _count: {
    conversations: number
  }
}

interface TeamMember {
  id: string
  userId: string
  role: string
  user: {
    id: string
    name: string
    email: string
  }
}

interface User {
  id: string
  name: string
  email: string
}

export function TeamManager() {
  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)

  // Form state
  const [teamName, setTeamName] = useState("")
  const [teamDescription, setTeamDescription] = useState("")
  const [teamColor, setTeamColor] = useState("#10b981")
  const [autoAssign, setAutoAssign] = useState(true)
  const [assignmentMode, setAssignmentMode] = useState("round_robin")

  const fetchTeams = useCallback(async () => {
    try {
      const response = await fetch("/api/whatsapp/teams")
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams || [])
      }
    } catch (error) {
      console.error("Erro ao buscar times:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        const userList = Array.isArray(data) ? data : (data.users || [])
        setUsers(userList.filter((u: User) => (u as any).active !== false))
      }
    } catch (error) {
      console.error("Erro ao buscar usuarios:", error)
    }
  }, [])

  useEffect(() => {
    fetchTeams()
    fetchUsers()
  }, [fetchTeams, fetchUsers])

  const resetForm = () => {
    setTeamName("")
    setTeamDescription("")
    setTeamColor("#10b981")
    setAutoAssign(true)
    setAssignmentMode("round_robin")
    setEditingTeam(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setShowCreateDialog(true)
  }

  const handleOpenEdit = (team: Team) => {
    setTeamName(team.name)
    setTeamDescription(team.description || "")
    setTeamColor(team.color || "#10b981")
    setAutoAssign(team.autoAssign)
    setAssignmentMode(team.assignmentMode)
    setEditingTeam(team)
    setShowCreateDialog(true)
  }

  const handleSaveTeam = async () => {
    if (!teamName.trim()) {
      toast.error("Nome do time e obrigatorio")
      return
    }

    setSaving(true)
    try {
      const url = editingTeam
        ? `/api/whatsapp/teams/${editingTeam.id}`
        : "/api/whatsapp/teams"

      const response = await fetch(url, {
        method: editingTeam ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: teamName,
          description: teamDescription || null,
          color: teamColor,
          autoAssign,
          assignmentMode,
        }),
      })

      if (response.ok) {
        toast.success(editingTeam ? "Time atualizado" : "Time criado")
        setShowCreateDialog(false)
        resetForm()
        fetchTeams()
      } else {
        const data = await response.json()
        toast.error(data.error || "Erro ao salvar time")
      }
    } catch (error) {
      toast.error("Erro ao salvar time")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Tem certeza que deseja excluir este time?")) return

    try {
      const response = await fetch(`/api/whatsapp/teams/${teamId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Time excluido")
        fetchTeams()
      } else {
        toast.error("Erro ao excluir time")
      }
    } catch (error) {
      toast.error("Erro ao excluir time")
    }
  }

  const handleAddMember = async (teamId: string, userId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        toast.success("Membro adicionado")
        fetchTeams()
      } else {
        const data = await response.json()
        toast.error(data.error || "Erro ao adicionar membro")
      }
    } catch (error) {
      toast.error("Erro ao adicionar membro")
    }
  }

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/teams/${teamId}/members/${memberId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Membro removido")
        fetchTeams()
      } else {
        toast.error("Erro ao remover membro")
      }
    } catch (error) {
      toast.error("Erro ao remover membro")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Times de Atendimento</h3>
            <p className="text-sm text-zinc-500">
              Organize seus atendentes em times para distribuicao automatica
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={(open) => {
            if (!open) resetForm()
            setShowCreateDialog(open)
          }}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Time
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTeam ? "Editar Time" : "Criar Novo Time"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Nome do Time</label>
                  <Input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Ex: Vendas, Suporte"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descricao (opcional)</label>
                  <Input
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    placeholder="Descricao do time"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Cor</label>
                  <div className="flex gap-2 mt-1">
                    {["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"].map((color) => (
                      <button
                        key={color}
                        onClick={() => setTeamColor(color)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          teamColor === color ? "border-white" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoAssign"
                    checked={autoAssign}
                    onChange={(e) => setAutoAssign(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="autoAssign" className="text-sm">
                    Atribuicao automatica de conversas
                  </label>
                </div>
                {autoAssign && (
                  <div>
                    <label className="text-sm font-medium">Modo de Atribuicao</label>
                    <Select value={assignmentMode} onValueChange={setAssignmentMode}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="round_robin">Round Robin (rotativo)</SelectItem>
                        <SelectItem value="least_busy">Menos ocupado</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveTeam} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : editingTeam ? (
                      "Salvar"
                    ) : (
                      "Criar Time"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {teams.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum time criado ainda</p>
            <p className="text-sm">Crie times para organizar seus atendentes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="border border-zinc-800 rounded-lg p-4 bg-zinc-800/30"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: team.color || "#10b981" }}
                    />
                    <div>
                      <h4 className="font-medium">{team.name}</h4>
                      {team.description && (
                        <p className="text-sm text-zinc-500">{team.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {team._count?.conversations || 0} conversas
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenEdit(team)}
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-400"
                      onClick={() => handleDeleteTeam(team.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Membros */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-500 uppercase">
                      Membros ({team.members?.length || 0})
                    </span>
                    <Select
                      onValueChange={(userId) => handleAddMember(team.id, userId)}
                    >
                      <SelectTrigger className="w-auto h-7 text-xs">
                        <UserPlus className="h-3 w-3 mr-1" />
                        Adicionar
                      </SelectTrigger>
                      <SelectContent>
                        {users
                          .filter(
                            (u) => !team.members?.some((m) => m.userId === u.id)
                          )
                          .map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        {users.filter(
                          (u) => !team.members?.some((m) => m.userId === u.id)
                        ).length === 0 && (
                          <SelectItem value="none" disabled>
                            Todos os usuarios ja estao no time
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {team.members && team.members.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {team.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2 bg-zinc-800 px-2 py-1 rounded-lg"
                        >
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">
                              {member.user.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{member.user.name}</span>
                          <button
                            onClick={() => handleRemoveMember(team.id, member.id)}
                            className="text-zinc-500 hover:text-red-400"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500">
                      Nenhum membro no time
                    </p>
                  )}
                </div>

                {/* Config info */}
                <div className="mt-3 pt-3 border-t border-zinc-700 flex gap-4 text-xs text-zinc-500">
                  <span>
                    Auto-atribuicao: {team.autoAssign ? "Ativada" : "Desativada"}
                  </span>
                  {team.autoAssign && (
                    <span>
                      Modo:{" "}
                      {team.assignmentMode === "round_robin"
                        ? "Round Robin"
                        : team.assignmentMode === "least_busy"
                        ? "Menos ocupado"
                        : "Manual"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
