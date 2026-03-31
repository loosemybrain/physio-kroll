/**
 * Zentrale Prüfung von Embed-URLs (Google Maps, Facebook).
 * Verhindert triviale Fehlkonfigurationen und offensichtlich falsche Hosts.
 */

import type { ExternalMediaProviderId } from "./externalMediaProviders"

export type EmbedUrlValidation =
  | { ok: true; href: string }
  | { ok: false; message: string }

function parseHttpsUrl(raw: string): URL | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    const u = new URL(trimmed)
    if (u.protocol !== "https:") return null
    // Kein userinfo / keine seltsamen Schemes
    if (u.username || u.password) return null
    return u
  } catch {
    return null
  }
}

/** Exakt erlaubte Hosts für Google-Maps-Embed (keine Wildcards, keine anderen google.*-Hosts). */
const GOOGLE_MAPS_ALLOWED_HOSTS = new Set<string>(["www.google.com", "google.com"])

/**
 * Validiert eine Google-Maps-Embed-URL:
 * - ausschließlich https: (http:, data:, javascript: u. a. blockiert)
 * - Host nur `www.google.com` oder `google.com`
 * - Pfad beginnt mit `/maps/embed`
 */
export function validateGoogleMapsEmbedUrl(raw: string): EmbedUrlValidation {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { ok: false, message: "Bitte eine gültige HTTPS-URL für die eingebettete Karte angeben." }
  }

  let u: URL
  try {
    u = new URL(trimmed)
  } catch {
    return { ok: false, message: "Die URL ist ungültig und kann nicht geladen werden." }
  }

  if (u.protocol !== "https:") {
    return {
      ok: false,
      message:
        "Nur HTTPS ist erlaubt. http:, data:, javascript: und andere Schemes sind nicht zulässig.",
    }
  }

  if (u.username || u.password) {
    return { ok: false, message: "URLs mit Benutzername oder Passwort sind nicht zulässig." }
  }

  const host = u.hostname.toLowerCase()
  if (!GOOGLE_MAPS_ALLOWED_HOSTS.has(host)) {
    return {
      ok: false,
      message: "Nur die Hosts www.google.com und google.com sind für eingebettete Karten erlaubt.",
    }
  }

  const path = u.pathname.toLowerCase()
  if (!path.startsWith("/maps/embed")) {
    return {
      ok: false,
      message: 'Der Pfad muss mit „/maps/embed“ beginnen (offizielles Karten-Embed).',
    }
  }

  return { ok: true, href: u.toString() }
}

/** Host ist facebook.com (inkl. www / m). */
function isFacebookHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  return h === "facebook.com" || h === "www.facebook.com" || h === "m.facebook.com"
}

/** Meta-Plugin-iframes liegen unter /plugins/ */
function isFacebookPluginPath(pathname: string): boolean {
  return pathname.toLowerCase().startsWith("/plugins/")
}

/**
 * Validiert eine Facebook-Plugin-Embed-URL (iframe unter facebook.com/plugins/…).
 */
export function validateFacebookEmbedUrl(raw: string): EmbedUrlValidation {
  const u = parseHttpsUrl(raw)
  if (!u) {
    return { ok: false, message: "Bitte eine gültige HTTPS-URL für das Facebook-Plugin angeben." }
  }
  if (!isFacebookHost(u.hostname)) {
    return { ok: false, message: "Nur offizielle facebook.com-Plugin-URLs sind erlaubt." }
  }
  if (!isFacebookPluginPath(u.pathname)) {
    return {
      ok: false,
      message: "Die URL muss ein Facebook-Plugin sein (Pfad beginnt mit „/plugins/“).",
    }
  }
  return { ok: true, href: u.toString() }
}

export function validateEmbedUrlForProvider(
  provider: ExternalMediaProviderId,
  raw: string
): EmbedUrlValidation {
  if (provider === "google_maps") return validateGoogleMapsEmbedUrl(raw)
  return validateFacebookEmbedUrl(raw)
}
