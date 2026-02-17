"use client"

import { useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { CardSurface } from "@/components/ui/card"
import { useElementShadowStyle } from "@/lib/shadow"
import type { FaqBlock } from "@/types/cms"

/* ================================================================ */
/*  Props                                                            */
/* ================================================================ */

interface FaqAccordionProps {
  section?: unknown
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
  background?: "none" | "muted" | "gradient"
  variant?: "default" | "soft"
  editable?: boolean
  blockId?: string
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  // Shadow/Element Props
  elements?: Record<string, any>
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
}

/* ================================================================ */
/*  Background Map                                                   */
/* ================================================================ */

const backgroundMap = {
  none: "bg-background",
  muted: "bg-muted/10",
  gradient: "bg-gradient-to-br from-primary/5 via-background to-background",
}

/* ================================================================ */
/*  Component                                                        */
/* ================================================================ */

export function FaqAccordion({
  headline,
  headlineColor,
  questionColor,
  answerColor,
  items,
  background = "none",
  variant = "default",
  editable = false,
  blockId,
  onEditField,
  elements,
  onElementClick,
  selectedElementId,
}: FaqAccordionProps) {
  const isSoft = variant === "soft"

  const canInlineEdit = Boolean(editable && blockId && onEditField)

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
        "py-10 md:py-14 lg:py-16",
        backgroundMap[background]
      )}
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Inner surface panel - always rounded, overflow, and padded */}
        <div
          data-element-id="faq.surface"
          style={surfaceShadow}
          onClick={() => onElementClick?.(blockId || "", "faq.surface")}
          className={cn(
            "relative rounded-2xl overflow-hidden px-6 py-10 sm:px-10 md:py-14",
            isSoft ? "border border-border/20 bg-muted/30 backdrop-blur-sm" : "bg-card"
          )}
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
                  "text-3xl font-semibold tracking-tight text-foreground md:text-4xl transition-all rounded",
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
            {items.map((item, index) => {
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

              const isItemSelected = isElementSelected(itemSurfaceId)
              const isQuestionSelected = isElementSelected(itemQuestionId)
              const isAnswerSelected = isElementSelected(itemAnswerId)

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
                        "flex-1 text-left transition-all rounded",
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
                        "text-sm leading-relaxed text-muted-foreground md:text-base transition-all rounded",
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
            })}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
