"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { UserItem } from "./UserRoleEditor"

type Props = {
  user: UserItem
  currentUserId: string
  onSaved: (status: UserItem["status"]) => void
  onError: (message: string) => void
  canManageOwner: boolean
}

const STATUS_OPTIONS: Array<{ id: UserItem["status"]; label: string; variant: "default" | "secondary" | "destructive" }> = [
  { id: "active", label: "Aktiv", variant: "default" },
  { id: "invited", label: "Invited", variant: "secondary" },
  { id: "disabled", label: "Deaktiviert", variant: "destructive" },
]

export function UserStatusEditor({ user, currentUserId, onSaved, onError, canManageOwner }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<UserItem["status"]>(user.status)

  const isSelf = currentUserId === user.userId
  const isOwnerTarget = user.roles.includes("owner")
  const canEdit = !isOwnerTarget || canManageOwner

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${user.userId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        onError(payload.error ?? "Status konnte nicht aktualisiert werden.")
        return
      }
      onSaved((payload.status as UserItem["status"]) ?? status)
      setOpen(false)
    } catch (error) {
      onError(error instanceof Error ? error.message : "Status konnte nicht aktualisiert werden.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) setStatus(user.status) }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 border-muted-foreground/25 bg-background px-3">
          Status
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Status ändern</DialogTitle>
          <DialogDescription>{user.displayName || user.email}</DialogDescription>
        </DialogHeader>

        {!canEdit ? (
          <p className="text-sm text-destructive">Nur Owner dürfen den Status von Owner-Benutzern ändern.</p>
        ) : null}
        {isSelf ? <p className="text-xs text-muted-foreground">Eigenes Konto kann nicht deaktiviert werden.</p> : null}

        <div className="space-y-2">
          <Select value={status} onValueChange={(v) => setStatus(v as UserItem["status"])} disabled={saving || !canEdit}>
            <SelectTrigger className="h-9 border-muted-foreground/25 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  <span className="inline-flex items-center gap-2">
                    <Badge variant={option.variant}>{option.label}</Badge>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" className="border-muted-foreground/25 bg-background" onClick={() => setOpen(false)} disabled={saving}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving || !canEdit || (isSelf && status === "disabled")}>
            {saving ? "Speichern..." : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

