"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CMSBlock } from "@/types/cms"
import type { ElementShadow } from "@/types/cms"
import { createImageSlide } from "@/cms/blocks/registry"
import { getByPath } from "@/lib/cms/editorPathOps"
import { UniversalRepeaterInspector } from "../repeater/UniversalRepeaterInspector"
import { ShadowInspector } from "../../ShadowInspector"
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

const ImageSliderInspectorSectionContent = React.memo(
  ({
    selectedBlock,
    expandedRepeaterCards,
    setExpandedRepeaterCards,
    updateSelectedProps,
    editorActions,
    handleRemoveArrayItem: _handleRemoveArrayItem,
    lastAddedRepeaterRef,
    renderOneRepeaterItemFields,
  }: PageEditorInspectorSectionProps) => {
    const props = selectedBlock.props as Record<string, unknown>
    const slides = ((getByPath(props, "slides") as Array<{ id: string; title?: string }>) || [])
    const [shadowSlideId, setShadowSlideId] = React.useState<string>("")
    const repeaterKey = `${selectedBlock.id}:slides`
    const expandedId = expandedRepeaterCards[repeaterKey] ?? null
    const updateSlides = (next: typeof slides) => updateSelectedProps({ ...props, slides: next } as CMSBlock["props"])
    const selectedShadowSlideIndex = React.useMemo(
      () => slides.findIndex((slide) => slide.id === shadowSlideId),
      [slides, shadowSlideId],
    )
    const effectiveShadowSlideIndex = selectedShadowSlideIndex >= 0 ? selectedShadowSlideIndex : 0
    const effectiveShadowSlide = slides[effectiveShadowSlideIndex] ?? null

    React.useEffect(() => {
      if (slides.length === 0) {
        setShadowSlideId("")
        return
      }
      if (!slides.some((slide) => slide.id === shadowSlideId)) {
        setShadowSlideId(slides[0]?.id ?? "")
      }
    }, [slides, shadowSlideId])
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

        {effectiveShadowSlide ? (
          <div className="mt-4 border-t border-border/50 pt-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor={`${selectedBlock.id}-slide-shadow-select`}>Slide-Shadow bearbeiten</Label>
                <Select value={effectiveShadowSlide.id} onValueChange={setShadowSlideId}>
                  <SelectTrigger id={`${selectedBlock.id}-slide-shadow-select`} className="w-full">
                    <SelectValue placeholder="Slide wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {slides.map((slide, index) => (
                      <SelectItem key={slide.id} value={slide.id}>
                        {slide.title ? `Slide ${index + 1}: ${slide.title}` : `Slide ${index + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ShadowInspector
                config={(effectiveShadowSlide as Record<string, unknown>).shadow as ElementShadow | undefined}
                onChange={(shadowConfig: ElementShadow | undefined) => {
                  if (!selectedBlock) return
                  const currentProps = selectedBlock.props as Record<string, unknown>
                  const currentSlides = Array.isArray(currentProps.slides) ? [...(currentProps.slides as unknown[])] : []
                  if (!currentSlides[effectiveShadowSlideIndex]) return
                  currentSlides[effectiveShadowSlideIndex] = {
                    ...currentSlides[effectiveShadowSlideIndex],
                    shadow: shadowConfig,
                  }
                  const updatedProps = { ...currentProps, slides: currentSlides } as CMSBlock["props"]
                  updateSelectedProps(updatedProps)
                }}
              />
            </div>
          </div>
        ) : null}
      </>
    )
  }
)

ImageSliderInspectorSectionContent.displayName = "ImageSliderInspectorSection"

export function ImageSliderInspectorSection(props: PageEditorInspectorSectionProps) {
  return <ImageSliderInspectorSectionContent {...props} />
}
