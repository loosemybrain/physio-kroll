export type BrandKey = "physiotherapy" | "physio-konzept"

export interface NavLink {
  id: string
  label: string
  type: "page" | "url"
  pageSlug?: string
  href?: string
  newTab?: boolean
  visibility: "both" | BrandKey
  sort: number
  /** Optional: assign link to a group for multi-column layouts */
  group?: "primary" | "secondary" | "utility"
}

export interface NavCta {
  enabled: boolean
  label: string
  type: "page" | "url"
  pageSlug?: string
  href?: string
  variant?: "default" | "outline" | "ghost" | "secondary"
}

export interface NavLogo {
  url?: string
  mediaId?: string
  alt?: string
}

export interface NavConfig {
  links: NavLink[]
  cta?: NavCta
  logo?: NavLogo | null
  logoSize?: "sm" | "md" | "lg"
  logoFit?: "contain" | "cover"
  searchEnabled?: boolean

  /* ---- New: layout columns (desktop) ---- */
  headerLayoutColumns?: 3 | 4 | 5

  /* ---- New: font preset ---- */
  headerFontPreset?: "brand" | "sans" | "serif" | "mono"

  /* ---- New: optional secondary / info content ---- */
  secondaryLinks?: NavLink[]
  infoBadge?: string | null
}

export const DEFAULT_NAV_CONFIG: NavConfig = {
  links: [
    { id: "home", label: "Startseite", type: "page", pageSlug: "", visibility: "both", sort: 0 },
    { id: "leistungen", label: "Leistungen", type: "page", pageSlug: "leistungen", visibility: "both", sort: 1 },
    { id: "team", label: "Team", type: "page", pageSlug: "team", visibility: "both", sort: 2 },
    { id: "kontakt", label: "Kontakt", type: "page", pageSlug: "kontakt", visibility: "both", sort: 3 },
  ],
  cta: {
    enabled: true,
    label: "Termin buchen",
    type: "page",
    pageSlug: "kontakt",
    variant: "default",
  },
  logo: null,
  logoSize: "md",
  logoFit: "contain",
  searchEnabled: true,
  headerLayoutColumns: 4,
  headerFontPreset: "brand",
  secondaryLinks: [],
  infoBadge: null,
}
