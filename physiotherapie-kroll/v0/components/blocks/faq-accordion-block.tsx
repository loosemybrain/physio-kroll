"use client"

import { useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

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
  variant?: "default" | "soft"
  editable?: boolean
  blockId?: string
  onEditField?: (
    blockId: string,
    fieldPath: string,
    anchorRect?: DOMRect,
  ) => void
  elements?: Record<string, unknown>
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function FaqAccordionBlock({
  headline,
  headlineColor,
  questionColor,
  answerColor,
  items,
  variant = "default",
  editable = false,
  blockId,
  onEditField,
}: FaqAccordionProps) {
  const isSoft = variant === "soft"

  /* ---- inline-edit helper ---- */
  const handleInlineEdit = useCallback(
    (e: React.MouseEvent, fieldPath: string) => {
      if (!editable || !blockId || !onEditField) return
      e.preventDefault()
      e.stopPropagation()
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      onEditField(blockId, fieldPath, rect)
    },
    [editable, blockId, onEditField],
  )

  const editableClass =
    editable && blockId && onEditField
      ? "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
      : ""

  return (
    <section
      className={cn(
        "py-10 md:py-14 lg:py-16",
        isSoft && "bg-muted/30",
      )}
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Optional inner surface panel */}
        <div
          className={cn(
            "relative",
            isSoft &&
              "rounded-2xl border border-border/20 bg-card/70 px-6 py-10 backdrop-blur-sm sm:px-10 md:py-14",
          )}
        >
          {/* ---- Headline ---- */}
          {headline && (
            <div className="mb-10">
              <h2
                onClick={(e) => handleInlineEdit(e, "headline")}
                className={cn(
                  "text-3xl font-semibold tracking-tight text-foreground md:text-4xl",
                  editableClass,
                )}
                style={
                  headlineColor
                    ? ({ color: headlineColor } as React.CSSProperties)
                    : undefined
                }
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

          {/* ---- Accordion ---- */}
          <Accordion
            type="single"
            collapsible
            className="flex w-full flex-col gap-3"
            suppressHydrationWarning
          >
            {items.map((item, index) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className={cn(
                  "rounded-xl border border-border/40 bg-transparent px-5 transition-all duration-300",
                  "hover:border-primary/30 hover:bg-primary/5",
                  "data-[state=open]:border-primary/25 data-[state=open]:bg-primary/[0.03]",
                  /* remove default shadcn bottom border */
                  "!border-b",
                )}
              >
                <AccordionTrigger
                  className={cn(
                    "py-5 text-base font-medium text-foreground no-underline hover:no-underline md:text-lg",
                    "[&>svg]:size-5 [&>svg]:text-muted-foreground/60",
                  )}
                >
                  <span
                    onClick={(e) => {
                      if (editable && blockId && onEditField) {
                        e.stopPropagation()
                        handleInlineEdit(e, `items.${index}.question`)
                      }
                    }}
                    className={cn("flex-1 text-left", editableClass)}
                    style={{
                      color:
                        item.questionColor || questionColor || undefined,
                    }}
                  >
                    {item.question || "Frage eingeben..."}
                  </span>
                </AccordionTrigger>

                <AccordionContent className="pb-5">
                  <div
                    onClick={(e) => {
                      if (editable && blockId && onEditField) {
                        e.stopPropagation()
                        handleInlineEdit(e, `items.${index}.answer`)
                      }
                    }}
                    className={cn(
                      "text-sm leading-relaxed text-muted-foreground md:text-base",
                      editableClass,
                    )}
                    style={{
                      color: item.answerColor || answerColor || undefined,
                    }}
                    dangerouslySetInnerHTML={{
                      __html: item.answer || "Antwort eingeben...",
                    }}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
