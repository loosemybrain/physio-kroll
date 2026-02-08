"use client"

import { useCallback } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface TeamGridBlockProps {
  section?: unknown
  typography?: unknown
  headline?: string
  subheadline?: string
  headlineColor?: string
  subheadlineColor?: string
  nameColor?: string
  roleColor?: string
  ctaColor?: string
  cardBgColor?: string
  cardBorderColor?: string
  members: Array<{
    id: string
    name: string
    role: string
    imageUrl: string
    imageAlt: string
    ctaText?: string
    ctaHref?: string
    nameColor?: string
    roleColor?: string
    ctaColor?: string
    cardBgColor?: string
    cardBorderColor?: string
  }>
  columns?: 2 | 3 | 4
  editable?: boolean
  blockId?: string
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  // Shadow/Element Props
  elements?: Record<string, any>
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
}

const columnsMap = {
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
}

export function TeamGridBlock({
  headline,
  subheadline,
  headlineColor,
  subheadlineColor,
  nameColor,
  roleColor,
  ctaColor,
  cardBgColor,
  cardBorderColor,
  members,
  columns = 3,
  editable = false,
  blockId,
  onEditField,
}: TeamGridBlockProps) {
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
    <section className="py-16">
      <div>
        {/* Headline & Subheadline */}
        {(headline || subheadline) && (
          <div className="mb-12 text-center">
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
                  "mt-4 text-lg text-muted-foreground max-w-2xl mx-auto",
                  editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                )}
                style={subheadlineColor ? ({ color: subheadlineColor } as React.CSSProperties) : undefined}
              >
                {subheadline}
              </p>
            )}
          </div>
        )}

        {/* Members Grid */}
        <div className={cn("grid gap-6", columnsMap[columns])}>
          {members.map((member, index) => (
            <Card
              key={member.id}
              className="h-full flex flex-col overflow-hidden"
              style={{
                backgroundColor: member.cardBgColor || cardBgColor || undefined,
                borderColor: member.cardBorderColor || cardBorderColor || undefined,
              }}
            >
              {/* Image */}
              <div className="relative aspect-square w-full overflow-hidden bg-muted">
                <img
                  src={member.imageUrl || "/placeholder.svg"}
                  alt={member.imageAlt || member.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <CardHeader className="flex-1">
                {/* Name */}
                <h3
                  onClick={(e) => handleInlineEdit(e, `members.${index}.name`)}
                  className={cn(
                    "text-xl font-semibold text-foreground",
                    editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                  )}
                  style={{ color: member.nameColor || nameColor || undefined }}
                >
                  {member.name || "Name eingeben..."}
                </h3>

                {/* Role */}
                <p
                  onClick={(e) => handleInlineEdit(e, `members.${index}.role`)}
                  className={cn(
                    "mt-1 text-sm text-muted-foreground",
                    editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                  )}
                  style={{ color: member.roleColor || roleColor || undefined }}
                >
                  {member.role || "Rolle eingeben..."}
                </p>
              </CardHeader>

              {/* CTA */}
              {member.ctaText && (
                <CardContent>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 w-full"
                    style={{ color: member.ctaColor || ctaColor || undefined }}
                    onClick={editable && blockId && onEditField ? (e) => handleInlineEdit(e, `members.${index}.ctaText`) : undefined}
                    asChild={!editable && !!member.ctaHref}
                  >
                    {!editable && member.ctaHref ? (
                      <a href={member.ctaHref}>
                        {member.ctaText}
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    ) : (
                      <>
                        <span
                          onClick={(e) => {
                            if (editable && blockId && onEditField) {
                              e.stopPropagation()
                              handleInlineEdit(e, `members.${index}.ctaText`)
                            }
                          }}
                          className={cn(
                            editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                          )}
                        >
                          {member.ctaText}
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
