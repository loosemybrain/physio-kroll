"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { AnimatedBlock } from "@/components/blocks/AnimatedBlock"
import { ElementAnimated } from "@/components/blocks/ElementAnimated"
import { RevealOnScroll } from "@/components/ui/RevealOnScroll"
import type { BlockSectionProps, ElementConfig } from "@/types/cms"
import { sanitizeCmsHtml } from "@/lib/security/sanitizeCmsHtml"

interface TextBlockProps {
  section?: BlockSectionProps
  typography?: unknown
  content: string
  alignment?: "left" | "center" | "right"
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full"
  textSize?: "sm" | "base" | "lg" | "xl" | "2xl"
  contentColor?: string
  headingColor?: string
  linkColor?: string
  elements?: Record<string, ElementConfig | undefined>
  editable?: boolean
  blockId?: string
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full",
}

const textSizeMap = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
}

const alignmentMap = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
}

export function TextBlock({
  section,
  content,
  alignment = "left",
  maxWidth = "xl",
  textSize = "base",
  contentColor,
  headingColor,
  linkColor,
  elements,
  editable = false,
  blockId,
  onEditField,
  onElementClick,
  selectedElementId,
}: TextBlockProps) {
  const proseStyle = {
    ...(contentColor ? ({ ["--tw-prose-body" as unknown as string]: contentColor, color: contentColor } as React.CSSProperties) : {}),
    ...(headingColor ? ({ ["--tw-prose-headings" as unknown as string]: headingColor } as React.CSSProperties) : {}),
    ...(linkColor ? ({ ["--tw-prose-links" as unknown as string]: linkColor } as React.CSSProperties) : {}),
  } as React.CSSProperties

  const canInlineEdit = Boolean(editable && blockId && onEditField)

  return (
    <AnimatedBlock config={section?.animation}>
      <RevealOnScroll>
        <section>
          <div className={cn("mx-auto px-4", maxWidthMap[maxWidth])}>
            <ElementAnimated elementId="text.content" elements={elements}>
              <div
                data-element-id="text.content"
                data-cms-field={canInlineEdit ? "content" : undefined}
                className={cn(
                  alignmentMap[alignment],
                  textSizeMap[textSize],
                  "prose prose-neutral dark:prose-invert max-w-none",
                  canInlineEdit && "cursor-pointer rounded-md",
                  selectedElementId === "text.content" && "ring-2 ring-primary/30 ring-offset-2"
                )}
                style={proseStyle}
                dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(content, "richText") }}
                onClick={
                  canInlineEdit
                    ? (e) => {
                        e.stopPropagation()
                        onElementClick?.(blockId ?? "", "text.content")
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                        onEditField?.(blockId ?? "", "content", rect)
                      }
                    : undefined
                }
              />
            </ElementAnimated>
          </div>
        </section>
      </RevealOnScroll>
    </AnimatedBlock>
  )
}
