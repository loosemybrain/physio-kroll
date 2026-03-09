/**
 * Zentrale ScrollSpy-Utility: ein IntersectionObserver für alle Block-Anchors.
 * Bestimmt die aktuell sichtbare Section und meldet sie über einen Callback.
 * Sticky-Header wird über rootMargin berücksichtigt.
 */

import { BLOCK_ANCHOR_PREFIX } from "./scrollToAnchor"

const DEFAULT_HEADER_OFFSET_PX = 80

export type ScrollSpyOptions = {
  /** rootMargin: oben = Header-Höhe (Section gilt als "sichtbar" unterhalb des Headers). */
  headerOffsetPx?: number
  /** rootMargin: unten = Anteil Viewport (z. B. "-60%" = Section muss in oberer Hälfte sein). */
  bottomMarginPercent?: number
  threshold?: number | number[]
}

/**
 * Erstellt einen IntersectionObserver für alle Elemente mit id="block-*".
 * Ruft onActive(blockId) mit der Block-ID (ohne Präfix) der aktuell "aktiven" Section auf.
 * Bei mehreren sichtbaren Sections gewinnt die mit dem höchsten intersectionRatio,
 * bei Gleichstand die erste in DOM-Reihenfolge (oberste).
 *
 * @param onActive - Callback mit blockId (ohne "block-" Präfix) oder null wenn keine Section aktiv
 * @param options - headerOffsetPx, bottomMarginPercent, threshold
 * @returns Cleanup-Funktion (disconnect + remove listeners)
 */
export function createScrollSpyObserver(
  onActive: (blockId: string | null) => void,
  options: ScrollSpyOptions = {}
): () => void {
  if (typeof document === "undefined" || typeof IntersectionObserver === "undefined") {
    return () => {}
  }

  const headerOffsetPx = options.headerOffsetPx ?? DEFAULT_HEADER_OFFSET_PX
  const bottomPercent = options.bottomMarginPercent ?? 60
  const rootMargin = `-${headerOffsetPx}px 0px -${bottomPercent}% 0px`
  const threshold = options.threshold ?? 0.2

  const observedBlockIds = new Map<Element, string>()
  /** Pro Block: letzter ratio und top (für Tie-Break). */
  const state = new Map<string, { ratio: number; top: number }>()
  let lastReported: string | null = null

  const updateActive = (entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      const blockId = observedBlockIds.get(entry.target)
      if (blockId === undefined) continue
      const rect = entry.boundingClientRect
      state.set(blockId, {
        ratio: entry.isIntersecting ? entry.intersectionRatio : 0,
        top: rect.top,
      })
    }
    const visible = Array.from(state.entries()).filter(([, v]) => v.ratio > 0)
    const activeBlockId =
      visible.length === 0
        ? null
        : visible.sort((a, b) => b[1].ratio - a[1].ratio || a[1].top - b[1].top)[0][0]
    if (activeBlockId !== lastReported) {
      lastReported = activeBlockId
      onActive(activeBlockId)
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      updateActive(entries)
    },
    { root: null, rootMargin, threshold }
  )

  const collectAndObserve = () => {
    const nodes = document.querySelectorAll<HTMLElement>(`[id^="${BLOCK_ANCHOR_PREFIX}"]`)
    nodes.forEach((el) => {
      const id = el.getAttribute("id")
      if (!id || !id.startsWith(BLOCK_ANCHOR_PREFIX)) return
      const blockId = id.slice(BLOCK_ANCHOR_PREFIX.length)
      if (blockId && !observedBlockIds.has(el)) {
        observedBlockIds.set(el, blockId)
        observer.observe(el)
      }
    })
  }

  collectAndObserve()

  // Einmaliger Initial-Check: Section, die beim Load bereits sichtbar ist, als aktiv setzen
  const runInitialCheck = () => {
    const vh = typeof window !== "undefined" ? window.innerHeight : 0
    const top = headerOffsetPx
    const bottom = vh * (1 - bottomPercent / 100)
    let best: { blockId: string; top: number } | null = null
    observedBlockIds.forEach((blockId, el) => {
      const rect = el.getBoundingClientRect()
      if (rect.top < bottom && rect.bottom > top) {
        if (!best || rect.top < best.top) best = { blockId, top: rect.top }
      }
    })
    const next: string | null = best ? (best as { blockId: string }).blockId : null
    if (next !== lastReported) {
      lastReported = next
      onActive(next)
    }
  }
  if (typeof requestAnimationFrame !== "undefined") {
    requestAnimationFrame(runInitialCheck)
  }

  return () => {
    observer.disconnect()
    observedBlockIds.clear()
  }
}
