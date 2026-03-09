/**
 * Zentrale Anchor-Scroll-Logik für Onepage-Navigation.
 * Verwendet von Header/Nav (Klick) und bei Seitenload mit Hash.
 * Scrollspy kann später dieselbe ID-Konvention und ggf. diese Hilfen nutzen.
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
 * Scrollt zum Element mit der angegebenen Block-Anchor-ID (mit Header-Offset).
 * @param blockId - Block-ID (ohne Präfix); es wird BLOCK_ANCHOR_PREFIX + blockId verwendet
 * @param headerOffsetPx - Abstand nach oben (z. B. feste Header-Höhe); Standard 80
 */
export function scrollToBlockAnchor(
  blockId: string,
  headerOffsetPx: number = 80
): void {
  if (typeof document === "undefined" || !blockId) return
  const id = getBlockAnchorId(blockId)
  const el = document.getElementById(id)
  if (!el) return

  const y =
    el.getBoundingClientRect().top + window.scrollY - headerOffsetPx
  window.scrollTo({
    top: Math.max(0, y),
    behavior: "smooth",
  })
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
