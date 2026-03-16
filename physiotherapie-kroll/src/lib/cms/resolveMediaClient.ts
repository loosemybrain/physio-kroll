import type { MediaValue } from "@/types/cms"
import { getMediaPublicUrl } from "./mediaStore"
import { normalizeMediaUrl } from "./normalizeMediaUrl"

/**
 * Resolve a MediaValue to a usable URL client-side.
 * Supports multiple shapes to ensure compatibility:
 * - Direct string URL
 * - { url: string }
 * - { src: string }
 * - { publicUrl: string }
 * - { path: string }
 * - { id: string } (if path is available, use getMediaPublicUrl)
 */
export function resolveMediaClient(mediaValue?: MediaValue | null): string | null {
  if (!mediaValue) return null

  // Handle direct string URLs
  if (typeof mediaValue === "string") {
    return mediaValue ? normalizeMediaUrl(mediaValue) : null
  }

  // Handle objects - check multiple common property names
  if (typeof mediaValue === "object") {
    const urlProp = mediaValue as Record<string, unknown>
    
    // Prefer path: build public URL
    if (urlProp.path && typeof urlProp.path === "string") {
      return getMediaPublicUrl(urlProp.path)
    }
    
    if (urlProp.url && typeof urlProp.url === "string") {
      return normalizeMediaUrl(urlProp.url)
    }
    
    if (urlProp.src && typeof urlProp.src === "string") {
      return normalizeMediaUrl(urlProp.src)
    }
    
    if (urlProp.publicUrl && typeof urlProp.publicUrl === "string") {
      return normalizeMediaUrl(urlProp.publicUrl)
    }

    // If only ID is available without path, return null
    // Don't build fake paths from mediaId
    if (urlProp.id || urlProp.mediaId) {
      return null
    }
  }

  return null
}
