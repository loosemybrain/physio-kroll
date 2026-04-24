"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { CMSBlock } from "@/types/cms"
import { createTeamMember } from "@/cms/blocks/registry"
import { getByPath } from "@/lib/cms/editorPathOps"
import { UniversalRepeaterInspector } from "../repeater/UniversalRepeaterInspector"
import type { InspectorFieldType } from "@/cms/blocks/registry"

type RepeaterEditorActions = {
  handleAddArrayItem: (blockId: string, arrayPath: string, createItem: () => unknown) => void
  handleMoveArrayItem: (blockId: string, arrayPath: string, from: number, to: number) => void
}

export interface PageEditorInspectorSectionProps {
  selectedBlock: CMSBlock
  selectedBlockId: string | null
  expandedRepeaterCards: Record<string, string | null>
  setExpandedRepeaterCards: React.Dispatch<React.SetStateAction<Record<string, string | null>>>
  updateSelectedProps: (nextProps: CMSBlock["props"]) => void
  editorActions: RepeaterEditorActions
  handleRemoveArrayItem: (blockId: string, arrayPath: string, index: number) => void
  lastAddedRepeaterRef: React.MutableRefObject<{ key: string; itemId: string } | null>
  renderOneRepeaterItemFields: (
    block: CMSBlock,
    arrayPath: string,
    index: number,
    item: Record<string, unknown>,
    itemFields: Array<{ key: string; label: string; type: InspectorFieldType; placeholder?: string; required?: boolean; options?: Array<{ value: string; label: string }> }>
  ) => React.ReactNode
}

const TeamInspectorSectionContent = React.memo(
  ({
    selectedBlock,
    expandedRepeaterCards,
    setExpandedRepeaterCards,
    updateSelectedProps,
    editorActions,
    handleRemoveArrayItem,
    lastAddedRepeaterRef,
    renderOneRepeaterItemFields,
  }: PageEditorInspectorSectionProps) => {
    const handleColumnsChange = (v: string) => {
      if (!selectedBlock) return
      const currentProps = selectedBlock.props as Record<string, unknown>
      const updatedProps = { ...currentProps, columns: Number(v) } as CMSBlock["props"]
      updateSelectedProps(updatedProps)
    }

    const props = selectedBlock.props as Record<string, unknown>
    const members = ((getByPath(props, "members") as Array<{ id: string; name?: string }>) || [])
    const repeaterKey = `${selectedBlock.id}:members`
    const expandedId = expandedRepeaterCards[repeaterKey] ?? null
    const updateMembers = (next: typeof members) => updateSelectedProps({ ...props, members: next } as CMSBlock["props"])
    const addItem = () => {
      const newItem = createTeamMember()
      updateMembers([...members, newItem])
      setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: newItem.id }))
      lastAddedRepeaterRef.current = { key: repeaterKey, itemId: newItem.id }
    }
    const memberFields = [
      { key: "name", label: "Name", type: "text" as const, required: true },
      { key: "role", label: "Rolle", type: "text" as const, required: true },
      { key: "bio", label: "Bio (optional)", type: "textarea" as const },
      { key: "imageUrl", label: "Profilbild", type: "image" as const, required: true },
      { key: "imageAlt", label: "Bildbeschreibung", type: "text" as const, required: true },
      { key: "avatarGradient", label: "Avatar Gradient", type: "select" as const, options: [{ value: "auto", label: "Auto" }, { value: "g1", label: "Primary" }, { value: "g2", label: "Accent" }, { value: "g3", label: "Chart 1" }, { value: "g4", label: "Chart 2" }, { value: "g5", label: "Chart 3" }, { value: "g6", label: "Blue" }, { value: "g7", label: "Purple" }, { value: "g8", label: "Green" }, { value: "g9", label: "Rose" }, { value: "g10", label: "Amber" }] },
      { key: "nameColor", label: "Name Farbe (optional)", type: "color" as const, placeholder: "#111111" },
      { key: "roleColor", label: "Rolle Farbe (optional)", type: "color" as const, placeholder: "#666666" },
      { key: "cardBgColor", label: "Card Hintergrund (optional)", type: "color" as const, placeholder: "#ffffff" },
      { key: "cardBorderColor", label: "Card Border (optional)", type: "color" as const, placeholder: "#e5e7eb" },
      { key: "ctaText", label: "CTA Text (optional)", type: "text" as const },
      { key: "ctaHref", label: "CTA Link (optional)", type: "url" as const },
      { key: "ctaColor", label: "CTA Farbe (optional)", type: "color" as const, placeholder: "#111111" },
    ]

    return (
      <>
        <Separator />

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Spalten</Label>
            <Select
              value={String((selectedBlock.props as Record<string, unknown>)?.columns || 3)}
              onValueChange={handleColumnsChange}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <UniversalRepeaterInspector
          items={members}
          getItemId={(m) => m.id}
          renderSummary={(member) => <span className="truncate">{(member as Record<string, unknown>).name as string || "Team Member"}</span>}
          renderContent={(member, index) => renderOneRepeaterItemFields(selectedBlock, "members", index, member as Record<string, unknown>, memberFields)}
          expandedId={expandedId}
          onToggle={(id) => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: expandedId === id ? null : id }))}
          onCollapseAll={() => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: null }))}
          countLabel={`${members.length} Members`}
          addLabel="Team Member hinzufügen"
          onAdd={addItem}
          onMove={(from, to) => editorActions.handleMoveArrayItem(selectedBlock.id, "members", from, to)}
          onRemove={(itemId) => handleRemoveArrayItem(selectedBlock.id, "members", members.findIndex((m) => m.id === itemId))}
          minItems={1}
          maxItems={12}
        />
      </>
    )
  }
)

TeamInspectorSectionContent.displayName = "TeamInspectorSection"

export function TeamInspectorSection(props: PageEditorInspectorSectionProps) {
  return <TeamInspectorSectionContent {...props} />
}
