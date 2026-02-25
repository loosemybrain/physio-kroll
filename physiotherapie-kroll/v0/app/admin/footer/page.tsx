"use client"

import { FooterEditorClient } from "@/components/admin/FooterEditorClient"
import { DEFAULT_FOOTER_CONFIG } from "@/types/footer"
import type { BrandKey } from "@/types/navigation"

/**
 * Admin footer editor page.
 * In production, initialConfigs and pages would come from Supabase via a Server Component.
 * Here we use defaults for the demo.
 */

const initialConfigs: Record<BrandKey, typeof DEFAULT_FOOTER_CONFIG> = {
  physiotherapy: { ...DEFAULT_FOOTER_CONFIG },
  "physio-konzept": {
    ...DEFAULT_FOOTER_CONFIG,
    sections: DEFAULT_FOOTER_CONFIG.sections.map((s) =>
      s.id === "col-1"
        ? {
            ...s,
            blocks: s.blocks.map((b) =>
              b.id === "b-logo" ? { ...b, title: "PhysioKonzept" } : b
            ),
          }
        : s
    ),
  },
}

const initialPages = [
  { slug: "", title: "Startseite" },
  { slug: "leistungen", title: "Leistungen" },
  { slug: "team", title: "Team" },
  { slug: "kontakt", title: "Kontakt" },
  { slug: "impressum", title: "Impressum" },
  { slug: "datenschutz", title: "Datenschutz" },
  { slug: "agb", title: "AGB" },
  { slug: "blog", title: "Blog" },
]

export default function AdminFooterPage() {
  return <FooterEditorClient initialConfigs={initialConfigs} initialPages={initialPages} />
}
