"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { BlockSectionProps, SectionBackground, SectionLayout } from "@/types/cms"
import { BackgroundInspectorSection } from "./BackgroundInspectorSection"
import type { BrandKey } from "@/components/brand/brandAssets"
import { SectionPresetsPicker } from "./SectionPresetsPicker"
import type { SectionBackgroundPreset } from "@/types/cms"
import { Button } from "@/components/ui/button"

function defaultSection(): BlockSectionProps {
  return {
    layout: {
      width: "contained",
      paddingY: "lg",
      paddingX: undefined,
      minHeight: "auto",
    },
    background: {
      type: "none",
      parallax: false,
    },
  }
}

export function SectionInspectorSection(props: {
  brand: BrandKey
  section: BlockSectionProps | undefined
  onChange: (next: BlockSectionProps) => void
  onApplyPreset?: (next: BlockSectionProps) => void
  onApplyPresetBackgroundOnly?: (next: BlockSectionProps) => void
}) {
  const current = props.section ?? defaultSection()
  const layout: SectionLayout = current.layout ?? defaultSection().layout
  const background: SectionBackground = current.background ?? defaultSection().background

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Section</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => {
            const next = defaultSection()
            if (props.onApplyPreset) props.onApplyPreset(next)
            else props.onChange(next)
          }}
        >
          Standard wiederherstellen
        </Button>
      </div>

      <Separator />

      <SectionPresetsPicker
        brand={props.brand}
        currentSection={current}
        onApply={(next) => (props.onApplyPreset ? props.onApplyPreset(next) : props.onChange(next))}
        onApplyBackgroundOnly={(next) =>
          props.onApplyPresetBackgroundOnly ? props.onApplyPresetBackgroundOnly(next) : props.onChange(next)
        }
        onSaveCurrentAsPreset={async (name, description) => {
          const listRes = await fetch(
            `/api/admin/section-presets?brand=${encodeURIComponent(props.brand)}`,
            { cache: "no-store" }
          )
          if (!listRes.ok) throw new Error("Presets konnten nicht geladen werden")
          const data = (await listRes.json()) as { presets?: SectionBackgroundPreset[] }
          const nextPreset: SectionBackgroundPreset = {
            id: `p-${Date.now()}`,
            name,
            description,
            section: JSON.parse(JSON.stringify(current)) as BlockSectionProps,
          }
          const nextPresets = [...(data.presets ?? []), nextPreset]
          const saveRes = await fetch("/api/admin/section-presets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ brand: props.brand, presets: nextPresets }),
          })
          if (!saveRes.ok) {
            const err = await saveRes.json().catch(() => ({}))
            throw new Error(err?.error || "Preset konnte nicht gespeichert werden")
          }
        }}
      />

      <Separator />

      {/* Layout */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold">Layout</Label>

        <div className="space-y-1.5">
          <Label className="text-xs">Breite</Label>
          <Select
            value={layout.width}
            onValueChange={(v) =>
              props.onChange({
                ...current,
                layout: { ...layout, width: v as SectionLayout["width"] },
              })
            }
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contained">Contained</SelectItem>
              <SelectItem value="full">Full Background</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Padding Y</Label>
          <Select
            value={layout.paddingY}
            onValueChange={(v) =>
              props.onChange({
                ...current,
                layout: { ...layout, paddingY: v as SectionLayout["paddingY"] },
              })
            }
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="sm">SM</SelectItem>
              <SelectItem value="md">MD</SelectItem>
              <SelectItem value="lg">LG</SelectItem>
              <SelectItem value="xl">XL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Min Height</Label>
          <Select
            value={layout.minHeight ?? "auto"}
            onValueChange={(v) =>
              props.onChange({
                ...current,
                layout: { ...layout, minHeight: v as SectionLayout["minHeight"] },
              })
            }
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              <SelectItem value="sm">SM</SelectItem>
              <SelectItem value="md">MD</SelectItem>
              <SelectItem value="lg">LG</SelectItem>
              <SelectItem value="screen">Screen</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Background */}
      <BackgroundInspectorSection
        background={background}
        onChange={(nextBg) =>
          props.onChange({
            ...current,
            background: nextBg,
          })
        }
      />
    </div>
  )
}

