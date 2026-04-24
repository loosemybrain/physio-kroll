"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import type { CMSBlock } from "@/types/cms"
import { createGalleryImage } from "@/cms/blocks/registry"
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

const GalleryInspectorSectionContent = React.memo(
  ({
    selectedBlock,
    expandedRepeaterCards,
    setExpandedRepeaterCards,
    updateSelectedProps: _updateSelectedProps,
    editorActions,
    handleRemoveArrayItem,
    lastAddedRepeaterRef,
    renderOneRepeaterItemFields,
  }: PageEditorInspectorSectionProps) => {
    const props = selectedBlock.props as Record<string, unknown>
    const images = (getByPath(props, "images") as Array<{ id: string }>) || []
    const repeaterKey = `${selectedBlock.id}:images`
    const expandedId = expandedRepeaterCards[repeaterKey] ?? null
    const addImage = () => {
      const newItem = createGalleryImage()
      editorActions.handleAddArrayItem(selectedBlock.id, "images", () => newItem)
      setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: newItem.id }))
      lastAddedRepeaterRef.current = { key: repeaterKey, itemId: newItem.id }
    }
    const galleryImageFields = [
      { key: "url", label: "Bild-URL", type: "image" as const, required: true, placeholder: "/placeholder.svg" },
      { key: "alt", label: "Alt-Text", type: "text" as const, required: true },
      { key: "caption", label: "Caption (optional)", type: "text" as const },
      { key: "captionColor", label: "Caption Farbe (optional)", type: "color" as const, placeholder: "#666666" },
      { key: "link", label: "Link (optional, wenn Lightbox aus)", type: "url" as const },
    ]

    return (
      <>
        <Separator />
        <UniversalRepeaterInspector
          items={images}
          getItemId={(img) => img.id}
          getItemLabel={(_img, index) => `Bild ${index + 1}`}
          renderContent={(item, index) => renderOneRepeaterItemFields(selectedBlock, "images", index, item as Record<string, unknown>, galleryImageFields)}
          expandedId={expandedId}
          onToggle={(id) => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: expandedId === id ? null : id }))}
          onCollapseAll={() => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: null }))}
          countLabel={`${images.length} Bilder`}
          addLabel="Bild hinzufügen"
          onAdd={addImage}
          onMove={(from, to) => editorActions.handleMoveArrayItem(selectedBlock.id, "images", from, to)}
          onRemove={(itemId) => handleRemoveArrayItem(selectedBlock.id, "images", images.findIndex((img) => img.id === itemId))}
          minItems={3}
          maxItems={18}
        />
      </>
    )
  }
)

GalleryInspectorSectionContent.displayName = "GalleryInspectorSection"

export function GalleryInspectorSection(props: PageEditorInspectorSectionProps) {
  return <GalleryInspectorSectionContent {...props} />
}
