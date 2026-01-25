import type { MediaValue } from "@/types/cms"
import { getMediaPublicUrl } from "./mediaStore"

/**
 * Client-side media resolution
 * This file is safe to import in Client Components
 */
export function resolveMediaClient(mediaValue: MediaValue | null | undefined): string | null {
  if (!mediaValue) return null
  
  if ("url" in mediaValue && mediaValue.url) {
    return mediaValue.url
  }
  
  if ("mediaId" in mediaValue && mediaValue.mediaId) {
    // Use the media store helper
    return getMediaPublicUrl(`media/${mediaValue.mediaId}`)
  }
  
  return null
}
