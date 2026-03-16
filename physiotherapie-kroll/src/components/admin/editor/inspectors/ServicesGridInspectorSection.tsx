"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { CMSBlock } from "@/types/cms"
import { createServiceCard } from "@/cms/blocks/registry"
import { getByPath, setByPath } from "@/lib/cms/editorPathOps"
import { getAvailableIconsWithLabels } from "@/components/icons/service-icons"
import { UniversalRepeaterInspector } from "../repeater/UniversalRepeaterInspector"
import type { InspectorFieldType } from "@/cms/blocks/registry"

export interface PageEditorInspectorSectionProps {
  selectedBlock: CMSBlock
  selectedBlockId: string | null
  expandedRepeaterCards: Record<string, string | null>
  setExpandedRepeaterCards: React.Dispatch<React.SetStateAction<Record<string, string | null>>>
  updateSelectedProps: (nextProps: CMSBlock["props"]) => void
  editorActions: any
  confirmDeleteItem: (blockId: string, arrayPath: string, index: number) => void
  lastAddedRepeaterRef: React.MutableRefObject<{ key: string; itemId: string } | null>
  renderOneRepeaterItemFields: (
    block: CMSBlock,
    arrayPath: string,
    index: number,
    item: Record<string, unknown>,
    itemFields: Array<{ key: string; label: string; type: InspectorFieldType; placeholder?: string; required?: boolean; options?: Array<{ value: string; label: string }> }>
  ) => React.ReactNode
}

const ServicesGridInspectorSectionContent = React.memo(
  ({
    selectedBlock,
    expandedRepeaterCards,
    setExpandedRepeaterCards,
    updateSelectedProps,
    editorActions,
    confirmDeleteItem,
    lastAddedRepeaterRef,
    renderOneRepeaterItemFields,
  }: PageEditorInspectorSectionProps) => {
    const handleVariantChange = (v: string) => {
      if (!selectedBlock) return
      const currentProps = selectedBlock.props as Record<string, unknown>
      const updatedProps = { ...currentProps, variant: v } as CMSBlock["props"]
      updateSelectedProps(updatedProps)
    }

    const handleBackgroundChange = (v: string) => {
      if (!selectedBlock) return
      const currentProps = selectedBlock.props as Record<string, unknown>
      const updatedProps = { ...currentProps, background: v } as CMSBlock["props"]
      updateSelectedProps(updatedProps)
    }

    const handleColumnsChange = (v: string) => {
      if (!selectedBlock) return
      const currentProps = selectedBlock.props as Record<string, unknown>
      const updatedProps = { ...currentProps, columns: Number(v) } as CMSBlock["props"]
      updateSelectedProps(updatedProps)
    }

    const handleTextAlignChange = (v: string) => {
      if (!selectedBlock) return
      const currentProps = selectedBlock.props as Record<string, unknown>
      const updatedProps = { ...currentProps, textAlign: v } as CMSBlock["props"]
      updateSelectedProps(updatedProps)
    }

    const handleAutoplayChange = () => {
      if (!selectedBlock) return
      const currentProps = selectedBlock.props as Record<string, unknown>
      const updatedProps = { ...currentProps, autoplay: !currentProps.autoplay } as CMSBlock["props"]
      updateSelectedProps(updatedProps)
    }

    const handleIntervalChange = (v: string) => {
      if (!selectedBlock) return
      const currentProps = selectedBlock.props as Record<string, unknown>
      const updatedProps = { ...currentProps, interval: Number(v) } as CMSBlock["props"]
      updateSelectedProps(updatedProps)
    }

    const handleSliderAlignChange = (v: string) => {
      if (!selectedBlock) return
      const currentProps = selectedBlock.props as Record<string, unknown>
      const updatedProps = { ...currentProps, sliderAlign: v } as CMSBlock["props"]
      updateSelectedProps(updatedProps)
    }

    const handleShowControlsChange = () => {
      if (!selectedBlock) return
      const currentProps = selectedBlock.props as Record<string, unknown>
      const updatedProps = { ...currentProps, showControls: !currentProps.showControls } as CMSBlock["props"]
      updateSelectedProps(updatedProps)
    }

    const props = selectedBlock.props as Record<string, unknown>
    const cards = ((getByPath(props, "cards") as Array<{ id: string; title?: string }>) || [])
    const repeaterKey = `${selectedBlock.id}:cards`
    const expandedId = expandedRepeaterCards[repeaterKey] ?? null
    const updateCards = (next: typeof cards) => updateSelectedProps({ ...props, cards: next } as CMSBlock["props"])
    const addItem = () => {
      const newItem = createServiceCard()
      updateCards([...cards, newItem])
      setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: newItem.id }))
      lastAddedRepeaterRef.current = { key: repeaterKey, itemId: newItem.id }
    }
    const serviceCardFields = [
      { key: "icon", label: "Icon", type: "select" as const, options: getAvailableIconsWithLabels() },
      { key: "iconColor", label: "Icon Farbe (optional)", type: "color" as const, placeholder: "#111111" },
      { key: "iconBgColor", label: "Icon Hintergrund (optional)", type: "color" as const, placeholder: "#e5e7eb" },
      { key: "title", label: "Titel", type: "text" as const },
      { key: "titleColor", label: "Titel Farbe (optional)", type: "color" as const, placeholder: "#111111" },
      { key: "text", label: "Text", type: "textarea" as const },
      { key: "textColor", label: "Text Farbe (optional)", type: "color" as const, placeholder: "#666666" },
      { key: "textAlign", label: "Text Ausrichtung", type: "select" as const, options: [{ value: "left", label: "Links" }, { value: "center", label: "Mitte" }, { value: "right", label: "Rechts" }, { value: "justify", label: "Blocksatz" }] },
      { key: "ctaText", label: "CTA Text", type: "text" as const },
      { key: "ctaColor", label: "CTA Farbe (optional)", type: "color" as const, placeholder: "#111111" },
      { key: "ctaHref", label: "CTA Link", type: "url" as const },
      { key: "cardBgColor", label: "Card Hintergrund (optional)", type: "color" as const, placeholder: "#ffffff" },
      { key: "cardBorderColor", label: "Card Border (optional)", type: "color" as const, placeholder: "#e5e7eb" },
    ]

    return (
      <>
        <Separator />

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Variante</Label>
            <Select
              value={(selectedBlock.props as Record<string, unknown>)?.variant as string || "grid"}
              onValueChange={handleVariantChange}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="slider">Slider</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Hintergrund</Label>
            <Select
              value={(selectedBlock.props as Record<string, unknown>)?.background as string || "none"}
              onValueChange={handleBackgroundChange}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine</SelectItem>
                <SelectItem value="muted">Muted</SelectItem>
                <SelectItem value="gradient">Gradient</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(selectedBlock.props as Record<string, unknown>)?.variant === "grid" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Spalten</Label>
                <Select
                  value={String((selectedBlock.props as Record<string, unknown>)?.columns || 3)}
                  onValueChange={handleColumnsChange}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Text Ausrichtung</Label>
                <Select
                  value={((selectedBlock.props as Record<string, unknown>)?.textAlign || "left") as string}
                  onValueChange={handleTextAlignChange}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Links</SelectItem>
                    <SelectItem value="center">Mitte</SelectItem>
                    <SelectItem value="right">Rechts</SelectItem>
                    <SelectItem value="justify">Blocksatz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {(selectedBlock.props as Record<string, unknown>)?.variant === "slider" && (
            <>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Autoplay</Label>
                <button
                  type="button"
                  onClick={handleAutoplayChange}
                  className={cn(
                    "h-6 w-11 rounded-full border border-border transition-colors",
                    (selectedBlock.props as Record<string, unknown>)?.autoplay ? "bg-primary" : "bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full bg-white transition-transform",
                      (selectedBlock.props as Record<string, unknown>)?.autoplay ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>

              {(selectedBlock.props as Record<string, unknown>)?.autoplay && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Interval (Sekunden)</Label>
                  <Select
                    value={String((selectedBlock.props as Record<string, unknown>)?.interval || 6000)}
                    onValueChange={handleIntervalChange}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3000">3 Sekunden</SelectItem>
                      <SelectItem value="4500">4,5 Sekunden</SelectItem>
                      <SelectItem value="6000">6 Sekunden</SelectItem>
                      <SelectItem value="8000">8 Sekunden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">Slider Ausrichtung</Label>
                <Select
                  value={((selectedBlock.props as Record<string, unknown>)?.sliderAlign || "center") as string}
                  onValueChange={handleSliderAlignChange}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center">Zentriert</SelectItem>
                    <SelectItem value="left">Links</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs">Steuerelemente</Label>
                <button
                  type="button"
                  onClick={handleShowControlsChange}
                  className={cn(
                    "h-6 w-11 rounded-full border border-border transition-colors",
                    (selectedBlock.props as Record<string, unknown>)?.showControls ? "bg-primary" : "bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full bg-white transition-transform",
                      (selectedBlock.props as Record<string, unknown>)?.showControls ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>
            </>
          )}
        </div>

        <Separator />

        <UniversalRepeaterInspector
          items={cards}
          getItemId={(c) => c.id}
          renderSummary={(card) => <span className="truncate">{card.title || "Card"}</span>}
          renderContent={(card, index) => renderOneRepeaterItemFields(selectedBlock, "cards", index, card as Record<string, unknown>, serviceCardFields)}
          expandedId={expandedId}
          onToggle={(id) => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: expandedId === id ? null : id }))}
          onCollapseAll={() => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: null }))}
          countLabel={`${cards.length} Cards`}
          addLabel="Card hinzufügen"
          onAdd={addItem}
          onMove={(from, to) => editorActions.handleMoveArrayItem(selectedBlock.id, "cards", from, to)}
          onRemove={(itemId) => confirmDeleteItem(selectedBlock.id, "cards", cards.findIndex((c) => c.id === itemId))}
        />
      </>
    )
  }
)

ServicesGridInspectorSectionContent.displayName = "ServicesGridInspectorSection"

export function ServicesGridInspectorSection(props: PageEditorInspectorSectionProps) {
  return <ServicesGridInspectorSectionContent {...props} />
}
