"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { UserTable } from "./UserTable"
import type { UserItem } from "./UserRoleEditor"

type Props = {
  currentUserId: string
  canManageOwner: boolean
}

export function UserManagementPage({ currentUserId, canManageOwner }: Props) {
  const { toast } = useToast()
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")

  const queryUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (search.trim()) params.set("search", search.trim())
    if (statusFilter !== "all") params.set("status", statusFilter)
    if (roleFilter !== "all") params.set("role", roleFilter)
    const query = params.toString()
    return query ? `/api/admin/users?${query}` : "/api/admin/users"
  }, [search, statusFilter, roleFilter])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch(queryUrl, { cache: "no-store" })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload.error ?? "Benutzer konnten nicht geladen werden.")
      }
      setUsers(Array.isArray(payload.users) ? payload.users : [])
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Benutzer konnten nicht geladen werden.",
        variant: "destructive",
      })
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryUrl])

  const onError = (message: string) => {
    toast({
      title: "Aktion fehlgeschlagen",
      description: message,
      variant: "destructive",
    })
  }

  const onRoleSaved = (userId: string, roles: string[]) => {
    setUsers((prev) => prev.map((u) => (u.userId === userId ? { ...u, roles: [...roles].sort() } : u)))
    toast({ title: "Rollen gespeichert" })
  }

  const onStatusSaved = (userId: string, status: UserItem["status"]) => {
    setUsers((prev) => prev.map((u) => (u.userId === userId ? { ...u, status } : u)))
    toast({ title: "Status gespeichert" })
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Benutzer</h1>
        <p className="text-sm text-muted-foreground">
          Benutzerstatus und Rollen serverseitig verwalten. Schreibende Aktionen erfordern Adminrechte und AAL2.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suche: Name, E-Mail, Rolle..."
          className="md:col-span-2 h-9 border-muted-foreground/25 bg-background"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 border-muted-foreground/25 bg-background">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="active">Aktiv</SelectItem>
            <SelectItem value="invited">Invited</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-9 border-muted-foreground/25 bg-background">
            <SelectValue placeholder="Rolle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Rollen</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-muted-foreground/25 bg-background p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{users.length} Benutzer gefunden</p>
          <Button
            variant="outline"
            className="h-9 border-muted-foreground/25 bg-background"
            onClick={() => void loadUsers()}
            disabled={loading}
          >
            Aktualisieren
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Benutzer werden geladen...
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">Keine Benutzer für die aktuellen Filter gefunden.</div>
        ) : (
          <UserTable
            users={users}
            currentUserId={currentUserId}
            canManageOwner={canManageOwner}
            onRolesSaved={onRoleSaved}
            onStatusSaved={onStatusSaved}
            onError={onError}
          />
        )}
      </div>
    </div>
  )
}

