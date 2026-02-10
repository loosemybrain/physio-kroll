"use client"

import React, { useCallback, useRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Globe,
  Linkedin,
  Instagram,
  Mail,
} from "lucide-react"
import { resolveSectionBg, getSectionWrapperClasses } from "@/lib/theme/resolveSectionBg"
import { resolveContainerBg } from "@/lib/theme/resolveContainerBg"
import { resolveBoxShadow } from "@/lib/shadow/resolveBoxShadow"
import type { BlockSectionProps, ElementShadow } from "@/types/cms"

interface TeamMember {
  id: string
  name: string
  role?: string
  bio?: string
  imageUrl?: string | { url?: string; src?: string; publicUrl?: string; path?: string }
  imageAlt?: string
  avatarGradient?: "auto" | "g1" | "g2" | "g3" | "g4" | "g5" | "g6" | "g7" | "g8" | "g9" | "g10"
  avatarFit?: "cover" | "contain"
  avatarFocus?: "center" | "top" | "bottom" | "left" | "right"
  tags?: string[]
  socials?: Array<{
    type: "website" | "linkedin" | "instagram" | "email"
    href: string
  }>
  ctaText?: string
  ctaHref?: string
  nameColor?: string
  roleColor?: string
  bioColor?: string
  ctaColor?: string
  cardBgColor?: string
  cardBorderColor?: string
}

export interface TeamGridBlockProps {
  blockId?: string
  editable?: boolean
  onEditField?: (
    blockId: string,
    fieldPath: string,
    anchorRect?: DOMRect,
  ) => void
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
  elements?: Record<string, any>

  section?: BlockSectionProps

  headline?: string
  subheadline?: string
  eyebrow?: string

  columns?: 2 | 3 | 4
  layout?: "cards" | "compact"
  background?: "none" | "muted" | "gradient"

  members: TeamMember[]

  headlineColor?: string
  subheadlineColor?: string
  eyebrowColor?: string
  nameColor?: string
  roleColor?: string
  bioColor?: string
  ctaColor?: string
  cardBgColor?: string
  cardBorderColor?: string

  // Inner Container Background (Panel behind Header + Grid)
  containerBackgroundMode?: "transparent" | "color" | "gradient"
  containerBackgroundColor?: string
  containerBackgroundGradientPreset?: "soft" | "aurora" | "ocean" | "sunset" | "hero" | "none"
  containerBackgroundGradient?: string
  
  // Container Shadow
  containerShadow?: ElementShadow
}

/* Gradient presets keyed g1..g10 */
const gradientPresets: string[] = [
  "from-emerald-500 to-teal-600",
  "from-sky-500 to-blue-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-teal-500",
  "from-lime-500 to-green-600",
  "from-fuchsia-500 to-pink-500",
  "from-indigo-500 to-blue-500",
  "from-red-500 to-rose-600",
]

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function stableHash(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) - h + id.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function stableGradientKey(id: string): number {
  return stableHash(id) % 10
}

function getMediaUrl(
  avatar?: string | { url?: string; src?: string; publicUrl?: string; path?: string },
): string | null {
  if (!avatar) return null
  if (typeof avatar === "string") return avatar
  return avatar.url || avatar.src || avatar.publicUrl || avatar.path || null
}

function resolveGradient(
  avatarGradient: TeamMember["avatarGradient"],
  memberId: string,
): string {
  if (!avatarGradient || avatarGradient === "auto") {
    return gradientPresets[stableGradientKey(memberId)]
  }
  const idx = parseInt(avatarGradient.replace("g", ""), 10) - 1
  return gradientPresets[Math.max(0, Math.min(idx, 9))]
}

function getAvatarFitClass(fit?: "cover" | "contain"): string {
  return fit === "contain" ? "object-contain" : "object-cover"
}

function getAvatarFocusClass(focus?: "center" | "top" | "bottom" | "left" | "right"): string {
  const focusMap: Record<string, string> = {
    center: "object-center",
    top: "object-top",
    bottom: "object-bottom",
    left: "object-left",
    right: "object-right",
  }
  return focusMap[focus || "center"] || "object-center"
}

const columnsMap: Record<2 | 3 | 4, string> = {
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
}

const socialIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  website: Globe,
  linkedin: Linkedin,
  instagram: Instagram,
  email: Mail,
}

const socialLabelMap: Record<string, string> = {
  website: "Website",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  email: "E-Mail",
}

function MemberAvatar({
  member,
  size = "lg",
}: {
  member: TeamMember
  size?: "sm" | "lg"
}) {
  const imageUrl = getMediaUrl(member.imageUrl)
  const initials = getInitials(member.name)
  const gradient = resolveGradient(member.avatarGradient, member.id)

  const sizeClasses = size === "lg" ? "h-28 w-28" : "h-16 w-16"
  const textSize = size === "lg" ? "text-2xl" : "text-base"

  // Avatar Fit und Focus (mit Defaults)
  const avatarFit = member.avatarFit || "cover"
  const avatarFocus = member.avatarFocus || "center"
  const fitClass = getAvatarFitClass(avatarFit)
  const focusClass = getAvatarFocusClass(avatarFocus)

  if (imageUrl) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-2xl ring-[3px] ring-border/40 ring-offset-2 ring-offset-card transition-all duration-500 group-hover:ring-primary/40",
          avatarFit === "contain" && "bg-muted/30",
          sizeClasses,
        )}
      >
        <img
          src={imageUrl}
          alt={member.name}
          className={cn(
            "h-full w-full transition-transform duration-500 group-hover:scale-110",
            fitClass,
            focusClass
          )}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-bold text-white ring-[3px] ring-border/40 ring-offset-2 ring-offset-card transition-all duration-500 group-hover:ring-primary/40 group-hover:shadow-lg",
        gradient,
        sizeClasses,
        textSize,
      )}
    >
      {initials}
    </div>
  )
}

function Bio({
  text,
  color,
  editable,
  onClick,
}: {
  text: string
  color?: string
  editable?: boolean
  onClick?: (e: React.MouseEvent) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [needsClamp, setNeedsClamp] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = ref.current
    if (el) setNeedsClamp(el.scrollHeight > el.clientHeight + 2)
  }, [text])

  return (
    <div className="relative">
      <p
        ref={ref}
        onClick={editable ? onClick : undefined}
        className={cn(
          "text-sm leading-relaxed text-muted-foreground transition-all duration-300",
          !expanded && "line-clamp-3",
          editable && "cursor-pointer rounded px-1 hover:bg-primary/10",
        )}
        style={color ? { color } : undefined}
      >
        {text}
      </p>
      {!editable && needsClamp && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
        >
          Mehr lesen
        </button>
      )}
    </div>
  )
}

function MemberCard({
  member,
  index,
  layout,
  nameColor,
  roleColor,
  bioColor,
  ctaColor,
  cardBgColor,
  cardBorderColor,
  editable,
  blockId,
  onEditField,
}: {
  member: TeamMember
  index: number
  layout: "cards" | "compact"
  nameColor?: string
  roleColor?: string
  bioColor?: string
  ctaColor?: string
  cardBgColor?: string
  cardBorderColor?: string
  editable?: boolean
  blockId?: string
  onEditField?: TeamGridBlockProps["onEditField"]
}) {
  const handleEdit = useCallback(
    (e: React.MouseEvent, fieldPath: string) => {
      if (!editable || !blockId || !onEditField) return
      e.preventDefault()
      e.stopPropagation()
      onEditField(
        blockId,
        fieldPath,
        (e.currentTarget as HTMLElement).getBoundingClientRect(),
      )
    },
    [editable, blockId, onEditField],
  )

  const isCompact = layout === "compact"

  return (
    <article
      className={cn(
        "group relative flex overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-sm",
        // Shadow & hover
        "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_10px_32px_-10px_rgba(0,0,0,0.10)]",
        "transition-all duration-500 ease-out",
        "hover:-translate-y-1.5 hover:border-primary/30",
        "hover:shadow-[0_1px_3px_rgba(0,0,0,0.04),0_24px_56px_-16px_rgba(0,0,0,0.18)]",
        // Layout
        isCompact ? "flex-row items-center gap-5 p-5" : "flex-col",
        // Border
        !cardBorderColor && "border-border/30",
      )}
      style={{
        backgroundColor: cardBgColor || undefined,
        borderColor: cardBorderColor || undefined,
      }}
    >
      {/* Top accent bar (cards layout only) */}
      {!isCompact && (
        <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary/30 to-transparent" />
      )}

      {/* Hover spotlight */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(ellipse at 30% 0%, oklch(0.45 0.12 160 / 0.06), transparent 60%)",
        }}
        aria-hidden="true"
      />

      {/* Avatar */}
      <div className={cn("relative", isCompact ? "shrink-0" : "flex justify-center px-7 pt-8")}>
        <MemberAvatar member={member} size={isCompact ? "sm" : "lg"} />
      </div>

      {/* Content */}
      <div
        className={cn(
          "relative flex min-w-0 flex-1 flex-col",
          isCompact ? "py-1" : "px-7 pb-7 pt-5",
          !isCompact && "items-center text-center",
        )}
      >
        {/* Name */}
        <h3
          onClick={(e) => handleEdit(e, `members.${index}.name`)}
          className={cn(
            "truncate text-lg font-semibold tracking-tight text-card-foreground",
            editable && blockId && onEditField && "cursor-pointer rounded px-1 hover:bg-primary/10",
          )}
          style={{ color: nameColor || undefined }}
        >
          {member.name}
        </h3>

        {/* Role */}
        {member.role && (
          <p
            onClick={(e) => handleEdit(e, `members.${index}.role`)}
            className={cn(
              "mt-1 truncate text-sm text-muted-foreground",
              editable && blockId && onEditField && "cursor-pointer rounded px-1 hover:bg-primary/10",
            )}
            style={{ color: roleColor || undefined }}
          >
            {member.role}
          </p>
        )}

        {/* Tags */}
        {member.tags && (
          (() => {
            const tagsArray = typeof member.tags === "string" 
              ? (member.tags as string).split(",").map((t) => t.trim()).filter(Boolean)
              : Array.isArray(member.tags) 
                ? member.tags as string[]
                : []
            
            return tagsArray.length > 0 ? (
              <div className={cn("mt-3 flex flex-wrap gap-1.5", !isCompact && "justify-center")}>
                {tagsArray.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border/50 bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null
          })()
        )}

        {/* Bio */}
        {member.bio && (
          <div className={cn("mt-4 w-full min-w-0", !isCompact && "text-left")}>
            <Bio
              text={member.bio}
              color={bioColor}
              editable={editable}
              onClick={(e) => handleEdit(e, `members.${index}.bio`)}
            />
          </div>
        )}

        {/* Socials */}
        {member.socials && member.socials.length > 0 && (
          <div className={cn("mt-4 flex items-center gap-2", !isCompact && "justify-center")}>
            {member.socials.map((social) => {
              const Icon = socialIconMap[social.type] || Globe
              const label = socialLabelMap[social.type] || social.type
              return (
                <a
                  key={social.type}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${label} von ${member.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 bg-muted/30 text-muted-foreground transition-all duration-200 hover:border-primary/40 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon className="h-4 w-4" />
                </a>
              )
            })}
          </div>
        )}

        {/* CTA */}
        {member.ctaText && (
          <div className={cn("mt-5", !isCompact && "w-full")}>
            <div className="border-t border-border/30 pt-4">
              {editable && blockId && onEditField ? (
                <button
                  type="button"
                  onClick={(e) => handleEdit(e, `members.${index}.ctaText`)}
                  className="group/cta inline-flex cursor-pointer items-center gap-2 rounded px-1 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                  style={{ color: ctaColor || undefined }}
                >
                  {member.ctaText}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
                </button>
              ) : (
                <a
                  href={member.ctaHref || "#"}
                  className="group/cta inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                  style={{ color: ctaColor || undefined }}
                >
                  {member.ctaText}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-1" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

export function TeamGridBlock({
  blockId,
  editable = false,
  onEditField,
  section,
  headline,
  subheadline,
  eyebrow,
  columns = 3,
  layout = "cards",
  background = "none",
  members,
  headlineColor,
  subheadlineColor,
  eyebrowColor,
  nameColor,
  roleColor,
  bioColor,
  ctaColor,
  cardBgColor,
  cardBorderColor,
  containerBackgroundMode,
  containerBackgroundColor,
  containerBackgroundGradientPreset,
  containerBackgroundGradient,
  containerShadow,
}: TeamGridBlockProps) {
  const sectionBg = resolveSectionBg(section)
  const containerBg = resolveContainerBg({
    mode: containerBackgroundMode,
    color: containerBackgroundColor,
    gradientPreset: containerBackgroundGradientPreset,
    gradient: containerBackgroundGradient,
  })
  const containerShadowCss = resolveBoxShadow(containerShadow)
  const handleInlineEdit = useCallback(
    (e: React.MouseEvent, fieldPath: string) => {
      if (!editable || !blockId || !onEditField) return
      e.preventDefault()
      e.stopPropagation()
      onEditField(
        blockId,
        fieldPath,
        (e.currentTarget as HTMLElement).getBoundingClientRect(),
      )
    },
    [editable, blockId, onEditField],
  )

  return (
    <section
      className={cn(
        "relative overflow-x-hidden py-20 md:py-28",
        sectionBg.className
      )}
      style={sectionBg.style}
      aria-label={headline || "Team"}
    >
      {/* Inner Container Panel (Header + Grid) */}
      <div
        className={cn(
          "relative mx-auto max-w-6xl rounded-3xl p-6 md:p-10",
          containerBackgroundMode && containerBackgroundMode !== "transparent" && "border border-border/20",
          containerBackgroundMode === "gradient" && "backdrop-blur-sm"
        )}
        style={{
          ...containerBg.style,
          ...(containerShadowCss ? { boxShadow: containerShadowCss } : {}),
        }}
      >
        {/* Content Wrapper */}
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* ---- Header ---- */}
        {(eyebrow || headline || subheadline) && (
          <header className="mb-16 text-center">
            {/* Eyebrow */}
            {eyebrow && (
              <div className="mb-5 flex items-center justify-center gap-4">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/40" />
                <span
                  onClick={(e) => handleInlineEdit(e, "eyebrow")}
                  className={cn(
                    "text-xs font-semibold uppercase tracking-[0.2em] text-primary",
                    editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                  )}
                  style={eyebrowColor ? { color: eyebrowColor } : undefined}
                >
                  {eyebrow}
                </span>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/40" />
              </div>
            )}

            {/* Headline */}
            {headline && (
              <h2
                onClick={(e) => handleInlineEdit(e, "headline")}
                className={cn(
                  "mx-auto max-w-3xl text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl",
                  editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                )}
                style={headlineColor ? { color: headlineColor } : undefined}
              >
                {headline}
              </h2>
            )}

            {/* Subheadline */}
            {subheadline && (
              <p
                onClick={(e) => handleInlineEdit(e, "subheadline")}
                className={cn(
                  "mx-auto mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg",
                  editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                )}
                style={subheadlineColor ? { color: subheadlineColor } : undefined}
              >
                {subheadline}
              </p>
            )}
          </header>
        )}

        {/* ---- Grid ---- */}
        <div
          className={cn("grid gap-6 lg:gap-8", columnsMap[columns])}
        >
          {members.map((member, index) => (
            <MemberCard
              key={member.id}
              member={member}
              index={index}
              layout={layout}
              nameColor={nameColor}
              roleColor={roleColor}
              bioColor={bioColor}
              ctaColor={ctaColor}
              cardBgColor={cardBgColor}
              cardBorderColor={cardBorderColor}
              editable={editable}
              blockId={blockId}
              onEditField={onEditField}
            />
          ))}
        </div>
      </div>
      </div>
    </section>
  )
}
