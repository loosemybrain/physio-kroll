/**
 * Resolves inner container background props to className + styles
 * For panel backgrounds (behind content, inside section)
 */
export function resolveContainerBg(props?: {
  mode?: "transparent" | "color" | "gradient"
  color?: string
  gradientPreset?: "soft" | "aurora" | "ocean" | "sunset" | "hero" | "none"
  gradient?: {
    from?: string
    via?: string
    to?: string
    angle?: number
  }
}): { className: string; style?: React.CSSProperties } {
  if (!props || props.mode === "transparent" || !props.mode) {
    return {
      className: "",
      style: undefined,
    }
  }

  if (props.mode === "color" && props.color) {
    return {
      className: "",
      style: {
        backgroundColor: props.color,
      },
    }
  }

  if (props.mode === "gradient") {
    // Predefined gradients
    const gradients: Record<string, string> = {
      soft: "linear-gradient(135deg, rgba(var(--primary), 0.03), rgba(var(--primary), 0.01))",
      aurora: "linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05))",
      ocean: "linear-gradient(135deg, rgba(6, 182, 212, 0.05), rgba(59, 130, 246, 0.05))",
      sunset: "linear-gradient(135deg, rgba(249, 115, 22, 0.05), rgba(236, 72, 153, 0.05))",
      hero: "linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(59, 130, 246, 0.08))",
      none: "none",
    }

    let bgImage = gradients[props.gradientPreset || "soft"] || gradients.soft

    // Custom gradient stops override preset
    if (props.gradient) {
      const from = props.gradient.from?.trim()
      const via = props.gradient.via?.trim()
      const to = props.gradient.to?.trim()
      const angle = typeof props.gradient.angle === "number" && props.gradient.angle >= 0 && props.gradient.angle <= 360 
        ? props.gradient.angle 
        : 135

      // If ANY custom stop is set, build custom gradient
      if (from || via || to) {
        // Build gradient with from/via/to, using preset defaults as fallback
        const presetDefault = gradients[props.gradientPreset || "soft"] || gradients.soft
        
        // Extract fallback colors from preset if needed
        const fallbackFrom = from || "rgba(var(--primary), 0.03)"
        const fallbackVia = via || ""
        const fallbackTo = to || "rgba(var(--primary), 0.01)"

        // Build linear-gradient string
        if (via) {
          bgImage = `linear-gradient(${angle}deg, ${fallbackFrom}, ${fallbackVia}, ${fallbackTo})`
        } else {
          bgImage = `linear-gradient(${angle}deg, ${fallbackFrom}, ${fallbackTo})`
        }
      }
    }

    return {
      className: "",
      style: {
        backgroundImage: bgImage,
      },
    }
  }

  return {
    className: "",
    style: undefined,
  }
}
