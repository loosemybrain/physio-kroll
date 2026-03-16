/**
 * Zentrale Anchor-Scroll-Logik für Onepage-Navigation.
 * Verwendet von Header/Nav (Klick) und bei Seitenload mit Hash.
 * ScrollSpy nutzt dieselbe ID-Konvention (block-<id>).
 * 
 * Brand-aware Pfad-Kanonisierung:
 * - Physiotherapy: home -> "/" (Root)
 * - Physio-Konzept: home -> "/konzept" (Brand prefix)
 * - Andere Slugs werden mit Brand-Präfix versehen
 */

import type { BrandKey } from "@/components/brand/brandAssets"

/** Präfix für Block-DOM-IDs; vermeidet Kollisionen mit anderen IDs. */
export const BLOCK_ANCHOR_PREFIX = "block-"

/**
 * Normalisiert einen internen Pfad zu kanonischer Form.
 * Entfernt trailing slashes (außer bei Root "/"), normalisiert doppelte Slashes.
 */
function normalizeInternalPath(path: string): string {
  if (!path) return "/"
  let normalized = path.replace(/\/+/g, "/") // Doppelte Slashes weg
  if (normalized !== "/" && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1) // Trailing slash weg (außer Root)
  }
  return normalized || "/"
}

/**
 * Zentrale Brand-aware Pfadauflösung.
 * Bestimmt den kanonischen internen Pfad für einen CMS-Slug und eine Marke.
 * 
 * Regeln:
 * - Physiotherapy: home -> "/", andere -> "/<slug>"
 * - Physio-Konzept: home -> "/konzept", andere -> "/konzept/<slug>"
 * - Defensive Behandlung: Leere/null Slugs, führende Slashes normalisieren
 */
export function resolvePagePathForBrand(
  slug: string | null | undefined,
  brand: BrandKey | undefined
): string {
  const isConcept = brand === "physio-konzept"
  const basePrefix = isConcept ? "/konzept" : ""

  // Leerer oder "home" Slug -> Homepage
  if (!slug || slug === "home") {
    return basePrefix || "/"
  }

  // Slug normalisieren: führende Slashes entfernen
  const cleanSlug = String(slug).replace(/^\/+/, "")
  if (!cleanSlug) return basePrefix || "/"

  // Pfad zusammensetzen
  const path = basePrefix ? `${basePrefix}/${cleanSlug}` : `/${cleanSlug}`
  return normalizeInternalPath(path)
}

/**
 * Normalisiert zwei Pfade für Vergleich (kanonische Form).
 * Entfernt Query-Strings und Hashes.
 */
function normalizePathForComparison(path: string): string {
  if (!path) return "/"
  // Query und Hash entfernen
  const cleaned = path.split(/[?#]/)[0] || "/"
  return normalizeInternalPath(cleaned)
}

/**
 * Erzeugt die stabile DOM-ID für einen Block (Kollisionsschutz durch Präfix).
 */
export function getBlockAnchorId(blockId: string): string {
  return blockId ? `${BLOCK_ANCHOR_PREFIX}${blockId}` : ""
}

/**
 * Normalisiert anchorId zu Block-ID (ohne Präfix). Akzeptiert "block-xyz" oder "xyz".
 */
export function normalizeAnchorToBlockId(anchorId: string): string {
  if (!anchorId) return ""
  return anchorId.startsWith(BLOCK_ANCHOR_PREFIX)
    ? anchorId.slice(BLOCK_ANCHOR_PREFIX.length)
    : anchorId
}

/**
 * Smooth-Scroll zu einem Anchor-Element (Block-Anker). Berücksichtigt Sticky-Header-Offset.
 * Nutzt scrollIntoView, damit sowohl window als auch scrollbare Container (z. B. Admin main) funktionieren.
 * @param anchorId - Vollständige DOM-ID (z. B. "block-xyz") oder Block-ID ("xyz")
 * @param headerOffsetPx - Abstand nach oben (z. B. Header-Höhe); Standard 80
 * @returns true wenn gescrollt wurde, false wenn Element fehlt (fail graceful)
 */
export function smoothScrollToAnchor(
  anchorId: string,
  headerOffsetPx: number = 80
): boolean {
  if (typeof document === "undefined" || !anchorId?.trim()) return false
  const id = anchorId.startsWith(BLOCK_ANCHOR_PREFIX)
    ? anchorId
    : getBlockAnchorId(anchorId)
  const el = document.getElementById(id)
  if (!el) return false

  // scroll-margin-top sorgt dafür, dass der Header-Offset beim scrollIntoView berücksichtigt wird
  const prevMargin = el.style.scrollMarginTop
  el.style.scrollMarginTop = `${headerOffsetPx}px`
  el.scrollIntoView({ behavior: "smooth", block: "start" })
  el.style.scrollMarginTop = prevMargin
  return true
}

/**
 * Scrollt zum Element mit der angegebenen Block-Anchor-ID (mit Header-Offset).
 * @param blockId - Block-ID (ohne Präfix); es wird BLOCK_ANCHOR_PREFIX + blockId verwendet
 * @param headerOffsetPx - Abstand nach oben (z. B. feste Header-Höhe); Standard 80
 */
export function scrollToBlockAnchor(
  blockId: string,
  headerOffsetPx: number = 80
): void {
  smoothScrollToAnchor(blockId, headerOffsetPx)
}

/**
 * Kanonisiert einen CMS-Slug zur Route-URL (DEPRECATED, nur rückwärts-kompatibel).
 * Nutze stattdessen resolvePagePathForBrand() mit Brand-Info.
 * 
 * Diese Funktion annahm implizit Brand="physiotherapy".
 * Für korrekte Brand-aware Auflösung: resolvePagePathForBrand(slug, brand)
 */
export function canonicalizeSlugToPath(slug?: string | null): string {
  // Rückwärts-kompatibel: annahm implizit Brand="physiotherapy"
  return resolvePagePathForBrand(slug, "physiotherapy")
}

/**
 * Vergleicht, ob zwei Pfade dieselbe Seite bezeichnen.
 * Brand-aware: berücksichtigt unterschiedliche Homepage-Pfade pro Marke.
 * 
 * @param currentPath - Der aktuelle Seiten-Pfad (z. B. aus usePathname())
 * @param targetSlug - Der Ziel-Slug aus der Navigation
 * @param targetBrand - Die Marke des Ziel-Links (optional, standardmäßig wie currentPath)
 * @returns true wenn beide auf dieselbe Seite zeigen
 */
export function isSamePage(
  currentPath: string,
  targetSlug?: string | null,
  targetBrand?: BrandKey
): boolean {
  const normalizedCurrent = normalizePathForComparison(currentPath || "/")
  
  // Wenn Brand nicht angegeben: aus currentPath ableiten
  const isCurrentConcept = normalizedCurrent.startsWith("/konzept")
  const brand: BrandKey = targetBrand ?? (isCurrentConcept ? "physio-konzept" : "physiotherapy")
  
  const targetPath = resolvePagePathForBrand(targetSlug, brand)
  const normalizedTarget = normalizePathForComparison(targetPath)
  
  return normalizedCurrent === normalizedTarget
}

/**
 * Erzeugt einen Brand-aware Href für einen Anchor-Link.
 * Format: "/<slug>#block-<id>" oder mit Brand-Präfix bei Konzept.
 * 
 * @param blockId - Die Block-ID (z. B. "abc123")
 * @param pageSlug - Der Ziel-Seiten-Slug (z. B. "home", "about")
 * @param brand - Die Marke (optional, standardmäßig "physiotherapy")
 * @returns Vollqualifizierter Anchor-Href
 */
export function buildAnchorHref(
  blockId: string,
  pageSlug?: string | null,
  brand?: BrandKey
): string {
  const hash = `#${BLOCK_ANCHOR_PREFIX}${blockId}`
  const targetPath = resolvePagePathForBrand(pageSlug, brand || "physiotherapy")
  
  // Wenn Ziel Root "/" ist, kann man Optional nur den Hash zurückgeben
  // aber für Konsistenz immer vollqualifiziert (mit Root Präfix wenn nötig)
  if (targetPath === "/") {
    return hash // Root: kann "/#block-..." sein
  }
  
  return `${targetPath}${hash}`
}

/**
 * Prüft, ob der aktuelle Hash eine Block-Anchor-ID ist, und scrollt ggf. dorthin.
 * Nach dem Laden der Seite aufrufen (z. B. in Layout oder Page).
 */
export function scrollToAnchorFromHash(headerOffsetPx: number = 80): void {
  if (typeof window === "undefined") return
  const hash = window.location.hash?.slice(1)
  if (!hash || !hash.startsWith(BLOCK_ANCHOR_PREFIX)) return
  const blockId = hash.slice(BLOCK_ANCHOR_PREFIX.length)
  if (!blockId) return
  // Kurz verzögern, damit alle Blöcke gerendert sind
  requestAnimationFrame(() => {
    requestAnimationFrame(() => scrollToBlockAnchor(blockId, headerOffsetPx))
  })
}
