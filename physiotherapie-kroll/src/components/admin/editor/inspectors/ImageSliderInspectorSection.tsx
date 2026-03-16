"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import type { CMSBlock } from "@/types/cms"
import type { ElementShadow } from "@/types/cms"
import { createImageSlide } from "@/cms/blocks/registry"
import { getByPath } from "@/lib/cms/editorPathOps"
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
  lastAddedRepeaterRef: React.MutableRefObject<{ key: string; itemId: string } | null>
  renderOneRepeaterItemFields: (
    block: CMSBlock,
    arrayPath: string,
    index: number,
    item: Record<string, unknown>,
    itemFields: Array<{ key: string; label: string; type: InspectorFieldType; placeholder?: string; required?: boolean; options?: Array<{ value: string; label: string }> }>
  ) => React.ReactNode
}

const ImageSliderInspectorSectionContent = React.memo(
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
    const slides = ((getByPath(props, "slides") as Array<{ id: string; title?: string }>) || [])
    const repeaterKey = `${selectedBlock.id}:slides`
    const expandedId = expandedRepeaterCards[repeaterKey] ?? null
    const updateSlides = (next: typeof slides) => updateSelectedProps({ ...props, slides: next } as CMSBlock["props"])
    const addSlide = () => {
      const newItem = createImageSlide()
      updateSlides([...slides, newItem])
      setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: newItem.id }))
      lastAddedRepeaterRef.current = { key: repeaterKey, itemId: newItem.id }
    }
    const removeSlideAt = (index: number) => {
      const id = slides[index]?.id
      if (id && expandedId === id) setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: null }))
      updateSlides(slides.filter((_, i) => i !== index))
    }
    const slideFields = [
      { key: "url", label: "Bild", type: "image" as const, required: true },
      { key: "alt", label: "Alt-Text", type: "text" as const, required: true },
      { key: "title", label: "Titel (optional)", type: "text" as const },
      { key: "text", label: "Text (optional)", type: "textarea" as const },
      { key: "titleColor", label: "Titel Farbe", type: "color" as const, placeholder: "#111111" },
      { key: "textColor", label: "Text Farbe", type: "color" as const, placeholder: "#666666" },
    ]

    return (
      <>
        <Separator />
        <UniversalRepeaterInspector
          items={slides}
          getItemId={(s) => s.id}
          renderSummary={(slide) => <span className="truncate">{(slide as Record<string, unknown>).title as string || "Slide"}</span>}
          renderContent={(slide, index) => renderOneRepeaterItemFields(selectedBlock, "slides", index, slide as Record<string, unknown>, slideFields)}
          expandedId={expandedId}
          onToggle={(id) => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: expandedId === id ? null : id }))}
          onCollapseAll={() => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: null }))}
          countLabel={`${slides.length} Slides`}
          addLabel="Slide hinzufügen"
          onAdd={addSlide}
          onMove={(from, to) => editorActions.handleMoveArrayItem(selectedBlock.id, "slides", from, to)}
          onRemove={(itemId) => removeSlideAt(slides.findIndex((s) => s.id === itemId))}
          minItems={1}
          maxItems={12}
        />

        {((selectedBlock.props as any)?.slides ?? []).map((slide: any, slideIndex: number) => {
          const slideKey = slide.id || `slide-${slideIndex}-${slide.title || ""}`
          return (
            <div key={slideKey} className="mt-4 pt-4 border-t border-border/50">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">
                  {slide.title ? `Slide ${slideIndex + 1}: ${slide.title}` : `Slide ${slideIndex + 1}`} - Shadow
                </h4>
                <ShadowInspector
                  config={slide.shadow}
                  onChange={(shadowConfig: ElementShadow | undefined) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const slides = Array.isArray(currentProps.slides) ? [...(currentProps.slides as any[])] : []
                    if (slides[slideIndex]) {
                      slides[slideIndex] = { ...slides[slideIndex], shadow: shadowConfig }
                      const updatedProps = { ...currentProps, slides } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }
                  }}
                />
              </div>
            </div>
          )
        })}
      </>
    )
  }
)

ImageSliderInspectorSectionContent.displayName = "ImageSliderInspectorSection"

export function ImageSliderInspectorSection(props: PageEditorInspectorSectionProps) {
  return <ImageSliderInspectorSectionContent {...props} />
}
