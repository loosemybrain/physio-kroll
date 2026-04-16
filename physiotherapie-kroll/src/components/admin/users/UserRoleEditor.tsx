"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export type UserItem = {
  userId: string
  email: string
  displayName: string | null
  status: "active" | "invited" | "disabled"
  roles: string[]
  createdAt: string
}

type Props = {
  user: UserItem
  currentUserId: string
  onSaved: (roles: string[]) => void
  onError: (message: string) => void
  canManageOwner: boolean
}

const ROLE_OPTIONS = [
  { id: "user", label: "User", description: "Basisrolle" },
  { id: "editor", label: "Editor", description: "Inhalte bearbeiten" },
  { id: "admin", label: "Admin", description: "Adminbereich verwalten" },
  { id: "owner", label: "Owner", description: "Höchste Berechtigung" },
] as const

function roleBadgeVariant(role: string): "secondary" | "default" | "destructive" | "outline" {
  if (role === "owner") return "destructive"
  if (role === "admin") return "default"
  if (role === "editor") return "secondary"
  return "outline"
}

export function UserRoleEditor({ user, currentUserId, onSaved, onError, canManageOwner }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user.roles)
  const [saving, setSaving] = useState(false)

  const canEditOwnerTarget = canManageOwner || !user.roles.includes("owner")
  const isSelf = currentUserId === user.userId

  const visibleRoleOptions = useMemo(() => {
    if (canManageOwner) return ROLE_OPTIONS
    return ROLE_OPTIONS.filter((r) => r.id !== "owner")
  }, [canManageOwner])

  const toggleRole = (roleId: string) => {
    setSelectedRoles((prev) => {
      if (roleId === "user") return prev
      if (prev.includes(roleId)) {
        return prev.filter((r) => r !== roleId)
      }
      return [...prev, roleId]
    })
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      setSelectedRoles(user.roles)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const roles = Array.from(new Set([...selectedRoles, "user"]))
      const res = await fetch(`/api/admin/users/${user.userId}/roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        onError(payload.error ?? "Rollen konnten nicht gespeichert werden.")
        return
      }
      onSaved(Array.isArray(payload.roles) ? payload.roles : roles)
      setOpen(false)
    } catch (error) {
      onError(error instanceof Error ? error.message : "Rollen konnten nicht gespeichert werden.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 border-muted-foreground/25 bg-background px-3">
          Rollen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Rollen verwalten</DialogTitle>
          <DialogDescription>
            {user.displayName || user.email} ({user.userId})
          </DialogDescription>
        </DialogHeader>

        {!canEditOwnerTarget ? (
          <p className="text-sm text-destructive">Dieser Benutzer hat eine Owner-Rolle. Nur Owner dürfen diese Rollen ändern.</p>
        ) : null}

        <div className="space-y-3">
          {visibleRoleOptions.map((role) => {
            const checked = selectedRoles.includes(role.id)
            const disabled =
              saving ||
              !canEditOwnerTarget ||
              role.id === "user" ||
              (isSelf && (role.id === "admin" || role.id === "owner") && checked)
            return (
              <label
                key={role.id}
                className="flex items-start gap-3 rounded border border-muted-foreground/25 bg-muted/20 p-3 hover:bg-muted/30"
              >
                <Checkbox checked={checked} onCheckedChange={() => toggleRole(role.id)} disabled={disabled} />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{role.label}</span>
                    <Badge variant={roleBadgeVariant(role.id)}>{role.id}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{role.description}</p>
                </div>
              </label>
            )
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" className="border-muted-foreground/25 bg-background" onClick={() => setOpen(false)} disabled={saving}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving || !canEditOwnerTarget}>
            {saving ? "Speichern..." : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

