"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Eye, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageField } from "@/components/admin/ImageField"
import { ColorField } from "@/components/admin/ColorField"
import { usePopup } from "@/lib/popups/useAdminPopups"
import type { AdminPopup, PublicPopup } from "@/types/popups"
import {
  POPUP_ANIMATION_VARIANTS,
  POPUP_DESIGN_VARIANTS,
  POPUP_LAYOUT_VARIANTS,
  POPUP_POSITIONS,
  POPUP_SIZES,
  POPUP_TRIGGER_TYPES,
} from "@/types/popups"
import { listPages, type AdminPageSummary } from "@/lib/cms/supabaseStore"
import { PopupModal } from "@/components/popups/PopupModal"
import { POPUP_PRESET_KEYS, applyPopupPreset, type PopupPresetKey } from "@/lib/popups/presets"

type Props = { popupId: string | null }

function toDatetimeLocal(iso: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocal(v: string) {
  if (!v) return null
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function asPublicPopup(p: AdminPopup): PublicPopup {
  return {
    id: p.id,
    headline: p.content.headline,
    body: p.content.body,
    imageUrl: p.content.imageUrl,
    ctaLabel: p.content.ctaLabel,
    ctaUrl: p.content.ctaUrl,
    closeLabel: p.content.closeLabel,

    triggerType: p.trigger.triggerType,
    triggerDelaySeconds: p.trigger.triggerDelaySeconds,
    triggerScrollPercent: p.trigger.triggerScrollPercent,
    showOncePerSession: p.trigger.showOncePerSession,
    showOncePerBrowser: p.trigger.showOncePerBrowser,

    allPages: p.allPages,

    designVariant: p.design.designVariant,
    size: p.design.size,
    position: p.design.position,
    layoutVariant: p.design.layoutVariant,
    animationVariant: p.design.animationVariant,
    animationFadeInMs: p.design.animationFadeInMs,
    animationFadeOutMs: p.design.animationFadeOutMs,
    bgColor: p.design.bgColor,
    textColor: p.design.textColor,
    overlayOpacity: p.design.overlayOpacity,
    borderRadius: p.design.borderRadius,
    shadowPreset: p.design.shadowPreset,
    buttonVariant: p.design.buttonVariant,
    showCloseIcon: p.design.showCloseIcon,
    closeOnOverlay: p.behavior.closeOnOverlay,
    closeOnEscape: p.behavior.closeOnEscape,

    priority: p.priority,
    updatedAt: p.updatedAt,
  }
}

export function PopupEditorClient({ popupId }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { popup, setPopup, save, loading, error } = usePopup(popupId)
  const [saving, setSaving] = useState(false)
  const [pages, setPages] = useState<AdminPageSummary[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const presetAppliedRef = useRef(false)

  const presetKey = (searchParams?.get("preset") ?? "") as PopupPresetKey

  const compatibleLayoutVariants = useMemo(() => {
    const dv = popup?.design.designVariant ?? "promotion"
    if (dv === "announcement") return ["no_image", "image_top", "image_left"] as const
    return ["image_top", "image_left", "no_image"] as const
  }, [popup?.design.designVariant])

  const layoutHelp = useMemo(() => {
    const dv = popup?.design.designVariant ?? "promotion"
    if (dv === "announcement") {
      return "Announcement: reduziert (no_image bevorzugt), image_top optional, image_left nur wenn es sauber passt."
    }
    return "Promotion: bildstark (image_top/image_left), no_image nur als Fallback."
  }, [popup?.design.designVariant])

  useEffect(() => {
    if (popupId) return
    if (!popup) return
    if (presetAppliedRef.current) return
    if (!POPUP_PRESET_KEYS.includes(presetKey as any)) return
    setPopup(applyPopupPreset(popup, presetKey))
    presetAppliedRef.current = true
  }, [popupId, popup, presetKey, setPopup])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const data = await listPages()
        if (!cancelled) setPages(data)
      } catch {
        if (!cancelled) setPages([])
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  // If an image is set, make sure the preview can actually show it.
  // Keep user-chosen image_left, but avoid "no_image" hiding a provided image.
  useEffect(() => {
    if (!popup) return
    const hasImage = !!popup.content.imageUrl
    if (!hasImage) return
    if (popup.design.layoutVariant === "no_image") {
      const nextLayout = popup.design.designVariant === "announcement" ? "image_left" : "image_top"
      setPopup({ ...popup, design: { ...popup.design, layoutVariant: nextLayout } })
    }
  }, [popup?.content.imageUrl])

  const title = popup?.name ?? "Popup"

  const canPreview = !!popup
  const previewPopup = useMemo(() => (popup ? asPublicPopup(popup) : null), [popup])

  const handleSave = async () => {
    if (!popup) return
    try {
      setSaving(true)
      const saved = await save(popup)
      setPopup(saved)
    } finally {
      setSaving(false)
    }
  }

  const selectedPages = useMemo(() => {
    if (!popup) return []
    const set = new Set(popup.selectedPageIds)
    return pages.filter((p) => set.has(p.id))
  }, [pages, popup])

  if (loading && !popup) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Lade…</p>
      </div>
    )
  }

  if (!popup) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Popup nicht gefunden.</p>
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => router.push("/admin/popups")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>
            </div>
            <h1 className="mt-2 text-2xl font-bold">{title}</h1>
            {error ? <p className="mt-1 text-sm text-destructive">Fehler: {String((error as any)?.message ?? error)}</p> : null}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(true)} disabled={!canPreview}>
              <Eye className="mr-2 h-4 w-4" />
              Vorschau
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Speichere…" : "Speichern"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Basis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Titel / interne Bezeichnung</Label>
                  <Input
                    id="name"
                    value={popup.name}
                    onChange={(e) => setPopup({ ...popup, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (optional)</Label>
                  <Input
                    id="slug"
                    value={popup.slug ?? ""}
                    onChange={(e) => setPopup({ ...popup, slug: e.target.value || null })}
                    placeholder="z. B. fruehjahrs-aktion"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                  <div>
                    <div className="text-sm font-medium">Aktiv</div>
                    <div className="text-xs text-muted-foreground">Popup wird angezeigt</div>
                  </div>
                  <Switch checked={popup.isActive} onCheckedChange={(v) => setPopup({ ...popup, isActive: v })} />
                </div>
                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="priority">Priorität</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={popup.priority}
                    onChange={(e) => setPopup({ ...popup, priority: Number(e.target.value || 0) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Interne Notizen (optional)</Label>
                <Textarea
                  id="notes"
                  value={popup.internalNotes ?? ""}
                  onChange={(e) => setPopup({ ...popup, internalNotes: e.target.value || null })}
                  placeholder="Nur im Admin sichtbar…"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inhalt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageField
                id="imageUrl"
                label="Bild (optional)"
                value={popup.content.imageUrl ?? ""}
                onChange={(v) => setPopup({ ...popup, content: { ...popup.content, imageUrl: v || null } })}
              />

              <div className="space-y-2">
                <Label htmlFor="headline">Überschrift</Label>
                <Input
                  id="headline"
                  value={popup.content.headline ?? ""}
                  onChange={(e) => setPopup({ ...popup, content: { ...popup.content, headline: e.target.value || null } })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Text / Beschreibung</Label>
                <Textarea
                  id="body"
                  value={popup.content.body ?? ""}
                  onChange={(e) => setPopup({ ...popup, content: { ...popup.content, body: e.target.value || null } })}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ctaLabel">CTA-Text (optional)</Label>
                  <Input
                    id="ctaLabel"
                    value={popup.content.ctaLabel ?? ""}
                    onChange={(e) => setPopup({ ...popup, content: { ...popup.content, ctaLabel: e.target.value || null } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctaUrl">CTA-Link (optional)</Label>
                  <Input
                    id="ctaUrl"
                    value={popup.content.ctaUrl ?? ""}
                    onChange={(e) => setPopup({ ...popup, content: { ...popup.content, ctaUrl: e.target.value || null } })}
                    placeholder="https://…"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="closeLabel">Schließen-Button-Text (optional)</Label>
                <Input
                  id="closeLabel"
                  value={popup.content.closeLabel ?? ""}
                  onChange={(e) => setPopup({ ...popup, content: { ...popup.content, closeLabel: e.target.value || null } })}
                  placeholder="Schließen"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scheduling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startsAt">Startdatum/-zeit</Label>
                  <Input
                    id="startsAt"
                    type="datetime-local"
                    value={toDatetimeLocal(popup.scheduling.startsAt)}
                    onChange={(e) =>
                      setPopup({ ...popup, scheduling: { ...popup.scheduling, startsAt: fromDatetimeLocal(e.target.value) } })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endsAt">Enddatum/-zeit</Label>
                  <Input
                    id="endsAt"
                    type="datetime-local"
                    value={toDatetimeLocal(popup.scheduling.endsAt)}
                    onChange={(e) =>
                      setPopup({ ...popup, scheduling: { ...popup.scheduling, endsAt: fromDatetimeLocal(e.target.value) } })
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Hinweis: Die Speicherung erfolgt in UTC (timestamptz). Anzeige-/Eingabe-Werte werden lokal umgerechnet.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trigger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Trigger-Typ</Label>
                <Select
                  value={popup.trigger.triggerType}
                  onValueChange={(v) => {
                    const next = v as "immediate" | "delay" | "scroll"
                    if (next === "delay") {
                      setPopup({
                        ...popup,
                        trigger: {
                          ...popup.trigger,
                          triggerType: "delay",
                          triggerDelaySeconds: popup.trigger.triggerDelaySeconds ?? 3,
                          triggerScrollPercent: null,
                        },
                      })
                      return
                    }
                    if (next === "scroll") {
                      setPopup({
                        ...popup,
                        trigger: {
                          ...popup.trigger,
                          triggerType: "scroll",
                          triggerScrollPercent: popup.trigger.triggerScrollPercent ?? 50,
                          triggerDelaySeconds: null,
                        },
                      })
                      return
                    }
                    // immediate
                    setPopup({
                      ...popup,
                      trigger: {
                        ...popup.trigger,
                        triggerType: "immediate",
                        triggerDelaySeconds: null,
                        triggerScrollPercent: null,
                      },
                    })
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Trigger wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {POPUP_TRIGGER_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t === "immediate" ? "Sofort" : t === "delay" ? "Nach X Sekunden" : "Bei Scroll %"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {popup.trigger.triggerType === "delay" ? (
                <div className="space-y-2">
                  <Label htmlFor="delaySeconds">Verweildauer (Sekunden)</Label>
                  <Input
                    id="delaySeconds"
                    type="number"
                    min={0}
                    value={popup.trigger.triggerDelaySeconds ?? 0}
                    onChange={(e) =>
                      setPopup({
                        ...popup,
                        trigger: { ...popup.trigger, triggerDelaySeconds: Number(e.target.value || 0), triggerScrollPercent: null },
                      })
                    }
                  />
                </div>
              ) : null}

              {popup.trigger.triggerType === "scroll" ? (
                <div className="space-y-2">
                  <Label htmlFor="scrollPercent">Scroll-Schwelle (%)</Label>
                  <Input
                    id="scrollPercent"
                    type="number"
                    min={0}
                    max={100}
                    value={popup.trigger.triggerScrollPercent ?? 50}
                    onChange={(e) =>
                      setPopup({
                        ...popup,
                        trigger: { ...popup.trigger, triggerScrollPercent: Number(e.target.value || 0), triggerDelaySeconds: null },
                      })
                    }
                  />
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                  <div>
                    <div className="text-sm font-medium">Nur einmal pro Sitzung</div>
                    <div className="text-xs text-muted-foreground">SessionStorage</div>
                  </div>
                  <Switch
                    checked={popup.trigger.showOncePerSession}
                    onCheckedChange={(v) => setPopup({ ...popup, trigger: { ...popup.trigger, showOncePerSession: v } })}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                  <div>
                    <div className="text-sm font-medium">Nur einmal pro Browser</div>
                    <div className="text-xs text-muted-foreground">LocalStorage</div>
                  </div>
                  <Switch
                    checked={popup.trigger.showOncePerBrowser}
                    onCheckedChange={(v) => setPopup({ ...popup, trigger: { ...popup.trigger, showOncePerBrowser: v } })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Seiten-Zuordnung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">Auf allen Seiten anzeigen</div>
                  <div className="text-xs text-muted-foreground">Wenn aktiv, ignoriert die Auswahl unten.</div>
                </div>
                <Switch
                  checked={popup.allPages}
                  onCheckedChange={(v) => setPopup({ ...popup, allPages: v, selectedPageIds: v ? [] : popup.selectedPageIds })}
                />
              </div>

              {!popup.allPages ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-md border p-3">
                    <div className="mb-2 text-sm font-medium">Ausgewählte Seiten</div>
                    {selectedPages.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Noch keine Seiten ausgewählt.</p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {selectedPages.map((p) => (
                          <li key={p.id} className="flex items-center justify-between gap-2">
                            <span className="truncate">{p.title}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setPopup({
                                  ...popup,
                                  selectedPageIds: popup.selectedPageIds.filter((x) => x !== p.id),
                                })
                              }
                            >
                              Entfernen
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="rounded-md border p-3">
                    <div className="mb-2 text-sm font-medium">Seiten auswählen</div>
                    <div className="max-h-64 overflow-y-auto pr-1">
                      <ul className="space-y-2">
                        {pages.map((p) => {
                          const checked = popup.selectedPageIds.includes(p.id)
                          return (
                            <li key={p.id} className="flex items-start gap-2">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) => {
                                  const next = !!v
                                  setPopup({
                                    ...popup,
                                    selectedPageIds: next
                                      ? Array.from(new Set([...popup.selectedPageIds, p.id]))
                                      : popup.selectedPageIds.filter((x) => x !== p.id),
                                  })
                                }}
                              />
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{p.title}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  /{p.brand === "physio-konzept" ? "konzept/" : ""}{p.slug}
                                </div>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Design</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Design-Variante</Label>
                <Select
                  value={popup.design.designVariant}
                  onValueChange={(v) => {
                    const next = v as any
                    // Enforce sensible layout defaults per design variant
                    const currentLayout = popup.design.layoutVariant
                    const hasImage = !!popup.content.imageUrl
                    let nextLayout = currentLayout
                    if (next === "announcement") {
                      // Prefer image_left when an image exists (v0 style); otherwise no_image
                      nextLayout = hasImage ? "image_left" : "no_image"
                    } else {
                      // promotion prefers image layouts; keep no_image only if no image exists
                      nextLayout = hasImage ? (currentLayout === "no_image" ? "image_top" : currentLayout) : currentLayout
                      if (hasImage && nextLayout === "no_image") nextLayout = "image_top"
                    }

                    setPopup({
                      ...popup,
                      design: { ...popup.design, designVariant: next, layoutVariant: nextLayout },
                    })
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Variante" />
                  </SelectTrigger>
                  <SelectContent>
                    {POPUP_DESIGN_VARIANTS.map((dv) => (
                      <SelectItem key={dv} value={dv}>
                        {dv === "promotion" ? "promotion – bildstark / CTA-orientiert" : "announcement – reduziert / info-orientiert"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{layoutHelp}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Größe</Label>
                  <Select
                    value={popup.design.size}
                    onValueChange={(v) => setPopup({ ...popup, design: { ...popup.design, size: v as any } })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Größe" />
                    </SelectTrigger>
                    <SelectContent>
                      {POPUP_SIZES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select
                    value={popup.design.position}
                    onValueChange={(v) => setPopup({ ...popup, design: { ...popup.design, position: v as any } })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Position" />
                    </SelectTrigger>
                    <SelectContent>
                      {POPUP_POSITIONS.map((pos) => (
                        <SelectItem key={pos} value={pos}>
                          {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Layout</Label>
                  <Select
                    value={popup.design.layoutVariant}
                    onValueChange={(v) => setPopup({ ...popup, design: { ...popup.design, layoutVariant: v as any } })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Layout" />
                    </SelectTrigger>
                    <SelectContent>
                      {compatibleLayoutVariants.map((lv) => (
                        <SelectItem key={lv} value={lv}>
                          {popup.design.designVariant === "promotion" && lv === "no_image" ? "no_image (Fallback)" : lv}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Animation</Label>
                  <Select
                    value={popup.design.animationVariant}
                    onValueChange={(v) => setPopup({ ...popup, design: { ...popup.design, animationVariant: v as any } })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Animation" />
                    </SelectTrigger>
                    <SelectContent>
                      {POPUP_ANIMATION_VARIANTS.map((av) => (
                        <SelectItem key={av} value={av}>
                          {av}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="animationFadeInMs">Fade-In Dauer (ms)</Label>
                  <Input
                    id="animationFadeInMs"
                    type="number"
                    min={100}
                    max={4000}
                    step={10}
                    value={popup.design.animationFadeInMs}
                    onChange={(e) =>
                      setPopup({
                        ...popup,
                        design: {
                          ...popup.design,
                          animationFadeInMs: Math.max(100, Math.min(4000, Number(e.target.value || 620))),
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="animationFadeOutMs">Fade-Out Dauer (ms)</Label>
                  <Input
                    id="animationFadeOutMs"
                    type="number"
                    min={80}
                    max={3000}
                    step={10}
                    value={popup.design.animationFadeOutMs}
                    onChange={(e) =>
                      setPopup({
                        ...popup,
                        design: {
                          ...popup.design,
                          animationFadeOutMs: Math.max(80, Math.min(3000, Number(e.target.value || 220))),
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bgColor">Hintergrundfarbe (optional)</Label>
                  <ColorField
                    value={popup.design.bgColor ?? ""}
                    onChange={(next) => setPopup({ ...popup, design: { ...popup.design, bgColor: next || null } })}
                    placeholder="#RRGGBB oder #RRGGBBAA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="textColor">Textfarbe (optional)</Label>
                  <ColorField
                    value={popup.design.textColor ?? ""}
                    onChange={(next) => setPopup({ ...popup, design: { ...popup.design, textColor: next || null } })}
                    placeholder="#RRGGBB oder #RRGGBBAA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="overlayOpacity">Overlay Opacity (0–1)</Label>
                  <Input
                    id="overlayOpacity"
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={popup.design.overlayOpacity ?? 0.5}
                    onChange={(e) =>
                      setPopup({ ...popup, design: { ...popup.design, overlayOpacity: Number(e.target.value || 0) } })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="borderRadius">Border radius (optional)</Label>
                  <Input
                    id="borderRadius"
                    value={popup.design.borderRadius ?? ""}
                    onChange={(e) => setPopup({ ...popup, design: { ...popup.design, borderRadius: e.target.value || null } })}
                    placeholder="z. B. 12px"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="shadowPreset">Schatten-Preset (optional)</Label>
                  <Input
                    id="shadowPreset"
                    value={popup.design.shadowPreset ?? ""}
                    onChange={(e) => setPopup({ ...popup, design: { ...popup.design, shadowPreset: e.target.value || null } })}
                    placeholder="none | sm | md | lg | xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buttonVariant">Button-Stil (optional)</Label>
                  <Input
                    id="buttonVariant"
                    value={popup.design.buttonVariant ?? ""}
                    onChange={(e) => setPopup({ ...popup, design: { ...popup.design, buttonVariant: e.target.value || null } })}
                    placeholder="z. B. default"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">Close-Icon oben rechts</div>
                  <div className="text-xs text-muted-foreground">X-Button anzeigen</div>
                </div>
                <Switch
                  checked={popup.design.showCloseIcon}
                  onCheckedChange={(v) => setPopup({ ...popup, design: { ...popup.design, showCloseIcon: v } })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verhalten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">Schließen per Overlay-Klick</div>
                  <div className="text-xs text-muted-foreground">Klick außerhalb des Popups</div>
                </div>
                <Switch
                  checked={popup.behavior.closeOnOverlay}
                  onCheckedChange={(v) => setPopup({ ...popup, behavior: { ...popup.behavior, closeOnOverlay: v } })}
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">ESC schließt Popup</div>
                  <div className="text-xs text-muted-foreground">Tastatur</div>
                </div>
                <Switch
                  checked={popup.behavior.closeOnEscape}
                  onCheckedChange={(v) => setPopup({ ...popup, behavior: { ...popup.behavior, closeOnEscape: v } })}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {previewPopup ? (
        <PopupModal popup={previewPopup} open={previewOpen} onOpenChange={setPreviewOpen} previewMode />
      ) : null}
    </>
  )
}

