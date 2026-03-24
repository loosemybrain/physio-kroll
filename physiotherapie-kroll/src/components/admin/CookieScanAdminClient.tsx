"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Play, Cookie, ArrowLeft, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type ScanStatus = "queued" | "running" | "success" | "failed"
type ApprovalStatus = "draft" | "reviewed" | "approved" | "rejected"

type ScanListItem = {
  id: string
  targetUrl: string
  environment: string
  scannedAt: string | null
  status: ScanStatus
  consentMode: string
  approvalStatus: ApprovalStatus
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

type ScanItem = {
  id: string
  scanId: string
  name: string
  domain: string
  path: string
  category: string | null
  purpose: string | null
  duration: string | null
  secure: boolean
  httpOnly: boolean
  sameSite: string | null
  provider: string | null
  sourceUrl: string | null
  isThirdParty: boolean
  notes: string | null
  createdAt: string
}

const DEFAULT_TARGET_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export function CookieScanAdminClient() {
  const { toast } = useToast()
  const [scans, setScans] = useState<ScanListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [runStatus, setRunStatus] = useState<"idle" | "running">("idle")
  const [targetUrl, setTargetUrl] = useState(DEFAULT_TARGET_URL)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<{ scan: ScanListItem; items: ScanItem[] } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ category: "", purpose: "", provider: "", notes: "" })
  const [clearingList, setClearingList] = useState(false)

  const loadScans = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/cookie-scan")
      const data = await res.json().catch(() => ({}))
      setScans(Array.isArray(data.scans) ? data.scans : [])
      if (!res.ok) {
        const msg = data.error ?? "Scans konnten nicht geladen werden"
        toast({ title: "Fehler", description: msg, variant: "destructive" })
      }
    } catch (e) {
      toast({
        title: "Fehler",
        description: e instanceof Error ? e.message : "Unbekannter Fehler",
        variant: "destructive",
      })
      setScans([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadScans()
  }, [loadScans])

  // Polling, solange mindestens ein Scan queued oder running ist
  const hasPending = scans.some((s) => s.status === "queued" || s.status === "running")
  useEffect(() => {
    if (!hasPending) return
    const t = setInterval(loadScans, 5000)
    return () => clearInterval(t)
  }, [hasPending, loadScans])

  const loadDetail = useCallback(
    async (id: string) => {
      setDetailLoading(true)
      setSelectedId(id)
      try {
        const res = await fetch(`/api/admin/cookie-scan/${id}`)
        if (!res.ok) throw new Error("Scan konnte nicht geladen werden")
        const data = await res.json()
        setDetail({ scan: data.scan, items: data.items ?? [] })
      } catch (e) {
        toast({
          title: "Fehler",
          description: e instanceof Error ? e.message : "Unbekannter Fehler",
          variant: "destructive",
        })
        setDetail(null)
      } finally {
        setDetailLoading(false)
      }
    },
    [toast]
  )

  const handleRunScan = async () => {
    if (runStatus === "running") return
    setRunStatus("running")
    try {
      const res = await fetch("/api/admin/cookie-scan/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: targetUrl || DEFAULT_TARGET_URL,
          consentMode: "accepted",
          environment: "production",
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Job konnte nicht angelegt werden")
      }
      toast({
        title: "Scan in Warteschlange",
        description: data.message ?? "Ein Worker verarbeitet den Job. Liste wird aktualisiert.",
        variant: "default",
      })
      await loadScans()
      if (data.id) loadDetail(data.id)
    } catch (e) {
      toast({
        title: "Fehler",
        description: e instanceof Error ? e.message : "Unbekannter Fehler",
        variant: "destructive",
      })
    } finally {
      setRunStatus("idle")
    }
  }

  const handleSetApproval = async (scanId: string, approvalStatus: ApprovalStatus) => {
    try {
      const res = await fetch(`/api/admin/cookie-scan/${scanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus }),
      })
      if (!res.ok) throw new Error("Freigabe konnte nicht gespeichert werden")
      toast({
        title: "Gespeichert",
        description: `Status: ${approvalStatus === "approved" ? "Freigegeben" : approvalStatus === "reviewed" ? "Geprüft" : approvalStatus === "rejected" ? "Abgelehnt" : "Entwurf"}`,
      })
      await loadScans()
      if (detail?.scan.id === scanId) {
        setDetail((d) => (d ? { ...d, scan: { ...d.scan, approvalStatus } } : null))
      }
    } catch (e) {
      toast({
        title: "Fehler",
        description: e instanceof Error ? e.message : "Unbekannter Fehler",
        variant: "destructive",
      })
    }
  }

  const handleSaveItem = async (scanId: string, itemId: string) => {
    try {
      const res = await fetch(`/api/admin/cookie-scan/${scanId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error("Item konnte nicht gespeichert werden")
      toast({ title: "Gespeichert" })
      setEditingItemId(null)
      if (detail?.scan.id === scanId) {
        const updated = await fetch(`/api/admin/cookie-scan/${scanId}`).then((r) => r.json())
        setDetail({ scan: updated.scan, items: updated.items ?? [] })
      }
    } catch (e) {
      toast({
        title: "Fehler",
        description: e instanceof Error ? e.message : "Unbekannter Fehler",
        variant: "destructive",
      })
    }
  }

  const handleClearAllScans = async () => {
    if (scans.length === 0 || clearingList) return
    const ok = window.confirm(
      "Alle Cookie-Scans und zugehörigen Cookie-Einträge unwiderruflich löschen?"
    )
    if (!ok) return
    setClearingList(true)
    try {
      const res = await fetch("/api/admin/cookie-scan", { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error ?? "Liste konnte nicht geleert werden")
      }
      setScans([])
      setSelectedId(null)
      setDetail(null)
      toast({
        title: "Gelöscht",
        description:
          typeof data.deletedScans === "number"
            ? `${data.deletedScans} Scan(s) entfernt.`
            : "Alle Scans wurden entfernt.",
      })
    } catch (e) {
      toast({
        title: "Fehler",
        description: e instanceof Error ? e.message : "Unbekannter Fehler",
        variant: "destructive",
      })
    } finally {
      setClearingList(false)
    }
  }

  if (detail && selectedId) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Liste
        </Button>

        <div className="rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <span className="font-medium">Scan: {detail.scan.targetUrl}</span>
            <Badge variant={detail.scan.status === "success" ? "default" : detail.scan.status === "failed" ? "destructive" : "secondary"}>
              {detail.scan.status === "running" && <Loader2 className="h-3 w-3 animate-spin mr-1 inline" />}
              {detail.scan.status === "queued" ? "Warteschlange" : detail.scan.status}
            </Badge>
            <Badge variant="outline">{detail.scan.approvalStatus}</Badge>
            <span className="text-sm text-muted-foreground">
              {detail.scan.scannedAt ? new Date(detail.scan.scannedAt).toLocaleString("de-DE") : "—"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Label className="sr-only">Freigabe</Label>
            <Select
              value={detail.scan.approvalStatus}
              onValueChange={(v) => handleSetApproval(detail.scan.id, v as ApprovalStatus)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Entwurf</SelectItem>
                <SelectItem value="reviewed">Geprüft</SelectItem>
                <SelectItem value="approved">Freigegeben</SelectItem>
                <SelectItem value="rejected">Abgelehnt</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {detail.scan.errorMessage && (
            <p className="mt-2 text-sm text-destructive">{detail.scan.errorMessage}</p>
          )}
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <h3 className="px-4 py-3 font-medium border-b border-border">Cookies ({detail.items.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">Domain</th>
                  <th className="px-4 py-2 text-left font-medium">Kategorie</th>
                  <th className="px-4 py-2 text-left font-medium">Zweck</th>
                  <th className="px-4 py-2 text-left font-medium">Anbieter</th>
                  <th className="px-4 py-2 text-left font-medium">Laufzeit</th>
                  <th className="px-4 py-2 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {detail.items.map((it) => (
                  <tr key={it.id} className="border-b border-border/50">
                    <td className="px-4 py-2 font-mono text-xs">{it.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">{it.domain}</td>
                    <td className="px-4 py-2">{it.category ?? "—"}</td>
                    <td className="px-4 py-2">{it.purpose ?? "—"}</td>
                    <td className="px-4 py-2">{it.provider ?? "—"}</td>
                    <td className="px-4 py-2">{it.duration ?? "—"}</td>
                    <td className="px-4 py-2">
                      {editingItemId === it.id ? (
                        <div className="space-y-2 min-w-[280px]">
                          <Input
                            placeholder="Kategorie"
                            value={editForm.category}
                            onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                            className="h-8"
                          />
                          <Input
                            placeholder="Zweck"
                            value={editForm.purpose}
                            onChange={(e) => setEditForm((f) => ({ ...f, purpose: e.target.value }))}
                            className="h-8"
                          />
                          <Input
                            placeholder="Anbieter"
                            value={editForm.provider}
                            onChange={(e) => setEditForm((f) => ({ ...f, provider: e.target.value }))}
                            className="h-8"
                          />
                          <Input
                            placeholder="Notizen"
                            value={editForm.notes}
                            onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                            className="h-8"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveItem(detail.scan.id, it.id)}
                            >
                              Speichern
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingItemId(null)}
                            >
                              Abbrechen
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingItemId(it.id)
                            setEditForm({
                              category: it.category ?? "",
                              purpose: it.purpose ?? "",
                              provider: it.provider ?? "",
                              notes: it.notes ?? "",
                            })
                          }}
                        >
                          Bearbeiten
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border p-4 max-w-xl">
        <h2 className="font-medium mb-3">Scan starten</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Scan-Job wird in die Warteschlange gelegt; ein separater Worker (Docker) führt den Browser-Scan aus und schreibt die Ergebnisse in die Datenbank.
        </p>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="target-url" className="text-xs">Ziel-URL</Label>
            <Input
              id="target-url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1"
            />
          </div>
          <Button
            onClick={handleRunScan}
            disabled={runStatus === "running"}
            className="gap-2"
          >
            {runStatus === "running" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {runStatus === "running" ? "Scan läuft…" : "Scan starten"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border">
          <h2 className="font-medium">Scans</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive"
            disabled={loading || scans.length === 0 || clearingList}
            onClick={(e) => {
              e.stopPropagation()
              void handleClearAllScans()
            }}
          >
            {clearingList ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Alle löschen
          </Button>
        </div>
        {loading ? (
          <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Lade…
          </div>
        ) : scans.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Noch keine Scans. Starten Sie einen Scan.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {scans.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-4 px-4 py-3 hover:bg-muted/30 cursor-pointer"
                onClick={() => loadDetail(s.id)}
              >
                <Cookie className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-mono text-sm truncate flex-1 min-w-0">{s.targetUrl}</span>
                <Badge variant={s.status === "success" ? "default" : s.status === "failed" ? "destructive" : "secondary"}>
                  {(s.status === "running" || s.status === "queued") && <Loader2 className="h-3 w-3 animate-spin mr-1 inline" />}
                  {s.status === "queued" ? "Warteschlange" : s.status}
                </Badge>
                <Badge variant="outline">{s.approvalStatus}</Badge>
                <span className="text-xs text-muted-foreground">
                  {s.scannedAt ? new Date(s.scannedAt).toLocaleString("de-DE") : new Date(s.createdAt).toLocaleString("de-DE")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
