"use client"

import { cn } from "@/lib/utils"
import { Calendar, Clock, MapPin, User } from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type Weekday =
  | "Montag"
  | "Dienstag"
  | "Mittwoch"
  | "Donnerstag"
  | "Freitag"
  | "Samstag"
  | "Sonntag"

export interface CourseSlot {
  id: string
  weekday: Weekday
  startTime: string
  endTime: string
  title: string
  instructor?: string
  location?: string
  highlight?: boolean
}

export interface CourseScheduleBlockProps {
  mode?: "calendar" | "timeline"
  headline?: string
  subheadline?: string
  slots: CourseSlot[]
  background?: "none" | "muted" | "gradient"
  headlineColor?: string
  subheadlineColor?: string
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const WEEKDAYS: Weekday[] = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
]

const backgroundMap: Record<
  NonNullable<CourseScheduleBlockProps["background"]>,
  string
> = {
  none: "",
  muted: "bg-muted/40",
  gradient: "bg-gradient-to-b from-primary/[0.03] via-background to-background",
}

function groupByWeekday(slots: CourseSlot[]): Record<Weekday, CourseSlot[]> {
  const grouped = {} as Record<Weekday, CourseSlot[]>
  for (const day of WEEKDAYS) {
    grouped[day] = []
  }
  for (const slot of slots) {
    if (grouped[slot.weekday]) {
      grouped[slot.weekday].push(slot)
    }
  }
  // Sort each day by start time
  for (const day of WEEKDAYS) {
    grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime))
  }
  return grouped
}

function sortSlots(slots: CourseSlot[]): CourseSlot[] {
  const dayIndex = (w: Weekday) => WEEKDAYS.indexOf(w)
  return [...slots].sort((a, b) => {
    const dayDiff = dayIndex(a.weekday) - dayIndex(b.weekday)
    if (dayDiff !== 0) return dayDiff
    return a.startTime.localeCompare(b.startTime)
  })
}

/* ------------------------------------------------------------------ */
/*  Slot Card (reused in both layouts)                                 */
/* ------------------------------------------------------------------ */

function SlotCard({
  slot,
  compact = false,
}: {
  slot: CourseSlot
  compact?: boolean
}) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-300",
        slot.highlight
          ? "border-primary/30 bg-primary/4"
          : "border-border/50 bg-card/80 backdrop-blur-sm",
        "hover:border-primary/20 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.1)]",
        "hover:-translate-y-0.5",
        compact ? "p-3" : "p-4"
      )}
    >
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
    </article>
  )
}

/* ------------------------------------------------------------------ */
/*  Calendar View                                                      */
/* ------------------------------------------------------------------ */

function CalendarView({ slots }: { slots: CourseSlot[] }) {
  const grouped = groupByWeekday(slots)

  return (
    <div
      className="grid gap-4 md:grid-cols-7"
      role="grid"
      aria-label="Wochenkalender der Kurse"
    >
      {WEEKDAYS.map((day) => {
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
                  <SlotCard key={slot.id} slot={slot} compact />
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

function TimelineView({ slots }: { slots: CourseSlot[] }) {
  const sorted = sortSlots(slots)

  // Group sorted slots by weekday for labels
  let lastDay: Weekday | null = null

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
        const showDayLabel = slot.weekday !== lastDay
        lastDay = slot.weekday

        return (
          <div
            key={slot.id}
            role="listitem"
            className={cn(
              "relative pb-6 last:pb-0",
              // Staggered entrance animation
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
              <SlotCard slot={slot} />
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
  mode = "calendar",
  headline,
  subheadline,
  slots,
  background = "none",
  headlineColor,
  subheadlineColor,
}: CourseScheduleBlockProps) {
  return (
    <section
      className={cn("py-16 md:py-20", backgroundMap[background])}
      aria-label={headline || "Kursplan"}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {(headline || subheadline) && (
          <header className="mb-10 text-center md:mb-12">
            {headline && (
              <h2
                className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
                style={headlineColor ? { color: headlineColor } : undefined}
              >
                {headline}
              </h2>
            )}
            {subheadline && (
              <p
                className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground"
                style={subheadlineColor ? { color: subheadlineColor } : undefined}
              >
                {subheadline}
              </p>
            )}
          </header>
        )}

        {/* Content panel */}
        <div
          className={cn(
            "overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-4 backdrop-blur-sm sm:p-6 md:p-8",
            "shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_32px_-12px_rgba(0,0,0,0.08)]"
          )}
        >
          {mode === "calendar" ? (
            <CalendarView slots={slots} />
          ) : (
            <TimelineView slots={slots} />
          )}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Default Export with Example Data                                   */
/* ------------------------------------------------------------------ */

export const EXAMPLE_SLOTS: CourseSlot[] = [
  {
    id: "1",
    weekday: "Montag",
    startTime: "09:00",
    endTime: "10:00",
    title: "Rückenfit",
    instructor: "Dr. Müller",
    location: "Raum 1",
    highlight: true,
  },
  {
    id: "2",
    weekday: "Montag",
    startTime: "17:00",
    endTime: "18:00",
    title: "Yoga Basics",
    instructor: "Lisa Berger",
    location: "Studio A",
  },
  {
    id: "3",
    weekday: "Dienstag",
    startTime: "10:00",
    endTime: "11:00",
    title: "Pilates",
    instructor: "Anna Schmidt",
    location: "Raum 2",
  },
  {
    id: "4",
    weekday: "Mittwoch",
    startTime: "08:30",
    endTime: "09:30",
    title: "Aqua-Gymnastik",
    instructor: "Thomas Weber",
    location: "Schwimmbad",
    highlight: true,
  },
  {
    id: "5",
    weekday: "Donnerstag",
    startTime: "16:00",
    endTime: "17:00",
    title: "Funktionstraining",
    instructor: "Max Hoffmann",
    location: "Trainingsbereich",
  },
  {
    id: "6",
    weekday: "Freitag",
    startTime: "11:00",
    endTime: "12:00",
    title: "Sturzprävention",
    instructor: "Dr. Müller",
    location: "Raum 1",
  },
  {
    id: "7",
    weekday: "Samstag",
    startTime: "10:00",
    endTime: "11:30",
    title: "Nordic Walking",
    instructor: "Lisa Berger",
    location: "Treffpunkt Eingang",
  },
]

export default CourseScheduleBlock
