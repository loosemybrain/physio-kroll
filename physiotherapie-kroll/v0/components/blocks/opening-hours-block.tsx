"use client"

import { cn } from "@/lib/utils"
import { mergeTypographyClasses } from "@/lib/typography"
import { Clock } from "lucide-react"

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
  editable?: boolean
  blockId?: string
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  elements?: Record<string, unknown>
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
}

const backgroundMap: Record<
  NonNullable<OpeningHoursBlockProps["background"]>,
  string
> = {
  none: "",
  muted: "bg-muted/40",
  gradient:
    "bg-gradient-to-b from-primary/[0.03] via-background to-background",
}

const editableClass =
  "cursor-pointer rounded-md px-1.5 py-0.5 transition-colors duration-150 hover:bg-primary/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"

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
  typography,
  editable = false,
  blockId,
  onEditField,
}: OpeningHoursBlockProps) {
  const typo = (typography as Record<string, unknown> | undefined) ?? {}
  const canEdit = editable && !!blockId && !!onEditField

  const handleInlineEdit = (
    e: React.MouseEvent,
    fieldPath: string
  ) => {
    if (!canEdit) return
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onEditField!(blockId!, fieldPath, rect)
  }

  return (
    <section
      className={cn("py-16 md:py-20", backgroundMap[background])}
      aria-label={headline || "Öffnungszeiten"}
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* ── Header ── */}
        {(headline || subheadline) && (
          <header className="mb-10 text-center md:mb-12">
            {headline && (
              <div className="flex items-center justify-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.08]">
                  <Clock
                    className="h-5 w-5 text-primary"
                    aria-hidden="true"
                  />
                </div>
                <h2
                  onClick={(e) => handleInlineEdit(e, "headline")}
                  className={cn(
                    mergeTypographyClasses(
                      "text-2xl font-semibold tracking-tight text-foreground sm:text-3xl",
                      typo["openingHours.headline"]
                    ),
                    canEdit && editableClass
                  )}
                  style={
                    headlineColor
                      ? ({ color: headlineColor } as React.CSSProperties)
                      : undefined
                  }
                >
                  {headline}
                </h2>
              </div>
            )}

            {subheadline && (
              <p
                onClick={(e) => handleInlineEdit(e, "subheadline")}
                className={cn(
                  mergeTypographyClasses(
                    "mx-auto mt-3 max-w-lg text-base leading-relaxed text-muted-foreground",
                    typo["openingHours.subheadline"]
                  ),
                  canEdit && editableClass
                )}
                style={
                  subheadlineColor
                    ? ({ color: subheadlineColor } as React.CSSProperties)
                    : undefined
                }
              >
                {subheadline}
              </p>
            )}
          </header>
        )}

        {/* ── Panel ── */}
        <div
          className={cn(
            "overflow-hidden rounded-2xl border border-border/60",
            background === "gradient"
              ? "bg-card/70 backdrop-blur-sm"
              : "bg-card",
            "shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_32px_-12px_rgba(0,0,0,0.08)]"
          )}
          style={{
            backgroundColor: cardBgColor || undefined,
            borderColor: cardBorderColor || undefined,
          }}
        >
          {/* Subtle top accent line */}
          <div
            className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent"
            aria-hidden="true"
          />

          <dl className="p-6 sm:p-8">
            <div
              className={cn(
                layout === "twoColumn" ? "space-y-0" : "space-y-5"
              )}
            >
              {hours.map((row, index) => {
                const isLast = index === hours.length - 1

                if (layout === "stack") {
                  return (
                    <div
                      key={row.id}
                      className={cn(
                        !isLast &&
                          "border-b border-border/40 pb-5"
                      )}
                    >
                      <dt
                        onClick={(e) =>
                          handleInlineEdit(e, `hours.${index}.label`)
                        }
                        className={cn(
                          mergeTypographyClasses(
                            "text-sm font-medium text-foreground",
                            typo["openingHours.label"]
                          ),
                          canEdit && editableClass
                        )}
                        style={{
                          color:
                            row.labelColor || labelColor || undefined,
                        }}
                      >
                        {row.label || "Tag\u2026"}
                      </dt>
                      <dd
                        onClick={(e) =>
                          handleInlineEdit(e, `hours.${index}.value`)
                        }
                        className={cn(
                          mergeTypographyClasses(
                            "mt-1 text-base text-muted-foreground",
                            typo["openingHours.value"]
                          ),
                          canEdit && editableClass
                        )}
                        style={{
                          color:
                            row.valueColor || valueColor || undefined,
                        }}
                      >
                        {row.value || "Uhrzeit\u2026"}
                      </dd>
                    </div>
                  )
                }

                // twoColumn layout
                return (
                  <div
                    key={row.id}
                    className={cn(
                      "group/row flex items-baseline justify-between gap-4 py-3",
                      !isLast && "border-b border-border/30"
                    )}
                  >
                    <dt
                      onClick={(e) =>
                        handleInlineEdit(e, `hours.${index}.label`)
                      }
                      className={cn(
                        mergeTypographyClasses(
                          "text-sm font-medium text-foreground sm:text-base",
                          typo["openingHours.label"]
                        ),
                        canEdit && editableClass
                      )}
                      style={{
                        color:
                          row.labelColor || labelColor || undefined,
                      }}
                    >
                      {row.label || "Tag\u2026"}
                    </dt>

                    {/* Spacer dots */}
                    <div
                      className="hidden flex-1 border-b border-dotted border-border/30 sm:block"
                      aria-hidden="true"
                    />

                    <dd
                      onClick={(e) =>
                        handleInlineEdit(e, `hours.${index}.value`)
                      }
                      className={cn(
                        mergeTypographyClasses(
                          "whitespace-nowrap text-right text-sm tabular-nums text-muted-foreground sm:text-base",
                          typo["openingHours.value"]
                        ),
                        canEdit && editableClass
                      )}
                      style={{
                        color:
                          row.valueColor || valueColor || undefined,
                      }}
                    >
                      {row.value || "Uhrzeit\u2026"}
                    </dd>
                  </div>
                )
              })}
            </div>

            {/* ── Note ── */}
            {typeof note !== "undefined" && (
              <div className="mt-6 border-t border-border/40 pt-5">
                <p
                  onClick={(e) => handleInlineEdit(e, "note")}
                  className={cn(
                    mergeTypographyClasses(
                      "text-sm leading-relaxed text-muted-foreground",
                      typo["openingHours.note"]
                    ),
                    canEdit && editableClass
                  )}
                  style={
                    noteColor
                      ? ({ color: noteColor } as React.CSSProperties)
                      : undefined
                  }
                >
                  {note || "Hinweis\u2026"}
                </p>
              </div>
            )}
          </dl>
        </div>
      </div>
    </section>
  )
}
