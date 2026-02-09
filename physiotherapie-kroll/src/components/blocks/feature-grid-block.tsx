"use client"

import { useCallback } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardSurface } from "@/components/ui/card"
import { useElementShadowStyle } from "@/lib/shadow"

interface Feature {
  id: string
  title: string
  description: string
  icon?: string
  titleColor?: string
  descriptionColor?: string
  iconColor?: string
  cardBgColor?: string
  cardBorderColor?: string
}

interface FeatureGridBlockProps {
  section?: unknown
  typography?: unknown
  features: Feature[]
  columns?: 2 | 3 | 4
  titleColor?: string
  descriptionColor?: string
  iconColor?: string
  cardBgColor?: string
  cardBorderColor?: string
  editable?: boolean
  blockId?: string
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  elements?: Record<string, any>
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
}

const columnsMap = {
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
}

export function FeatureGridBlock({
  features,
  columns = 3,
  titleColor,
  descriptionColor,
  iconColor,
  cardBgColor,
  cardBorderColor,
  editable = false,
  blockId,
  onEditField,
  elements,
  onElementClick,
  selectedElementId,
}: FeatureGridBlockProps) {
  const handleInlineEdit = useCallback(
    (e: React.MouseEvent, fieldPath: string, elementId?: string) => {
      if (!editable || !blockId || !onEditField) return
      if (elementId && onElementClick) {
        onElementClick(blockId, elementId)
      }
      e.preventDefault()
      e.stopPropagation()
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      onEditField(blockId, fieldPath, rect)
    },
    [editable, blockId, onEditField, onElementClick],
  )

  return (
    <section className="py-16">
      <div className={cn("grid gap-6", columnsMap[columns])}>
          {features.map((feature, index) => {
            const cardShadow = useElementShadowStyle({
              elementId: `card-${feature.id}`,
              elementConfig: (elements ?? {})[`card-${feature.id}`],
            })
            return (
            <CardSurface
              key={feature.id}
              className="h-full"
              data-element-id={`card-${feature.id}`}
              style={{
                ...(cardShadow as any),
                backgroundColor: feature.cardBgColor || cardBgColor || undefined,
                borderColor: feature.cardBorderColor || cardBorderColor || undefined,
              }}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("[data-element-id]") === e.currentTarget && onElementClick) {
                  onElementClick(blockId || "", `card-${feature.id}`)
                }
              }}
            >
              <CardHeader>
                {feature.icon && (
                  <div
                    className="mb-4 text-4xl"
                    style={{ color: feature.iconColor || iconColor || undefined }}
                    dangerouslySetInnerHTML={{ __html: feature.icon }}
                  />
                )}
                <CardTitle
                  onClick={(e) => handleInlineEdit(e, `features.${index}.title`)}
                  className={cn(
                    editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                  )}
                  style={{ color: feature.titleColor || titleColor || undefined }}
                >
                  {feature.title || "Titel eingeben..."}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription
                  onClick={(e) => handleInlineEdit(e, `features.${index}.description`)}
                  className={cn(
                    "text-base",
                    editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                  )}
                  style={{ color: feature.descriptionColor || descriptionColor || undefined }}
                >
                  {feature.description || "Beschreibung eingeben..."}
                </CardDescription>
              </CardContent>
            </CardSurface>
            )
          })}
        </div>
    </section>
  )
}
