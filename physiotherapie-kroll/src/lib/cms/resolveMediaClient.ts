import type { MediaValue } from "@/types/cms"
import { getMediaPublicUrl } from "./mediaStore"

export function resolveMediaClient(mediaValue?: MediaValue | null): string | null {
  if (!mediaValue) return null

  // 🔒 HARD GUARD: primitives ausschließen
  if (typeof mediaValue !== "object") return null

  if ("url" in mediaValue && typeof mediaValue.url === "string" && mediaValue.url) {
    return mediaValue.url
  }

  if ("path" in mediaValue && typeof mediaValue.path === "string" && mediaValue.path) {
    return mediaValue.path
  }

  if ("id" in mediaValue && typeof mediaValue.id === "string") {
    // optional: später lookup über mediaStore
    return null
  }

  return null
}
