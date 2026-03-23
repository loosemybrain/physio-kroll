/**
 * Legal CMS body fields: plain text with `\n` paragraph breaks (no HTML storage).
 * Legacy entries may still contain simple `<p>…</p>` / `<br>` — reduced to text + newlines before splitting.
 */

function looksLikeHtml(s: string): boolean {
  return /<[a-z][\s\S]*>/i.test(s)
}

/** Best-effort legacy HTML → plain text (tags removed, common entities decoded). */
export function legalLegacyHtmlToPlainText(html: string): string {
  return html
    .replace(/\r\n/g, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(div|h[1-6]|li|blockquote|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

/**
 * Split stored legal body into non-empty paragraph strings.
 * One or more line breaks (`\n`, `\r\n`) start a new paragraph; empty lines are skipped.
 */
export function legalPlainTextToParagraphs(raw: string | undefined | null): string[] {
  if (raw == null) return []
  const normalized = raw.replace(/\r\n/g, "\n").trim()
  if (!normalized) return []

  const plain = looksLikeHtml(normalized) ? legalLegacyHtmlToPlainText(normalized).trim() : normalized

  return plain
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}
