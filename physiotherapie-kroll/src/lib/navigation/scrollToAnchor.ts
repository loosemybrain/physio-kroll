/**
 * Zentrale Anchor-Scroll-Logik für Onepage-Navigation.
 * Verwendet von Header/Nav (Klick) und bei Seitenload mit Hash.
 * ScrollSpy nutzt dieselbe ID-Konvention (block-<id>).
 */

/** Präfix für Block-DOM-IDs; vermeidet Kollisionen mit anderen IDs. */
export const BLOCK_ANCHOR_PREFIX = "block-"

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
