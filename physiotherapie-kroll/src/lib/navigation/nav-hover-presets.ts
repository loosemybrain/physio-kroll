import { motion, type TargetAndTransition, type Transition } from "framer-motion"

/**
 * Navigation link hover preset identifiers
 */
export type NavHoverPresetId = "none" | "underline-slide" | "shrink" | "glow" | "lift" | "scale-soft" | "blur-backdrop" | "accent-fill"

/**
 * Navigation hover preset configuration
 */
export interface NavHoverPreset {
  id: NavHoverPresetId
  label: string
  description: string
  linkClass?: string
  motion?: {
    whileHover?: TargetAndTransition
    transition?: Transition
  }
}

/**
 * Built-in navigation hover effect presets
 * IMPORTANT: No brand-specific hardcodes; use tokens or CSS variables
 */
export const NAV_HOVER_PRESETS: NavHoverPreset[] = [
  {
    id: "none",
    label: "Keine",
    description: "Kein zusätzlicher Hover-Effekt",
    linkClass: "",
  },
  {
    id: "underline-slide",
    label: "Underline Slide",
    description: "Unterstrich expandiert von links nach rechts",
    linkClass: "relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-current after:transition-all after:duration-300 hover:after:w-full",
  },
  {
    id: "shrink",
    label: "Shrink",
    description: "Text schrumpft leicht beim Hover",
    motion: {
      whileHover: { scale: 0.94 },
      transition: { duration: 0.2 },
    },
  },
  {
    id: "glow",
    label: "Glow",
    description: "Text leuchtet mit Shadow-Effekt",
    linkClass: "hover:[filter:drop-shadow(0_0_8px_var(--nav-glow,rgba(59,130,246,0.3)))] transition-all duration-300",
  },
  {
    id: "lift",
    label: "Lift",
    description: "Text hebt sich nach oben",
    motion: {
      whileHover: { y: -3 },
      transition: { duration: 0.2 },
    },
  },
  {
    id: "scale-soft",
    label: "Scale Soft",
    description: "Sanfte Vergrößerung beim Hover",
    motion: {
      whileHover: { scale: 1.05 },
      transition: { duration: 0.2, type: "spring", stiffness: 300 },
    },
  },
  {
    id: "blur-backdrop",
    label: "Blur Backdrop",
    description: "Verschwommener Hintergrund beim Hover",
    linkClass: "relative hover:before:absolute hover:before:inset-0 hover:before:bg-background/30 hover:before:backdrop-blur-md hover:before:rounded-md hover:before:-z-10 transition-all duration-300",
  },
  {
    id: "accent-fill",
    label: "Accent Fill",
    description: "Akzent-Hintergrund expandiert",
    linkClass: "relative before:absolute before:inset-0 before:bg-primary/10 before:rounded-md before:scale-x-0 before:origin-left before:transition-transform before:duration-300 hover:before:scale-x-100 -z-10 px-2",
  },
]

/**
 * Get hover preset by ID
 */
export function getNavHoverPreset(id?: string | null): NavHoverPreset {
  if (!id) return NAV_HOVER_PRESETS[1] // Default to "underline-slide"
  const preset = NAV_HOVER_PRESETS.find((p) => p.id === id)
  return preset || NAV_HOVER_PRESETS[1]
}

/**
 * Default hover preset ID
 */
export const NAV_HOVER_PRESET_DEFAULT_ID: NavHoverPresetId = "underline-slide"
