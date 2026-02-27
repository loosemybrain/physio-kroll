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
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImageField } from "./ImageField"
import { MediaPickerDialog } from "./MediaPickerDialog"
import { Plus, Trash2, ChevronUp, ChevronDown, Save, AlertCircle, RotateCcw } from "lucide-react"
import { arrayMove, arrayRemove, uuid } from "@/lib/cms/arrayOps"
import type { BrandKey } from "@/components/brand/brandAssets"
import type { FooterConfig, FooterSection, FooterBlock } from "@/types/footer"
import { DEFAULT_FOOTER_CONFIG, getDefaultSpansForSectionCount, DESIGN_PRESETS, SPACING_OPTIONS, DIVIDER_CLASS_OPTIONS, COLOR_PRESETS, FONT_FAMILIES } from "@/lib/supabase/footer.shared"
import type { PageForNavigation } from "@/lib/supabase/pages.server"
import { cn } from "@/lib/utils"
import { FooterClient } from "@/components/layout/FooterClient"

type FooterEditorClientProps = {
  initialPhysio: FooterConfig
  initialKonzept: FooterConfig
  initialPages: PageForNavigation[]
}

export function FooterEditorClient({
  initialPhysio,
  initialKonzept,
  initialPages,
}: FooterEditorClientProps) {
  const { toast } = useToast()
  const [activeBrand, setActiveBrand] = useState<BrandKey>("physiotherapy")
  const [physioConfig, setPhysioConfig] = useState<FooterConfig>(initialPhysio || DEFAULT_FOOTER_CONFIG)
  const [konzeptConfig, setKonzeptConfig] = useState<FooterConfig>(initialKonzept || DEFAULT_FOOTER_CONFIG)
  const [pages] = useState<PageForNavigation[]>(initialPages || [])
  const [saving, setSaving] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [pendingBlockType, setPendingBlockType] = useState<Record<string, string>>({})

  const footerConfig = useMemo(() => {
    return activeBrand === "physiotherapy" ? physioConfig : konzeptConfig
  }, [activeBrand, physioConfig, konzeptConfig])

  const pagesMap = useMemo(() => {
    return new Map(pages.map((p) => [p.slug, p.title]))
  }, [pages])

  // Calculate total span
  const totalSpan = useMemo(() => {
    return footerConfig.sections.reduce((sum, section) => sum + section.span, 0)
  }, [footerConfig.sections])

  // Save footer
  const handleSave = useCallback(async () => {
    if (!footerConfig) return

    setValidationError(null)

    // Validate span sum
    if (totalSpan > 12) {
      setValidationError(`Die Summe aller Spaltenbreiten (${totalSpan}) darf nicht größer als 12 sein.`)
      toast({
        title: "Validierungsfehler",
        description: "Die Summe aller Spaltenbreiten darf nicht größer als 12 sein.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/footer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: activeBrand, config: footerConfig }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload?.error || "Footer konnte nicht gespeichert werden")
      }

      toast({
        title: "Gespeichert",
        description: "Footer wurde erfolgreich gespeichert",
      })
      setValidationError(null)
    } catch (error) {
      console.error("Error saving footer:", error)
      const errorMessage = error instanceof Error ? error.message : "Footer konnte nicht gespeichert werden"
      setValidationError(errorMessage)
      toast({
        title: "Fehler",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }, [footerConfig, activeBrand, toast, totalSpan])

  // Update config helper
  const updateConfig = useCallback(
    (updates: Partial<FooterConfig>) => {
      if (activeBrand === "physiotherapy") {
        setPhysioConfig((prev) => ({ ...prev, ...updates }))
      } else {
        setKonzeptConfig((prev) => ({ ...prev, ...updates }))
      }
      setValidationError(null)
    },
    [activeBrand]
  )

  // Section management
  const addSection = useCallback(() => {
    if (footerConfig.sections.length >= 5) {
      toast({
        title: "Maximale Anzahl erreicht",
        description: "Es können maximal 5 Sektionen erstellt werden.",
        variant: "destructive",
      })
      return
    }

    const defaultSpans = getDefaultSpansForSectionCount(footerConfig.sections.length + 1)
    const newSection: FooterSection = {
      id: uuid(),
      title: `Sektion ${footerConfig.sections.length + 1}`,
      span: defaultSpans[footerConfig.sections.length] || 6,
      blocks: [
        {
          type: "text",
          id: uuid(),
          text: "Neuer Text",
        },
      ],
    }
    updateConfig({ sections: [...footerConfig.sections, newSection] })
  }, [footerConfig, updateConfig, toast])

  const removeSection = useCallback(
    (index: number) => {
      if (footerConfig.sections.length <= 2) {
        toast({
          title: "Minimale Anzahl erreicht",
          description: "Es müssen mindestens 2 Sektionen vorhanden sein.",
          variant: "destructive",
        })
        return
      }
      updateConfig({ sections: arrayRemove(footerConfig.sections, index) })
    },
    [footerConfig, updateConfig, toast]
  )

  const moveSection = useCallback(
    (index: number, direction: -1 | 1) => {
      const to = index + direction
      if (to < 0 || to >= footerConfig.sections.length) return
      updateConfig({ sections: arrayMove(footerConfig.sections, index, to) })
    },
    [footerConfig, updateConfig]
  )

  const updateSection = useCallback(
    (index: number, updates: Partial<FooterSection>) => {
      const updated = [...footerConfig.sections]
      updated[index] = { ...updated[index], ...updates }
      updateConfig({ sections: updated })
    },
    [footerConfig, updateConfig]
  )

  const updateSectionSpan = useCallback(
    (index: number, newSpan: 2 | 3 | 4 | 6) => {
      const updated = [...footerConfig.sections]
      const oldSpan = updated[index].span
      updated[index] = { ...updated[index], span: newSpan }
      
      const newTotalSpan = totalSpan - oldSpan + newSpan
      if (newTotalSpan > 12) {
        toast({
          title: "Ungültige Breite",
          description: `Die Summe aller Spaltenbreiten würde ${newTotalSpan} betragen. Maximal 12 erlaubt.`,
          variant: "destructive",
        })
        return
      }
      
      updateConfig({ sections: updated })
    },
    [footerConfig, totalSpan, updateConfig, toast]
  )

  // Block management
  const addBlock = useCallback(
    (sectionIndex: number, blockType: FooterBlock["type"]) => {
      const section = footerConfig.sections[sectionIndex]
      if (!section) return

      let newBlock: FooterBlock

      switch (blockType) {
        case "text":
          newBlock = { type: "text", id: uuid(), text: "" }
          break
        case "links":
          newBlock = {
            type: "links",
            id: uuid(),
            title: "",
            links: [{ id: uuid(), label: "", href: "" }],
          }
          break
        case "pages":
          newBlock = {
            type: "pages",
            id: uuid(),
            title: "",
            pageSlugs: [],
          }
          break
        case "logo":
          newBlock = {
            type: "logo",
            id: uuid(),
            size: "md",
            fit: "contain",
          }
          break
        case "copyright":
          newBlock = { type: "copyright", id: uuid(), text: "" }
          break
        default:
          return
      }

      const updated = [...footerConfig.sections]
      updated[sectionIndex] = {
        ...section,
        blocks: [...section.blocks, newBlock],
      }
      updateConfig({ sections: updated })
    },
    [footerConfig, updateConfig]
  )

  const removeBlock = useCallback(
    (sectionIndex: number, blockIndex: number) => {
      const updated = [...footerConfig.sections]
      updated[sectionIndex] = {
        ...updated[sectionIndex],
        blocks: arrayRemove(updated[sectionIndex].blocks, blockIndex),
      }
      updateConfig({ sections: updated })
    },
    [footerConfig, updateConfig]
  )

  const moveBlock = useCallback(
    (sectionIndex: number, blockIndex: number, direction: -1 | 1) => {
      const updated = [...footerConfig.sections]
      const section = updated[sectionIndex]
      const to = blockIndex + direction
      if (to < 0 || to >= section.blocks.length) return
      updated[sectionIndex] = {
        ...section,
        blocks: arrayMove(section.blocks, blockIndex, to),
      }
      updateConfig({ sections: updated })
    },
    [footerConfig, updateConfig]
  )

  const updateBlock = useCallback(
    (sectionIndex: number, blockIndex: number, updates: Partial<Record<string, unknown>>) => {
      const updated = [...footerConfig.sections]
      const section = updated[sectionIndex]
      const block = section.blocks[blockIndex]
      if (!block) return

      updated[sectionIndex] = {
        ...section,
        blocks: section.blocks.map((b, i) => (i === blockIndex ? ({ ...b, ...updates, type: b.type } as FooterBlock) : b)),
      }
      updateConfig({ sections: updated })
    },
    [footerConfig, updateConfig]
  )

  if (!footerConfig) {
    return <div className="flex h-full items-center justify-center">Laden...</div>
  }

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Live Preview (Left) */}
      <div className="lg:flex-1 lg:border-r border-border bg-muted/30 p-6 overflow-y-auto hidden lg:block">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground">Live Preview</h2>
        </div>
        <div className="bg-background rounded-lg border border-border overflow-hidden">
          <FooterClient brand={activeBrand} footerConfig={footerConfig} pagesMap={pagesMap} />
        </div>
      </div>

      {/* Inspector (Right) */}
      <div className="lg:flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border bg-background px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Footer</h1>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Speichern..." : "Speichern"}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {validationError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          <div className="mb-4 flex items-center justify-between rounded-md bg-muted p-3">
            <span className="text-sm font-medium">Gesamtbreite: {totalSpan} / 12 Spalten</span>
            {totalSpan > 12 && (
              <span className="text-sm text-destructive">⚠️ Überschreitung!</span>
            )}
          </div>

          <Tabs value={activeBrand} onValueChange={(v) => setActiveBrand(v as BrandKey)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="physiotherapy">Physiotherapie</TabsTrigger>
              <TabsTrigger value="physio-konzept">Physio-Konzept</TabsTrigger>
            </TabsList>

            <TabsContent value={activeBrand} className="mt-6">
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="content">Inhalt</TabsTrigger>
                  <TabsTrigger value="design">Design</TabsTrigger>
                </TabsList>

                {/* Content Tab */}
                <TabsContent value="content" className="space-y-6 mt-6">
                  {/* Layout Width */}
                  <div className="space-y-4 rounded-lg border border-border p-4">
                    <Label className="text-base font-semibold">Layout</Label>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Footer Breite</Label>
                      <Select
                        value={footerConfig.layoutWidth || "contained"}
                        onValueChange={(value) => {
                          updateConfig({ layoutWidth: value as "full" | "contained" })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contained">Contained (wie Blocks)</SelectItem>
                          <SelectItem value="full">Full Background (volle Breite)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-2">
                        {footerConfig.layoutWidth === "full" 
                          ? "Der Footer-Hintergrund und Inhalt erstrecken sich über die volle Breite."
                          : "Der Footer-Inhalt nutzt die gleiche max-width wie die Content-Blöcke."}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Footer Background */}
                  <div className="space-y-4 rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Hintergrund</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateConfig({ background: undefined })}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Zurücksetzen
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Typ</Label>
                      <Select
                        value={footerConfig.background?.mode || "transparent"}
                        onValueChange={(value) => {
                          updateConfig({
                            background: {
                              ...footerConfig.background,
                              mode: value as any,
                            },
                          })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transparent">Transparent</SelectItem>
                          <SelectItem value="color">Farbe</SelectItem>
                          <SelectItem value="gradient">Verlauf</SelectItem>
                          <SelectItem value="image">Bild</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {footerConfig.background?.mode === "color" && (
                      <div className="space-y-2">
                        <Label className="text-xs">Farbe</Label>
                        <input
                          type="color"
                          value={footerConfig.background?.color || "#ffffff"}
                          onChange={(e) => {
                            updateConfig({
                              background: {
                                ...footerConfig.background,
                                color: e.target.value,
                              },
                            })
                          }}
                          className="h-10 w-full rounded border border-input cursor-pointer"
                        />
                      </div>
                    )}

                    {footerConfig.background?.mode === "gradient" && (
                      <div className="space-y-2">
                        <Label className="text-xs">Preset</Label>
                        <Select
                          value={footerConfig.background?.gradientPreset || "soft"}
                          onValueChange={(value) => {
                            updateConfig({
                              background: {
                                ...footerConfig.background,
                                gradientPreset: value as any,
                              },
                            })
                          }}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="soft">Soft</SelectItem>
                            <SelectItem value="aurora">Aurora</SelectItem>
                            <SelectItem value="ocean">Ocean</SelectItem>
                            <SelectItem value="sunset">Sunset</SelectItem>
                            <SelectItem value="hero">Hero</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {(footerConfig.background?.mode === "image" || footerConfig.background?.mode === "video") && (
                      <div className="space-y-3">
                        <ImageField
                          id={`footer-background-${footerConfig.background?.mode}`}
                          label={footerConfig.background?.mode === "video" ? "Video" : "Hintergrundbild"}
                          value={footerConfig.background?.mediaUrl || ""}
                          onChange={(url) => {
                            updateConfig({
                              background: {
                                ...footerConfig.background,
                                mediaUrl: url || undefined,
                              },
                            })
                          }}
                          onMediaSelect={(mediaId, url) => {
                            updateConfig({
                              background: {
                                ...footerConfig.background,
                                mediaId,
                                mediaUrl: url,
                              },
                            })
                          }}
                          placeholder={footerConfig.background?.mode === "video" ? "/placeholder-video.mp4" : "/placeholder-image.jpg"}
                        />
                      </div>
                    )}

                    {footerConfig.background?.mode && footerConfig.background?.mode !== "transparent" && (
                      <div className="space-y-3 rounded-md bg-muted/50 p-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="bg-overlay-enabled"
                            checked={footerConfig.background?.overlay?.enabled || false}
                            onCheckedChange={(checked) => {
                              updateConfig({
                                background: {
                                  ...footerConfig.background,
                                  overlay: {
                                    ...footerConfig.background?.overlay,
                                    enabled: checked as boolean,
                                  },
                                },
                              })
                            }}
                          />
                          <Label htmlFor="bg-overlay-enabled" className="text-xs font-medium">Overlay (für Lesbarkeit)</Label>
                        </div>

                        {footerConfig.background?.overlay?.enabled && (
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Farbe</Label>
                              <input
                                type="color"
                                value={footerConfig.background?.overlay?.color || "#000000"}
                                onChange={(e) => {
                                  updateConfig({
                                    background: {
                                      ...footerConfig.background,
                                      overlay: {
                                        ...footerConfig.background?.overlay,
                                        color: e.target.value,
                                      },
                                    },
                                  })
                                }}
                                className="h-8 w-full rounded border border-input cursor-pointer"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Opazität: {Math.round(((footerConfig.background?.overlay?.opacity || 0.3) * 100))}%</Label>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={Math.round(((footerConfig.background?.overlay?.opacity || 0.3) * 100))}
                                onChange={(e) => {
                                  updateConfig({
                                    background: {
                                      ...footerConfig.background,
                                      overlay: {
                                        ...footerConfig.background?.overlay,
                                        opacity: Number(e.target.value) / 100,
                                      },
                                    },
                                  })
                                }}
                                className="w-full"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Glassmorphism */}
                  <div className="space-y-4 rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Glassmorphism (Panel-Effekt)</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateConfig({ glassmorphism: undefined })}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Zurücksetzen
                      </Button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="glass-enabled"
                        checked={footerConfig.glassmorphism?.enabled ?? true}
                        onCheckedChange={(enabled) => {
                          updateConfig({
                            glassmorphism: {
                              ...footerConfig.glassmorphism,
                              enabled,
                            },
                          })
                        }}
                      />
                      <Label htmlFor="glass-enabled" className="text-sm font-medium">Aktiviert</Label>
                    </div>

                    {footerConfig.glassmorphism?.enabled !== false && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Intensität</Label>
                          <Select
                            value={footerConfig.glassmorphism?.intensity || "medium"}
                            onValueChange={(value) => {
                              updateConfig({
                                glassmorphism: {
                                  ...footerConfig.glassmorphism,
                                  intensity: value as any,
                                },
                              })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="subtle">Subtil (kaum sichtbar)</SelectItem>
                              <SelectItem value="medium">Medium (empfohlen)</SelectItem>
                              <SelectItem value="strong">Stark (sehr glasmorphic)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="glass-highlight"
                            checked={footerConfig.glassmorphism?.highlightLine ?? true}
                            onCheckedChange={(checked) => {
                              updateConfig({
                                glassmorphism: {
                                  ...footerConfig.glassmorphism,
                                  highlightLine: checked as boolean,
                                },
                              })
                            }}
                          />
                          <Label htmlFor="glass-highlight" className="text-xs font-medium">Highlight-Linie oben</Label>
                        </div>

                        {footerConfig.glassmorphism?.highlightLine && (
                          <div className="space-y-2">
                            <Label className="text-xs">Highlight-Farbe</Label>
                            <input
                              type="color"
                              value={footerConfig.glassmorphism?.highlightColor || "#e5e7eb"}
                              onChange={(e) => {
                                updateConfig({
                                  glassmorphism: {
                                    ...footerConfig.glassmorphism,
                                    highlightColor: e.target.value,
                                  },
                                })
                              }}
                              className="h-8 w-full rounded border border-input cursor-pointer"
                            />
                          </div>
                        )}

                        <div className="space-y-2 border-t pt-3">
                          <Label className="text-xs">Border-Farbe</Label>
                          <input
                            type="color"
                            value={footerConfig.glassmorphism?.borderColor || "#e5e7eb"}
                            onChange={(e) => {
                              updateConfig({
                                glassmorphism: {
                                  ...footerConfig.glassmorphism,
                                  borderColor: e.target.value,
                                },
                              })
                            }}
                            className="h-8 w-full rounded border border-input cursor-pointer"
                          />
                          <p className="text-xs text-muted-foreground">Border-Opazität wird über die Intensität gesteuert</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Sections */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Sektionen ({footerConfig.sections.length}/5)</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addSection}
                        disabled={footerConfig.sections.length >= 5}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Sektion hinzufügen
                      </Button>
                    </div>

                    {footerConfig.sections.map((section, sectionIndex) => (
                      <div key={section.id} className="rounded-lg border border-border p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={section.title || ""}
                              onChange={(e) => updateSection(sectionIndex, { title: e.target.value })}
                              placeholder="Sektions-Titel (optional)"
                              className="max-w-xs"
                            />
                            <Select
                              value={String(section.span)}
                              onValueChange={(value) => updateSectionSpan(sectionIndex, Number(value) as 2 | 3 | 4 | 6)}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="2">Schmal (2/12)</SelectItem>
                                <SelectItem value="3">Normal (3/12)</SelectItem>
                                <SelectItem value="4">Breit (4/12)</SelectItem>
                                <SelectItem value="6">Sehr breit (6/12)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => moveSection(sectionIndex, -1)}
                              disabled={sectionIndex === 0}
                              title="Nach oben"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => moveSection(sectionIndex, 1)}
                              disabled={sectionIndex === footerConfig.sections.length - 1}
                              title="Nach unten"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => removeSection(sectionIndex)}
                              disabled={footerConfig.sections.length <= 2}
                              title="Entfernen"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <Separator />

                        {/* Blocks */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Blöcke</Label>
                            <Select
                              value={pendingBlockType[sectionIndex] || ""}
                              onValueChange={(value) => {
                                addBlock(sectionIndex, value as FooterBlock["type"])
                                setPendingBlockType((prev) => ({ ...prev, [sectionIndex]: "" }))
                              }}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Block hinzufügen" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="links">Links</SelectItem>
                                <SelectItem value="pages">Seiten</SelectItem>
                                <SelectItem value="logo">Logo</SelectItem>
                                <SelectItem value="copyright">Copyright</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {section.blocks.map((block, blockIndex) => (
                            <div key={block.id} className="rounded-md border border-border bg-muted/50 p-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">
                                  {block.type === "text" && "Text"}
                                  {block.type === "links" && "Links"}
                                  {block.type === "pages" && "Seiten"}
                                  {block.type === "logo" && "Logo"}
                                  {block.type === "copyright" && "Copyright"}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => moveBlock(sectionIndex, blockIndex, -1)}
                                    disabled={blockIndex === 0}
                                  >
                                    <ChevronUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => moveBlock(sectionIndex, blockIndex, 1)}
                                    disabled={blockIndex === section.blocks.length - 1}
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive"
                                    onClick={() => removeBlock(sectionIndex, blockIndex)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              {/* Block Editor */}
                              {block.type === "text" && (
                                <div className="space-y-2">
                                  <Label className="text-xs">Text</Label>
                                  <Textarea
                                    value={block.text}
                                    onChange={(e) => updateBlock(sectionIndex, blockIndex, { text: e.target.value })}
                                    placeholder="Text eingeben..."
                                    rows={3}
                                  />
                                </div>
                              )}

                              {block.type === "links" && (
                                <div className="space-y-3">
                                  <Input
                                    value={block.title || ""}
                                    onChange={(e) => updateBlock(sectionIndex, blockIndex, { title: e.target.value })}
                                    placeholder="Titel (optional)"
                                    className="text-sm"
                                  />
                                  <div className="space-y-2">
                                    <Label className="text-xs">Links</Label>
                                    {block.links.map((link, linkIndex) => (
                                      <div key={link.id} className="flex gap-2">
                                        <Input
                                          value={link.label}
                                          onChange={(e) => {
                                            const updated = [...block.links]
                                            updated[linkIndex] = { ...link, label: e.target.value }
                                            updateBlock(sectionIndex, blockIndex, { links: updated })
                                          }}
                                          placeholder="Label"
                                          className="flex-1 text-sm"
                                        />
                                        <Input
                                          value={link.href}
                                          onChange={(e) => {
                                            const updated = [...block.links]
                                            updated[linkIndex] = { ...link, href: e.target.value }
                                            updateBlock(sectionIndex, blockIndex, { links: updated })
                                          }}
                                          placeholder="/link"
                                          className="flex-1 text-sm"
                                        />
                                        <div className="flex items-center gap-2">
                                          <Checkbox
                                            checked={link.newTab || false}
                                            onCheckedChange={(checked) => {
                                              const updated = [...block.links]
                                              updated[linkIndex] = { ...link, newTab: checked as boolean }
                                              updateBlock(sectionIndex, blockIndex, { links: updated })
                                            }}
                                          />
                                          <Label className="text-xs">Neuer Tab</Label>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() => {
                                            const updated = block.links.filter((_, i) => i !== linkIndex)
                                            updateBlock(sectionIndex, blockIndex, { links: updated })
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const newLink = { id: uuid(), label: "", href: "" }
                                        updateBlock(sectionIndex, blockIndex, { links: [...block.links, newLink] })
                                      }}
                                    >
                                      <Plus className="mr-2 h-3 w-3" />
                                      Link hinzufügen
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {block.type === "pages" && (
                                <div className="space-y-2">
                                  <Input
                                    value={block.title || ""}
                                    onChange={(e) => updateBlock(sectionIndex, blockIndex, { title: e.target.value })}
                                    placeholder="Titel (optional)"
                                    className="text-sm"
                                  />
                                  <Label className="text-xs">Seiten auswählen</Label>
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {pages.map((page) => (
                                      <div key={page.id} className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={block.pageSlugs.includes(page.slug)}
                                          onCheckedChange={(checked) => {
                                            const updated = checked
                                              ? [...block.pageSlugs, page.slug]
                                              : block.pageSlugs.filter((s) => s !== page.slug)
                                            updateBlock(sectionIndex, blockIndex, { pageSlugs: updated })
                                          }}
                                        />
                                        <Label className="text-sm flex-1">
                                          {page.title} ({page.slug})
                                          {page.status === "draft" && (
                                            <span className="ml-2 text-xs text-muted-foreground">(Entwurf)</span>
                                          )}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {block.type === "logo" && (
                                <div className="space-y-3">
                                  <ImageField
                                    id={`footer-logo-${block.id}`}
                                    label="Logo"
                                    value={block.url || ""}
                                    onChange={(url) => updateBlock(sectionIndex, blockIndex, { url: url || undefined })}
                                    onMediaSelect={(mediaId, url) =>
                                      updateBlock(sectionIndex, blockIndex, { mediaId, url })
                                    }
                                    placeholder="/placeholder-logo.svg"
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1.5">
                                      <Label className="text-xs">Größe</Label>
                                      <Select
                                        value={block.size || "md"}
                                        onValueChange={(value) =>
                                          updateBlock(sectionIndex, blockIndex, { size: value as "sm" | "md" | "lg" })
                                        }
                                      >
                                        <SelectTrigger className="h-8 text-sm">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="sm">Klein</SelectItem>
                                          <SelectItem value="md">Mittel</SelectItem>
                                          <SelectItem value="lg">Groß</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label className="text-xs">Darstellung</Label>
                                      <Select
                                        value={block.fit || "contain"}
                                        onValueChange={(value) =>
                                          updateBlock(sectionIndex, blockIndex, { fit: value as "contain" | "cover" })
                                        }
                                      >
                                        <SelectTrigger className="h-8 text-sm">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="contain">Vollständig</SelectItem>
                                          <SelectItem value="cover">Ausfüllen</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <Input
                                    value={block.href || ""}
                                    onChange={(e) => updateBlock(sectionIndex, blockIndex, { href: e.target.value || undefined })}
                                    placeholder="Link (optional)"
                                    className="text-sm"
                                  />
                                  <Input
                                    value={block.alt || ""}
                                    onChange={(e) => updateBlock(sectionIndex, blockIndex, { alt: e.target.value || undefined })}
                                    placeholder="Alt-Text (optional)"
                                    className="text-sm"
                                  />
                                </div>
                              )}

                              {block.type === "copyright" && (
                                <div className="space-y-2">
                                  <Label className="text-xs">Copyright-Text</Label>
                                  <Input
                                    value={block.text}
                                    onChange={(e) => updateBlock(sectionIndex, blockIndex, { text: e.target.value })}
                                    placeholder="© 2024..."
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Bottom Bar */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="bottom-bar-enabled"
                        checked={footerConfig.bottomBar?.enabled || false}
                        onCheckedChange={(enabled) =>
                          updateConfig({
                            bottomBar: {
                              ...footerConfig.bottomBar,
                              enabled,
                              left: enabled && !footerConfig.bottomBar?.left
                                ? { type: "copyright", id: uuid(), text: "" }
                                : footerConfig.bottomBar?.left,
                            },
                          })
                        }
                      />
                      <Label htmlFor="bottom-bar-enabled" className="text-base font-semibold">
                        Bottom Bar aktivieren
                      </Label>
                    </div>

                    {footerConfig.bottomBar?.enabled && (
                      <div className="space-y-4 rounded-lg border border-border p-4">
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Links (Copyright)</Label>
                          {footerConfig.bottomBar.left && (
                            <div className="space-y-2">
                              {footerConfig.bottomBar.left.type === "copyright" && (
                                <Input
                                  value={footerConfig.bottomBar.left.text}
                                  onChange={(e) =>
                                    (() => {
                                      const left = footerConfig.bottomBar?.left
                                      if (!left || left.type !== "copyright") return
                                      updateConfig({
                                        bottomBar: {
                                          ...footerConfig.bottomBar!,
                                          left: { ...left, text: e.target.value },
                                        },
                                      })
                                    })()
                                  }
                                  placeholder="© 2024..."
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Design Tab */}
                <TabsContent value="design" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold">Design-Voreinstellungen</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateConfig({ design: undefined })}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Zurücksetzen
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Preset</Label>
                      <Select
                        value={
                          !footerConfig.design ? "brand-default"
                          : DESIGN_PRESETS.find(p => JSON.stringify(p.design) === JSON.stringify(footerConfig.design))?.id
                          || "custom"
                        }
                        onValueChange={(presetId) => {
                          if (presetId === "custom") return
                          const preset = DESIGN_PRESETS.find(p => p.id === presetId)
                          if (preset) {
                            updateConfig({
                              design: presetId === "brand-default" ? undefined : preset.design,
                            })
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DESIGN_PRESETS.map((preset) => (
                            <SelectItem key={preset.id} value={preset.id}>
                              {preset.label}
                            </SelectItem>
                          ))}
                          {footerConfig.design && !DESIGN_PRESETS.some(p => JSON.stringify(p.design) === JSON.stringify(footerConfig.design)) && (
                            <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Abstände</Label>
                    <Select
                      value={footerConfig.design?.spacing?.py || "normal"}
                      onValueChange={(value) => {
                        const currentDesign = footerConfig.design || {}
                        updateConfig({
                          design: {
                            ...currentDesign,
                            spacing: {
                              py: value as "compact" | "normal" | "spacious",
                            },
                          },
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Kompakt</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="spacious">Großzügig</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Ausrichtung</Label>
                    <Select
                      value={footerConfig.design?.section?.align || "left"}
                      onValueChange={(value) => {
                        const currentDesign = footerConfig.design || {}
                        updateConfig({
                          design: {
                            ...currentDesign,
                            section: {
                              align: value as "left" | "center" | "right",
                            },
                          },
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Links</SelectItem>
                        <SelectItem value="center">Mittig</SelectItem>
                        <SelectItem value="right">Rechts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-sm font-semibold">Typografie</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Text-Größe</Label>
                        <Select
                          value={footerConfig.design?.typography?.bodySize || "base"}
                          onValueChange={(value) => {
                            const currentDesign = footerConfig.design || {}
                            updateConfig({
                              design: {
                                ...currentDesign,
                                typography: {
                                  ...currentDesign.typography,
                                  bodySize: value as "sm" | "base" | "lg",
                                },
                              },
                            })
                          }}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sm">Klein</SelectItem>
                            <SelectItem value="base">Normal</SelectItem>
                            <SelectItem value="lg">Groß</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Text-Gewicht</Label>
                        <Select
                          value={footerConfig.design?.typography?.bodyWeight || "normal"}
                          onValueChange={(value) => {
                            const currentDesign = footerConfig.design || {}
                            updateConfig({
                              design: {
                                ...currentDesign,
                                typography: {
                                  ...currentDesign.typography,
                                  bodyWeight: value as "normal" | "semibold" | "bold",
                                },
                              },
                            })
                          }}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="semibold">Halbfett</SelectItem>
                            <SelectItem value="bold">Fett</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Text-Schriftart</Label>
                        <Select
                          value={footerConfig.design?.typography?.bodyFont || "sans"}
                          onValueChange={(value) => {
                            const currentDesign = footerConfig.design || {}
                            updateConfig({
                              design: {
                                ...currentDesign,
                                typography: {
                                  ...currentDesign.typography,
                                  bodyFont: value as "sans" | "serif" | "mono" | "geist-sans" | "geist-mono",
                                },
                              },
                            })
                          }}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_FAMILIES.map((font) => (
                              <SelectItem key={font.id} value={font.id}>
                                {font.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Überschrift-Größe</Label>
                        <Select
                          value={footerConfig.design?.typography?.headingSize || "base"}
                          onValueChange={(value) => {
                            const currentDesign = footerConfig.design || {}
                            updateConfig({
                              design: {
                                ...currentDesign,
                                typography: {
                                  ...currentDesign.typography,
                                  headingSize: value as "sm" | "base" | "lg",
                                },
                              },
                            })
                          }}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sm">Klein</SelectItem>
                            <SelectItem value="base">Normal</SelectItem>
                            <SelectItem value="lg">Groß</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Überschrift-Gewicht</Label>
                        <Select
                          value={footerConfig.design?.typography?.headingWeight || "semibold"}
                          onValueChange={(value) => {
                            const currentDesign = footerConfig.design || {}
                            updateConfig({
                              design: {
                                ...currentDesign,
                                typography: {
                                  ...currentDesign.typography,
                                  headingWeight: value as "normal" | "semibold" | "bold",
                                },
                              },
                            })
                          }}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="semibold">Halbfett</SelectItem>
                            <SelectItem value="bold">Fett</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Überschrift-Schriftart</Label>
                        <Select
                          value={footerConfig.design?.typography?.headingFont || "sans"}
                          onValueChange={(value) => {
                            const currentDesign = footerConfig.design || {}
                            updateConfig({
                              design: {
                                ...currentDesign,
                                typography: {
                                  ...currentDesign.typography,
                                  headingFont: value as "sans" | "serif" | "mono" | "geist-sans" | "geist-mono",
                                },
                              },
                            })
                          }}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_FAMILIES.map((font) => (
                              <SelectItem key={font.id} value={font.id}>
                                {font.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Farben</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentDesign = footerConfig.design || {}
                          updateConfig({
                            design: {
                              ...currentDesign,
                              colors: {
                                bgCustom: undefined,
                                textCustom: undefined,
                                headingCustom: undefined,
                                accentCustom: undefined,
                              },
                            },
                          })
                        }}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Zurücksetzen
                      </Button>
                    </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Hintergrundfarbe</Label>
                          <input
                            type="color"
                            value={footerConfig.design?.colors?.bgCustom || "#ffffff"}
                            onChange={(e) => {
                              const currentDesign = footerConfig.design || {}
                              updateConfig({
                                design: {
                                  ...currentDesign,
                                  colors: {
                                    ...currentDesign.colors,
                                    bgCustom: e.target.value,
                                  },
                                },
                              })
                            }}
                            className="h-10 w-full rounded border border-input cursor-pointer"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Textfarbe</Label>
                          <input
                            type="color"
                            value={footerConfig.design?.colors?.textCustom || "#000000"}
                            onChange={(e) => {
                              const currentDesign = footerConfig.design || {}
                              updateConfig({
                                design: {
                                  ...currentDesign,
                                  colors: {
                                    ...currentDesign.colors,
                                    textCustom: e.target.value,
                                  },
                                },
                              })
                            }}
                            className="h-10 w-full rounded border border-input cursor-pointer"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Überschrift-Farbe</Label>
                          <input
                            type="color"
                            value={footerConfig.design?.colors?.headingCustom || "#18181b"}
                            onChange={(e) => {
                              const currentDesign = footerConfig.design || {}
                              updateConfig({
                                design: {
                                  ...currentDesign,
                                  colors: {
                                    ...currentDesign.colors,
                                    headingCustom: e.target.value,
                                  },
                                },
                              })
                            }}
                            className="h-10 w-full rounded border border-input cursor-pointer"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Akzentfarbe</Label>
                          <input
                            type="color"
                            value={footerConfig.design?.colors?.accentCustom || "#f97316"}
                            onChange={(e) => {
                              const currentDesign = footerConfig.design || {}
                              updateConfig({
                                design: {
                                  ...currentDesign,
                                  colors: {
                                    ...currentDesign.colors,
                                    accentCustom: e.target.value,
                                  },
                                },
                              })
                            }}
                            className="h-10 w-full rounded border border-input cursor-pointer"
                          />
                        </div>
                      </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Bottom Bar</Label>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">Ausrichtung</Label>
                      <Select
                        value={footerConfig.design?.bottomBar?.align || "left"}
                        onValueChange={(value) => {
                          const currentDesign = footerConfig.design || {}
                          updateConfig({
                            design: {
                              ...currentDesign,
                              bottomBar: {
                                ...currentDesign.bottomBar,
                                align: value as "left" | "center" | "right",
                              },
                            },
                          })
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Links</SelectItem>
                          <SelectItem value="center">Mittig</SelectItem>
                          <SelectItem value="right">Rechts</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="divider-enabled"
                        checked={footerConfig.design?.bottomBar?.dividerEnabled || false}
                        onCheckedChange={(enabled) => {
                          const currentDesign = footerConfig.design || {}
                          updateConfig({
                            design: {
                              ...currentDesign,
                              bottomBar: {
                                ...currentDesign.bottomBar,
                                dividerEnabled: enabled,
                              },
                            },
                          })
                        }}
                      />
                      <Label htmlFor="divider-enabled" className="text-xs font-medium">
                        Divider anzeigen
                      </Label>
                    </div>

                    {footerConfig.design?.bottomBar?.dividerEnabled && (
                      <div className="space-y-2">
                        <Label className="text-xs">Divider-Stil</Label>
                        <Select
                          value={footerConfig.design.bottomBar?.dividerClass || "border-zinc-200"}
                          onValueChange={(value) => {
                            const currentDesign = footerConfig.design || {}
                            updateConfig({
                              design: {
                                ...currentDesign,
                                bottomBar: {
                                  ...currentDesign.bottomBar,
                                  dividerClass: value as any,
                                },
                              },
                            })
                          }}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DIVIDER_CLASS_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {footerConfig.design && (
                    <>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
