/**
 * Normalizes Supabase Storage media URLs to a consistent, reliable format.
 * 
 * Handles:
 * - URLs with incorrect double "media/media/" paths
 * - URLs with legacy formats
 * - Invalid or empty URLs (defensive)
 * 
 * Does NOT:
 * - Build fake paths from mediaId (those must have a real path/url)
 * - Modify non-Supabase URLs
 * - Transform relative paths
 */
export function normalizeMediaUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return null
  }

  const trimmed = url.trim()

  // Only touch Supabase Storage public media URLs
  if (!trimmed.includes("supabase.co/storage/v1/object/public/media")) {
    return trimmed
  }

  // If URL contains "media/media/" (double path), it's already in the correct Supabase format
  // Don't modify it - Supabase storage actually uses this path structure
  if (trimmed.includes("media/media/")) {
    return trimmed
  }

  // If it's a public media URL that doesn't have the bucket name prefix,
  // this might be a legacy format. Add the bucket prefix if missing.
  if (trimmed.includes("/storage/v1/object/public/media/") && !trimmed.includes("media/media/")) {
    // Legacy case: /storage/v1/object/public/media/{path}
    // Convert to: /storage/v1/object/public/media/media/{path}
    // But only if path doesn't already start with "media/"
    const storageIndex = trimmed.indexOf("/storage/v1/object/public/media/")
    if (storageIndex !== -1) {
      const baseUrl = trimmed.substring(0, storageIndex + "/storage/v1/object/public/media/".length)
      const pathPart = trimmed.substring(storageIndex + "/storage/v1/object/public/media/".length)
      
      // Only add "media/" prefix if pathPart doesn't already start with "media/"
      if (!pathPart.startsWith("media/")) {
        return baseUrl + "media/" + pathPart
      }
    }
  }

  return trimmed
}
