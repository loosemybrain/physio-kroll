import type { BrandKey } from "./navigation"

/* ------------------------------------------------------------------ */
/*  Legal Page Types                                                   */
/* ------------------------------------------------------------------ */

export type LegalPageType = "datenschutz" | "cookies" | "impressum"

export interface LegalPageMeta {
  id: string
  type: LegalPageType
  slug: string
  title: string
  subtitle?: string
  introText?: string
  seoTitle?: string
  seoDescription?: string
  brand?: BrandKey | "all"
  published: boolean
  updatedAt?: string
}

/* ------------------------------------------------------------------ */
/*  Content Block Types                                                */
/* ------------------------------------------------------------------ */

export type LegalBlockType =
  | "section"
  | "richtext"
  | "table"
  | "infobox"
  | "contact-card"
  | "cookie-categories"
  | "divider"

export interface LegalBlockBase {
  id: string
  type: LegalBlockType
  visible?: boolean
  spacingTop?: "none" | "sm" | "md" | "lg"
  spacingBottom?: "none" | "sm" | "md" | "lg"
}

/* ---- Section Block ---- */
export interface LegalSectionBlock extends LegalBlockBase {
  type: "section"
  anchorId?: string
  headline: string
  headlineSize?: "h2" | "h3" | "h4"
  subheadline?: string
  content: string // HTML rich text
  textAlign?: "left" | "center" | "justify"
  showNumber?: boolean
  numberValue?: number
  highlight?: boolean
  headlineColor?: string
  textColor?: string
  backgroundColor?: string
}

/* ---- Rich Text Block ---- */
export interface LegalRichTextBlock extends LegalBlockBase {
  type: "richtext"
  content: string // HTML
  textAlign?: "left" | "center" | "justify"
  textColor?: string
}

/* ---- Table Block ---- */
export interface LegalTableColumn {
  id: string
  label: string
  width?: string // e.g. "200px" or "25%"
}

export interface LegalTableRow {
  id: string
  cells: Record<string, string> // column id -> cell content
}

export interface LegalTableBlock extends LegalBlockBase {
  type: "table"
  caption?: string
  columns: LegalTableColumn[]
  rows: LegalTableRow[]
  variant?: "default" | "compact" | "spacious"
  zebra?: boolean
  headerBgColor?: string
  borderColor?: string
}

/* ---- InfoBox / Notice Block ---- */
export interface LegalInfoBoxBlock extends LegalBlockBase {
  type: "infobox"
  variant?: "info" | "warning" | "success" | "neutral"
  icon?: boolean
  headline?: string
  content: string // HTML
}

/* ---- Contact Card Block ---- */
export interface LegalContactCardBlock extends LegalBlockBase {
  type: "contact-card"
  headline?: string
  lines: Array<{
    id: string
    label: string
    value: string
    href?: string
  }>
}

/* ---- Cookie Categories Block ---- */
export interface CookieCategoryItem {
  id: string
  name: string
  description: string
  required: boolean
  cookies?: Array<{
    id: string
    name: string
    provider: string
    purpose: string
    duration: string
    type: string
  }>
}

export interface LegalCookieCategoriesBlock extends LegalBlockBase {
  type: "cookie-categories"
  categories: CookieCategoryItem[]
  variant?: "cards" | "accordion"
}

/* ---- Divider Block ---- */
export interface LegalDividerBlock extends LegalBlockBase {
  type: "divider"
  variant?: "line" | "gradient" | "dots"
}

/* ---- Union Type ---- */
export type LegalBlock =
  | LegalSectionBlock
  | LegalRichTextBlock
  | LegalTableBlock
  | LegalInfoBoxBlock
  | LegalContactCardBlock
  | LegalCookieCategoriesBlock
  | LegalDividerBlock

/* ------------------------------------------------------------------ */
/*  Full Page Config                                                   */
/* ------------------------------------------------------------------ */

export interface LegalPageConfig {
  meta: LegalPageMeta
  showTableOfContents?: boolean
  tocPosition?: "sidebar" | "inline"
  blocks: LegalBlock[]
}

/* ------------------------------------------------------------------ */
/*  Default Configs                                                    */
/* ------------------------------------------------------------------ */

export const DEFAULT_LEGAL_META: LegalPageMeta = {
  id: "",
  type: "datenschutz",
  slug: "datenschutz",
  title: "Datenschutzerklärung",
  published: true,
}
