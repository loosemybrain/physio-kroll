import type { NavConfig } from "@/types/navigation"

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
}
