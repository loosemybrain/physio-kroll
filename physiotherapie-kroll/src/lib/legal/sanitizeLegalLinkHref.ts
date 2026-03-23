/**
 * Erlaubt nur unkritische Ziele für Legal-Links (kein javascript:/data:).
 * Normalisiert z. B. `www.example.de` → `https://www.example.de`.
 */
export function sanitizeLegalLinkHref(raw: string): string | null {
  let t = raw.trim()
  if (!t) return null

  // Häufige Nutzereingabe ohne Schema (nur wenn klar als Host erkennbar)
  if (/^www\./i.test(t)) {
    t = `https://${t}`
  }

  const lower = t.toLowerCase()
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("file:")
  ) {
    return null
  }
  if (lower.startsWith("http://") || lower.startsWith("https://")) return t
  if (lower.startsWith("mailto:") || lower.startsWith("tel:")) return t
  if (t.startsWith("/") && !t.startsWith("//")) return t
  if (t.startsWith("#")) return t
  return null
}

export function isExternalLegalHref(href: string): boolean {
  return /^https?:\/\//i.test(href)
}
