"use client"

import { Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { AdminPopupListItem } from "@/lib/popups/adminPopupsStore"

type Props = {
  popups: AdminPopupListItem[]
  busyId: string | null
  onEdit: (id: string) => void
  onToggleActive: (id: string) => void
  onDelete: (id: string) => void
}

function formatWindow(startsAt: string | null, endsAt: string | null) {
  const fmt = (v: string) => new Date(v).toLocaleString("de-DE")
  if (!startsAt && !endsAt) return "—"
  if (startsAt && !endsAt) return `ab ${fmt(startsAt)}`
  if (!startsAt && endsAt) return `bis ${fmt(endsAt)}`
  return `${fmt(startsAt!)} – ${fmt(endsAt!)}`
}

export function PopupsTable({ popups, busyId, onEdit, onToggleActive, onDelete }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Zeitfenster</TableHead>
          <TableHead>Priorität</TableHead>
          <TableHead>Seiten</TableHead>
          <TableHead>Aktualisiert</TableHead>
          <TableHead className="text-right">Aktionen</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {popups.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-muted-foreground">
              Noch keine Popups angelegt.
            </TableCell>
          </TableRow>
        ) : (
          popups.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.slug ? `slug: ${p.slug}` : p.id}</div>
              </TableCell>
              <TableCell>
                <Badge variant={p.isActive ? "default" : "secondary"}>{p.isActive ? "aktiv" : "inaktiv"}</Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap">{formatWindow(p.startsAt, p.endsAt)}</TableCell>
              <TableCell>{p.priority}</TableCell>
              <TableCell>
                {p.allPages ? (
                  <Badge variant="outline">Alle Seiten</Badge>
                ) : (
                  <div className="text-sm">
                    {p.assignedPages.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span>{p.assignedPages.slice(0, 2).map((x) => x.title).join(", ")}{p.assignedPages.length > 2 ? ` (+${p.assignedPages.length - 2})` : ""}</span>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap">{new Date(p.updatedAt).toLocaleString("de-DE")}</TableCell>
              <TableCell className="text-right">
                <div className="inline-flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(p.id)} title="Bearbeiten">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleActive(p.id)}
                    disabled={busyId === p.id}
                    title={p.isActive ? "Deaktivieren" : "Aktivieren"}
                  >
                    {p.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(p.id)} title="Löschen">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

