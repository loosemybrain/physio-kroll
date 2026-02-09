import type { MediaValue } from "@/types/cms"
import { getMediaPublicUrl } from "./mediaStore"

/**
 * Resolve a MediaValue to a usable URL client-side.
 * Supports multiple shapes to ensure compatibility:
 * - Direct string URL
 * - { url: string }
 * - { src: string }
 * - { publicUrl: string }
 * - { path: string }
 * - { id: string } (Supabase Storage)
 */
export function resolveMediaClient(mediaValue?: MediaValue | null): string | null {
  if (!mediaValue) return null

  // Handle direct string URLs
  if (typeof mediaValue === "string") {
    return mediaValue ? mediaValue : null
  }

  // Handle objects - check multiple common property names
  if (typeof mediaValue === "object") {
    // Try common URL properties in priority order
    const urlProp = (mediaValue as Record<string, unknown>)
    
    if (urlProp.url && typeof urlProp.url === "string") {
      return urlProp.url
    }
    
    if (urlProp.src && typeof urlProp.src === "string") {
      return urlProp.src
    }
    
    if (urlProp.publicUrl && typeof urlProp.publicUrl === "string") {
      return urlProp.publicUrl
    }
    
    if (urlProp.path && typeof urlProp.path === "string") {
      return urlProp.path
    }

    // If it has an ID (Supabase Storage), return null for now
    // (can be implemented later with storage lookups)
    if (urlProp.id && typeof urlProp.id === "string") {
      return null
    }
  }

  return null
}
