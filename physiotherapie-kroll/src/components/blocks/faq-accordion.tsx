"use client"

import { useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type { FaqBlock } from "@/types/cms"

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
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  // Shadow/Element Props
  elements?: Record<string, any>
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
}

export function FaqAccordion({
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

  // Inline edit helper
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

  return (
    <section
      className={cn(
        "py-16",
        isSoft && "bg-muted/30"
      )}
    >
      <div className="mx-auto max-w-4xl">
        {/* Headline */}
        {headline && (
          <h2
            onClick={(e) => handleInlineEdit(e, "headline")}
            className={cn(
              "text-3xl font-bold tracking-tight text-foreground mb-8 md:text-4xl",
              editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
            )}
            style={headlineColor ? ({ color: headlineColor } as React.CSSProperties) : undefined}
          >
            {headline}
          </h2>
        )}

        {/* Accordion */}
        <Accordion type="single" collapsible className="w-full">
          {items.map((item, index) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger
                className={cn(
                  "text-left",
                  editable && blockId && onEditField && "group"
                )}
              >
                <span
                  onClick={(e) => {
                    if (editable && blockId && onEditField) {
                      e.stopPropagation()
                      handleInlineEdit(e, `items.${index}.question`)
                    }
                  }}
                  className={cn(
                    "flex-1",
                    editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                  )}
                  style={{ color: item.questionColor || questionColor || undefined }}
                >
                  {item.question || "Frage eingeben..."}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div
                  onClick={(e) => {
                    if (editable && blockId && onEditField) {
                      e.stopPropagation()
                      handleInlineEdit(e, `items.${index}.answer`)
                    }
                  }}
                  className={cn(
                    "text-muted-foreground leading-relaxed",
                    editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                  )}
                  style={{ color: item.answerColor || answerColor || undefined }}
                  dangerouslySetInnerHTML={{ __html: item.answer || "Antwort eingeben..." }}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
