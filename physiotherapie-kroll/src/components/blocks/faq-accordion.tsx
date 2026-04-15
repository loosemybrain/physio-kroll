"use client"

import { useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useElementShadowStyle } from "@/lib/shadow"
import { resolveSectionBg } from "@/lib/theme/resolveSectionBg"
import { resolveContainerBg } from "@/lib/theme/resolveContainerBg"
import { resolveBoxShadow } from "@/lib/shadow/resolveBoxShadow"
import { mergeTypographyClasses } from "@/lib/typography"
import type { BlockSectionProps } from "@/types/cms"
import type { GradientPresetValue } from "@/lib/theme/gradientPresets"
import { sanitizeCmsHtml } from "@/lib/security/sanitizeCmsHtml"
import { AnimatedBlock } from "@/components/blocks/AnimatedBlock"
import { ElementAnimated } from "@/components/blocks/ElementAnimated"

/* ================================================================ */
/*  Props                                                            */
/* ================================================================ */

interface FaqAccordionProps {
  section?: BlockSectionProps
  typography?: unknown
  headline?: string
  headlineColor?: string
  questionColor?: string
  answerColor?: string
  items: Array<{
    id: string
    question: string
    answer: string
    questionColor?: string
    answerColor?: string
  }>
  variant?: "default" | "soft"
  // Panel Container Props
  containerBackgroundMode?: "transparent" | "color" | "gradient"
  containerBackgroundColor?: string
  containerBackgroundGradientPreset?: GradientPresetValue
  containerGradientFrom?: string
  containerGradientVia?: string
  containerGradientTo?: string
  containerGradientAngle?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  containerShadow?: any
  containerBorder?: boolean
  containerBorderColor?: string
  editable?: boolean
  blockId?: string
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  // Shadow/Element Props
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elements?: Record<string, any>
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
  /** Admin Live-Preview: Klick auf Item öffnet zugehörige Inspector-Card */
  interactivePreview?: boolean
  activeItemId?: string | null
  onItemSelect?: (itemId: string) => void
}

/* ================================================================ */
/*  Item Component (zum Beheben von React Hook Rules)              */
/* ================================================================ */

interface FaqItemProps {
  item: {
    id: string
    question: string
    answer: string
    questionColor?: string
    answerColor?: string
  }
  index: number
  questionColor?: string
  answerColor?: string
  blockId?: string
  canInlineEdit: boolean
  editable?: boolean
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elements?: Record<string, any>
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
  typography?: Record<string, any>
  interactivePreview?: boolean
  activeItemId?: string | null
  onItemSelect?: (itemId: string) => void
}

function FaqItemComponent({
  item,
  index,
  questionColor,
  answerColor,
  blockId,
  canInlineEdit,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  editable,
  onEditField,
  elements,
  onElementClick,
  selectedElementId,
  typography,
  interactivePreview,
  activeItemId,
  onItemSelect,
}: FaqItemProps) {
  const itemSurfaceId = `faq.item.${item.id}`
  const isPreviewActive = interactivePreview && activeItemId === item.id
  const itemSurfaceShadow = useElementShadowStyle({
    elementId: itemSurfaceId,
    elementConfig: (elements ?? {})[itemSurfaceId],
  })
  // Use registry element IDs for question/answer so Shadow Inspector (faq.question, faq.answer) applies
  const itemQuestionShadow = useElementShadowStyle({
    elementId: "faq.question",
    elementConfig: (elements ?? {})["faq.question"],
  })
  const itemAnswerShadow = useElementShadowStyle({
    elementId: "faq.answer",
    elementConfig: (elements ?? {})["faq.answer"],
  })

  const isItemSelected = selectedElementId === itemSurfaceId
  const isQuestionSelected = selectedElementId === "faq.question"
  const isAnswerSelected = selectedElementId === "faq.answer"

  const handleInlineEdit = useCallback(
    (e: React.MouseEvent, fieldPath: string) => {
      if (!canInlineEdit) return
      e.preventDefault()
      e.stopPropagation()
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      onEditField?.(blockId || "", fieldPath, rect)
    },
    [canInlineEdit, blockId, onEditField],
  )

  const handleItemClick = () => {
    if (interactivePreview && onItemSelect) {
      onItemSelect(item.id)
      return
    }
    onElementClick?.(blockId || "", itemSurfaceId)
  }

  return (
    <AccordionItem
      key={item.id}
      value={item.id}
      data-repeater-field="items"
      data-repeater-item-id={item.id}
      data-element-id={itemSurfaceId}
      style={itemSurfaceShadow}
      onClick={handleItemClick}
      className={cn(
        "rounded-xl border border-border/40 bg-transparent px-5 transition-all duration-300",
        "hover:border-primary/30 hover:bg-primary/5",
        "data-[state=open]:border-primary/25 data-[state=open]:bg-primary/3",
        (isItemSelected || isPreviewActive) && "ring-2 ring-primary/30 border-primary/50",
        /* remove default shadcn bottom border */
        "border-b!",
      )}
    >
      <AccordionTrigger
        className={cn(
          "py-5 text-base font-medium text-foreground no-underline hover:no-underline md:text-lg",
          "[&>svg]:size-5 [&>svg]:text-muted-foreground/60",
        )}
      >
        <ElementAnimated elementId="faq.question" elements={elements}>
        <span
          data-element-id="faq.question"
          onClick={(e) => {
            e.stopPropagation()
            if (canInlineEdit) {
              handleInlineEdit(e, `items.${index}.question`)
            }
            onElementClick?.(blockId || "", "faq.question")
          }}
          className={cn(
            mergeTypographyClasses(
              "flex-1 text-left transition-all rounded",
              (typography as Record<string, any> ?? {})["faq.question"]
            ),
            isQuestionSelected && "ring-2 ring-primary/30 px-2 py-1",
            canInlineEdit && "cursor-pointer px-1 transition-colors hover:bg-primary/10"
          )}
          style={{
            ...itemQuestionShadow,
            color: item.questionColor || questionColor || undefined,
          }}
        >
          {item.question || "Frage eingeben..."}
        </span>
        </ElementAnimated>
      </AccordionTrigger>

      <AccordionContent className="pb-5">
        <ElementAnimated elementId="faq.answer" elements={elements}>
        <div
          data-element-id="faq.answer"
          onClick={(e) => {
            e.stopPropagation()
            if (canInlineEdit) {
              handleInlineEdit(e, `items.${index}.answer`)
            }
            onElementClick?.(blockId || "", "faq.answer")
          }}
          className={cn(
            mergeTypographyClasses(
              "text-sm leading-relaxed text-muted-foreground md:text-base transition-all rounded",
              (typography as Record<string, any> ?? {})["faq.answer"]
            ),
            isAnswerSelected && "ring-2 ring-primary/30 px-2 py-1",
            canInlineEdit && "cursor-pointer px-1 transition-colors hover:bg-primary/10"
          )}
          style={{
            ...itemAnswerShadow,
            color: item.answerColor || answerColor || undefined,
          }}
          dangerouslySetInnerHTML={{
            __html: sanitizeCmsHtml(item.answer || "Antwort eingeben...", "richText"),
          }}
        />
        </ElementAnimated>
      </AccordionContent>
    </AccordionItem>
  )
}

/* ================================================================ */
/*  Component                                                        */
/* ================================================================ */

export function FaqAccordion({
  section,
  headline,
  headlineColor,
  questionColor,
  answerColor,
  items,
  containerBackgroundMode,
  containerBackgroundColor,
  containerBackgroundGradientPreset,
  containerGradientFrom,
  containerGradientVia,
  containerGradientTo,
  containerGradientAngle,
  containerShadow,
  containerBorder,
  containerBorderColor,
  typography,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  variant = "default",
  editable = false,
  blockId,
  onEditField,
  elements,
  onElementClick,
  selectedElementId,
  interactivePreview = false,
  activeItemId = null,
  onItemSelect,
}: FaqAccordionProps) {
  const canInlineEdit = Boolean(editable && blockId && onEditField)

  // Resolve section and container backgrounds
  const sectionBg = resolveSectionBg(section)
  const containerBg = resolveContainerBg({
    mode: containerBackgroundMode,
    color: containerBackgroundColor,
    gradientPreset: containerBackgroundGradientPreset,
    gradient: {
      from: containerGradientFrom || "",
      via: containerGradientVia || "",
      to: containerGradientTo || "",
      angle: containerGradientAngle ?? 135,
    },
  })
  const containerShadowCss = resolveBoxShadow(containerShadow)
  const containerBorderStyle: React.CSSProperties = {}
  if (containerBorder) {
    containerBorderStyle.borderWidth = "1px"
    containerBorderStyle.borderStyle = "solid"
    const hex = containerBorderColor?.trim()
    containerBorderStyle.borderColor = hex && /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : "var(--border)"
  }

  // Element shadows
  const surfaceShadow = useElementShadowStyle({
    elementId: "faq.surface",
    elementConfig: (elements ?? {})["faq.surface"],
  })
  const headlineShadow = useElementShadowStyle({
    elementId: "faq.headline",
    elementConfig: (elements ?? {})["faq.headline"],
  })

  // Inline edit helper
  const handleInlineEdit = useCallback(
    (e: React.MouseEvent, fieldPath: string) => {
      if (!canInlineEdit) return
      e.preventDefault()
      e.stopPropagation()
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      onEditField?.(blockId || "", fieldPath, rect)
    },
    [canInlineEdit, blockId, onEditField],
  )

  // Helper to determine if element is selected
  const isElementSelected = (elementId: string) => selectedElementId === elementId

  return (
    <section
      className={cn(
        "relative overflow-x-hidden py-10 md:py-14 lg:py-16",
        sectionBg.className
      )}
      style={sectionBg.style}
      aria-label={headline || "FAQ"}
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Inner Container Panel (EIN Panel - nicht doppelt!) */}
        <AnimatedBlock config={section?.animation}>
          <ElementAnimated elementId="faq.surface" elements={elements}>
          <div
            data-element-id="faq.surface"
            onClick={(e) => {
              if (editable && blockId && onElementClick) {
                e.stopPropagation()
                onElementClick(blockId, "faq.surface")
              }
            }}
            className={cn(
              "relative rounded-3xl px-8 py-8 md:px-14 md:py-10",
              !containerBorder && containerBackgroundMode && containerBackgroundMode !== "transparent" && "border border-border/20",
              containerBackgroundMode === "gradient" && "backdrop-blur-sm",
              isElementSelected("faq.surface") && "ring-2 ring-primary/30",
              editable && blockId && onElementClick && "cursor-pointer"
            )}
            style={{
              ...surfaceShadow,
              ...containerBg.style,
              ...containerBorderStyle,
              ...(containerShadowCss ? { boxShadow: containerShadowCss } : {}),
            }}
          >
          {/* Headline */}
          {headline && (
            <div className="mb-10">
              <ElementAnimated elementId="faq.headline" elements={elements}>
              <h2
                data-element-id="faq.headline"
                onClick={(e) => {
                  if (canInlineEdit) {
                    e.stopPropagation()
                    handleInlineEdit(e, "headline")
                  }
                  onElementClick?.(blockId || "", "faq.headline")
                }}
                className={cn(
                  mergeTypographyClasses(
                    "text-3xl font-semibold tracking-tight text-foreground md:text-4xl transition-all rounded",
                    (typography as Record<string, any> ?? {})["faq.headline"]
                  ),
                  isElementSelected("faq.headline") && "ring-2 ring-primary/30 px-2 py-1",
                  canInlineEdit && "cursor-pointer px-1 transition-colors hover:bg-primary/10"
                )}
                style={{
                  ...headlineShadow,
                  ...(headlineColor ? { color: headlineColor } : {}),
                }}
              >
                {headline}
              </h2>
              </ElementAnimated>

              {/* Gradient divider */}
              <div
                className="mt-4 h-px w-20"
                style={{
                  background:
                    "linear-gradient(to right, var(--color-primary), var(--color-primary) 40%, transparent)",
                }}
                aria-hidden="true"
              />
            </div>
          )}

          {/* Accordion */}
          <Accordion
            type="single"
            collapsible
            className="flex w-full flex-col gap-3"
            suppressHydrationWarning
          >
            {items.map((item, index) => (
              <FaqItemComponent
                key={item.id}
                item={item}
                index={index}
                questionColor={questionColor}
                answerColor={answerColor}
                blockId={blockId}
                canInlineEdit={canInlineEdit}
                editable={editable}
                onEditField={onEditField}
                elements={elements}
                onElementClick={onElementClick}
                selectedElementId={selectedElementId}
                typography={(typography as Record<string, any>) ?? {}}
                interactivePreview={interactivePreview}
                activeItemId={activeItemId}
                onItemSelect={onItemSelect}
              />
            ))}
          </Accordion>
          </div>
          </ElementAnimated>
        </AnimatedBlock>
      </div>
    </section>
  )
}
