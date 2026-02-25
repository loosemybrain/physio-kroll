import type { NavConfig } from "@/types/navigation"
import { NAV_HOVER_PRESET_DEFAULT_ID } from "@/lib/navigation/nav-hover-presets"

/**
 * Default navigation configuration
 * Can be used in both client and server components
 */
export const DEFAULT_NAV_CONFIG: NavConfig = {
  logo: null,
  logoSize: "md",
  logoFit: "contain",
  links: [],
  searchEnabled: true,
  cta: null,
  // Header layout defaults
  headerLayoutColumns: 4,
  headerFontPreset: "brand",
  headerMotionPreset: "subtle",
  secondaryLinks: [],
  infoBadge: undefined,
  // Navigation style preset (defaults to minimal)
  navStylePresetId: "minimal",
  // Navigation hover preset
  navHoverPresetId: NAV_HOVER_PRESET_DEFAULT_ID,
  // Navigation link colors (defaults to null = theme-driven)
  navLinkColor: null,
  navLinkHoverColor: null,
  navLinkActiveColor: null,
  navIndicatorColor: null,
}
