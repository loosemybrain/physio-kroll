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
  containerBackgroundGradientPreset?: string
  containerGradientFrom?: string
  containerGradientVia?: string
  containerGradientTo?: string
  containerGradientAngle?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  containerShadow?: any
  editable?: boolean
  blockId?: string
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  // Shadow/Element Props
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elements?: Record<string, any>
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
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
}: FaqItemProps) {
  const itemSurfaceId = `faq.item.${item.id}`
  const itemQuestionId = `faq.item.${item.id}.question`
  const itemAnswerId = `faq.item.${item.id}.answer`

  const itemSurfaceShadow = useElementShadowStyle({
    elementId: itemSurfaceId,
    elementConfig: (elements ?? {})[itemSurfaceId],
  })
  const itemQuestionShadow = useElementShadowStyle({
    elementId: itemQuestionId,
    elementConfig: (elements ?? {})[itemQuestionId],
  })
  const itemAnswerShadow = useElementShadowStyle({
    elementId: itemAnswerId,
    elementConfig: (elements ?? {})[itemAnswerId],
  })

  const isItemSelected = selectedElementId === itemSurfaceId
  const isQuestionSelected = selectedElementId === itemQuestionId
  const isAnswerSelected = selectedElementId === itemAnswerId

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

  return (
    <AccordionItem
      key={item.id}
      value={item.id}
      data-element-id={itemSurfaceId}
      style={itemSurfaceShadow}
      onClick={() => onElementClick?.(blockId || "", itemSurfaceId)}
      className={cn(
        "rounded-xl border border-border/40 bg-transparent px-5 transition-all duration-300",
        "hover:border-primary/30 hover:bg-primary/5",
        "data-[state=open]:border-primary/25 data-[state=open]:bg-primary/3",
        isItemSelected && "ring-2 ring-primary/30 border-primary/50",
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
        <span
          data-element-id={itemQuestionId}
          onClick={(e) => {
            e.stopPropagation()
            if (canInlineEdit) {
              handleInlineEdit(e, `items.${index}.question`)
            }
            onElementClick?.(blockId || "", itemQuestionId)
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
      </AccordionTrigger>

      <AccordionContent className="pb-5">
        <div
          data-element-id={itemAnswerId}
          onClick={(e) => {
            e.stopPropagation()
            if (canInlineEdit) {
              handleInlineEdit(e, `items.${index}.answer`)
            }
            onElementClick?.(blockId || "", itemAnswerId)
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
            __html: item.answer || "Antwort eingeben...",
          }}
        />
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
  typography,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  variant = "default",
  editable = false,
  blockId,
  onEditField,
  elements,
  onElementClick,
  selectedElementId,
}: FaqAccordionProps) {
  const canInlineEdit = Boolean(editable && blockId && onEditField)

  // Resolve section and container backgrounds
  const sectionBg = resolveSectionBg(section)
  const containerBg = resolveContainerBg({
    mode: containerBackgroundMode,
    color: containerBackgroundColor,
    gradientPreset: containerBackgroundGradientPreset as "soft" | "aurora" | "ocean" | "sunset" | "hero" | "none" | undefined,
    gradient: {
      from: containerGradientFrom || "",
      via: containerGradientVia || "",
      to: containerGradientTo || "",
      angle: containerGradientAngle ?? 135,
    },
  })
  const containerShadowCss = resolveBoxShadow(containerShadow)

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
            containerBackgroundMode && containerBackgroundMode !== "transparent" && "border border-border/20",
            containerBackgroundMode === "gradient" && "backdrop-blur-sm",
            isElementSelected("faq.surface") && "ring-2 ring-primary/30",
            editable && blockId && onElementClick && "cursor-pointer"
          )}
          style={{
            ...surfaceShadow,
            ...containerBg.style,
            ...(containerShadowCss ? { boxShadow: containerShadowCss } : {}),
          }}
        >
          {/* Headline */}
          {headline && (
            <div className="mb-10">
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
              />
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
