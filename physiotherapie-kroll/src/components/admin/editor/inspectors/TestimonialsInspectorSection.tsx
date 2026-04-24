"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { CMSBlock } from "@/types/cms"
import { createTestimonialItem } from "@/cms/blocks/registry"
import { getByPath } from "@/lib/cms/editorPathOps"
import { UniversalRepeaterInspector } from "../repeater/UniversalRepeaterInspector"
import type { InspectorFieldType } from "@/cms/blocks/registry"

type RepeaterEditorActions = {
  handleAddArrayItem: (blockId: string, arrayPath: string, createItem: () => unknown) => void
  handleMoveArrayItem: (blockId: string, arrayPath: string, from: number, to: number) => void
}

export interface PageEditorInspectorSectionProps {
  selectedBlock: CMSBlock
  selectedBlockId: string | null
  expandedRepeaterCards: Record<string, string | null>
  setExpandedRepeaterCards: React.Dispatch<React.SetStateAction<Record<string, string | null>>>
  updateSelectedProps: (nextProps: CMSBlock["props"]) => void
  editorActions: RepeaterEditorActions
  handleRemoveArrayItem: (blockId: string, arrayPath: string, index: number) => void
  lastAddedRepeaterRef: React.MutableRefObject<{ key: string; itemId: string } | null>
  renderOneRepeaterItemFields: (
    block: CMSBlock,
    arrayPath: string,
    index: number,
    item: Record<string, unknown>,
    itemFields: Array<{ key: string; label: string; type: InspectorFieldType; placeholder?: string; required?: boolean; options?: Array<{ value: string; label: string }> }>
  ) => React.ReactNode
}

const TestimonialsInspectorSectionContent = React.memo(
  ({
    selectedBlock,
    expandedRepeaterCards,
    setExpandedRepeaterCards,
    updateSelectedProps,
    editorActions,
    handleRemoveArrayItem,
    lastAddedRepeaterRef,
    renderOneRepeaterItemFields,
  }: PageEditorInspectorSectionProps) => {
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

    const props = selectedBlock.props as Record<string, unknown>
    const items = ((getByPath(props, "items") as Array<{ id: string; name?: string }>) || [])
    const repeaterKey = `${selectedBlock.id}:items`
    const expandedId = expandedRepeaterCards[repeaterKey] ?? null
    const updateItems = (next: typeof items) => updateSelectedProps({ ...props, items: next } as CMSBlock["props"])
    const addItem = () => {
      const newItem = createTestimonialItem()
      updateItems([...items, newItem])
      setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: newItem.id }))
      lastAddedRepeaterRef.current = { key: repeaterKey, itemId: newItem.id }
    }
    const testimonialFields = [
      { key: "quote", label: "Zitat", type: "textarea" as const, required: true },
      { key: "quoteColor", label: "Zitat Farbe (optional)", type: "color" as const, placeholder: "#111111" },
      { key: "avatar", label: "Avatar (optional)", type: "image" as const, placeholder: "/avatar.jpg" },
      { key: "avatarGradient", label: "Avatar Gradient", type: "select" as const, options: [{ value: "auto", label: "Auto" }, { value: "g1", label: "Primary" }, { value: "g2", label: "Accent" }, { value: "g3", label: "Chart 1" }, { value: "g4", label: "Chart 2" }, { value: "g5", label: "Chart 3" }, { value: "g6", label: "Blue" }, { value: "g7", label: "Purple" }, { value: "g8", label: "Green" }, { value: "g9", label: "Rose" }, { value: "g10", label: "Amber" }] },
      { key: "avatarColor", label: "Avatar Farbe (optional)", type: "color" as const, placeholder: "#111111" },
      { key: "name", label: "Name", type: "text" as const, required: true },
      { key: "nameColor", label: "Name Farbe (optional)", type: "color" as const, placeholder: "#111111" },
      { key: "role", label: "Rolle (optional)", type: "text" as const },
      { key: "roleColor", label: "Rolle Farbe (optional)", type: "color" as const, placeholder: "#666666" },
      { key: "rating", label: "Rating (optional)", type: "select" as const, options: [{ value: "none", label: "—" }, { value: "5", label: "★★★★★ (5)" }, { value: "4", label: "★★★★☆ (4)" }, { value: "3", label: "★★★☆☆ (3)" }, { value: "2", label: "★★☆☆☆ (2)" }, { value: "1", label: "★☆☆☆☆ (1)" }] },
    ]

    return (
      <>
        <Separator />
        
        {(selectedBlock.props as Record<string, unknown>)?.variant === "slider" && (
          <div className="space-y-3 border-b border-border pb-4 mb-4">
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

            {((selectedBlock.props as Record<string, unknown>)?.autoplay as boolean) && (
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
          </div>
        )}

        <UniversalRepeaterInspector
          items={items}
          getItemId={(i) => i.id}
          renderSummary={(item) => <span className="truncate">{(item as Record<string, unknown>).name as string || "Testimonial"}</span>}
          renderContent={(item, index) => renderOneRepeaterItemFields(selectedBlock, "items", index, item as Record<string, unknown>, testimonialFields)}
          expandedId={expandedId}
          onToggle={(id) => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: expandedId === id ? null : id }))}
          onCollapseAll={() => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: null }))}
          countLabel={`${items.length} Testimonials`}
          addLabel="Testimonial hinzufügen"
          onAdd={addItem}
          onMove={(from, to) => editorActions.handleMoveArrayItem(selectedBlock.id, "items", from, to)}
          onRemove={(itemId) => handleRemoveArrayItem(selectedBlock.id, "items", items.findIndex((i) => i.id === itemId))}
          minItems={1}
          maxItems={12}
        />
      </>
    )
  }
)

TestimonialsInspectorSectionContent.displayName = "TestimonialsInspectorSection"

export function TestimonialsInspectorSection(props: PageEditorInspectorSectionProps) {
  return <TestimonialsInspectorSectionContent {...props} />
}
