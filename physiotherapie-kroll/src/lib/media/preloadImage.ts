"use client"

const loadedImageUrls = new Set<string>()
const inFlightImageLoads = new Map<string, Promise<void>>()
/** Nach Fehler: kurz keine erneuten Preloads derselben URL (reduziert Spam / Doppelrequests). */
const failedUntilByUrl = new Map<string, number>()

const FAILED_COOLDOWN_MS = 45_000

/** Max. Wartezeit bevor Popup geöffnet wird (blockierendes preloadImage in PopupRuntime). */
export const POPUP_IMAGE_PRELOAD_MAX_MS = 1200

/** Reserviert / Doku: Lightbox nutzt kein blockierendes Preload mehr (nur sichtbares img + optional scheduleWarmupImage). */
export const LIGHTBOX_IMAGE_PRELOAD_MAX_MS = 1200

/** Verzögerung vor optionalem Warmup des nächsten Lightbox-Bilds — weniger Konkurrenz zum aktuellen Request. */
export const LIGHTBOX_NEXT_WARMUP_DELAY_MS = 450

function normalizeUrl(url: string): string {
  return url.trim()
}

function pruneFailed(url: string) {
  const until = failedUntilByUrl.get(url)
  if (until != null && Date.now() >= until) {
    failedUntilByUrl.delete(url)
  }
}

function isInFailedCooldown(url: string): boolean {
  pruneFailed(url)
  const until = failedUntilByUrl.get(url)
  return until != null && Date.now() < until
}

function markLoadFailed(url: string) {
  failedUntilByUrl.set(url, Date.now() + FAILED_COOLDOWN_MS)
}

function preloadImageInternal(url: string): Promise<void> {
  const normalized = normalizeUrl(url)
  if (!normalized) return Promise.resolve()
  if (loadedImageUrls.has(normalized)) return Promise.resolve()
  if (isInFailedCooldown(normalized)) return Promise.resolve()

  const existing = inFlightImageLoads.get(normalized)
  if (existing) return existing

  const promise = new Promise<void>((resolve, reject) => {
    const img = new Image()

    const cleanup = () => {
      img.onload = null
      img.onerror = null
    }

    img.onload = () => {
      failedUntilByUrl.delete(normalized)
      loadedImageUrls.add(normalized)
      cleanup()
      resolve()
    }

    img.onerror = () => {
      markLoadFailed(normalized)
      cleanup()
      reject(new Error(`Failed to preload image: ${normalized}`))
    }

    img.src = normalized
  }).finally(() => {
    inFlightImageLoads.delete(normalized)
  })

  inFlightImageLoads.set(normalized, promise)
  return promise
}

/**
 * Blockierend (await): lädt die URL in den Browser-Cache, max. timeoutMs.
 * Resolved immer (kein throw): Timeout, Fehler und Failed-Cooldown brechen still ab.
 */
export async function preloadImage(url: string, timeoutMs = 1200): Promise<void> {
  const normalized = normalizeUrl(url)
  if (!normalized) return
  if (isInFailedCooldown(normalized)) return

  const t = Math.max(100, timeoutMs)
  const timeoutPromise = new Promise<void>((resolve) => {
    window.setTimeout(resolve, t)
  })

  await Promise.race([
    preloadImageInternal(normalized).catch(() => {
      /* Fehler bereits in markLoadFailed / UI bleibt bedienbar */
    }),
    timeoutPromise,
  ])
}

export function isImagePreloaded(url: string): boolean {
  const normalized = normalizeUrl(url)
  if (!normalized) return true
  return loadedImageUrls.has(normalized)
}

/**
 * Fire-and-forget: ein nicht-blockierender Hint für Hintergrund-Caches (z. B. nächstes Lightbox-Bild).
 * Kein zweiter paralleler Start derselben URL, solange inflight / loaded / Failed-Cooldown.
 */
export function warmupImage(url: string): void {
  const normalized = normalizeUrl(url)
  if (!normalized) return
  if (loadedImageUrls.has(normalized)) return
  if (isInFailedCooldown(normalized)) return
  if (inFlightImageLoads.has(normalized)) return
  void preloadImageInternal(normalized).catch(() => {})
}

/**
 * Nächstes Bild leicht zeitversetzt vorwärmen, damit es nicht mit dem aktuellen sichtbaren &lt;img&gt; um Bandbreite konkurriert.
 * Gibt clear() zurück zum Aufräumen bei Unmount / schnellem Slidewechsel.
 */
export function scheduleWarmupImage(url: string, delayMs = LIGHTBOX_NEXT_WARMUP_DELAY_MS): () => void {
  const normalized = normalizeUrl(url)
  if (!normalized) return () => {}

  const id = window.setTimeout(() => {
    warmupImage(normalized)
  }, Math.max(0, delayMs))

  return () => window.clearTimeout(id)
}
