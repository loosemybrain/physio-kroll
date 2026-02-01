import type { ElementShadow } from "@/types/cms"
import { getShadowPreset, isShadowPresetKey } from "./shadowPresets"

/**
 * Resolves a shadow configuration to a CSS box-shadow string
 * Returns undefined if shadow is disabled or not configured
 */
export function resolveBoxShadow(shadowConfig?: ElementShadow): string | undefined {
  // If no config or disabled, return undefined
  if (!shadowConfig || !shadowConfig.enabled) {
    return undefined
  }

  // If preset is selected and not "custom", use the preset
  if (shadowConfig.preset && shadowConfig.preset !== "custom") {
    if (isShadowPresetKey(shadowConfig.preset)) {
      return getShadowPreset(shadowConfig.preset)
    }
  }

  // If preset is "custom" or not specified, build custom shadow
  if (shadowConfig.preset === "custom" || (!shadowConfig.preset && shadowConfig.enabled)) {
    const x = shadowConfig.x ?? 0
    const y = shadowConfig.y ?? 4
    const blur = shadowConfig.blur ?? 6
    const spread = shadowConfig.spread ?? -1
    const color = shadowConfig.color ?? "rgba(0, 0, 0, 0.1)"
    const opacity = shadowConfig.opacity ?? 1

    // Parse color opacity if provided separately
    let finalColor = color
    if (opacity !== 1) {
      // If color is rgba, replace opacity; if hex, convert to rgba
      if (color.includes("rgba")) {
        finalColor = color.replace(/[\d.]+\)$/, `${opacity})`)
      } else if (color.includes("rgb")) {
        // Simple RGB, add opacity
        finalColor = color.replace(/\)$/, `, ${opacity})`)
      } else {
        // Assume it's a hex color, convert to rgba with opacity
        finalColor = `rgba(0, 0, 0, ${opacity})`
      }
    }

    const insetKeyword = shadowConfig.inset ? "inset " : ""
    return `${insetKeyword}${x}px ${y}px ${blur}px ${spread}px ${finalColor}`
  }

  return undefined
}
