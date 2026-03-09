import type { BrandKey } from "@/components/brand/brandAssets"
import type { FooterLegalLinksConfig } from "@/types/footer"

/** Erwartete Slugs für Legal-Seiten (Fallback, wenn nur Slug bekannt). */
const LEGAL_SLUG_BY_SUBTYPE: Record<string, string> = {
  privacy: "datenschutz",
  cookies: "cookies",
  imprint: "impressum",
}

/** Subtype zu erwartetem Slug (für Slug-basierte Zuordnung). */
export const LEGAL_SUBTYPE_TO_SLUG: Record<string, string> = {
  privacy: "datenschutz",
  cookies: "cookies",
  imprint: "impressum",
}

/** Reihenfolge der Legal-Links im Footer. */
export const LEGAL_SUBTYPE_ORDER: readonly string[] = ["privacy", "cookies", "imprint"]

/** Deutsche Labels für Legal-Seiten. */
export const LEGAL_SUBTYPE_LABELS: Record<string, string> = {
  privacy: "Datenschutz",
  cookies: "Cookies",
  imprint: "Impressum",
}

/** Eine veröffentlichte Legal-Seite aus der Datenquelle (API). */
export type LegalPageFromSource = {
  slug: string
  title: string
  page_subtype: string
}

/** Ein aufgelöster Legal-Link für die Anzeige (Subtype + Seite vorhanden). */
export type ResolvedLegalLink = {
  subtype: string
  label: string
  href: string
  slug: string
  title: string
}

/**
 * Gibt den Frontend-Pfad für eine Seite (Slug) abhängig vom Brand zurück.
 * physiotherapy: /{slug}, physio-konzept: /konzept/{slug}
 */
export function getPageHrefForBrand(brand: BrandKey, slug: string): string {
  const s = slug.replace(/^\//, "")
  return brand === "physio-konzept" ? `/konzept/${s}` : `/${s}`
}

/**
 * Gibt den erwarteten Pfad für eine Legal-Seite (Subtype) zurück.
 * Nutzt die Standard-Slugs (datenschutz, cookies, impressum).
 */
export function getLegalPageHref(brand: BrandKey, pageSubtype: string): string {
  const slug = LEGAL_SLUG_BY_SUBTYPE[pageSubtype] ?? pageSubtype
  return getPageHrefForBrand(brand, slug)
}

/**
 * Liefert für einen Brand die konfigurierten Legal-Link-Infos (nur Pfad/Label).
 * Für die Anzeige im Footer sollten nur existierende CMS-Seiten verlinkt werden;
 * die tatsächlichen Links kommen aus den von der API gelieferten legalPages (slug + getPageHrefForBrand).
 */
export function getLegalLinksForBrand(brand: BrandKey): Array<{ subtype: string; label: string; href: string }> {
  return LEGAL_SUBTYPE_ORDER.map((subtype) => ({
    subtype,
    label: LEGAL_SUBTYPE_LABELS[subtype] ?? subtype,
    href: getLegalPageHref(brand, subtype),
  }))
}

/**
 * Zentrale Auflösung: welche Legal-Links im Footer angezeigt werden.
 * - Bevorzugt page_subtype aus der Datenquelle (API liefert pageType/pageSubtype).
 * - Nur Subtypes, die in legalLinks.items aktiviert sind.
 * - Nur wenn eine veröffentlichte Legal-Seite für diesen Subtype existiert.
 * Reihenfolge: LEGAL_SUBTYPE_ORDER.
 */
export function resolveLegalLinksForFooter(
  legalLinksConfig: FooterLegalLinksConfig | undefined,
  legalPagesFromSource: LegalPageFromSource[],
  brand: BrandKey
): ResolvedLegalLink[] {
  if (!legalLinksConfig?.enabled || !legalLinksConfig.items) return []

  const bySubtype = new Map<string, LegalPageFromSource>()
  for (const p of legalPagesFromSource) {
    if (p.page_subtype && LEGAL_SUBTYPE_ORDER.includes(p.page_subtype)) {
      bySubtype.set(p.page_subtype, p)
    }
  }
  // Fallback: Zuordnung über Slug, falls page_subtype fehlt (alte Datenquelle)
  for (const p of legalPagesFromSource) {
    for (const subtype of LEGAL_SUBTYPE_ORDER) {
      if (bySubtype.has(subtype)) continue
      const expectedSlug = LEGAL_SUBTYPE_TO_SLUG[subtype]
      if (expectedSlug && p.slug === expectedSlug) {
        bySubtype.set(subtype, p)
        break
      }
    }
  }

  const result: ResolvedLegalLink[] = []
  const items = legalLinksConfig.items
  for (const subtype of LEGAL_SUBTYPE_ORDER) {
    const enabled = subtype === "imprint" ? items.imprint : subtype === "privacy" ? items.privacy : items.cookies
    if (!enabled) continue
    const page = bySubtype.get(subtype)
    if (!page) continue
    result.push({
      subtype,
      label: LEGAL_SUBTYPE_LABELS[subtype] ?? page.title,
      href: getPageHrefForBrand(brand, page.slug),
      slug: page.slug,
      title: page.title,
    })
  }
  return result
}
