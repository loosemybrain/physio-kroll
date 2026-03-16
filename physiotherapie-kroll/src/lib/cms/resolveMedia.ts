import type { MediaValue } from "@/types/cms"
import { getMediaPublicUrl } from "./mediaStore"
import { normalizeMediaUrl } from "./normalizeMediaUrl"
import { getSupabasePublic } from "@/lib/supabase/serverPublic"

/**
 * Server-side: Resolves a MediaValue to a URL
 * If mediaId is provided, fetches from media table (prefers path over url)
 * If url is provided, uses it directly and normalizes it
 */
export async function resolveMedia(mediaValue: MediaValue | null | undefined): Promise<string | null> {
  if (!mediaValue) return null
  
  if ("url" in mediaValue && mediaValue.url) {
    return normalizeMediaUrl(mediaValue.url)
  }
  
  if ("mediaId" in mediaValue && mediaValue.mediaId) {
    try {
      const supabase = await getSupabasePublic()
      const { data, error } = await supabase
        .from("media")
        .select("url, path")
        .eq("id", mediaValue.mediaId)
        .single()
      
      if (error || !data) {
        console.error("Error resolving media:", error)
        return null
      }
      
      // Prefer path: build the public URL via getMediaPublicUrl
      if (data.path) {
        return getMediaPublicUrl(data.path)
      }
      
      // Fallback to url if path is not available
      if (data.url) {
        return normalizeMediaUrl(data.url)
      }
      
      return null
    } catch (error) {
      console.error("Error in resolveMedia:", error)
      return null
    }
  }
  
  return null
}
