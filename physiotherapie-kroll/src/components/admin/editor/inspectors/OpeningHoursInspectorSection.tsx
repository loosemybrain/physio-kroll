"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import type { CMSBlock, ElementConfig, ElementShadow } from "@/types/cms"
import { createOpeningHour } from "@/cms/blocks/registry"
import { getByPath, setByPath } from "@/lib/cms/editorPathOps"
import { UniversalRepeaterInspector } from "../repeater/UniversalRepeaterInspector"
import { ShadowInspector } from "../../ShadowInspector"
import type { InspectorFieldType } from "@/cms/blocks/registry"

export interface PageEditorInspectorSectionProps {
  selectedBlock: CMSBlock
  selectedBlockId: string | null
  expandedRepeaterCards: Record<string, string | null>
  setExpandedRepeaterCards: React.Dispatch<React.SetStateAction<Record<string, string | null>>>
  updateSelectedProps: (nextProps: CMSBlock["props"]) => void
  editorActions: any
  handleRemoveArrayItem: (blockId: string, arrayPath: string, index: number) => void
  selectedElementId: string | null
  deselectElement: (blockId: string) => void
  lastAddedRepeaterRef: React.MutableRefObject<{ key: string; itemId: string } | null>
  renderOneRepeaterItemFields: (
    block: CMSBlock,
    arrayPath: string,
    index: number,
    item: Record<string, unknown>,
    itemFields: Array<{ key: string; label: string; type: InspectorFieldType; placeholder?: string; required?: boolean; options?: Array<{ value: string; label: string }> }>
  ) => React.ReactNode
}

const OpeningHoursInspectorSectionContent = React.memo(
  ({
    selectedBlock,
    selectedBlockId,
    expandedRepeaterCards,
    setExpandedRepeaterCards,
    updateSelectedProps,
    editorActions,
    handleRemoveArrayItem,
    selectedElementId,
    deselectElement,
    lastAddedRepeaterRef,
    renderOneRepeaterItemFields,
  }: PageEditorInspectorSectionProps) => {
    const props = selectedBlock.props as Record<string, unknown>
    const hours = (getByPath(props, "hours") as Array<{ id: string; label?: string }>) || []
    const repeaterKey = `${selectedBlock.id}:hours`
    const expandedId = expandedRepeaterCards[repeaterKey] ?? null
    const openingHourFields = [
      { key: "label", label: "Label", type: "text" as const, required: true },
      { key: "labelColor", label: "Label Farbe (optional)", type: "color" as const, placeholder: "#111111" },
      { key: "value", label: "Wert", type: "text" as const, required: true },
      { key: "valueColor", label: "Wert Farbe (optional)", type: "color" as const, placeholder: "#666666" },
    ]
    const addHour = () => {
      const newItem = createOpeningHour()
      editorActions.handleAddArrayItem(selectedBlock.id, "hours", () => newItem)
      setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: newItem.id }))
      lastAddedRepeaterRef.current = { key: repeaterKey, itemId: newItem.id }
    }

    return (
      <>
        <Separator />
        
        {selectedElementId && (
          <>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold mb-4">Element Shadow</h3>
              <ShadowInspector
                config={
                  ((selectedBlock.props as Record<string, unknown>)?.elements as Record<string, ElementConfig> | undefined)?.[selectedElementId]?.style?.shadow
                }
                onChange={(shadowConfig: ElementShadow | undefined) => {
                  const currentElements = ((selectedBlock.props as Record<string, unknown>)?.elements ?? {}) as Record<string, ElementConfig>
                  const currentElement = currentElements[selectedElementId] ?? { style: {} }
                  const nextElement: ElementConfig = {
                    ...currentElement,
                    style: {
                      ...currentElement.style,
                      shadow: shadowConfig,
                    },
                  }
                  const nextElements = {
                    ...currentElements,
                    [selectedElementId]: nextElement,
                  }
                  const updatedProps = setByPath(selectedBlock.props as Record<string, unknown>, "elements", nextElements) as CMSBlock["props"]
                  updateSelectedProps(updatedProps)
                }}
                onClose={() => deselectElement(selectedBlockId || "")}
              />
            </div>
            <Separator />
          </>
        )}
        
        <UniversalRepeaterInspector
          items={hours}
          getItemId={(h) => h.id}
          renderSummary={(row) => <span className="truncate">{(row as Record<string, unknown>).label as string || "Zeile"}</span>}
          renderContent={(item, index) => renderOneRepeaterItemFields(selectedBlock, "hours", index, item as Record<string, unknown>, openingHourFields)}
          expandedId={expandedId}
          onToggle={(id) => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: expandedId === id ? null : id }))}
          onCollapseAll={() => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: null }))}
          countLabel={`${hours.length} Zeilen`}
          addLabel="Zeile hinzufügen"
          onAdd={addHour}
          onMove={(from, to) => editorActions.handleMoveArrayItem(selectedBlock.id, "hours", from, to)}
          onRemove={(itemId) => handleRemoveArrayItem(selectedBlock.id, "hours", hours.findIndex((h) => h.id === itemId))}
          minItems={1}
          maxItems={10}
        />
      </>
    )
  }
)

OpeningHoursInspectorSectionContent.displayName = "OpeningHoursInspectorSection"

export function OpeningHoursInspectorSection(props: PageEditorInspectorSectionProps) {
  return <OpeningHoursInspectorSectionContent {...props} />
}
