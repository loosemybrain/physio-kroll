import type { MediaValue } from "@/types/cms"
import { getMediaPublicUrl } from "./mediaStore"
import { getSupabasePublic } from "@/lib/supabase/serverPublic"

/**
 * Server-side: Resolves a MediaValue to a URL
 * If mediaId is provided, fetches from media table
 * If url is provided, uses it directly
 */
export async function resolveMedia(mediaValue: MediaValue | null | undefined): Promise<string | null> {
  if (!mediaValue) return null
  
  if ("url" in mediaValue && mediaValue.url) {
    return mediaValue.url
  }
  
  if ("mediaId" in mediaValue && mediaValue.mediaId) {
    try {
      const supabase = await getSupabasePublic()
      const { data, error } = await supabase
        .from("media")
        .select("url")
        .eq("id", mediaValue.mediaId)
        .single()
      
      if (error || !data) {
        console.error("Error resolving media:", error)
        return null
      }
      
      return data.url
    } catch (error) {
      console.error("Error in resolveMedia:", error)
      return null
    }
  }
  
  return null
}

/**
 * Client-side media resolution
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
