import sanitizeHtml from "sanitize-html"
import { getCmsInlineIconSanitizeOptions, getCmsRichTextSanitizeOptions } from "./cmsHtmlPolicy"

export type CmsHtmlProfile = "richText" | "inlineIcon"

/**
 * Zentrale CMS-HTML-Sanitization (Allowlist über `cmsHtmlPolicy.ts`, Bibliothek: `sanitize-html`).
 */
export function sanitizeCmsHtml(input: string, profile: CmsHtmlProfile = "richText"): string {
  const html = typeof input === "string" ? input : ""
  if (!html) return ""

  const options = profile === "inlineIcon" ? getCmsInlineIconSanitizeOptions() : getCmsRichTextSanitizeOptions()
  return sanitizeHtml(html, options)
}

export { isSafeCmsRichTextHref, CMS_RICHTEXT_ALLOWED_TAGS } from "./cmsHtmlPolicy"
