"use client"

import { SelectContent, SelectItem } from "@/components/ui/select"
import { GRADIENT_PRESETS } from "@/lib/theme/gradientPresets"

/**
 * Reusable SelectContent for gradient preset dropdowns.
 * Use inside <Select> with GradientPresetSelectContent as children of Select.
 */
export function GradientPresetSelectContent() {
  return (
    <SelectContent>
      {GRADIENT_PRESETS.map((preset) => (
        <SelectItem key={preset.value} value={preset.value}>
          {preset.label}
        </SelectItem>
      ))}
    </SelectContent>
  )
}
