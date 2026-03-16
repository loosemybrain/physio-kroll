"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { CMSBlock, CourseScheduleBlock, CourseSlot, CourseScheduleWeekday } from "@/types/cms"
import { createCourseSlot } from "@/cms/blocks/registry"
import { getByPath } from "@/lib/cms/editorPathOps"
import { UniversalRepeaterInspector } from "../repeater/UniversalRepeaterInspector"

export interface PageEditorInspectorSectionProps {
  selectedBlock: CMSBlock
  selectedBlockId: string | null
  expandedRepeaterCards: Record<string, string | null>
  setExpandedRepeaterCards: React.Dispatch<React.SetStateAction<Record<string, string | null>>>
  updateSelectedProps: (nextProps: CMSBlock["props"]) => void
  lastAddedRepeaterRef: React.MutableRefObject<{ key: string; itemId: string } | null>
}

const CourseScheduleInspectorSectionContent = React.memo(
  ({
    selectedBlock,
    expandedRepeaterCards,
    setExpandedRepeaterCards,
    updateSelectedProps,
    lastAddedRepeaterRef,
  }: PageEditorInspectorSectionProps) => {
    const props = selectedBlock.props as CourseScheduleBlock["props"]
    const slots: CourseSlot[] = props.slots ?? []
    const weekdays: CourseScheduleWeekday[] = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
    const repeaterKey = `${selectedBlock.id}:slots`
    const expandedSlotId = expandedRepeaterCards[repeaterKey] ?? null
    const updateSlots = (nextSlots: CourseSlot[]) => updateSelectedProps({ ...props, slots: nextSlots } as CMSBlock["props"])
    const updateSlot = (slotId: string, patch: Partial<CourseSlot>) => {
      const idx = slots.findIndex((s) => s.id === slotId)
      if (idx === -1) return
      const next = [...slots]
      next[idx] = { ...next[idx], ...patch }
      updateSlots(next)
    }
    const removeSlot = (slotId: string) => {
      const next = slots.filter((s) => s.id !== slotId)
      if (expandedSlotId === slotId) {
        setExpandedRepeaterCards((prev) => ({ ...prev, [repeaterKey]: null }))
      }
      updateSlots(next)
    }
    const addSlot = () => {
      const newSlot = createCourseSlot()
      updateSlots([...slots, newSlot])
      setExpandedRepeaterCards((prev) => ({ ...prev, [repeaterKey]: newSlot.id }))
      lastAddedRepeaterRef.current = { key: repeaterKey, itemId: newSlot.id }
    }
    const toggleSlot = (slotId: string) => {
      setExpandedRepeaterCards((prev) => ({
        ...prev,
        [repeaterKey]: expandedSlotId === slotId ? null : slotId,
      }))
    }

    return (
      <>
        <Separator />
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Anzeige</Label>
            <Select
              value={props.mode ?? "calendar"}
              onValueChange={(v: "calendar" | "timeline") => {
                if (!selectedBlock) return
                updateSelectedProps({ ...props, mode: v } as CMSBlock["props"])
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calendar">Kalender</SelectItem>
                <SelectItem value="timeline">Timeline</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Wochenende verstecken</Label>
            <button
              type="button"
              onClick={() => {
                if (!selectedBlock) return
                updateSelectedProps({ ...props, hideWeekend: !props.hideWeekend } as CMSBlock["props"])
              }}
              className={cn(
                "h-6 w-11 rounded-full border border-border transition-colors",
                props.hideWeekend ? "bg-primary" : "bg-muted"
              )}
            >
              <div
                className={cn(
                  "h-5 w-5 rounded-full bg-white transition-transform",
                  props.hideWeekend ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Überschrift</Label>
            <Input
              value={props.headline ?? ""}
              onChange={(e) => updateSelectedProps({ ...props, headline: e.target.value } as CMSBlock["props"])}
              className="h-8 text-sm"
              placeholder="Kursplan"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Untertitel (optional)</Label>
            <Textarea
              value={props.subheadline ?? ""}
              onChange={(e) => updateSelectedProps({ ...props, subheadline: e.target.value } as CMSBlock["props"])}
              className="min-h-[60px] text-sm"
              placeholder="Optionaler Hinweistext"
            />
          </div>
        </div>
        <Separator />
        <UniversalRepeaterInspector<CourseSlot>
          items={slots}
          getItemId={(s) => s.id}
          renderSummary={(slot) => (
            <div className="flex items-center gap-2 min-w-0 w-full">
              <span className="truncate text-sm font-medium">{slot.title || "Neuer Kurs"}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {slot.weekday} {slot.startTime}–{slot.endTime}
              </span>
            </div>
          )}
          renderContent={(slot) => (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Wochentag</Label>
                <Select
                  value={slot.weekday}
                  onValueChange={(v) => updateSlot(slot.id, { weekday: v as CourseScheduleWeekday })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {weekdays.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Start</Label>
                  <Input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateSlot(slot.id, { startTime: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Ende</Label>
                  <Input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateSlot(slot.id, { endTime: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Titel</Label>
                <Input
                  value={slot.title}
                  onChange={(e) => updateSlot(slot.id, { title: e.target.value })}
                  className="h-8 text-sm"
                  placeholder="Kursname"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Referent/in (optional)</Label>
                <Input
                  value={slot.instructor ?? ""}
                  onChange={(e) => updateSlot(slot.id, { instructor: e.target.value })}
                  className="h-8 text-sm"
                  placeholder="Name"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ort (optional)</Label>
                <Input
                  value={slot.location ?? ""}
                  onChange={(e) => updateSlot(slot.id, { location: e.target.value })}
                  className="h-8 text-sm"
                  placeholder="Raum / Adresse"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`slot-highlight-${slot.id}`}
                  checked={!!slot.highlight}
                  onCheckedChange={(checked) => updateSlot(slot.id, { highlight: !!checked })}
                />
                <Label htmlFor={`slot-highlight-${slot.id}`} className="text-xs cursor-pointer">Hervorheben</Label>
              </div>
            </>
          )}
          expandedId={expandedSlotId}
          onToggle={toggleSlot}
          onCollapseAll={() => setExpandedRepeaterCards((prev) => ({ ...prev, [repeaterKey]: null }))}
          countLabel={`${slots.length} Kurse`}
          addLabel="Slot hinzufügen"
          onAdd={addSlot}
          onMove={() => {}}
          onRemove={(itemId) => removeSlot(itemId)}
          emptyState={<p className="text-xs text-muted-foreground py-2">Keine Kurse. Slot hinzufügen.</p>}
          showMoveButtons={false}
        />
      </>
    )
  }
)

CourseScheduleInspectorSectionContent.displayName = "CourseScheduleInspectorSection"

export function CourseScheduleInspectorSection(props: PageEditorInspectorSectionProps) {
  return <CourseScheduleInspectorSectionContent {...props} />
}
