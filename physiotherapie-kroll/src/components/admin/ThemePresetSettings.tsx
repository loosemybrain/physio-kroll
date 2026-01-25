"use client"

import * as React from "react"
import type { BrandKey } from "@/components/brand/brandAssets"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ColorField } from "./ColorField"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Save, RotateCcw, Search, MoreVertical, Copy, Trash2, Edit, Check, Loader2, Plus } from "lucide-react"
import type { ThemePreset } from "@/lib/supabase/themePresets"
import { ALLOWED_THEME_TOKENS, filterThemeTokens } from "@/lib/theme/themePresetTokens"

type BrandState = {
  presets: ThemePreset[]
  activePresetId: string | null
}

type ThemePresetSettingsProps = {
  initial: Record<BrandKey, BrandState>
}

const COMMON_TOKENS: Array<(typeof ALLOWED_THEME_TOKENS)[number]> = [
  "--primary",
  "--primary-foreground",
  "--background",
  "--foreground",
  "--accent",
  "--accent-foreground",
  "--border",
  "--ring",
  "--card",
  "--card-foreground",
  "--hero-bg",
  "--hero-accent",
] as const

function tokenLabel(key: string): string {
  switch (key) {
    case "--primary":
      return "Primary"
    case "--primary-foreground":
      return "Primary Text"
    case "--background":
      return "Background"
    case "--foreground":
      return "Foreground"
    case "--accent":
      return "Accent"
    case "--accent-foreground":
      return "Accent Text"
    case "--border":
      return "Border"
    case "--ring":
      return "Ring"
    case "--card":
      return "Card"
    case "--card-foreground":
      return "Card Text"
    case "--hero-bg":
      return "Hero Background"
    case "--hero-accent":
      return "Hero Accent"
    default:
      return key
  }
}

function tokenValue(tokens: unknown, key: string): string | null {
  const filtered = filterThemeTokens(tokens)
  const normalizedKey = (key.startsWith("--") ? key : `--${key}`) as (typeof ALLOWED_THEME_TOKENS)[number]
  return filtered[normalizedKey] ?? null
}

function Swatch({ color, title }: { color: string; title: string }) {
  return (
    <div
      className="h-6 w-6 rounded-md border border-border"
      style={{ backgroundColor: color }}
      title={title}
      aria-label={title}
    />
  )
}

function applyPreviewTokens(el: HTMLElement, tokens: unknown) {
  const filtered = filterThemeTokens(tokens)

  // Clear previous values (only for whitelisted keys)
  for (const k of ALLOWED_THEME_TOKENS) {
    el.style.removeProperty(k)
  }

  for (const [k, v] of Object.entries(filtered)) {
    if (typeof v === "string" && v) el.style.setProperty(k, v)
  }
}

export function ThemePresetSettings({ initial }: ThemePresetSettingsProps) {
  const { toast } = useToast()
  const [activeBrand, setActiveBrand] = React.useState<BrandKey>("physiotherapy")

  // Ensure initial has valid structure
  const safeInitial: Record<BrandKey, BrandState> = {
    physiotherapy: {
      presets: initial?.physiotherapy?.presets ?? [],
      activePresetId: initial?.physiotherapy?.activePresetId ?? null,
    },
    "physio-konzept": {
      presets: initial?.["physio-konzept"]?.presets ?? [],
      activePresetId: initial?.["physio-konzept"]?.activePresetId ?? null,
    },
  }

  const [state, setState] = React.useState<Record<BrandKey, BrandState>>(safeInitial)
  // FIX: Rename pendingPresetId to selectedPresetId for clarity
  const [selectedPresetId, setSelectedPresetId] = React.useState<Record<BrandKey, string | null>>({
    physiotherapy: safeInitial.physiotherapy.activePresetId,
    "physio-konzept": safeInitial["physio-konzept"].activePresetId,
  })

  const [saving, setSaving] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState<string | null>(null)
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [editingPreset, setEditingPreset] = React.useState<ThemePreset | null>(null)
  const [editName, setEditName] = React.useState("")
  const [editTokensJson, setEditTokensJson] = React.useState("")
  const [editTokens, setEditTokens] = React.useState<Record<string, string>>({})
  const [showAllTokens, setShowAllTokens] = React.useState(false)
  const [showAdvancedJson, setShowAdvancedJson] = React.useState(false)
  const [jsonError, setJsonError] = React.useState<string | null>(null)
  const [lastTokensEditSource, setLastTokensEditSource] = React.useState<"picker" | "json">("picker")
  const [savingEdit, setSavingEdit] = React.useState(false)

  // Important: Tabs render multiple preview containers; keep a ref per brand so the preview
  // always updates the *visible* container.
  const previewRefs = React.useRef<Partial<Record<BrandKey, HTMLDivElement | null>>>({})

  const current = state[activeBrand] ?? { presets: [], activePresetId: null }
  const currentSelectedId = selectedPresetId[activeBrand] ?? null
  const isDirty = currentSelectedId !== current.activePresetId

  // FIX: Use selectedPresetId for preview (not activePresetId)
  const selectedPreset = React.useMemo(() => {
    if (!currentSelectedId) {
      // Fallback to active if nothing selected
      const activeId = current.activePresetId
      if (activeId) {
        return current.presets.find((p) => p.id === activeId) ?? null
      }
      return null
    }
    return current.presets.find((p) => p.id === currentSelectedId) ?? null
  }, [current.presets, currentSelectedId, current.activePresetId])

  // FIX: Apply preview tokens when selectedPreset changes
  React.useEffect(() => {
    const el = previewRefs.current[activeBrand] ?? null
    if (!el) return
    applyPreviewTokens(el, selectedPreset?.tokens ?? {})
  }, [activeBrand, selectedPreset?.id])

  // Debug: Log initial state
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("[ThemePresetSettings] State:", {
        brand: activeBrand,
        presetsCount: current.presets.length,
        activePresetId: current.activePresetId,
        selectedPresetId: currentSelectedId,
      })
    }
  }, [activeBrand, current.presets.length, current.activePresetId, currentSelectedId])

  const reloadBrand = React.useCallback(
    async (brand: BrandKey) => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/admin/theme-presets?brand=${encodeURIComponent(brand)}`, {
          cache: "no-store",
          credentials: "include",
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body?.error || "Presets konnten nicht geladen werden")

        const presets = (body?.presets ?? []) as ThemePreset[]
        const activeThemePresetId = (body?.activeThemePresetId ?? null) as string | null

        setState((prev) => ({
          ...prev,
          [brand]: {
            presets,
            activePresetId: activeThemePresetId,
          },
        }))
        // Keep user selection if possible; only fallback to active when selection is missing/invalid.
        setSelectedPresetId((prev) => {
          const currentSelected = prev[brand] ?? null
          if (currentSelected && presets.some((p) => p.id === currentSelected)) return prev
          return { ...prev, [brand]: activeThemePresetId }
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unbekannter Fehler"
        setError(msg)
        toast({ title: "Fehler", description: msg, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  // FIX: Handle preset selection (client-side only, no DB call)
  const handlePresetSelect = React.useCallback(
    (brand: BrandKey, presetId: string) => {
      setSelectedPresetId((prev) => ({ ...prev, [brand]: presetId }))
      if (process.env.NODE_ENV === "development") {
        console.log("[ThemePresetSettings] Selected preset:", { brand, presetId })
      }
    },
    []
  )

  const handleSave = React.useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      const presetId = selectedPresetId[activeBrand]
      if (!presetId) {
        throw new Error("Kein Preset ausgewählt")
      }

      const res = await fetch("/api/admin/theme-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: activeBrand, presetId }),
        credentials: "include",
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.error || "Konnte nicht speichern")

      // FIX: Update both state and selectedPresetId after successful save
      setState((prev) => ({
        ...prev,
        [activeBrand]: { ...prev[activeBrand], activePresetId: presetId },
      }))
      // selectedPresetId is already set, but ensure it matches active
      setSelectedPresetId((prev) => ({ ...prev, [activeBrand]: presetId }))

      // Reload from DB to confirm (prevents ghost states)
      await reloadBrand(activeBrand)

      toast({
        title: "Preset aktiviert",
        description: `Aktives Preset für ${activeBrand === "physio-konzept" ? "Physio‑Konzept" : "Physiotherapie"} aktualisiert.`,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unbekannter Fehler"
      setError(msg)
      toast({ title: "Fehler", description: msg, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }, [activeBrand, selectedPresetId, toast, reloadBrand])

  // FIX: handleSetActive should update DB and state immediately
  const handleSetActive = React.useCallback(
    async (brand: BrandKey, presetId: string, e?: React.MouseEvent) => {
      // Prevent event bubbling if called from dropdown
      if (e) {
        e.stopPropagation()
      }
      setActionLoading(presetId)
      setError(null)
      try {
        const res = await fetch("/api/admin/theme-presets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brand, presetId }),
          credentials: "include",
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body?.error || "Konnte nicht aktivieren")
        const confirmedActiveId = (body?.activeThemePresetId ?? presetId) as string

        // FIX: Update state immediately
        setState((prev) => ({
          ...prev,
          [brand]: { ...prev[brand], activePresetId: confirmedActiveId },
        }))
        // FIX: Also update selectedPresetId to match
        setSelectedPresetId((prev) => ({ ...prev, [brand]: confirmedActiveId }))

        // Reload from DB to confirm (prevents ghost states)
        await reloadBrand(brand)

        toast({
          title: "Preset aktiviert",
          description: "Das Preset wurde erfolgreich aktiviert.",
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unbekannter Fehler"
        setError(msg)
        toast({ title: "Fehler", description: msg, variant: "destructive" })
      } finally {
        setActionLoading(null)
      }
    },
    [reloadBrand, toast]
  )

  const handleDuplicate = React.useCallback(
    async (brand: BrandKey, presetId: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation()
      setActionLoading(presetId)
      setError(null)
      try {
        const res = await fetch("/api/admin/theme-presets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "duplicate", presetId }),
          credentials: "include",
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body?.error || "Konnte nicht duplizieren")

        // Reload to get new preset
        await reloadBrand(brand)

        toast({
          title: "Preset dupliziert",
          description: "Das Preset wurde erfolgreich dupliziert.",
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unbekannter Fehler"
        setError(msg)
        toast({ title: "Fehler", description: msg, variant: "destructive" })
      } finally {
        setActionLoading(null)
      }
    },
    [reloadBrand, toast]
  )

  const handleDelete = React.useCallback(
    async (brand: BrandKey, presetId: string) => {
      setActionLoading(presetId)
      setError(null)
      try {
        const res = await fetch(`/api/admin/theme-presets/${presetId}`, {
          method: "DELETE",
          credentials: "include",
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body?.error || "Konnte nicht löschen")

        // Reload to refresh list
        await reloadBrand(brand)

        toast({
          title: "Preset gelöscht",
          description: "Das Preset wurde erfolgreich gelöscht.",
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unbekannter Fehler"
        setError(msg)
        toast({ title: "Fehler", description: msg, variant: "destructive" })
      } finally {
        setActionLoading(null)
        setDeleteDialogOpen(null)
      }
    },
    [reloadBrand, toast]
  )

  const handleCreate = React.useCallback(() => {
    // Get default tokens from selected or active preset
    const defaultTokens =
      selectedPreset?.tokens ?? current.presets.find((p) => p.id === current.activePresetId)?.tokens ?? {}
    const filtered = filterThemeTokens(defaultTokens)

    setEditingPreset(null)
    setEditName("")
    setEditTokens(Object.fromEntries(Object.entries(filtered)) as Record<string, string>)
    setEditTokensJson(JSON.stringify(filtered, null, 2))
    setJsonError(null)
    setShowAllTokens(false)
    setShowAdvancedJson(false)
    setLastTokensEditSource("picker")
    setEditDialogOpen(true)
  }, [selectedPreset, current.presets, current.activePresetId])

  const handleEdit = React.useCallback(
    (preset: ThemePreset) => {
      const filtered = filterThemeTokens(preset.tokens)
      setEditingPreset(preset)
      setEditName(preset.name)
      setEditTokens(Object.fromEntries(Object.entries(filtered)) as Record<string, string>)
      setEditTokensJson(JSON.stringify(filtered, null, 2))
      setJsonError(null)
      setShowAllTokens(false)
      setShowAdvancedJson(false)
      setLastTokensEditSource("picker")
      setEditDialogOpen(true)
    },
    []
  )

  // Keep JSON preview in sync when edited via picker UI
  React.useEffect(() => {
    if (!editDialogOpen) return
    if (lastTokensEditSource !== "picker") return
    const filtered = filterThemeTokens(editTokens)
    setEditTokensJson(JSON.stringify(filtered, null, 2))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTokens, editDialogOpen, lastTokensEditSource])

  const handleTokenChange = React.useCallback((key: string, next: string) => {
    setLastTokensEditSource("picker")
    setJsonError(null)
    setEditTokens((prev) => {
      const out = { ...prev }
      const v = (next ?? "").trim()
      if (!v) {
        delete out[key]
      } else {
        out[key] = v
      }
      return out
    })
  }, [])

  const handleJsonChange = React.useCallback((next: string) => {
    setLastTokensEditSource("json")
    setEditTokensJson(next)
    try {
      const parsed = JSON.parse(next)
      const filtered = filterThemeTokens(parsed)
      setEditTokens(Object.fromEntries(Object.entries(filtered)) as Record<string, string>)
      setJsonError(null)
    } catch {
      setJsonError("Ungültiges JSON")
    }
  }, [])

  const handleSaveEdit = React.useCallback(async () => {
    if (!editName.trim()) {
      toast({ title: "Fehler", description: "Name darf nicht leer sein.", variant: "destructive" })
      return
    }

    if (showAdvancedJson && jsonError) {
      toast({ title: "Fehler", description: "Bitte das JSON korrigieren.", variant: "destructive" })
      return
    }

    // Source of truth: picker-edited token map (already filtered to allowed keys)
    const filtered = filterThemeTokens(editTokens)

    setSavingEdit(true)
    setError(null)
    try {
      if (editingPreset) {
        // Update existing
        const res = await fetch("/api/admin/theme-presets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            id: editingPreset.id,
            name: editName.trim(),
            tokens: filtered,
          }),
          credentials: "include",
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body?.error || "Konnte nicht speichern")

        await reloadBrand(activeBrand)
        // keep selection on edited preset
        setSelectedPresetId((prev) => ({ ...prev, [activeBrand]: editingPreset.id }))
        setEditDialogOpen(false)

        toast({
          title: "Preset aktualisiert",
          description: "Das Preset wurde erfolgreich aktualisiert.",
        })
      } else {
        // Create new
        const res = await fetch("/api/admin/theme-presets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            brand: activeBrand,
            name: editName.trim(),
            tokens: filtered,
          }),
          credentials: "include",
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body?.error || "Konnte nicht erstellen")

        await reloadBrand(activeBrand)
        // auto-select new preset so user can immediately preview + activate it
        const newPresetId = typeof body?.presetId === "string" ? body.presetId : null
        if (newPresetId) {
          setSelectedPresetId((prev) => ({ ...prev, [activeBrand]: newPresetId }))
        }
        setEditDialogOpen(false)

        toast({
          title: "Preset erstellt",
          description: "Das Preset wurde erfolgreich erstellt.",
        })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unbekannter Fehler"
      setError(msg)
      toast({ title: "Fehler", description: msg, variant: "destructive" })
    } finally {
      setSavingEdit(false)
    }
  }, [editName, editTokensJson, editingPreset, activeBrand, reloadBrand, toast])

  const handleReset = React.useCallback(() => {
    setSelectedPresetId((prev) => ({ ...prev, [activeBrand]: current.activePresetId }))
    // Preview effect will re-apply
  }, [activeBrand, current.activePresetId])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Theme Presets</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Presets verwalten, aktivieren, duplizieren oder löschen (pro Brand).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={loading}
            onClick={() => reloadBrand(activeBrand)}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Aktualisieren
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={handleCreate}
          >
            <Plus className="h-4 w-4" />
            Erstellen
          </Button>
          <Button
            type="button"
            className="gap-2"
            disabled={!isDirty || saving || loading}
            onClick={handleSave}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Speichern
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              Schließen
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeBrand} onValueChange={(v) => setActiveBrand(v as BrandKey)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="physiotherapy">Physiotherapie</TabsTrigger>
          <TabsTrigger value="physio-konzept">Physio‑Konzept</TabsTrigger>
        </TabsList>

        {(["physiotherapy", "physio-konzept"] as BrandKey[]).map((brand) => {
          const b = state[brand] ?? { presets: [], activePresetId: null }
          const selectedId = selectedPresetId[brand] ?? null

          // Filter and sort presets for this brand
          const filteredAndSortedPresets = React.useMemo(() => {
            let filtered = b.presets ?? []
            const activeId = b.activePresetId

            // Filter by search query
            if (searchQuery.trim()) {
              const query = searchQuery.toLowerCase()
              filtered = filtered.filter((p) => p.name.toLowerCase().includes(query))
            }

            // Sort: active first, then alphabetically
            return [...filtered].sort((a, b) => {
              const aActive = a.id === activeId
              const bActive = b.id === activeId
              if (aActive && !bActive) return -1
              if (!aActive && bActive) return 1
              return a.name.localeCompare(b.name, "de")
            })
          }, [b.presets, b.activePresetId, searchQuery])

          return (
            <TabsContent key={brand} value={brand} className="mt-6 space-y-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Presets durchsuchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Preset list (scrollable; keep live preview visible) */}
              {loading ? (
                <div className="max-h-72 overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-32 animate-pulse rounded-lg border border-border bg-card" />
                    ))}
                  </div>
                </div>
              ) : filteredAndSortedPresets.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                  {searchQuery.trim() ? "Keine Presets gefunden, die der Suche entsprechen." : "Keine Presets gefunden."}
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAndSortedPresets.map((p) => {
                    const isActive = p.id === b.activePresetId
                    const isSelected = p.id === selectedId
                    const isLoading = actionLoading === p.id
                    const primary = tokenValue(p.tokens, "--primary")
                    const background = tokenValue(p.tokens, "--background")
                    const accent = tokenValue(p.tokens, "--accent")
                    const border = tokenValue(p.tokens, "--border")
                    const swatches = [
                      primary ? { color: primary, title: "--primary" } : null,
                      background ? { color: background, title: "--background" } : null,
                      accent ? { color: accent, title: "--accent" } : null,
                      border ? { color: border, title: "--border" } : null,
                    ].filter(Boolean) as Array<{ color: string; title: string }>

                      return (
                      <div
                        key={p.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handlePresetSelect(brand, p.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            handlePresetSelect(brand, p.id)
                          }
                        }}
                        className={cn(
                          "group relative rounded-lg border bg-card p-4 transition-colors cursor-pointer",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          isSelected ? "border-primary ring-2 ring-primary/30" : "border-border hover:bg-muted/40",
                          isActive && "ring-2 ring-emerald-500/40",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-foreground truncate">{p.name}</div>
                              {isActive && (
                                <Badge variant="default" className="shrink-0">
                                  Aktiv
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {isSelected && !isActive ? "Ausgewählt" : ""}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {swatches.map((s) => (
                              <Swatch key={s.title} color={s.color} title={s.title} />
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div
                          className="mt-3 flex items-center gap-2"
                          // FIX: Prevent card click when clicking buttons
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            type="button"
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            className="flex-1 gap-2"
                            disabled={isLoading || isActive}
                            onClick={(e) => handleSetActive(brand, p.id, e)}
                          >
                            {isLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : isActive ? (
                              <Check className="h-3 w-3" />
                            ) : null}
                            {isActive ? "Aktiv" : "Aktiv setzen"}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={isLoading}>
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={(e) => handleSetActive(brand, p.id, e)} disabled={isActive || isLoading}>
                                <Check className="mr-2 h-4 w-4" />
                                Aktiv setzen
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => handleDuplicate(brand, p.id, e)} disabled={isLoading}>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplizieren
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEdit(p)
                                }}
                                disabled={isLoading}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Bearbeiten
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteDialogOpen(p.id)
                                }}
                                disabled={p.is_default || isActive || isLoading}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Löschen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Live Preview panel */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-foreground">Live Preview</div>
                    <div className="text-xs text-muted-foreground">
                      Änderungen wirken nur hier – erst „Speichern" macht es global aktiv.
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="h-8" onClick={handleReset} disabled={!isDirty}>
                    Zurücksetzen
                  </Button>
                </div>

                <div
                  ref={(el) => {
                    previewRefs.current[brand] = el
                  }}
                  className={cn(
                    "rounded-lg border border-border bg-background p-4",
                    // keep contrast for physio-konzept previews if preset doesn't set much
                    brand === "physio-konzept" && "physio-konzept",
                  )}
                >
                  <div className="flex flex-col gap-3">
                    <div className="text-lg font-semibold text-foreground">Beispiel‑Headline</div>
                    <div className="text-sm text-muted-foreground">
                      Beispiel‑Text für Vorschau (Tokens: background/foreground/border/primary/accent…)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button">Primary Button</Button>
                      <Button type="button" variant="outline">
                        Outline
                      </Button>
                      <Button type="button" variant="secondary">
                        Secondary
                      </Button>
                    </div>
                    <div className="rounded-md border border-border bg-card p-3 text-sm text-card-foreground">
                      <div className="font-medium">Card</div>
                      <div className="text-muted-foreground">Border + Card Hintergrund</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen !== null} onOpenChange={(open) => !open && setDeleteDialogOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Preset löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Das Preset wird permanent gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialogOpen && handleDelete(activeBrand, deleteDialogOpen)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create/Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{editingPreset ? "Preset bearbeiten" : "Neues Preset erstellen"}</DialogTitle>
            <DialogDescription>
              {editingPreset
                ? "Bearbeiten Sie den Namen und die Tokens des Presets."
                : "Erstellen Sie ein neues Theme-Preset für dieses Brand."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto pr-1 max-h-[65vh]">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Name</Label>
              <Input
                id="preset-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="z.B. Warm Sand"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium text-foreground">Farben (Color Picker)</div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAllTokens((v) => !v)}>
                  {showAllTokens ? "Nur wichtige" : "Alle Tokens"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAdvancedJson((v) => !v)}>
                  {showAdvancedJson ? "JSON ausblenden" : "Erweitert (JSON)"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {(showAllTokens ? ALLOWED_THEME_TOKENS : COMMON_TOKENS).map((k) => {
                const value = editTokens[k] ?? ""
                return (
                  <div key={k} className="rounded-lg border border-border bg-card p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{tokenLabel(k)}</div>
                        <div className="text-xs text-muted-foreground">{k}</div>
                      </div>
                      {value ? <Swatch color={value} title={k} /> : null}
                    </div>
                    <ColorField
                      value={value}
                      onChange={(next) => handleTokenChange(k, next)}
                      placeholder="#RRGGBB"
                      className="w-full"
                    />
                    {value ? (
                      <div className="mt-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleTokenChange(k, "")}>
                          Entfernen
                        </Button>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>

            {showAdvancedJson ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="preset-tokens">Tokens (JSON)</Label>
                  {jsonError ? <span className="text-xs text-destructive">{jsonError}</span> : null}
                </div>
                <Textarea
                  id="preset-tokens"
                  value={editTokensJson}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  placeholder='{"--primary": "#000000", "--background": "#ffffff", ...}'
                  className="font-mono text-sm min-h-[140px]"
                />
                <p className="text-xs text-muted-foreground">
                  Nur whitelisted Tokens werden gespeichert. Erlaubt: {ALLOWED_THEME_TOKENS.slice(0, 6).join(", ")}…
                </p>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} disabled={savingEdit}>
              Abbrechen
            </Button>
            <Button type="button" onClick={handleSaveEdit} disabled={savingEdit || !editName.trim()}>
              {savingEdit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichern...
                </>
              ) : (
                "Speichern"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
