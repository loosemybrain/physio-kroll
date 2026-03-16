"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { CMSBlock, HeroBlock } from "@/types/cms"
import { setByPath } from "@/lib/cms/editorPathOps"
import { ImageField } from "../../ImageField"
import { ColorField } from "../../ColorField"

export interface PageEditorInspectorSectionProps {
  selectedBlock: CMSBlock
  selectedBlockId: string | null
  updateBlockPropsById: (blockId: string, updater: (prevProps: Record<string, unknown>) => CMSBlock["props"]) => void
  activeBrandTab: Record<string, "physiotherapy" | "physio-konzept">
  setActiveBrandTab: React.Dispatch<React.SetStateAction<Record<string, "physiotherapy" | "physio-konzept">>>
  fieldRefs: React.MutableRefObject<Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>>
  isTypingRef: React.MutableRefObject<boolean>
  selectedElementId: string | null
  selectElement: (blockId: string, elementId: string) => void
  deselectElement: (blockId: string) => void
}

function normalizeStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string") as string[]
  if (typeof v === "string") return [v]
  if (v && typeof v === "object") {
    const rec = v as Record<string, unknown>
    const numericKeys = Object.keys(rec).filter((k) => /^\d+$/.test(k)).sort((a, b) => Number(a) - Number(b))
    if (numericKeys.length > 0) {
      return numericKeys
        .map((k) => rec[k])
        .filter((x) => typeof x === "string") as string[]
    }
  }
  return []
}

const HeroInspectorSectionContent = React.memo(
  ({
    selectedBlock,
    selectedBlockId,
    updateBlockPropsById,
    activeBrandTab,
    setActiveBrandTab,
    fieldRefs,
    isTypingRef,
    selectedElementId,
    selectElement,
    deselectElement,
  }: PageEditorInspectorSectionProps) => {
    const props = selectedBlock.props as HeroBlock["props"]
    const currentBrandTab = activeBrandTab[selectedBlock.id] || "physiotherapy"

    const handleBrandTabChange = (brand: "physiotherapy" | "physio-konzept") => {
      setActiveBrandTab((prev) => ({ ...prev, [selectedBlock.id]: brand }))
    }

    const brandContentForTab = props.brandContent?.[currentBrandTab] || {}
    const brandContent = {
      ...brandContentForTab,
      headline: brandContentForTab.headline ?? "",
      subheadline: brandContentForTab.subheadline ?? "",
    }

    const handleBrandFieldChange = (fieldPath: string, value: unknown) => {
      if (!selectedBlock) return
      isTypingRef.current = true
      const blockId = selectedBlock.id
      const brand = currentBrandTab
      updateBlockPropsById(blockId, (prevProps) => {
        const next = setByPath(
          prevProps,
          `brandContent.${brand}.${fieldPath}`,
          value
        ) as CMSBlock["props"]
        return next
      })
      setTimeout(() => {
        isTypingRef.current = false
      }, 50)
    }

    const handleBrandImageChange = (url: string) => {
      if (!selectedBlock) return
      isTypingRef.current = true
      const blockId = selectedBlock.id
      const brand = currentBrandTab
      updateBlockPropsById(blockId, (prevProps) => {
        const next = setByPath(
          prevProps,
          `brandContent.${brand}.image`,
          url ? ({ url } as unknown) : undefined
        ) as CMSBlock["props"]
        return next
      })
      setTimeout(() => {
        isTypingRef.current = false
      }, 50)
    }

    const handleHeroRootFieldChange = (fieldPath: string, value: unknown) => {
      if (!selectedBlock) return
      isTypingRef.current = true
      const blockId = selectedBlock.id
      updateBlockPropsById(blockId, (prevProps) => {
        return setByPath(prevProps, fieldPath, value) as unknown as CMSBlock["props"]
      })
      setTimeout(() => {
        isTypingRef.current = false
      }, 50)
    }

    const trustItems = normalizeStringArray(props.trustItems ?? [])
    const mood = (props as any)?.mood ?? "physiotherapy"
    const actions = props.actions ?? (props.brandContent?.[mood as keyof typeof props.brandContent]?.actions) ?? []

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold">Media anzeigen</div>
            <div className="text-xs text-muted-foreground">
              Floating-Elemente werden im Media-Bereich gerendert.
            </div>
          </div>
          <Checkbox
            checked={Boolean(props.showMedia ?? true)}
            onCheckedChange={(checked) => handleHeroRootFieldChange("showMedia", Boolean(checked))}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Höhe (Viewport)</Label>
          <Select
            value={String(props.minHeightVh || "90")}
            onValueChange={(v) => handleHeroRootFieldChange("minHeightVh", v)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50vh</SelectItem>
              <SelectItem value="60">60vh</SelectItem>
              <SelectItem value="70">70vh</SelectItem>
              <SelectItem value="80">80vh</SelectItem>
              <SelectItem value="90">90vh</SelectItem>
              <SelectItem value="100">100vh</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Minimale Höhe des Hero-Bereichs
          </p>
        </div>

        <Tabs value={currentBrandTab} onValueChange={(v) => handleBrandTabChange(v as typeof currentBrandTab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="physiotherapy">Physiotherapie</TabsTrigger>
            <TabsTrigger value="physio-konzept">PhysioKonzept</TabsTrigger>
          </TabsList>
          <TabsContent value="physiotherapy" className="space-y-4 mt-4">
            {currentBrandTab !== "physiotherapy" ? null : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Überschrift</Label>
                  <Input
                    id={`${selectedBlock.id}.headline`}
                    ref={(el) => {
                      fieldRefs.current[`${selectedBlock.id}.headline`] = el
                    }}
                    value={String(brandContent.headline ?? "")}
                    onChange={(e) => handleBrandFieldChange("headline", e.target.value)}
                    placeholder="Ihre Gesundheit in besten Händen"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Unterüberschrift</Label>
                  <Textarea
                    id={`${selectedBlock.id}.subheadline`}
                    ref={(el) => {
                      fieldRefs.current[`${selectedBlock.id}.subheadline`] = el
                    }}
                    value={String(brandContent.subheadline ?? "")}
                    onChange={(e) => handleBrandFieldChange("subheadline", e.target.value)}
                    placeholder="Professionelle Physiotherapie mit ganzheitlichem Ansatz. Wir begleiten Sie auf dem Weg zu mehr Wohlbefinden und Lebensqualität."
                    className="text-sm min-h-[60px]"
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">CTA Text</Label>
                  <Input
                    id={`${selectedBlock.id}.ctaText`}
                    ref={(el) => {
                      fieldRefs.current[`${selectedBlock.id}.ctaText`] = el
                    }}
                    value={String(brandContent.ctaText || "")}
                    onChange={(e) => handleBrandFieldChange("ctaText", e.target.value)}
                    placeholder="CTA Text"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">CTA Link</Label>
                  <Input
                    id={`${selectedBlock.id}.ctaHref`}
                    ref={(el) => {
                      fieldRefs.current[`${selectedBlock.id}.ctaHref`] = el
                    }}
                    value={String(brandContent.ctaHref || "")}
                    onChange={(e) => handleBrandFieldChange("ctaHref", e.target.value)}
                    placeholder="/kontakt"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="rounded-md border border-border bg-muted/20 p-3 space-y-3">
                  <div className="text-xs font-semibold">Farben</div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Hero Hintergrund</Label>
                      <ColorField
                        value={String(props.heroBgColor || "")}
                        onChange={(v) => handleHeroRootFieldChange("heroBgColor", v)}
                        placeholder="#rrggbb"
                        inputRef={(el) => {
                          fieldRefs.current[`${selectedBlock.id}.heroBgColor`] = el
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Headline Farbe</Label>
                      <ColorField
                        value={String((brandContent as Record<string, unknown>).headlineColor || "")}
                        onChange={(v) => handleBrandFieldChange("headlineColor", v)}
                        placeholder="#rrggbb"
                        inputRef={(el) => {
                          fieldRefs.current[`${selectedBlock.id}.headlineColor`] = el
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Subheadline Farbe</Label>
                      <ColorField
                        value={String((brandContent as Record<string, unknown>).subheadlineColor || "")}
                        onChange={(v) => handleBrandFieldChange("subheadlineColor", v)}
                        placeholder="#rrggbb"
                        inputRef={(el) => {
                          fieldRefs.current[`${selectedBlock.id}.subheadlineColor`] = el
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Bild</Label>
                  <ImageField
                    id={`${selectedBlock.id}.brandContent.${currentBrandTab}.image`}
                    label=""
                    value={
                      brandContent.image && "url" in brandContent.image
                        ? String(brandContent.image.url)
                        : ""
                    }
                    onChange={handleBrandImageChange}
                    placeholder="/placeholder.svg"
                  />
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value="physio-konzept" className="space-y-4 mt-4">
            {currentBrandTab !== "physio-konzept" ? null : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Überschrift</Label>
                  <Input
                    id={`${selectedBlock.id}.headline-pk`}
                    ref={(el) => {
                      fieldRefs.current[`${selectedBlock.id}.headline-pk`] = el
                    }}
                    value={String(brandContent.headline ?? "")}
                    onChange={(e) => handleBrandFieldChange("headline", e.target.value)}
                    placeholder="Ihre Gesundheit in besten Händen"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Unterüberschrift</Label>
                  <Textarea
                    id={`${selectedBlock.id}.subheadline-pk`}
                    ref={(el) => {
                      fieldRefs.current[`${selectedBlock.id}.subheadline-pk`] = el
                    }}
                    value={String(brandContent.subheadline ?? "")}
                    onChange={(e) => handleBrandFieldChange("subheadline", e.target.value)}
                    placeholder="Professionelle Physiotherapie mit ganzheitlichem Ansatz. Wir begleiten Sie auf dem Weg zu mehr Wohlbefinden und Lebensqualität."
                    className="text-sm min-h-[60px]"
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">CTA Text</Label>
                  <Input
                    id={`${selectedBlock.id}.ctaText-pk`}
                    ref={(el) => {
                      fieldRefs.current[`${selectedBlock.id}.ctaText-pk`] = el
                    }}
                    value={String(brandContent.ctaText || "")}
                    onChange={(e) => handleBrandFieldChange("ctaText", e.target.value)}
                    placeholder="CTA Text"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">CTA Link</Label>
                  <Input
                    id={`${selectedBlock.id}.ctaHref-pk`}
                    ref={(el) => {
                      fieldRefs.current[`${selectedBlock.id}.ctaHref-pk`] = el
                    }}
                    value={String(brandContent.ctaHref || "")}
                    onChange={(e) => handleBrandFieldChange("ctaHref", e.target.value)}
                    placeholder="/kontakt"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Bild</Label>
                  <ImageField
                    id={`${selectedBlock.id}.brandContent.${currentBrandTab}.image`}
                    label=""
                    value={
                      brandContent.image && "url" in brandContent.image
                        ? String(brandContent.image.url)
                        : ""
                    }
                    onChange={handleBrandImageChange}
                    placeholder="/placeholder.svg"
                  />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {trustItems.length > 0 && (
          <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
            <Label className="text-xs font-semibold">Trust Items</Label>
            <div className="flex flex-wrap gap-2">
              {trustItems.map((item, index) => {
                const itemId = `trustItems.${index}`
                const isSelected = selectedElementId === itemId
                const itemKey = `trustItems-${index}-${String(item || "").substring(0, 20)}`
                return (
                  <Button
                    key={itemKey}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => selectElement(selectedBlockId || "", itemId)}
                  >
                    Item {index + 1}
                  </Button>
                )
              })}
            </div>
            {selectedElementId && selectedElementId.startsWith("trustItems.") && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => deselectElement(selectedBlockId || "")}
              >
                Deselect
              </Button>
            )}
          </div>
        )}

        {actions.length > 0 && (
          <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
            <Label className="text-xs font-semibold">CTA Actions</Label>
            <div className="flex flex-wrap gap-2">
              {actions.map((action: any, index: number) => {
                const itemId = `action-${action.id}`
                const isSelected = selectedElementId === itemId
                return (
                  <Button
                    key={action?.id ?? `action-${action?.label ?? "unnamed"}-${action?.href ?? "nohref"}-${index}`}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => selectElement(selectedBlockId || "", itemId)}
                  >
                    {action.label || `Action ${index + 1}`}
                  </Button>
                )
              })}
            </div>
            {selectedElementId && selectedElementId.startsWith("action-") && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => deselectElement(selectedBlockId || "")}
              >
                Deselect
              </Button>
            )}
          </div>
        )}

        <Separator />
      </div>
    )
  }
)

HeroInspectorSectionContent.displayName = "HeroInspectorSection"

export function HeroInspectorSection(props: PageEditorInspectorSectionProps) {
  return <HeroInspectorSectionContent {...props} />
}
