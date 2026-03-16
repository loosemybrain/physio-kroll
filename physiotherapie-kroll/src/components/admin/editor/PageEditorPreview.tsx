"use client"

import { useRef } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown, Copy, Trash2 } from "lucide-react"
import { BlockRenderer } from "@/components/cms/BlockRenderer"
import { LivePreviewTheme } from "@/components/admin/LivePreviewTheme"
import { InlineFieldEditor } from "@/components/admin/InlineFieldEditor"
import { getBlockDefinition } from "@/cms/blocks/registry"
import type { CMSPage, CMSBlock, HeroBlock } from "@/types/cms"
import type { BrandKey } from "@/components/brand/brandAssets"
import type { AdminPage } from "@/lib/cms/supabaseStore"

interface PageEditorPreviewProps {
  current: AdminPage
  selectedBlockId: string | null
  selectedElementId: string | null
  expandedRepeaterCards: Record<string, string | null>
  inlineOpen: boolean
  inlineAnchorRect: DOMRect | null
  inlineLabel: string
  inlineValue: string
  inlineMultiline: boolean
  onInlineChange: (value: string) => void
  onInlineClose: () => void
  onEditField: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  onBlockSelect: (blockId: string) => void
  onElementClick: (blockId: string, elementId: string) => void
  onMoveBlock: (index: number, direction: -1 | 1) => void
  onDuplicateBlock: (index: number) => void
  onRemoveBlock: (blockId: string) => void
  onSelectRepeaterItem: (blockId: string, fieldPath: string, itemId: string) => void
}

export function PageEditorPreview({
  current,
  selectedBlockId,
  selectedElementId,
  expandedRepeaterCards,
  inlineOpen,
  inlineAnchorRect,
  inlineLabel,
  inlineValue,
  inlineMultiline,
  onInlineChange,
  onInlineClose,
  onEditField,
  onBlockSelect,
  onElementClick,
  onMoveBlock,
  onDuplicateBlock,
  onRemoveBlock,
  onSelectRepeaterItem,
}: PageEditorPreviewProps) {
  const liveScrollRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={liveScrollRef}
      className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/30 p-8 min-h-0"
      onScroll={(e) => {
        e.stopPropagation()
      }}
      onClick={(e) => {
        const target = e.target as HTMLElement
        const link = target.closest("a")
        if (link) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
    >
      <LivePreviewTheme brand={current.brand || "physiotherapy"} className="mx-auto max-w-5xl rounded-lg border border-border bg-background shadow-sm overflow-hidden">
        {current.blocks.map((block, index) => {
          const blockDefinition = getBlockDefinition(block.type)
          const blockLabel = blockDefinition.label || block.type
          const isFirst = index === 0
          const isLast = index === current.blocks.length - 1

          const blockToRender = block.type === "hero"
            ? (() => {
                const heroProps = block.props as HeroBlock["props"]
                const renderBrand: BrandKey = (current.brand || "physiotherapy") as BrandKey
                const brandContent = heroProps.brandContent || {
                  physiotherapy: {},
                  "physio-konzept": {},
                }
                if (!brandContent.physiotherapy?.headline && heroProps.headline) {
                  brandContent.physiotherapy = {
                    ...brandContent.physiotherapy,
                    headline: heroProps.headline,
                    subheadline: heroProps.subheadline,
                    ctaText: heroProps.ctaText,
                    ctaHref: heroProps.ctaHref,
                    badgeText: heroProps.badgeText,
                    playText: heroProps.playText,
                    trustItems: heroProps.trustItems,
                    floatingTitle: heroProps.floatingTitle,
                    floatingValue: heroProps.floatingValue,
                    floatingLabel: heroProps.floatingLabel,
                  }
                }
                return {
                  ...block,
                  props: {
                    ...heroProps,
                    mood: renderBrand,
                    brandContent,
                  } as HeroBlock["props"],
                }
              })()
            : block

          return (
            <div
              key={block.id}
              data-block-id={block.id}
              className={cn(
                "relative cursor-pointer transition-colors",
                selectedBlockId === block.id
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "hover:bg-muted/30"
              )}
              onClick={() => {
                onBlockSelect(block.id)
              }}
            >
              {/* Block Controls Overlay */}
              <div
                className="absolute top-2 right-2 z-50 flex items-center gap-1 rounded-md bg-[#0f0f10]/90 text-white border border-white/10 shadow-xl backdrop-blur-sm p-1"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onMoveBlock(index, -1)
                  }}
                  disabled={isFirst}
                  title="Nach oben"
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onMoveBlock(index, 1)
                  }}
                  disabled={isLast}
                  title="Nach unten"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onDuplicateBlock(index)
                  }}
                  title="Block duplizieren"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onRemoveBlock(block.id)
                  }}
                  title="Block löschen"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              <BlockRenderer
                block={blockToRender}
                editable
                onEditField={onEditField}
                onElementClick={(blockId, elementId) => {
                  onBlockSelect(blockId)
                  onElementClick(blockId, elementId)
                }}
                selectedElementId={selectedBlockId === block.id ? selectedElementId : null}
                courseSchedulePreview={
                  block.type === "courseSchedule" && selectedBlockId === block.id
                    ? {
                        interactivePreview: true,
                        activeSlotId: expandedRepeaterCards[`${block.id}:slots`] ?? null,
                        onSlotSelect: (slotId: string) => onSelectRepeaterItem(block.id, "slots", slotId),
                      }
                    : undefined
                }
                repeaterPreview={
                  selectedBlockId === block.id &&
                  (block.type === "team" ||
                    block.type === "servicesGrid" ||
                    block.type === "testimonials" ||
                    block.type === "faq" ||
                    block.type === "imageSlider")
                    ? (() => {
                        const fieldPath =
                          block.type === "team"
                            ? "members"
                            : block.type === "servicesGrid"
                              ? "cards"
                              : block.type === "imageSlider"
                                ? "slides"
                                : "items"
                        const key = `${block.id}:${fieldPath}`
                        return {
                          activeItemId: expandedRepeaterCards[key] ?? null,
                          onItemSelect: (itemId: string) => onSelectRepeaterItem(block.id, fieldPath, itemId),
                        }
                      })()
                    : undefined
                }
              />
            </div>
          )
        })}

        {/* Inline Field Editor */}
        <InlineFieldEditor
          open={inlineOpen}
          anchorRect={inlineAnchorRect}
          label={inlineLabel}
          value={inlineValue}
          multiline={inlineMultiline}
          onChange={onInlineChange}
          onClose={onInlineClose}
        />
      </LivePreviewTheme>
    </div>
  )
}
