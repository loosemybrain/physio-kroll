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
    if (shadowConfig.preset === "glow") {
      // Parse color (hex or rgb/rgba), default if not provided
      let color = shadowConfig.color ?? "#3b82f6"
      let opacity = shadowConfig.opacity ?? 0.5
      let rgbaColor = ""

      // Helper function to convert hex to {r,g,b}
      const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
        // Remove leading #
        hex = hex.replace(/^#/, "")
        if (hex.length === 3) {
          return {
            r: parseInt(hex[0] + hex[0], 16),
            g: parseInt(hex[1] + hex[1], 16),
            b: parseInt(hex[2] + hex[2], 16),
          }
        } else if (hex.length === 6) {
          return {
            r: parseInt(hex.slice(0, 2), 16),
            g: parseInt(hex.slice(2, 4), 16),
            b: parseInt(hex.slice(4, 6), 16),
          }
        }
        return null
      }

      if (color.startsWith("rgba")) {
        // Replace alpha value at the end
        rgbaColor = color.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/, `rgba($1, $2, $3, ${opacity})`)
      } else if (color.startsWith("rgb")) {
        // Convert rgb to rgba and add opacity
        rgbaColor = color.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/, `rgba($1, $2, $3, ${opacity})`)
      } else {
        // Assume hex
        const rgb = hexToRgb(color)
        if (rgb) {
          rgbaColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`
        } else {
          // fallback (unparsable): use default
          rgbaColor = "rgba(59, 130, 246, 0.5)" // default for #3b82f6
        }
      }
      return `0 0 20px ${rgbaColor}`
    }

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
