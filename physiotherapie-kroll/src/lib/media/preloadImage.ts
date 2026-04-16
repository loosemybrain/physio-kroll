"use client"

const loadedImageUrls = new Set<string>()
const inFlightImageLoads = new Map<string, Promise<void>>()

function normalizeUrl(url: string): string {
  return url.trim()
}

function preloadImageInternal(url: string): Promise<void> {
  const normalized = normalizeUrl(url)
  if (!normalized) return Promise.resolve()
  if (loadedImageUrls.has(normalized)) return Promise.resolve()
  const existing = inFlightImageLoads.get(normalized)
  if (existing) return existing

  const promise = new Promise<void>((resolve, reject) => {
    const img = new Image()

    const cleanup = () => {
      img.onload = null
      img.onerror = null
    }

    img.onload = () => {
      loadedImageUrls.add(normalized)
      cleanup()
      resolve()
    }

    img.onerror = () => {
      cleanup()
      reject(new Error(`Failed to preload image: ${normalized}`))
    }

    img.decoding = "async"
    img.src = normalized
  }).finally(() => {
    inFlightImageLoads.delete(normalized)
  })

  inFlightImageLoads.set(normalized, promise)
  return promise
}

export async function preloadImage(url: string, timeoutMs = 1200): Promise<void> {
  const normalized = normalizeUrl(url)
  if (!normalized) return

  const timeoutPromise = new Promise<void>((resolve) => {
    window.setTimeout(resolve, Math.max(100, timeoutMs))
  })

  await Promise.race([preloadImageInternal(normalized), timeoutPromise])
}

export function isImagePreloaded(url: string): boolean {
  const normalized = normalizeUrl(url)
  if (!normalized) return true
  return loadedImageUrls.has(normalized)
}
