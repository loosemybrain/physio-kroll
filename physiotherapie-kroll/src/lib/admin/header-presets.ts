import type { NavConfig } from "@/types/navigation"

/**
 * Header presets for admin quick-configuration
 */
export interface HeaderPreset {
  id: string
  name: string
  description: string
  config: Partial<Pick<NavConfig, "headerLayoutColumns" | "headerFontPreset" | "headerMotionPreset">>
}

export const HEADER_PRESETS: HeaderPreset[] = [
  {
    id: "default-4-subtle",
    name: "Standard",
    description: "4 Spalten, Brand-Font, Subtile Animation",
    config: {
      headerLayoutColumns: 4,
      headerFontPreset: "brand",
      headerMotionPreset: "subtle",
    },
  },
  {
    id: "compact-3-snappy",
    name: "Kompakt",
    description: "3 Spalten, Sans-Font, Schnelle Animation",
    config: {
      headerLayoutColumns: 3,
      headerFontPreset: "sans",
      headerMotionPreset: "snappy",
    },
  },
  {
    id: "utility-5-subtle",
    name: "Erweitert",
    description: "5 Spalten, Brand-Font, Subtile Animation",
    config: {
      headerLayoutColumns: 5,
      headerFontPreset: "brand",
      headerMotionPreset: "subtle",
    },
  },
  {
    id: "glassy-serif",
    name: "Elegant",
    description: "4 Spalten, Serif-Font, Glasiger Effekt",
    config: {
      headerLayoutColumns: 4,
      headerFontPreset: "serif",
      headerMotionPreset: "glassy",
    },
  },
  {
    id: "minimal-3-none",
    name: "Minimal",
    description: "3 Spalten, Brand-Font, Keine Animation",
    config: {
      headerLayoutColumns: 3,
      headerFontPreset: "brand",
      headerMotionPreset: "none",
    },
  },
]
