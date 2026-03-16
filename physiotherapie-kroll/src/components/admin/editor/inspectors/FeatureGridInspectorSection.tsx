"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { CMSBlock } from "@/types/cms"
import { createFeatureItem } from "@/cms/blocks/registry"
import { getByPath } from "@/lib/cms/editorPathOps"
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

const FeatureGridInspectorSectionContent = React.memo(
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
    const handleColumnsChange = (v: string) => {
      if (!selectedBlock) return
      const currentProps = selectedBlock.props as Record<string, unknown>
      const updatedProps = { ...currentProps, columns: Number(v) } as CMSBlock["props"]
      updateSelectedProps(updatedProps)
    }

    const props = selectedBlock.props as Record<string, unknown>
    const features = ((getByPath(props, "features") as Array<{ id: string; title?: string }>) || [])
    const repeaterKey = `${selectedBlock.id}:features`
    const expandedId = expandedRepeaterCards[repeaterKey] ?? null
    const updateFeatures = (next: typeof features) => updateSelectedProps({ ...props, features: next } as CMSBlock["props"])
    const addItem = () => {
      const newItem = createFeatureItem()
      updateFeatures([...features, newItem])
      setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: newItem.id }))
      lastAddedRepeaterRef.current = { key: repeaterKey, itemId: newItem.id }
    }
    const featureFields = [
      { key: "title", label: "Titel", type: "text" as const, required: true },
      { key: "description", label: "Beschreibung", type: "textarea" as const, required: true },
      { key: "icon", label: "Icon (optional)", type: "text" as const, placeholder: "Icon-Name" },
      { key: "titleColor", label: "Titel Farbe (optional)", type: "color" as const, placeholder: "#111111" },
      { key: "descriptionColor", label: "Beschreibung Farbe (optional)", type: "color" as const, placeholder: "#666666" },
      { key: "iconColor", label: "Icon Farbe (optional)", type: "color" as const, placeholder: "#111111" },
      { key: "cardBgColor", label: "Card Hintergrund (optional)", type: "color" as const, placeholder: "#ffffff" },
      { key: "cardBorderColor", label: "Card Border (optional)", type: "color" as const, placeholder: "#e5e7eb" },
    ]

    return (
      <>
        <Separator />

        <div className="space-y-3">
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
        </div>

        <Separator />

        <UniversalRepeaterInspector
          items={features}
          getItemId={(f) => f.id}
          renderSummary={(feature) => <span className="truncate">{(feature as Record<string, unknown>).title as string || "Feature"}</span>}
          renderContent={(feature, index) => renderOneRepeaterItemFields(selectedBlock, "features", index, feature as Record<string, unknown>, featureFields)}
          expandedId={expandedId}
          onToggle={(id) => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: expandedId === id ? null : id }))}
          onCollapseAll={() => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: null }))}
          countLabel={`${features.length} Features`}
          addLabel="Feature hinzufügen"
          onAdd={addItem}
          onMove={(from, to) => editorActions.handleMoveArrayItem(selectedBlock.id, "features", from, to)}
          onRemove={(itemId) => confirmDeleteItem(selectedBlock.id, "features", features.findIndex((f) => f.id === itemId))}
          minItems={1}
          maxItems={12}
        />
      </>
    )
  }
)

FeatureGridInspectorSectionContent.displayName = "FeatureGridInspectorSection"

export function FeatureGridInspectorSection(props: PageEditorInspectorSectionProps) {
  return <FeatureGridInspectorSectionContent {...props} />
}
