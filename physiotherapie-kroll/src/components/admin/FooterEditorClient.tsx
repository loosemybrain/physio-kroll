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
import { Plus, Trash2, ChevronUp, ChevronDown, Save, AlertCircle } from "lucide-react"
import { arrayMove, arrayRemove, uuid } from "@/lib/cms/arrayOps"
import type { BrandKey } from "@/components/brand/brandAssets"
import type { FooterConfig, FooterSection, FooterBlock } from "@/types/footer"
import { DEFAULT_FOOTER_CONFIG, getDefaultSpansForSectionCount } from "@/lib/supabase/footer.shared"
import type { PageForNavigation } from "@/lib/supabase/pages.server"
import { cn } from "@/lib/utils"
// Server-owned session: saving goes through our API route so HttpOnly cookies work.

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

  const footerConfig = useMemo(() => {
    return activeBrand === "physiotherapy" ? physioConfig : konzeptConfig
  }, [activeBrand, physioConfig, konzeptConfig])

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
    <div className="flex h-full flex-col">
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

        <Tabs value={activeBrand} onValueChange={(v) => setActiveBrand(v as BrandKey)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="physiotherapy">Physiotherapie</TabsTrigger>
            <TabsTrigger value="physio-konzept">Physio-Konzept</TabsTrigger>
          </TabsList>

          <TabsContent value={activeBrand} className="mt-6 space-y-6">
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
                        onValueChange={(value) => addBlock(sectionIndex, value as FooterBlock["type"])}
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
        </Tabs>
      </div>
    </div>
  )
}
