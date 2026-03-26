"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Calendar, Clock, MapPin, User } from "lucide-react"
import { resolveSectionBg } from "@/lib/theme/resolveSectionBg"
import { resolveContainerBg } from "@/lib/theme/resolveContainerBg"
import { resolveBoxShadow } from "@/lib/shadow/resolveBoxShadow"
import { mergeTypographyClasses } from "@/lib/typography"
import type { BlockSectionProps, ElementShadow, CourseSlot, ElementConfig } from "@/types/cms"
import type { GradientPresetValue } from "@/lib/theme/gradientPresets"
import { AnimatedBlock } from "@/components/blocks/AnimatedBlock"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type Weekday = "Montag" | "Dienstag" | "Mittwoch" | "Donnerstag" | "Freitag" | "Samstag" | "Sonntag"
export type { CourseSlot }

const ALL_WEEKDAYS: Weekday[] = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]

function getWeekdays(hideWeekend: boolean): Weekday[] {
  return hideWeekend ? ALL_WEEKDAYS.slice(0, 5) : ALL_WEEKDAYS
}

const CONTAINER_ELEMENT_ID = "courseSchedule.container"

export interface CourseScheduleBlockProps {
  blockId?: string
  editable?: boolean
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
  elements?: Record<string, ElementConfig>
  section?: BlockSectionProps
  typography?: Record<string, unknown>

  mode: "calendar" | "timeline"
  eyebrow?: string
  headline?: string
  subheadline?: string
  eyebrowColor?: string
  headlineColor?: string
  subheadlineColor?: string
  slots: CourseSlot[]
  hideWeekend?: boolean

  containerBackgroundMode?: "transparent" | "color" | "gradient"
  containerBackgroundColor?: string
  containerBackgroundGradientPreset?: GradientPresetValue
  containerGradientFrom?: string
  containerGradientVia?: string
  containerGradientTo?: string
  containerGradientAngle?: number
  containerShadow?: ElementShadow
  containerBorder?: boolean
  /** Admin Live-Preview: Slots klickbar, öffnen zugehörige Inspector-Card */
  interactivePreview?: boolean
  activeSlotId?: string | null
  onSlotSelect?: (slotId: string) => void
}

/* ------------------------------------------------------------------ */
/*  SlotCard                                                           */
/* ------------------------------------------------------------------ */

function SlotCard({
  slot,
  compact = false,
  interactive = false,
  isActive = false,
  onSlotSelect,
}: {
  slot: CourseSlot
  compact?: boolean
  interactive?: boolean
  isActive?: boolean
  onSlotSelect?: (slotId: string) => void
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!interactive || !onSlotSelect) return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onSlotSelect(slot.id)
    }
  }

  const content = (
    <>
      {/* Highlight indicator */}
      {slot.highlight && (
        <div
          className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-primary/60 via-accent/40 to-transparent"
          aria-hidden="true"
        />
      )}

      {/* Title */}
      <h4
        className={cn(
          "font-medium text-foreground",
          compact ? "text-sm" : "text-base"
        )}
      >
        {slot.title}
      </h4>

      {/* Time */}
      <div
        className={cn(
          "mt-1.5 flex items-center gap-1.5 text-muted-foreground",
          compact ? "text-xs" : "text-sm"
        )}
      >
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <time className="tabular-nums">
          {slot.startTime} – {slot.endTime}
        </time>
      </div>

      {/* Instructor */}
      {slot.instructor && (
        <div
          className={cn(
            "mt-1 flex items-center gap-1.5 text-muted-foreground",
            compact ? "text-xs" : "text-sm"
          )}
        >
          <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{slot.instructor}</span>
        </div>
      )}

      {/* Location */}
      {slot.location && (
        <div
          className={cn(
            "mt-1 flex items-center gap-1.5 text-muted-foreground",
            compact ? "text-xs" : "text-sm"
          )}
        >
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{slot.location}</span>
        </div>
      )}
    </>
  )

  const className = cn(
    "group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-300",
    slot.highlight
      ? "border-primary/30 bg-primary/4"
      : "border-border/50 bg-card/80 backdrop-blur-sm",
    "hover:border-primary/20 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.1)]",
    "hover:-translate-y-0.5",
    compact ? "p-3" : "p-4",
    interactive && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    isActive && "ring-2 ring-primary ring-offset-2"
  )

  if (interactive && onSlotSelect) {
    return (
      <article
        data-repeater-field="slots"
        data-repeater-item-id={slot.id}
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation()
          onSlotSelect(slot.id)
        }}
        onKeyDown={handleKeyDown}
        className={className}
        aria-label={`Kurs ${slot.title}, ${slot.weekday} ${slot.startTime}–${slot.endTime}`}
      >
        {content}
      </article>
    )
  }

  return (
    <article data-repeater-field="slots" data-repeater-item-id={slot.id} className={className}>
      {content}
    </article>
  )
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function groupByWeekday(slots: CourseSlot[], weekdaysToShow: Weekday[]): Record<Weekday, CourseSlot[]> {
  const grouped = {} as Record<Weekday, CourseSlot[]>
  for (const day of weekdaysToShow) {
    grouped[day] = []
  }
  for (const slot of slots) {
    if (grouped[slot.weekday]) {
      grouped[slot.weekday].push(slot)
    }
  }
  for (const day of weekdaysToShow) {
    grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime))
  }
  return grouped
}

function sortSlots(slots: CourseSlot[], weekdaysToShow: Weekday[]): CourseSlot[] {
  const dayIndex = (w: Weekday) => weekdaysToShow.indexOf(w)
  return [...slots]
    .filter((s) => weekdaysToShow.includes(s.weekday))
    .sort((a, b) => {
      const dayDiff = dayIndex(a.weekday) - dayIndex(b.weekday)
      if (dayDiff !== 0) return dayDiff
      return a.startTime.localeCompare(b.startTime)
    })
}

/* ------------------------------------------------------------------ */
/*  Calendar View                                                      */
/* ------------------------------------------------------------------ */

function CalendarView({
  slots,
  hideWeekend = false,
  interactivePreview = false,
  activeSlotId = null,
  onSlotSelect,
}: {
  slots: CourseSlot[]
  hideWeekend?: boolean
  interactivePreview?: boolean
  activeSlotId?: string | null
  onSlotSelect?: (slotId: string) => void
}) {
  const weekdaysToShow = getWeekdays(hideWeekend)
  const grouped = groupByWeekday(slots, weekdaysToShow)
  const gridCols = hideWeekend ? "md:grid-cols-5" : "md:grid-cols-7"

  return (
    <div
      className={`grid gap-4 ${gridCols}`}
      role="grid"
      aria-label="Wochenkalender der Kurse"
    >
      {weekdaysToShow.map((day) => {
        const daySlots = grouped[day]
        const hasSlots = daySlots.length > 0

        return (
          <div
            key={day}
            role="gridcell"
            className="flex flex-col"
          >
            {/* Day header */}
            <div
              className={cn(
                "mb-3 rounded-lg px-3 py-2 text-center text-sm font-medium",
                hasSlots
                  ? "bg-primary/8 text-foreground"
                  : "bg-muted/50 text-muted-foreground"
              )}
            >
              <span className="md:hidden">{day.slice(0, 2)}</span>
              <span className="hidden md:inline">{day}</span>
            </div>

            {/* Slots */}
            <div className="flex flex-1 flex-col gap-2">
              {hasSlots ? (
                daySlots.map((slot) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    compact
                    interactive={interactivePreview}
                    isActive={activeSlotId === slot.id}
                    onSlotSelect={onSlotSelect}
                  />
                ))
              ) : (
                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/40 py-6 text-xs text-muted-foreground/60">
                  <span className="hidden md:inline">Keine Kurse</span>
                  <span className="md:hidden">—</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Timeline View                                                      */
/* ------------------------------------------------------------------ */

function TimelineView({
  slots,
  hideWeekend = false,
  interactivePreview = false,
  activeSlotId = null,
  onSlotSelect,
}: {
  slots: CourseSlot[]
  hideWeekend?: boolean
  interactivePreview?: boolean
  activeSlotId?: string | null
  onSlotSelect?: (slotId: string) => void
}) {
  const weekdaysToShow = getWeekdays(hideWeekend)
  const sorted = sortSlots(slots, weekdaysToShow)

  return (
    <div
      className="relative pl-6 md:pl-8"
      role="list"
      aria-label="Kursübersicht als Timeline"
    >
      {/* Vertical line */}
      <div
        className="absolute left-2 top-0 h-full w-px bg-linear-to-b from-primary/30 via-border to-border/30 md:left-3"
        aria-hidden="true"
      />

      {sorted.map((slot, index) => {
        const prevSlot = sorted[index - 1]
        const showDayLabel = !prevSlot || prevSlot.weekday !== slot.weekday

        return (
          <div
            key={slot.id}
            role="listitem"
            className={cn(
              "relative pb-6 last:pb-0",
              "animate-in fade-in slide-in-from-left-4 duration-500",
            )}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            {/* Day label */}
            {showDayLabel && (
              <div className="mb-3 -ml-6 flex items-center gap-2 md:-ml-8">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground md:h-7 md:w-7">
                  <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5" aria-hidden="true" />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {slot.weekday}
                </span>
              </div>
            )}

            {/* Timeline marker */}
            <div
              className={cn(
                "absolute left-0 flex items-center justify-center md:left-1",
                slot.highlight ? "-ml-1.5 md:-ml-1.5" : "-ml-1 md:-ml-1"
              )}
              style={{ top: showDayLabel ? "2.75rem" : "0.5rem" }}
              aria-hidden="true"
            >
              <div
                className={cn(
                  "rounded-full border-2 border-background",
                  slot.highlight
                    ? "h-3.5 w-3.5 bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]"
                    : "h-2.5 w-2.5 bg-muted-foreground/40"
                )}
              />
            </div>

            {/* Content card */}
            <div
              className={cn(
                "ml-4 md:ml-6",
                slot.highlight && "scale-[1.02]"
              )}
            >
              <SlotCard
                slot={slot}
                interactive={interactivePreview}
                isActive={activeSlotId === slot.id}
                onSlotSelect={onSlotSelect}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function CourseScheduleBlock({
  blockId,
  editable = false,
  onEditField,
  onElementClick,
  selectedElementId,
  elements,
  section,
  typography,
  mode = "calendar",
  eyebrow,
  headline,
  subheadline,
  eyebrowColor,
  headlineColor,
  subheadlineColor,
  slots,
  hideWeekend = false,
  containerBackgroundMode,
  containerBackgroundColor,
  containerBackgroundGradientPreset,
  containerGradientFrom,
  containerGradientVia,
  containerGradientTo,
  containerGradientAngle,
  containerShadow,
  containerBorder,
  interactivePreview = false,
  activeSlotId = null,
  onSlotSelect,
}: CourseScheduleBlockProps) {
  const sectionBg = resolveSectionBg(section)
  const usesContainerPanel = containerBackgroundMode && containerBackgroundMode !== "transparent"
  const containerBg = resolveContainerBg({
    mode: containerBackgroundMode,
    color: containerBackgroundColor,
    gradientPreset: containerBackgroundGradientPreset,
    gradient: {
      from: containerGradientFrom || "",
      via: containerGradientVia || "",
      to: containerGradientTo || "",
      angle: containerGradientAngle ?? 135,
    },
  })
  // Prefer shadow from elements (inspector) over legacy containerShadow prop
  const containerElementConfig = elements?.[CONTAINER_ELEMENT_ID]
  const effectiveContainerShadow = containerElementConfig?.style?.shadow ?? containerShadow
  const containerShadowCss = resolveBoxShadow(effectiveContainerShadow)

  const handleInlineEdit = (e: React.MouseEvent, fieldPath: string) => {
    if (!editable || !blockId || !onEditField) return
    e.preventDefault()
    e.stopPropagation()
    onEditField(blockId, fieldPath, (e.currentTarget as HTMLElement).getBoundingClientRect())
  }

  return (
    <section
      className={cn(
        sectionBg.className
      )}
      style={sectionBg.style}
      aria-label={headline || "Kursplan"}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {(eyebrow || headline || subheadline) && (
          <header className="mb-10 text-center md:mb-12">
            {eyebrow && (
              <div className="mb-5 flex items-center justify-center gap-4">
                <div className="h-px w-12 bg-linear-to-r from-transparent to-primary/40" aria-hidden="true" />
                <span
                  onClick={(e) => handleInlineEdit(e, "eyebrow")}
                  className={cn(
                    mergeTypographyClasses(
                      "text-xs font-semibold uppercase tracking-[0.2em] text-primary",
                      (typography ?? {})["courseSchedule.eyebrow"] as Record<string, string> | undefined
                    ),
                    editable && blockId && onEditField && "cursor-pointer rounded px-1 hover:bg-primary/10"
                  )}
                  style={eyebrowColor ? { color: eyebrowColor } : undefined}
                >
                  {eyebrow}
                </span>
                <div className="h-px w-12 bg-linear-to-l from-transparent to-primary/40" aria-hidden="true" />
              </div>
            )}
            {headline && (
              <h2
                onClick={(e) => handleInlineEdit(e, "headline")}
                className={cn(
                  mergeTypographyClasses(
                    "text-2xl font-semibold tracking-tight text-foreground sm:text-3xl",
                    (typography ?? {})["courseSchedule.headline"] as Record<string, string> | undefined
                  ),
                  editable && blockId && onEditField && "cursor-pointer rounded px-1 hover:bg-primary/10"
                )}
                style={headlineColor ? { color: headlineColor } : undefined}
              >
                {headline}
              </h2>
            )}
            {subheadline && (
              <p
                onClick={(e) => handleInlineEdit(e, "subheadline")}
                className={cn(
                  mergeTypographyClasses(
                    "mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground",
                    (typography ?? {})["courseSchedule.subheadline"] as Record<string, string> | undefined
                  ),
                  editable && blockId && onEditField && "cursor-pointer rounded px-1 hover:bg-primary/10"
                )}
                style={subheadlineColor ? { color: subheadlineColor } : undefined}
              >
                {subheadline}
              </p>
            )}
          </header>
        )}

        {/* Content panel */}
        <AnimatedBlock config={section?.animation}>
          <div
            data-element-id={CONTAINER_ELEMENT_ID}
            role={editable && onElementClick ? "button" : undefined}
            tabIndex={editable && onElementClick ? 0 : undefined}
            onClick={
              editable && blockId && onElementClick
                ? () => onElementClick(blockId, CONTAINER_ELEMENT_ID)
                : undefined
            }
            className={cn(
              "rounded-2xl border border-border/60 bg-card/80 p-4 backdrop-blur-sm sm:p-6 md:p-8",
              "shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_32px_-12px_rgba(0,0,0,0.08)]",
              editable && onElementClick && "cursor-pointer transition-[box-shadow,outline] hover:outline-2 hover:outline-primary/30 hover:outline-offset-2",
              selectedElementId === CONTAINER_ELEMENT_ID && "outline-2 outline-primary outline-offset-2"
            )}
            style={{
              ...(usesContainerPanel ? containerBg.style : {}),
              ...(containerShadowCss ? { boxShadow: containerShadowCss } : {}),
            }}
          >
          {slots.length === 0 ? (
            <p className="text-center text-muted-foreground">Keine Kurse eingetragen.</p>
          ) : mode === "calendar" ? (
            <CalendarView
              slots={slots}
              hideWeekend={hideWeekend}
              interactivePreview={interactivePreview}
              activeSlotId={activeSlotId}
              onSlotSelect={onSlotSelect}
            />
          ) : (
            <TimelineView
              slots={slots}
              hideWeekend={hideWeekend}
              interactivePreview={interactivePreview}
              activeSlotId={activeSlotId}
              onSlotSelect={onSlotSelect}
            />
          )}
          </div>
        </AnimatedBlock>
      </div>
    </section>
  )
}
