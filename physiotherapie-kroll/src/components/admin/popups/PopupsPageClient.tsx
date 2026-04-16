"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, RefreshCw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PopupsTable } from "./PopupsTable"
import { usePopups } from "@/lib/popups/useAdminPopups"
import { deletePopup, getPopup, upsertPopup } from "@/lib/popups/adminPopupsStore"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function PopupsPageClient() {
  const router = useRouter()
  const { popups, refresh, loading, error } = usePopups()
  const [popupToDelete, setPopupToDelete] = useState<{ id: string; name: string } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const stats = useMemo(() => {
    const active = popups.filter((p) => p.isActive).length
    return { total: popups.length, active }
  }, [popups])

  const handleNew = () => router.push("/admin/popups/new")
  const handleNewPreset = () => router.push("/admin/popups/new?preset=customer_default")
  const handleEdit = (id: string) => router.push(`/admin/popups/${id}`)

  const handleToggleActive = async (id: string) => {
    try {
      setBusyId(id)
      const full = await getPopup(id)
      if (!full) return
      await upsertPopup({ ...full, isActive: !full.isActive })
      await refresh()
    } finally {
      setBusyId(null)
    }
  }

  const handleRequestDelete = (id: string) => {
    const p = popups.find((x) => x.id === id)
    if (p) setPopupToDelete({ id: p.id, name: p.name })
  }

  const handleConfirmDelete = async () => {
    if (!popupToDelete) return
    await deletePopup(popupToDelete.id)
    setPopupToDelete(null)
    await refresh()
  }

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Popups</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{stats.total} gesamt</span>
            <span>•</span>
            <span>{stats.active} aktiv</span>
            {loading ? (
              <>
                <span>•</span>
                <span>Lade…</span>
              </>
            ) : null}
            {error ? (
              <>
                <span>•</span>
                <Badge variant="destructive">Fehler</Badge>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refresh()} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Aktualisieren
          </Button>
          <Button variant="outline" onClick={handleNewPreset}>
            <Sparkles className="mr-2 h-4 w-4" />
            Preset
          </Button>
          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" />
            Neues Popup
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <PopupsTable
            popups={popups}
            busyId={busyId}
            onEdit={handleEdit}
            onToggleActive={handleToggleActive}
            onDelete={handleRequestDelete}
          />
        </CardContent>
      </Card>

      <AlertDialog open={!!popupToDelete} onOpenChange={(open) => !open && setPopupToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Popup wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Das Popup &quot;{popupToDelete?.name ?? ""}&quot; wird unwiderruflich gelöscht. Diese Aktion kann nicht
              rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Popup löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

