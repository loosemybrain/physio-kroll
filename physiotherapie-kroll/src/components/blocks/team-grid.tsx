"use client"

import { useCallback } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import type { MediaValue } from "@/types/cms"
import { resolveMediaClient } from "@/lib/cms/resolveMediaClient"

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

function MemberCard({
  member,
  index,
  nameColor,
  roleColor,
  ctaColor,
  editable,
  blockId,
  onEditField,
}: {
  member: TeamGridBlockProps["members"][number]
  index: number
  nameColor?: string
  roleColor?: string
  ctaColor?: string
  editable?: boolean
  blockId?: string
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
}) {
  const handleInlineEdit = useCallback(
    (e: React.MouseEvent, fieldPath: string) => {
      if (!editable || !blockId || !onEditField) return
      e.preventDefault()
      e.stopPropagation()
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      onEditField(blockId, fieldPath, rect)
    },
    [editable, blockId, onEditField]
  )

  const imageUrl = resolveMediaClient({ url: member.imageUrl }) || member.imageUrl || "/placeholder.svg"

  return (
    <Card
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)]",
        "transition-all duration-500 ease-out",
        "hover:-translate-y-2 hover:border-primary/30",
        "hover:shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_48px_-12px_rgba(0,0,0,0.15)]"
      )}
      style={{
        backgroundColor: member.cardBgColor || undefined,
        borderColor: member.cardBorderColor || undefined,
      }}
    >
      {/* Top accent bar */}
      <div className="h-1 w-full bg-linear-to-r from-primary/60 via-primary/30 to-transparent" />

      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={member.imageAlt || member.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <CardContent className="flex flex-1 flex-col p-7">
        {/* Name */}
        <h3
          onClick={(e) => handleInlineEdit(e, `members.${index}.name`)}
          className={cn(
            "mb-2 truncate font-semibold tracking-tight text-card-foreground",
            editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
          )}
          style={{ color: member.nameColor || nameColor || undefined }}
        >
          {member.name || "Name eingeben..."}
        </h3>

        {/* Role */}
        <p
          onClick={(e) => handleInlineEdit(e, `members.${index}.role`)}
          className={cn(
            "mb-5 truncate text-sm text-muted-foreground",
            editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
          )}
          style={{ color: member.roleColor || roleColor || undefined }}
        >
          {member.role || "Rolle eingeben..."}
        </p>

        {/* CTA */}
        {member.ctaText && (
          <div className="mt-auto border-t border-border/40 pt-5">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-2 justify-start p-0 h-auto text-sm font-medium text-primary",
                "hover:bg-transparent hover:text-primary/80",
                "transition-colors duration-200"
              )}
              style={{ color: member.ctaColor || ctaColor || undefined }}
              onClick={editable && blockId && onEditField ? (e) => handleInlineEdit(e, `members.${index}.ctaText`) : undefined}
              asChild={!editable && !!member.ctaHref}
            >
              {!editable && member.ctaHref ? (
                <a href={member.ctaHref} className="inline-flex items-center gap-2">
                  <span>{member.ctaText}</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
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
                      editable && blockId && onEditField && "cursor-pointer"
                    )}
                  >
                    {member.ctaText}
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
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
    [editable, blockId, onEditField]
  )

  return (
    <section className="relative py-20 md:py-28">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Headline & Subheadline */}
        {(headline || subheadline) && (
          <header className="mb-16 text-center">
            {subheadline && (
              <p
                onClick={(e) => handleInlineEdit(e, "subheadline")}
                className={cn(
                  "mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-primary",
                  editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                )}
                style={subheadlineColor ? ({ color: subheadlineColor } as React.CSSProperties) : undefined}
              >
                {subheadline}
              </p>
            )}
            {headline && (
              <h2
                onClick={(e) => handleInlineEdit(e, "headline")}
                className={cn(
                  "text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl",
                  editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                )}
                style={headlineColor ? ({ color: headlineColor } as React.CSSProperties) : undefined}
              >
                {headline}
              </h2>
            )}
          </header>
        )}

        {/* Members Grid */}
        <div className={cn("grid gap-6", columnsMap[columns])}>
          {members.map((member, index) => (
            <MemberCard
              key={member.id}
              member={member}
              index={index}
              nameColor={nameColor}
              roleColor={roleColor}
              ctaColor={ctaColor}
              editable={editable}
              blockId={blockId}
              onEditField={onEditField}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
