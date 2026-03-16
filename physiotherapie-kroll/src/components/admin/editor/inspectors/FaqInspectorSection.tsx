"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import type { CMSBlock } from "@/types/cms"
import { createFaqItem } from "@/cms/blocks/registry"
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

const FaqInspectorSectionContent = React.memo(
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
    const props = selectedBlock.props as Record<string, unknown>
    const items = ((getByPath(props, "items") as Array<{ id: string; question?: string }>) || [])
    const repeaterKey = `${selectedBlock.id}:items`
    const expandedId = expandedRepeaterCards[repeaterKey] ?? null
    const updateItems = (next: typeof items) => updateSelectedProps({ ...props, items: next } as CMSBlock["props"])
    const addItem = () => {
      const newItem = createFaqItem()
      updateItems([...items, newItem])
      setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: newItem.id }))
      lastAddedRepeaterRef.current = { key: repeaterKey, itemId: newItem.id }
    }
    const faqFields = [
      { key: "question", label: "Frage", type: "text" as const, required: true },
      { key: "answer", label: "Antwort", type: "textarea" as const, required: true },
      { key: "questionColor", label: "Frage Farbe (optional)", type: "color" as const, placeholder: "#111111" },
      { key: "answerColor", label: "Antwort Farbe (optional)", type: "color" as const, placeholder: "#666666" },
    ]

    return (
      <>
        <Separator />

        <UniversalRepeaterInspector
          items={items}
          getItemId={(i) => i.id}
          renderSummary={(item) => <span className="truncate">{(item as Record<string, unknown>).question as string || "FAQ Item"}</span>}
          renderContent={(item, index) => renderOneRepeaterItemFields(selectedBlock, "items", index, item as Record<string, unknown>, faqFields)}
          expandedId={expandedId}
          onToggle={(id) => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: expandedId === id ? null : id }))}
          onCollapseAll={() => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: null }))}
          countLabel={`${items.length} FAQs`}
          addLabel="FAQ hinzufügen"
          onAdd={addItem}
          onMove={(from, to) => editorActions.handleMoveArrayItem(selectedBlock.id, "items", from, to)}
          onRemove={(itemId) => handleRemoveArrayItem(selectedBlock.id, "items", items.findIndex((i) => i.id === itemId))}
          minItems={1}
          maxItems={20}
        />
      </>
    )
  }
)

FaqInspectorSectionContent.displayName = "FaqInspectorSection"

export function FaqInspectorSection(props: PageEditorInspectorSectionProps) {
  return <FaqInspectorSectionContent {...props} />
}
