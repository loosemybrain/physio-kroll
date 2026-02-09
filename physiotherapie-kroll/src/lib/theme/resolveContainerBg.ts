/**
 * Resolves inner container background props to className + styles
 * For panel backgrounds (behind content, inside section)
 */
export function resolveContainerBg(props?: {
  mode?: "transparent" | "color" | "gradient"
  color?: string
  gradientPreset?: "soft" | "aurora" | "ocean" | "sunset" | "hero" | "none"
  gradient?: string
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

    if (props.gradient) {
      bgImage = props.gradient
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
