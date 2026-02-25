import type { BrandKey } from "./navigation"

/* ------------------------------------------------------------------ */
/*  Footer Design Overrides (all optional)                             */
/* ------------------------------------------------------------------ */

export type FooterBgMode = "brand" | "solid-light" | "solid-dark" | "transparent" | "custom"
export type FooterSpacing = "sm" | "md" | "lg"

export interface FooterDesign {
  bgMode?: FooterBgMode
  bgClass?: string
  textClass?: string
  borderClass?: string
  linkClass?: string
  linkHoverClass?: string
  container?: {
    enabled?: boolean
    className?: string
  }
  spacing?: {
    py?: FooterSpacing
  }
  bottomBar?: {
    dividerEnabled?: boolean
    dividerClass?: string
  }
}

/* ------------------------------------------------------------------ */
/*  Footer Section / Block types                                       */
/* ------------------------------------------------------------------ */

export interface FooterLink {
  id: string
  label: string
  type: "page" | "url"
  pageSlug?: string
  href?: string
  newTab?: boolean
}

export interface FooterBlock {
  id: string
  type: "text" | "links" | "social" | "logo" | "newsletter"
  title?: string
  content?: string
  links?: FooterLink[]
}

export interface FooterSection {
  id: string
  span?: number
  blocks: FooterBlock[]
}

export interface FooterBottomBar {
  left?: string
  right?: string
  links?: FooterLink[]
}

/* ------------------------------------------------------------------ */
/*  Full Footer Config                                                 */
/* ------------------------------------------------------------------ */

export interface FooterConfig {
  sections: FooterSection[]
  bottomBar?: FooterBottomBar
  design?: FooterDesign
}

/* ------------------------------------------------------------------ */
/*  Default config                                                     */
/* ------------------------------------------------------------------ */

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  sections: [
    {
      id: "col-1",
      span: 2,
      blocks: [
        {
          id: "b-logo",
          type: "logo",
          title: "PhysioPraxis",
        },
        {
          id: "b-about",
          type: "text",
          content:
            "Ihre Praxis für Physiotherapie und Rehabilitation. Seit 2008 begleiten wir Sie auf dem Weg zu einem schmerzfreien und aktiven Leben.",
        },
      ],
    },
    {
      id: "col-2",
      blocks: [
        {
          id: "b-nav",
          type: "links",
          title: "Navigation",
          links: [
            { id: "fl-1", label: "Startseite", type: "page", pageSlug: "" },
            { id: "fl-2", label: "Leistungen", type: "page", pageSlug: "leistungen" },
            { id: "fl-3", label: "Team", type: "page", pageSlug: "team" },
            { id: "fl-4", label: "Kontakt", type: "page", pageSlug: "kontakt" },
          ],
        },
      ],
    },
    {
      id: "col-3",
      blocks: [
        {
          id: "b-legal",
          type: "links",
          title: "Rechtliches",
          links: [
            { id: "fl-5", label: "Impressum", type: "page", pageSlug: "impressum" },
            { id: "fl-6", label: "Datenschutz", type: "page", pageSlug: "datenschutz" },
            { id: "fl-7", label: "AGB", type: "page", pageSlug: "agb" },
          ],
        },
      ],
    },
    {
      id: "col-4",
      blocks: [
        {
          id: "b-contact",
          type: "text",
          title: "Kontakt",
          content: "Musterstraße 42\n12345 Musterstadt\nTel: 0123 456 789\ninfo@physiopraxis.de",
        },
      ],
    },
  ],
  bottomBar: {
    left: "\u00a9 2026 PhysioPraxis. Alle Rechte vorbehalten.",
    right: undefined,
    links: [],
  },
  // design is intentionally undefined -> brand defaults apply
}
