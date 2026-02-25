"use client"

import { useState, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import type { BrandKey } from "@/types/navigation"
import type { FooterConfig, FooterDesign } from "@/types/footer"
import { DEFAULT_FOOTER_CONFIG } from "@/types/footer"
import { FooterClient } from "@/components/layout/FooterClient"
import {
  DESIGN_PRESETS,
  SPACING_OPTIONS,
  DIVIDER_CLASS_OPTIONS,
} from "@/lib/theme/footerTheme"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface FooterEditorClientProps {
  initialConfigs: Record<BrandKey, FooterConfig>
  initialPages: Array<{ slug: string; title: string }>
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getActivePreset(design: FooterDesign | undefined): string {
  if (!design || Object.keys(design).length === 0) return "brand-default"

  // Try to match against known presets
  for (const preset of DESIGN_PRESETS) {
    if (preset.value === "brand-default") continue
    const pd = preset.design
    if (
      pd.bgClass === design.bgClass &&
      pd.textClass === design.textClass &&
      pd.linkClass === design.linkClass &&
      pd.linkHoverClass === design.linkHoverClass
    ) {
      return preset.value
    }
  }
  return "custom"
}

/* ------------------------------------------------------------------ */
/*  Editor component                                                   */
/* ------------------------------------------------------------------ */

export function FooterEditorClient({
  initialConfigs,
  initialPages,
}: FooterEditorClientProps) {
  const [activeBrand, setActiveBrand] = useState<BrandKey>("physiotherapy")
  const [configs, setConfigs] = useState<Record<BrandKey, FooterConfig>>(initialConfigs)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  const footerConfig = configs[activeBrand]

  const pagesMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of initialPages) {
      m.set(p.slug, p.title)
    }
    return m
  }, [initialPages])

  /* ---- Config updater ---- */

  const updateConfig = useCallback(
    (updater: (prev: FooterConfig) => FooterConfig) => {
      setConfigs((prev) => ({
        ...prev,
        [activeBrand]: updater(prev[activeBrand]),
      }))
    },
    [activeBrand]
  )

  const updateDesign = useCallback(
    (updater: (prev: FooterDesign) => FooterDesign) => {
      updateConfig((cfg) => ({
        ...cfg,
        design: updater(cfg.design ?? {}),
      }))
    },
    [updateConfig]
  )

  /* ---- Save handler ---- */

  const handleSave = useCallback(async () => {
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch("/api/footer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: activeBrand,
          config: configs[activeBrand],
        }),
      })
      if (res.ok) {
        setSaveMsg("Gespeichert!")
      } else {
        setSaveMsg("Fehler beim Speichern.")
      }
    } catch {
      setSaveMsg("Netzwerkfehler.")
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(null), 3000)
    }
  }, [activeBrand, configs])

  /* ---- Design tab state ---- */

  const design = footerConfig.design ?? {}
  const activePreset = getActivePreset(design)

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* ============================================================= */}
      {/*  LEFT: Live Preview                                            */}
      {/* ============================================================= */}
      <div className="flex-1 border-b bg-muted/30 lg:border-b-0 lg:border-r">
        <div className="sticky top-0 flex items-center justify-between border-b bg-background px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Live-Vorschau</h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={activeBrand === "physiotherapy" ? "default" : "outline"}
              onClick={() => setActiveBrand("physiotherapy")}
              className="rounded-full text-xs"
            >
              Physiotherapy
            </Button>
            <Button
              size="sm"
              variant={activeBrand === "physio-konzept" ? "default" : "outline"}
              onClick={() => setActiveBrand("physio-konzept")}
              className="rounded-full text-xs"
            >
              PhysioKonzept
            </Button>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex min-h-[400px] items-end overflow-auto">
          <FooterClient
            brand={activeBrand}
            footerConfig={footerConfig}
            pagesMap={pagesMap}
            className="w-full"
          />
        </div>
      </div>

      {/* ============================================================= */}
      {/*  RIGHT: Inspector                                              */}
      {/* ============================================================= */}
      <div className="w-full shrink-0 lg:w-[420px]">
        <div className="sticky top-0 flex items-center justify-between border-b bg-background px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Footer Editor</h2>
          <div className="flex items-center gap-2">
            {saveMsg && (
              <span className="text-xs text-muted-foreground">{saveMsg}</span>
            )}
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Speichert..." : "Speichern"}
            </Button>
          </div>
        </div>

        <div className="p-4">
          <Tabs defaultValue="content">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="content" className="flex-1">
                Content
              </TabsTrigger>
              <TabsTrigger value="design" className="flex-1">
                Design
              </TabsTrigger>
            </TabsList>

            {/* ---- Content Tab ---- */}
            <TabsContent value="content" className="flex flex-col gap-6">
              <ContentEditor footerConfig={footerConfig} updateConfig={updateConfig} />
            </TabsContent>

            {/* ---- Design Tab ---- */}
            <TabsContent value="design" className="flex flex-col gap-6">
              <DesignEditor
                design={design}
                activePreset={activePreset}
                updateDesign={updateDesign}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Content Editor                                                     */
/* ================================================================== */

function ContentEditor({
  footerConfig,
  updateConfig,
}: {
  footerConfig: FooterConfig
  updateConfig: (updater: (prev: FooterConfig) => FooterConfig) => void
}) {
  return (
    <>
      {/* Sections */}
      {footerConfig.sections.map((section, si) => (
        <div key={section.id} className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Spalte {si + 1}
            {section.span && section.span > 1 && (
              <span className="ml-1 text-xs text-muted-foreground">
                (span {section.span})
              </span>
            )}
          </h3>

          {section.blocks.map((block, bi) => (
            <div key={block.id} className="mb-3 last:mb-0">
              {block.title !== undefined && (
                <div className="mb-2">
                  <Label className="text-xs text-muted-foreground">Titel</Label>
                  <Input
                    value={block.title ?? ""}
                    onChange={(e) => {
                      const val = e.target.value
                      updateConfig((cfg) => {
                        const sections = [...cfg.sections]
                        const blocks = [...sections[si].blocks]
                        blocks[bi] = { ...blocks[bi], title: val }
                        sections[si] = { ...sections[si], blocks }
                        return { ...cfg, sections }
                      })
                    }}
                    className="mt-1"
                  />
                </div>
              )}

              {block.type === "text" && block.content !== undefined && (
                <div>
                  <Label className="text-xs text-muted-foreground">Text</Label>
                  <Textarea
                    value={block.content ?? ""}
                    rows={3}
                    onChange={(e) => {
                      const val = e.target.value
                      updateConfig((cfg) => {
                        const sections = [...cfg.sections]
                        const blocks = [...sections[si].blocks]
                        blocks[bi] = { ...blocks[bi], content: val }
                        sections[si] = { ...sections[si], blocks }
                        return { ...cfg, sections }
                      })
                    }}
                    className="mt-1"
                  />
                </div>
              )}

              {block.type === "links" && block.links && (
                <div className="mt-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Links</Label>
                  {block.links.map((link, li) => (
                    <div key={link.id} className="flex items-center gap-2">
                      <Input
                        value={link.label}
                        onChange={(e) => {
                          const val = e.target.value
                          updateConfig((cfg) => {
                            const sections = [...cfg.sections]
                            const blocks = [...sections[si].blocks]
                            const links = [...(blocks[bi].links ?? [])]
                            links[li] = { ...links[li], label: val }
                            blocks[bi] = { ...blocks[bi], links }
                            sections[si] = { ...sections[si], blocks }
                            return { ...cfg, sections }
                          })
                        }}
                        className="text-xs"
                        placeholder="Label"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Bottom bar */}
      {footerConfig.bottomBar && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Bottom Bar</h3>
          <div className="mb-2">
            <Label className="text-xs text-muted-foreground">Links</Label>
            <Input
              value={footerConfig.bottomBar.left ?? ""}
              onChange={(e) => {
                const val = e.target.value
                updateConfig((cfg) => ({
                  ...cfg,
                  bottomBar: { ...cfg.bottomBar, left: val },
                }))
              }}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Rechts</Label>
            <Input
              value={footerConfig.bottomBar.right ?? ""}
              onChange={(e) => {
                const val = e.target.value
                updateConfig((cfg) => ({
                  ...cfg,
                  bottomBar: { ...cfg.bottomBar, right: val },
                }))
              }}
              className="mt-1"
            />
          </div>
        </div>
      )}
    </>
  )
}

/* ================================================================== */
/*  Design Editor                                                      */
/* ================================================================== */

function DesignEditor({
  design,
  activePreset,
  updateDesign,
}: {
  design: FooterDesign
  activePreset: string
  updateDesign: (updater: (prev: FooterDesign) => FooterDesign) => void
}) {
  return (
    <>
      {/* Preset */}
      <div>
        <Label className="text-xs text-muted-foreground">Hintergrund-Preset</Label>
        <Select
          value={activePreset}
          onValueChange={(val) => {
            const preset = DESIGN_PRESETS.find((p) => p.value === val)
            if (preset) {
              updateDesign(() => ({ ...preset.design }))
            }
          }}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DESIGN_PRESETS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Spacing */}
      <div>
        <Label className="text-xs text-muted-foreground">Abstand (Vertikal)</Label>
        <Select
          value={design.spacing?.py ?? "md"}
          onValueChange={(val) => {
            updateDesign((prev) => ({
              ...prev,
              spacing: { ...prev.spacing, py: val as "sm" | "md" | "lg" },
            }))
          }}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SPACING_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Border toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">Rahmen (Border)</Label>
        <Switch
          checked={!!design.borderClass}
          onCheckedChange={(checked) => {
            updateDesign((prev) => ({
              ...prev,
              borderClass: checked ? "border-border" : undefined,
            }))
          }}
        />
      </div>

      {/* Container panel toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">Container-Panel</Label>
        <Switch
          checked={design.container?.enabled ?? false}
          onCheckedChange={(checked) => {
            updateDesign((prev) => ({
              ...prev,
              container: { ...prev.container, enabled: checked },
            }))
          }}
        />
      </div>

      {/* Divider toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">Bottom Bar Divider</Label>
        <Switch
          checked={design.bottomBar?.dividerEnabled ?? true}
          onCheckedChange={(checked) => {
            updateDesign((prev) => ({
              ...prev,
              bottomBar: { ...prev.bottomBar, dividerEnabled: checked },
            }))
          }}
        />
      </div>

      {/* Divider style (only if enabled) */}
      {(design.bottomBar?.dividerEnabled ?? true) && (
        <div>
          <Label className="text-xs text-muted-foreground">Divider-Stil</Label>
          <Select
            value={design.bottomBar?.dividerClass ?? "border-inherit"}
            onValueChange={(val) => {
              updateDesign((prev) => ({
                ...prev,
                bottomBar: { ...prev.bottomBar, dividerClass: val },
              }))
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIVIDER_CLASS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Reset */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => updateDesign(() => ({}))}
        className="mt-2 w-full"
      >
        Design zurücksetzen (Brand Defaults)
      </Button>
    </>
  )
}
