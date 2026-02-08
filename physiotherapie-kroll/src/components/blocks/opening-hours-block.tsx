"use client"

import { cn } from "@/lib/utils"

export interface OpeningHoursBlockProps {
  section?: unknown
  typography?: unknown
  headline?: string
  subheadline?: string
  hours: Array<{
    id: string
    label: string
    value: string
    labelColor?: string
    valueColor?: string
  }>
  layout?: "twoColumn" | "stack"
  note?: string
  background?: "none" | "muted" | "gradient"
  headlineColor?: string
  subheadlineColor?: string
  labelColor?: string
  valueColor?: string
  noteColor?: string
  cardBgColor?: string
  cardBorderColor?: string
  // CMS/Inline Edit Props
  editable?: boolean
  blockId?: string
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  // Shadow/Element Props
  elements?: Record<string, any>
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
}

const backgroundMap: Record<NonNullable<OpeningHoursBlockProps["background"]>, string> = {
  none: "",
  muted: "bg-muted/50",
  gradient: "bg-gradient-to-br from-primary/5 via-background to-background",
}

export function OpeningHoursBlock({
  headline,
  subheadline,
  hours,
  layout = "twoColumn",
  note,
  background = "none",
  headlineColor,
  subheadlineColor,
  labelColor,
  valueColor,
  noteColor,
  cardBgColor,
  cardBorderColor,
  editable = false,
  blockId,
  onEditField,
}: OpeningHoursBlockProps) {
  const handleInlineEdit = (e: React.MouseEvent, fieldPath: string) => {
    if (!editable || !blockId || !onEditField) return
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onEditField(blockId, fieldPath, rect)
  }

  return (
    <section className={cn("py-16", backgroundMap[background])} aria-label={headline || "Öffnungszeiten"}>
      <div className="mx-auto max-w-3xl">
        {(headline || subheadline) && (
          <header className="mb-10 text-center">
            {headline && (
              <h2
                onClick={(e) => handleInlineEdit(e, "headline")}
                className={cn(
                  "text-3xl font-bold tracking-tight text-foreground md:text-4xl",
                  editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                )}
                style={headlineColor ? ({ color: headlineColor } as React.CSSProperties) : undefined}
              >
                {headline}
              </h2>
            )}
            {subheadline && (
              <p
                onClick={(e) => handleInlineEdit(e, "subheadline")}
                className={cn(
                  "mt-4 text-lg text-muted-foreground",
                  editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                )}
                style={subheadlineColor ? ({ color: subheadlineColor } as React.CSSProperties) : undefined}
              >
                {subheadline}
              </p>
            )}
          </header>
        )}

        <dl
          className="rounded-xl border border-border bg-card p-6"
          style={{
            backgroundColor: cardBgColor || undefined,
            borderColor: cardBorderColor || undefined,
          }}
        >
          <div className={cn(layout === "twoColumn" ? "space-y-3" : "space-y-4")}>
            {hours.map((row, index) => (
              <div
                key={row.id}
                className={cn(
                  "flex gap-4",
                  layout === "twoColumn" ? "items-baseline justify-between" : "flex-col items-start"
                )}
              >
                <dt
                  onClick={(e) => handleInlineEdit(e, `hours.${index}.label`)}
                  className={cn(
                    "font-medium text-foreground",
                    editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                  )}
                  style={{ color: row.labelColor || labelColor || undefined }}
                >
                  {row.label || "Tag…"}
                </dt>
                <dd
                  onClick={(e) => handleInlineEdit(e, `hours.${index}.value`)}
                  className={cn(
                    "text-muted-foreground",
                    layout === "twoColumn" ? "text-right" : "text-left",
                    editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                  )}
                  style={{ color: row.valueColor || valueColor || undefined }}
                >
                  {row.value || "Uhrzeit…"}
                </dd>
              </div>
            ))}
          </div>

          {typeof note !== "undefined" && (
            <div className="mt-6 border-t border-border pt-4">
              <p
                onClick={(e) => handleInlineEdit(e, "note")}
                className={cn(
                  "text-sm text-muted-foreground",
                  editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                )}
                style={noteColor ? ({ color: noteColor } as React.CSSProperties) : undefined}
              >
                {note || "Hinweis…"}
              </p>
            </div>
          )}
        </dl>
      </div>
    </section>
  )
}

