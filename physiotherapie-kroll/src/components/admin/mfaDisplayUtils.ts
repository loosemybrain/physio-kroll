/** Rohes `totp.qr_code` von Supabase (SVG, data-URL, Base64-PNG, …). */
export function isSvgQrMarkup(raw: string | null | undefined): boolean {
  if (!raw?.trim()) return false
  const s = raw.trim()
  return /^<\?xml/i.test(s) || /^<svg[\s/>]/i.test(s)
}

export function toQrImageSrc(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  const s = raw.trim()
  if (isSvgQrMarkup(s)) return null
  if (s.startsWith("data:image/")) return s

  const compact = s.replace(/\s/g, "")
  if (/^[A-Za-z0-9+/]+=*$/.test(compact) && compact.length >= 40) {
    return `data:image/png;base64,${compact}`
  }

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`
}
