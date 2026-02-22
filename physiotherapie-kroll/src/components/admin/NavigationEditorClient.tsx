"use client"

import { useMemo, useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ImageField } from "./ImageField"
import { MediaPickerDialog } from "./MediaPickerDialog"
import { Plus, Trash2, ChevronUp, ChevronDown, Save, Zap } from "lucide-react"
import { arrayMove, arrayRemove } from "@/lib/cms/arrayOps"
import { uuid } from "@/lib/cms/arrayOps"
import type { BrandKey } from "@/components/brand/brandAssets"
import type { NavConfig, NavLink, NavCta } from "@/types/navigation"
import { DEFAULT_NAV_CONFIG } from "@/lib/consent/navigation-defaults"
import type { PageForNavigation } from "@/lib/supabase/pages.server"
import { getLogoSizeClasses } from "@/lib/theme/logoSize"
import type { BlockSectionProps, MediaValue, SectionBackgroundPreset } from "@/types/cms"
import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { ensureDefaultPresets } from "@/lib/cms/sectionPresets"
import { HEADER_PRESETS } from "@/lib/admin/header-presets"
import { HeaderClient } from "@/components/navigation/HeaderClient"

type NavigationEditorClientProps = {
  initialPhysio: NavConfig
  initialKonzept: NavConfig
  initialPages: PageForNavigation[]
}

export function NavigationEditorClient({
  initialPhysio,
  initialKonzept,
  initialPages,
}: NavigationEditorClientProps) {
  const { toast } = useToast()
  const [activeBrand, setActiveBrand] = useState<BrandKey>("physiotherapy")
  const [physioConfig, setPhysioConfig] = useState<NavConfig>(
    ensureDefaultPresets(initialPhysio || DEFAULT_NAV_CONFIG, "physiotherapy")
  )
  const [konzeptConfig, setKonzeptConfig] = useState<NavConfig>(
    ensureDefaultPresets(initialKonzept || DEFAULT_NAV_CONFIG, "physio-konzept")
  )
  const [pages] = useState<PageForNavigation[]>(initialPages || [])
  const [saving, setSaving] = useState(false)
  const [presetJsonDraft, setPresetJsonDraft] = useState<Record<string, string>>({})
  
  // Header draft/saved state
  const [physioHeaderDraft, setPhysioHeaderDraft] = useState<NavConfig>(physioConfig)
  const [konzeptHeaderDraft, setKonzeptHeaderDraft] = useState<NavConfig>(konzeptConfig)
  const [previewBrand, setPreviewBrand] = useState<BrandKey>("physiotherapy")
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("desktop")

  // Seed defaults persistently (idempotent) for both brands when admin opens this page
  useEffect(() => {
    void fetch(`/api/admin/section-presets?brand=physiotherapy`, { cache: "no-store" }).catch(() => {})
    void fetch(`/api/admin/section-presets?brand=physio-konzept`, { cache: "no-store" }).catch(() => {})
  }, [])

  const navConfig = useMemo(() => {
    return activeBrand === "physiotherapy" ? physioConfig : konzeptConfig
  }, [activeBrand, physioConfig, konzeptConfig])

  const headerDraft = useMemo(() => {
    return activeBrand === "physiotherapy" ? physioHeaderDraft : konzeptHeaderDraft
  }, [activeBrand, physioHeaderDraft, konzeptHeaderDraft])

  // Save navigation
  const handleSave = useCallback(async (configToSave?: NavConfig) => {
    const configData = configToSave || navConfig
    if (!configData) return

    setSaving(true)
    try {
      const response = await fetch("/api/navigation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brand: activeBrand,
          config: configData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save navigation")
      }

      // Sync draft with saved config
      if (activeBrand === "physiotherapy") {
        setPhysioHeaderDraft(configData)
      } else {
        setKonzeptHeaderDraft(configData)
      }

      toast({
        title: "Gespeichert",
        description: "Navigation wurde erfolgreich gespeichert",
      })
    } catch (error) {
      console.error("Error saving navigation:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Navigation konnte nicht gespeichert werden",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }, [activeBrand, toast])

  // Update config helper
  const updateConfig = useCallback(
    (updates: Partial<NavConfig>) => {
      if (activeBrand === "physiotherapy") {
        setPhysioConfig((prev) => ({ ...prev, ...updates }))
      } else {
        setKonzeptConfig((prev) => ({ ...prev, ...updates }))
      }
    },
    [activeBrand]
  )

  // Header-specific helpers
  const applyHeaderPreset = useCallback(
    (presetId: string) => {
      const preset = HEADER_PRESETS.find((p) => p.id === presetId)
      if (!preset) return

      const updatedDraft = {
        ...headerDraft,
        ...preset.config,
      }

      if (activeBrand === "physiotherapy") {
        setPhysioHeaderDraft(updatedDraft)
      } else {
        setKonzeptHeaderDraft(updatedDraft)
      }

      toast({
        title: "Preset angewendet",
        description: `Header-Preset "${preset.name}" wurde auf Draft übernommen`,
      })
    },
    [activeBrand, headerDraft, toast]
  )

  const resetHeaderDraft = useCallback(() => {
    if (activeBrand === "physiotherapy") {
      setPhysioHeaderDraft(physioConfig)
    } else {
      setKonzeptHeaderDraft(konzeptConfig)
    }

    toast({
      title: "Draft zurückgesetzt",
      description: "Header-Draft wurde auf zuletzt gespeicherte Version zurückgesetzt",
    })
  }, [activeBrand, physioConfig, konzeptConfig, toast])

  const saveHeaderDraft = useCallback(async () => {
    const configToSave = activeBrand === "physiotherapy" 
      ? { ...physioConfig, ...physioHeaderDraft } 
      : { ...konzeptConfig, ...konzeptHeaderDraft }

    if (activeBrand === "physiotherapy") {
      setPhysioConfig(configToSave)
    } else {
      setKonzeptConfig(configToSave)
    }

    // Trigger save with the new config
    await handleSave(configToSave)
  }, [activeBrand, physioConfig, konzeptConfig, physioHeaderDraft, konzeptHeaderDraft, handleSave])

  const updateHeaderDraft = useCallback(
    (updates: Partial<NavConfig>) => {
      if (activeBrand === "physiotherapy") {
        setPhysioHeaderDraft((prev) => ({ ...prev, ...updates }))
      } else {
        setKonzeptHeaderDraft((prev) => ({ ...prev, ...updates }))
      }
    },
    [activeBrand]
  )

  const presets = navConfig.presets?.sectionBackground ?? []
  const updatePresets = useCallback(
    (next: SectionBackgroundPreset[]) => {
      updateConfig({
        presets: {
          ...(navConfig.presets ?? {}),
          sectionBackground: next,
        },
      })
    },
    [navConfig.presets, updateConfig]
  )

  const addPreset = useCallback(() => {
    const baseSection: BlockSectionProps = {
      layout: { width: "contained", paddingY: "lg", minHeight: "auto" },
      background: { type: "none", parallax: false },
    }
    const next: SectionBackgroundPreset = {
      id: uuid(),
      name: "Neues Preset",
      description: "",
      section: baseSection,
    }
    updatePresets([...presets, next])
  }, [presets, updatePresets])

  const removePreset = useCallback(
    (index: number) => {
      updatePresets(arrayRemove(presets, index))
    },
    [presets, updatePresets]
  )

  const movePreset = useCallback(
    (index: number, direction: -1 | 1) => {
      const to = index + direction
      if (to < 0 || to >= presets.length) return
      updatePresets(arrayMove(presets, index, to))
    },
    [presets, updatePresets]
  )

  const updatePreset = useCallback(
    (index: number, updates: Partial<SectionBackgroundPreset>) => {
      const next = [...presets]
      next[index] = { ...next[index], ...updates }
      updatePresets(next)
    },
    [presets, updatePresets]
  )

  const validateSectionJson = useCallback((section: unknown): string | null => {
    if (!section || typeof section !== "object") return "Section fehlt"
    const s = section as Record<string, unknown>
    if (!s.layout || typeof s.layout !== "object") return "layout fehlt"
    if (!s.background || typeof s.background !== "object") return "background fehlt"
    const bg = s.background as Record<string, unknown>
    if (bg.type === "gradient") {
      const gradient = (bg.gradient && typeof bg.gradient === "object" ? (bg.gradient as Record<string, unknown>) : null)
      const stops = gradient?.stops
      if (!Array.isArray(stops) || stops.length < 2 || stops.length > 5) return "Gradient: stops müssen 2–5 sein"
      for (const stop of stops) {
        if (!stop || typeof stop !== "object") return "Gradient: stop ungültig"
        const st = stop as Record<string, unknown>
        const pos = st.pos
        const color = st.color
        if (typeof pos !== "number" || pos < 0 || pos > 100) return "Gradient: pos muss 0–100 sein"
        if (typeof color !== "string" || !color) return "Gradient: color fehlt"
      }
    }
    return null
  }, [])

  // Link management
  const addLink = useCallback(() => {
    if (!navConfig) return
    const newLink: NavLink = {
      id: uuid(),
      label: "Neuer Link",
      type: "page",
      visibility: "both",
      sort: navConfig.links.length,
    }
    updateConfig({ links: [...navConfig.links, newLink] })
  }, [navConfig, updateConfig])

  const removeLink = useCallback(
    (index: number) => {
      if (!navConfig) return
      updateConfig({ links: arrayRemove(navConfig.links, index) })
    },
    [navConfig, updateConfig]
  )

  const moveLink = useCallback(
    (index: number, direction: -1 | 1) => {
      if (!navConfig) return
      const to = index + direction
      if (to < 0 || to >= navConfig.links.length) return
      const moved = arrayMove(navConfig.links, index, to)
      // Update sort values
      const withSort = moved.map((link, i) => ({ ...link, sort: i }))
      updateConfig({ links: withSort })
    },
    [navConfig, updateConfig]
  )

  const updateLink = useCallback(
    (index: number, updates: Partial<NavLink>) => {
      if (!navConfig) return
      const updated = [...navConfig.links]
      updated[index] = { ...updated[index], ...updates }
      updateConfig({ links: updated })
    },
    [navConfig, updateConfig]
  )

  if (!navConfig) {
    return <div className="flex h-full items-center justify-center">Laden...</div>
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Navigation</h1>
          <Button onClick={() => handleSave(navConfig)} disabled={saving} size="lg">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Speichern..." : "Speichern"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <Tabs value={activeBrand} onValueChange={(v) => setActiveBrand(v as BrandKey)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="physiotherapy">Physiotherapie</TabsTrigger>
            <TabsTrigger value="physio-konzept">Physio-Konzept</TabsTrigger>
          </TabsList>

          <TabsContent value={activeBrand} className="mt-6 space-y-6">
            {/* Logo */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Logo</Label>
                <ImageField
                  id="navigation-logo"
                  label=""
                  value={navConfig.logo && "url" in navConfig.logo ? navConfig.logo.url : ""}
                  onChange={(url) => {
                    updateConfig({
                      logo: url ? { url } : null,
                    })
                  }}
                  onMediaSelect={(mediaId, url) => {
                    updateConfig({
                      logo: { mediaId, url },
                    })
                  }}
                  placeholder="/placeholder-logo.svg"
                />
              </div>
              
              {/* Logo Size */}
              <div className="space-y-1.5">
                <Label className="text-xs">Logo-Größe</Label>
                <Select
                  value={navConfig.logoSize || "md"}
                  onValueChange={(value: "sm" | "md" | "lg") => {
                    updateConfig({ logoSize: value })
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sm">Klein (36px)</SelectItem>
                    <SelectItem value="md">Mittel (48px)</SelectItem>
                    <SelectItem value="lg">Groß (56px)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Höhe des Logos im Header
                </p>
              </div>
              
              {/* Logo Fit */}
              <div className="space-y-1.5">
                <Label className="text-xs">Darstellung</Label>
                <Select
                  value={navConfig.logoFit || "contain"}
                  onValueChange={(value: "contain" | "cover") => {
                    updateConfig({ logoFit: value })
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contain">Vollständig anzeigen</SelectItem>
                    <SelectItem value="cover">Ausfüllen</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Vollständig: Logo wird nicht abgeschnitten. Ausfüllen: Logo füllt den Container.
                </p>
              </div>
              
              {/* Logo Preview */}
              {navConfig.logo && <LogoPreview logo={navConfig.logo} logoSize={navConfig.logoSize} logoFit={navConfig.logoFit} activeBrand={activeBrand} />}
            </div>

            <Separator />

            {/* HEADER LAYOUT CUSTOMIZATION */}
            <div className="space-y-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Header Konfiguration
              </Label>

              {/* Header Presets Grid */}
              <div className="space-y-3">
                <Label className="text-xs font-medium text-muted-foreground">Schnellauswahl</Label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-5 lg:grid-cols-5">
                  {HEADER_PRESETS.map((preset) => {
                    const isSelected =
                      headerDraft.headerLayoutColumns === preset.config.headerLayoutColumns &&
                      headerDraft.headerFontPreset === preset.config.headerFontPreset &&
                      headerDraft.headerMotionPreset === preset.config.headerMotionPreset
                    return (
                      <button
                        key={preset.id}
                        onClick={() => applyHeaderPreset(preset.id)}
                        className={cn(
                          "group relative px-3 py-3 rounded-lg border-2 transition-all duration-200",
                          "flex flex-col items-start gap-1.5 text-left",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-card hover:border-primary/50 hover:bg-primary/5"
                        )}
                      >
                        <span className="text-xs font-semibold leading-tight">{preset.name}</span>
                        <span className="text-xs text-muted-foreground leading-tight">{preset.description}</span>
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Header Controls - 3 Column Grid */}
              <div className="space-y-3">
                <Label className="text-xs font-medium text-muted-foreground">Individuelle Einstellungen</Label>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {/* Columns */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Spalten</Label>
                    <Select
                      value={String(headerDraft.headerLayoutColumns ?? 4)}
                      onValueChange={(v) => updateHeaderDraft({ headerLayoutColumns: parseInt(v) as 3 | 4 | 5 })}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 Spalten (Kompakt)</SelectItem>
                        <SelectItem value="4">4 Spalten (Standard)</SelectItem>
                        <SelectItem value="5">5 Spalten (Erweitert)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Font Preset */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Font-Stil</Label>
                    <Select
                      value={headerDraft.headerFontPreset ?? "brand"}
                      onValueChange={(v: "brand" | "sans" | "serif" | "mono") => updateHeaderDraft({ headerFontPreset: v })}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brand">Brand (Standard)</SelectItem>
                        <SelectItem value="sans">Sans-Serif</SelectItem>
                        <SelectItem value="serif">Serif</SelectItem>
                        <SelectItem value="mono">Monospace</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Motion Preset */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Animation</Label>
                    <Select
                      value={headerDraft.headerMotionPreset ?? "subtle"}
                      onValueChange={(v: "none" | "subtle" | "glassy" | "snappy") => updateHeaderDraft({ headerMotionPreset: v })}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Keine</SelectItem>
                        <SelectItem value="subtle">Subtil</SelectItem>
                        <SelectItem value="glassy">Glasig</SelectItem>
                        <SelectItem value="snappy">Schnell</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Header Draft Actions - Split Layout */}
              <div className="flex gap-3 pt-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={saveHeaderDraft}
                  disabled={saving}
                  className="flex-1 transition-all hover:shadow-md"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Speichern..." : "Speichern"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetHeaderDraft}
                  className="transition-all hover:bg-destructive/5"
                >
                  Zurücksetzen
                </Button>
              </div>

              {/* Live Preview */}
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-xs font-medium text-muted-foreground">Live-Vorschau</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  <div className="flex gap-1 rounded-lg border border-border p-1 bg-muted/50">
                    {(["physiotherapy", "physio-konzept"] as const).map((brand) => (
                      <Button
                        key={brand}
                        size="sm"
                        variant={previewBrand === brand ? "default" : "ghost"}
                        onClick={() => setPreviewBrand(brand)}
                        className="text-xs h-8"
                      >
                        {brand === "physiotherapy" ? "Physio" : "Konzept"}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-1 ml-auto rounded-lg border border-border p-1 bg-muted/50">
                    {(["desktop", "mobile"] as const).map((viewport) => (
                      <Button
                        key={viewport}
                        size="sm"
                        variant={previewViewport === viewport ? "default" : "ghost"}
                        onClick={() => setPreviewViewport(viewport)}
                        className="text-xs h-8 capitalize"
                      >
                        {viewport}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className={cn(
                  "border border-border rounded-lg overflow-hidden bg-white dark:bg-slate-950 shadow-sm",
                  previewViewport === "mobile" ? "mx-auto" : ""
                )} style={{
                  width: previewViewport === "mobile" ? "390px" : "100%",
                  maxHeight: "500px",
                }}>
                  <div className="flex flex-col h-full">
                    <HeaderClient brand={previewBrand} navConfig={headerDraft} />
                    <div className="flex-1 overflow-hidden bg-muted/50">
                      <div className="h-full w-full flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          {previewViewport === "mobile" ? "Mobile (390px)" : "Desktop"} • Scroll zum Testen
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Links */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Links</Label>
                <Button variant="outline" size="sm" onClick={addLink}>
                  <Plus className="mr-2 h-4 w-4" />
                  Link hinzufügen
                </Button>
              </div>

              <div className="space-y-3">
                {navConfig.links.map((link, index) => (
                  <div
                    key={link.id}
                    className="rounded-lg border border-border bg-card p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Link {index + 1}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => moveLink(index, -1)}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => moveLink(index, 1)}
                          disabled={index === navConfig.links.length - 1}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeLink(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Label</Label>
                        <Input
                          value={link.label}
                          onChange={(e) => updateLink(index, { label: e.target.value })}
                          placeholder="Link-Text"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Typ</Label>
                        <Select
                          value={link.type}
                          onValueChange={(v: "page" | "url") => {
                            updateLink(index, {
                              type: v,
                              pageSlug: v === "page" ? undefined : link.pageSlug,
                              href: v === "url" ? undefined : link.href,
                            })
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="page">Interne Seite</SelectItem>
                            <SelectItem value="url">Externe URL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {link.type === "page" ? (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Seite</Label>
                        <Select
                          value={link.pageSlug || ""}
                          onValueChange={(slug) => updateLink(index, { pageSlug: slug })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seite auswählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {pages.length === 0 ? (
                              <SelectItem value="" disabled>
                                Keine Seiten gefunden
                              </SelectItem>
                            ) : (
                              pages.map((page) => (
                                <SelectItem key={page.id} value={page.slug || ""}>
                                  {page.title || "Untitled"} ({page.slug || "no-slug"})
                                  {page.status === "draft" && " [Draft]"}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Label className="text-xs">URL</Label>
                        <Input
                          value={link.href || ""}
                          onChange={(e) => updateLink(index, { href: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Sichtbarkeit</Label>
                        <Select
                          value={link.visibility}
                          onValueChange={(v: "physiotherapy" | "physio-konzept" | "both") =>
                            updateLink(index, { visibility: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="both">Beide</SelectItem>
                            <SelectItem value="physiotherapy">Nur Physiotherapie</SelectItem>
                            <SelectItem value="physio-konzept">Nur Physio-Konzept</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {link.type === "url" && (
                        <div className="flex items-center space-x-2 pt-6">
                          <Switch
                            id={`link-${link.id}-newtab`}
                            checked={link.newTab || false}
                            onCheckedChange={(checked) => updateLink(index, { newTab: checked })}
                          />
                          <Label htmlFor={`link-${link.id}-newtab`} className="text-xs">
                            In neuem Tab öffnen
                          </Label>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Presets */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Section/Background Presets</Label>
                <Button variant="outline" size="sm" onClick={addPreset}>
                  <Plus className="mr-2 h-4 w-4" />
                  Preset hinzufügen
                </Button>
              </div>

              <div className="space-y-3">
                {presets.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Keine Presets vorhanden.</div>
                ) : (
                  presets.map((p, index) => (
                    <div key={p.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Preset {index + 1}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => movePreset(index, -1)}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => movePreset(index, 1)}
                            disabled={index === presets.length - 1}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => removePreset(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Name</Label>
                          <Input value={p.name} onChange={(e) => updatePreset(index, { name: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Beschreibung</Label>
                          <Input
                            value={p.description || ""}
                            onChange={(e) => updatePreset(index, { description: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Section JSON</Label>
                        <Textarea
                          className="min-h-40 font-mono text-xs"
                          value={
                            presetJsonDraft[p.id] ??
                            JSON.stringify(p.section ?? {}, null, 2)
                          }
                          onChange={(e) => {
                            const v = e.target.value
                            setPresetJsonDraft((prev) => ({ ...prev, [p.id]: v }))
                          }}
                          onBlur={() => {
                            const raw = presetJsonDraft[p.id]
                            if (!raw) return
                            try {
                              const parsed = JSON.parse(raw)
                              const err = validateSectionJson(parsed)
                              if (err) throw new Error(err)
                              updatePreset(index, { section: parsed as BlockSectionProps })
                              toast({ title: "Preset aktualisiert", description: "Section JSON wurde übernommen." })
                            } catch (e) {
                              toast({
                                title: "Ungültiges JSON",
                                description: e instanceof Error ? e.message : "Section JSON ist ungültig",
                                variant: "destructive",
                              })
                            }
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Validierung: Gradient stops 2–5, pos 0–100. MediaIds optional.
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Separator />

            {/* CTA */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="cta-enabled"
                  checked={navConfig.cta?.enabled || false}
                  onCheckedChange={(enabled) => {
                    updateConfig({
                      cta: enabled
                        ? {
                            enabled: true,
                            label: "Kontakt",
                            type: "page",
                            variant: "default",
                          }
                        : null,
                    })
                  }}
                />
                <Label htmlFor="cta-enabled" className="text-base font-semibold">
                  CTA Button aktivieren
                </Label>
              </div>

              {navConfig.cta?.enabled && (
                <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={navConfig.cta.label}
                        onChange={(e) =>
                          updateConfig({
                            cta: { ...navConfig.cta!, label: e.target.value },
                          })
                        }
                        placeholder="Button-Text"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Typ</Label>
                      <Select
                        value={navConfig.cta.type}
                        onValueChange={(v: "page" | "url") => {
                          updateConfig({
                            cta: {
                              ...navConfig.cta!,
                              type: v,
                              pageSlug: v === "page" ? undefined : navConfig.cta?.pageSlug,
                              href: v === "url" ? undefined : navConfig.cta?.href,
                            },
                          })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="page">Interne Seite</SelectItem>
                          <SelectItem value="url">Externe URL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {navConfig.cta.type === "page" ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Seite</Label>
                      <Select
                        value={navConfig.cta.pageSlug || ""}
                        onValueChange={(slug) =>
                          updateConfig({
                            cta: { ...navConfig.cta!, pageSlug: slug },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seite auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {pages.length === 0 ? (
                            <SelectItem value="" disabled>
                              Keine Seiten gefunden
                            </SelectItem>
                          ) : (
                            pages.map((page) => (
                              <SelectItem key={page.id} value={page.slug || ""}>
                                {page.title || "Untitled"} ({page.slug || "no-slug"})
                                {page.status === "draft" && " [Draft]"}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="text-xs">URL</Label>
                      <Input
                        value={navConfig.cta.href || ""}
                        onChange={(e) =>
                          updateConfig({
                            cta: { ...navConfig.cta!, href: e.target.value },
                          })
                        }
                        placeholder="https://..."
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-xs">Variante</Label>
                    <Select
                      value={navConfig.cta.variant || "default"}
                      onValueChange={(v: "default" | "secondary" | "outline") =>
                        updateConfig({
                          cta: { ...navConfig.cta!, variant: v },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Standard</SelectItem>
                        <SelectItem value="secondary">Sekundär</SelectItem>
                        <SelectItem value="outline">Outline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Search */}
            <div className="flex items-center space-x-2">
              <Switch
                id="search-enabled"
                checked={navConfig.searchEnabled}
                onCheckedChange={(enabled) => updateConfig({ searchEnabled: enabled })}
              />
              <Label htmlFor="search-enabled" className="text-base font-semibold">
                Suche anzeigen
              </Label>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

/**
 * Logo Preview Component for Admin
 * Shows a preview of the logo with brand-aware background
 */
function LogoPreview({
  logo,
  logoSize = "md",
  logoFit = "contain",
  activeBrand,
}: {
  logo: MediaValue | null
  logoSize?: "sm" | "md" | "lg"
  logoFit?: "contain" | "cover"
  activeBrand: BrandKey
}) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const resolveLogo = async () => {
      if (!logo) {
        setLogoUrl(null)
        setLoading(false)
        return
      }

      // If logo has url, use it directly
      if ("url" in logo && logo.url) {
        setLogoUrl(logo.url)
        setLoading(false)
        return
      }

      // If logo has mediaId, fetch from database
      if ("mediaId" in logo && logo.mediaId) {
        try {
          const { createSupabaseBrowserClient } = await import("@/lib/supabase/client")
          const supabase = createSupabaseBrowserClient()
          const { data, error } = await supabase
            .from("media")
            .select("url")
            .eq("id", logo.mediaId)
            .single()

          if (error || !data) {
            console.error("Error fetching logo from database:", error)
            setLogoUrl(null)
          } else {
            setLogoUrl(data.url)
          }
        } catch (error) {
          console.error("Error resolving logo:", error)
          setLogoUrl(null)
        } finally {
          setLoading(false)
        }
        return
      }

      setLogoUrl(null)
      setLoading(false)
    }

    resolveLogo()
  }, [logo])

  if (!logo) return null

  const logoClasses = getLogoSizeClasses(logoSize)

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">Vorschau</Label>
      <div
        className={cn(
          "relative h-20 w-full max-w-[260px] rounded-md border p-2 flex items-center justify-center",
          activeBrand === "physio-konzept"
            ? "bg-[#0f0f10] border-white/10"
            : "bg-white border-border"
        )}
      >
        {loading ? (
          <span className="text-xs text-muted-foreground">Logo wird geladen...</span>
        ) : logoUrl ? (
          <div className={cn("relative", logoClasses.height, logoClasses.maxWidth)}>
            <img
              src={logoUrl}
              alt="Logo Vorschau"
              className={cn(
                "h-full w-auto",
                logoFit === "contain" ? "object-contain" : "object-cover"
              )}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none"
              }}
            />
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Logo konnte nicht geladen werden</span>
        )}
      </div>
    </div>
  )
}
