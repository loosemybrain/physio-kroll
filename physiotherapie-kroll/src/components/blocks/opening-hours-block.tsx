"use client"

import { CSSProperties, MouseEvent } from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { mergeTypographyClasses } from "@/lib/typography"
import { useElementShadowStyle } from "@/lib/shadow"

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
  typography,
  editable = false,
  blockId,
  onEditField,
  elements,
  onElementClick,
  selectedElementId,
}: OpeningHoursBlockProps) {
  const typo = (typography as Record<string, any> | undefined) ?? {}
  
  const canEdit = editable && !!blockId && !!onEditField
  const canSelect = !!blockId && !!onElementClick
  const editableClass = canEdit && "cursor-pointer rounded-md px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 hover:bg-primary/7"

  // Element shadows
  const surfaceShadow = useElementShadowStyle({
    elementId: "openingHours.surface",
    elementConfig: (elements ?? {})["openingHours.surface"],
  })

  const handleInlineEdit = (e: MouseEvent<HTMLElement>, fieldPath: string) => {
    if (!canEdit) return
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onEditField(blockId, fieldPath, rect)
  }

  const handleElementClick = (e: MouseEvent<HTMLElement>, elementId: string) => {
    if (!canSelect) return
    e.preventDefault()
    e.stopPropagation()
    onElementClick(blockId, elementId)
  }

  const isElementSelected = (elementId: string) => selectedElementId === elementId
  const selectionClass = (elementId: string) => 
    isElementSelected(elementId) && "ring-2 ring-primary ring-inset"

  return (
    <section
      className={cn("py-16", backgroundMap[background])}
      aria-label={headline || "Öffnungszeiten"}
    >
      <div className="mx-auto max-w-3xl px-4">
        {(headline || subheadline) && (
          <header className="mb-12 text-center">
            <div className="mb-4 flex justify-center">
              <Clock
                className="h-8 w-8 text-primary/60"
                strokeWidth={1.5}
                aria-hidden
              />
            </div>
            {headline && (
              <h2
                onClick={(e) => {
                  handleInlineEdit(e, "headline")
                  handleElementClick(e, "headline")
                }}
                tabIndex={canEdit ? 0 : -1}
                className={cn(
                  mergeTypographyClasses(
                    "text-3xl font-bold tracking-tight text-foreground md:text-4xl",
                    typo["openingHours.headline"]
                  ),
                  editableClass,
                  selectionClass("headline"),
                  "rounded-lg transition-all"
                )}
                style={headlineColor ? ({ color: headlineColor } as CSSProperties) : undefined}
              >
                {headline}
              </h2>
            )}
            {subheadline && (
              <p
                onClick={(e) => {
                  handleInlineEdit(e, "subheadline")
                  handleElementClick(e, "subheadline")
                }}
                tabIndex={canEdit ? 0 : -1}
                className={cn(
                  mergeTypographyClasses(
                    "mt-3 text-lg leading-relaxed text-muted-foreground",
                    typo["openingHours.subheadline"]
                  ),
                  editableClass,
                  selectionClass("subheadline"),
                  "rounded-lg transition-all"
                )}
                style={subheadlineColor ? ({ color: subheadlineColor } as CSSProperties) : undefined}
              >
                {subheadline}
              </p>
            )}
          </header>
        )}

        <dl
          data-element-id="openingHours.surface"
          onClick={(e) => {
            if (editable && blockId && onElementClick) {
              e.stopPropagation()
              onElementClick(blockId, "openingHours.surface")
            }
          }}
          className={cn(
            "rounded-3xl border border-border/50 bg-card p-8",
            background === "gradient" && "backdrop-blur-sm",
            isElementSelected("openingHours.surface") && "ring-2 ring-primary ring-inset",
            editable && blockId && onElementClick && "cursor-pointer",
          )}
          style={{
            ...surfaceShadow,
            backgroundColor: cardBgColor || undefined,
            borderColor: cardBorderColor || undefined,
          }}
        >
          <div className={cn(layout === "twoColumn" ? "space-y-4" : "space-y-5")}>
            {hours.map((row, index) => (
              <div
                key={row.id}
                className={cn(
                  layout === "twoColumn"
                    ? "flex items-baseline justify-between gap-6"
                    : "flex flex-col gap-1 pb-4 last:pb-0",
                  layout === "stack" && index < hours.length - 1 && "border-b border-border/30"
                )}
              >
                <dt
                  onClick={(e) => {
                    handleInlineEdit(e, `hours.${index}.label`)
                    handleElementClick(e, `hours.${index}.label`)
                  }}
                  tabIndex={canEdit ? 0 : -1}
                  className={cn(
                    mergeTypographyClasses(
                      "font-medium text-foreground",
                      typo["openingHours.label"]
                    ),
                    editableClass,
                    selectionClass(`hours.${index}.label`),
                    "rounded-lg transition-all"
                  )}
                  style={{ color: row.labelColor || labelColor || undefined }}
                >
                  {row.label || "Tag…"}
                </dt>
                <dd
                  onClick={(e) => {
                    handleInlineEdit(e, `hours.${index}.value`)
                    handleElementClick(e, `hours.${index}.value`)
                  }}
                  tabIndex={canEdit ? 0 : -1}
                  className={cn(
                    mergeTypographyClasses(
                      "text-muted-foreground",
                      typo["openingHours.value"]
                    ),
                    layout === "twoColumn" && "text-right",
                    editableClass,
                    selectionClass(`hours.${index}.value`),
                    "rounded-lg transition-all"
                  )}
                  style={{ color: row.valueColor || valueColor || undefined }}
                >
                  {row.value || "Uhrzeit…"}
                </dd>
              </div>
            ))}
          </div>

          {typeof note !== "undefined" && note && (
            <div className="mt-6 border-t border-border/30 pt-6">
              <p
                onClick={(e) => {
                  handleInlineEdit(e, "note")
                  handleElementClick(e, "note")
                }}
                tabIndex={canEdit ? 0 : -1}
                className={cn(
                  mergeTypographyClasses(
                    "text-xs leading-relaxed text-muted-foreground/80",
                    typo["openingHours.note"]
                  ),
                  editableClass,
                  selectionClass("note"),
                  "rounded-lg transition-all"
                )}
                style={noteColor ? ({ color: noteColor } as CSSProperties) : undefined}
              >
                {note}
              </p>
            </div>
          )}
        </dl>
      </div>
    </section>
  )
}

