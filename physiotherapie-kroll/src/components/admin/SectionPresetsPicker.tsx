"use client"

import * as React from "react"
import type { BrandKey } from "@/components/brand/brandAssets"
import type { BlockSectionProps, SectionBackgroundPreset } from "@/types/cms"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { applyPresetToSection } from "@/lib/cms/sectionPresets"
import { defaultSectionPresets } from "@/lib/cms/sectionPresets"

function previewStyle(preset: SectionBackgroundPreset): React.CSSProperties | undefined {
  const bg = preset.section.background
  if (!bg) return undefined
  if (bg.type === "color") return { background: bg.color?.value ?? "transparent" }
  if (bg.type === "gradient") {
    const g = bg.gradient
    if (!g) return undefined
    const stops = (g.stops ?? []).map((s) => `${s.color} ${s.pos}%`).join(", ")
    if (!stops) return undefined
    if (g.kind === "radial") return { background: `radial-gradient(circle, ${stops})` }
    if (g.kind === "conic") return { background: `conic-gradient(from 0deg, ${stops})` }
    return { background: `linear-gradient(${g.direction ?? "to bottom"}, ${stops})` }
  }
  if (bg.type === "image") {
    // no media preview here (needs url resolution) – show placeholder
    return { background: "linear-gradient(135deg, #111827, #334155)" }
  }
  if (bg.type === "video") return { background: "linear-gradient(135deg, #0b1220, #111827)" }
  return undefined
}

export function SectionPresetsPicker(props: {
  brand: BrandKey
  currentSection: BlockSectionProps | undefined
  onApply: (nextSection: BlockSectionProps) => void
  onApplyBackgroundOnly: (nextSection: BlockSectionProps) => void
  onSaveCurrentAsPreset: (name: string, description: string | undefined) => Promise<void>
}) {
  const [open, setOpen] = React.useState(false)
  const [presets, setPresets] = React.useState<SectionBackgroundPreset[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState("")

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/section-presets?brand=${encodeURIComponent(props.brand)}`, { cache: "no-store" })
      if (!res.ok) throw new Error("Presets konnten nicht geladen werden")
      const data = (await res.json()) as { presets?: SectionBackgroundPreset[] }
      setPresets((data.presets ?? []).filter((p) => p && p.id && p.name && p.section))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Laden")
    } finally {
      setLoading(false)
    }
  }, [props.brand])

  React.useEffect(() => {
    if (open) load()
  }, [load, open])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return presets
    return presets.filter((p) => {
      const hay = `${p.name} ${p.description ?? ""}`.toLowerCase()
      return hay.includes(q)
    })
  }, [presets, query])

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">Presets (Popup)</div>
        <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => setOpen(true)}>
          Presets öffnen
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="h-[85vh] w-[90vw] max-w-[90vw] overflow-hidden sm:max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Section/Background Presets</DialogTitle>
            <DialogDescription>
              Wähle ein Preset aus. Du kannst auch die aktuelle Section als Preset speichern oder die Default-Presets
              wiederherstellen.
            </DialogDescription>
          </DialogHeader>

          <div className="flex h-full flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Suchen…"
                  className="h-8 text-sm sm:w-72"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    setQuery("")
                    void load()
                  }}
                >
                  Neu laden
                </Button>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={async () => {
                    const name = window.prompt("Preset-Name")
                    if (!name?.trim()) return
                    const description = window.prompt("Beschreibung (optional)") || undefined
                    await props.onSaveCurrentAsPreset(name.trim(), description?.trim() || undefined)
                    await load()
                  }}
                >
                  Aktuelle Section als Preset speichern
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-8"
                  onClick={async () => {
                    const ok = window.confirm("Default-Presets für diese Brand wiederherstellen? (überschreibt die Liste)")
                    if (!ok) return
                    const defaults = defaultSectionPresets(props.brand)
                    const saveRes = await fetch("/api/admin/section-presets", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ brand: props.brand, presets: defaults }),
                    })
                    if (!saveRes.ok) {
                      const err = await saveRes.json().catch(() => ({}))
                      throw new Error(err?.error || "Defaults konnten nicht gespeichert werden")
                    }
                    await load()
                  }}
                >
                  Default-Presets wiederherstellen
                </Button>
              </div>
            </div>

            <Separator />

            {loading ? (
              <div className="text-xs text-muted-foreground">Lade Presets…</div>
            ) : error ? (
              <div className="text-xs text-destructive">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="text-xs text-muted-foreground">Keine Presets gefunden.</div>
            ) : (
              <ScrollArea className="min-h-0 flex-1 pr-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {filtered.map((p) => (
                    <div key={p.id} className="rounded-md border border-border bg-card p-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn("h-10 w-10 rounded-sm border border-border")}
                          style={previewStyle(p)}
                          aria-hidden="true"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{p.name}</div>
                          {p.description && (
                            <div className="text-xs text-muted-foreground line-clamp-2">{p.description}</div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="h-8"
                          onClick={() => {
                            props.onApply(applyPresetToSection(props.currentSection, p, "full"))
                            setOpen(false)
                          }}
                        >
                          Anwenden
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => {
                            props.onApplyBackgroundOnly(applyPresetToSection(props.currentSection, p, "backgroundOnly"))
                            setOpen(false)
                          }}
                        >
                          Nur Background
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

