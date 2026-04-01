/**
 * Liest und validiert NEXT_PUBLIC_* Supabase-Variablen für den Browser.
 * Kein Service-Role-Key: nur URL + Anon-Key prüfen und offensichtliche Fehlbelegungen erkennen.
 */

const PREFIX = "[Supabase Browser] "

function base64UrlToUtf8(segment: string): string | null {
  try {
    let b64 = segment.replace(/-/g, "+").replace(/_/g, "/")
    const pad = b64.length % 4
    if (pad) b64 += "=".repeat(4 - pad)
    if (typeof globalThis.atob === "function") {
      const binary = globalThis.atob(b64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes)
    }
    if (typeof Buffer !== "undefined") {
      return Buffer.from(b64, "base64").toString("utf8")
    }
    return null
  } catch {
    return null
  }
}

/** Liest die `role`-Claim aus einem Supabase-JWT (anon vs. service_role), falls erkennbar. */
export function readSupabaseJwtRole(token: string): string | null {
  const parts = token.split(".")
  if (parts.length < 2) return null
  const json = base64UrlToUtf8(parts[1])
  if (!json) return null
  try {
    const payload = JSON.parse(json) as { role?: unknown }
    return typeof payload.role === "string" ? payload.role : null
  } catch {
    return null
  }
}

export function getValidatedBrowserSupabaseConfig(): { url: string; anonKey: string } {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim()
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim()

  if (!url) {
    throw new Error(
      `${PREFIX}NEXT_PUBLIC_SUPABASE_URL fehlt. Der Browser-Client kann ohne öffentliche Projekt-URL nicht starten.`
    )
  }
  if (!anonKey) {
    throw new Error(
      `${PREFIX}NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt. Tragen Sie den Anon-Key aus dem Supabase-Dashboard ein (nicht den Service-Role-Key).`
    )
  }

  const looksLikeJwt = anonKey.split(".").length === 3
  if (looksLikeJwt) {
    const role = readSupabaseJwtRole(anonKey)
    if (role === "service_role") {
      throw new Error(
        `${PREFIX}NEXT_PUBLIC_SUPABASE_ANON_KEY ist anscheinend ein Service-Role-Key (JWT-Claim role=service_role). ` +
          `Verwenden Sie für diese Variable ausschließlich den öffentlichen anon key; SUPABASE_SERVICE_ROLE_KEY gehört nur serverseitig in .env ohne NEXT_PUBLIC_.`
      )
    }
    if (role && role !== "anon") {
      throw new Error(
        `${PREFIX}NEXT_PUBLIC_SUPABASE_ANON_KEY hat die JWT-Rolle "${role}" (erwartet: anon). ` +
          `Bitte den anon public key aus Project Settings → API verwenden, nicht einen anderen API-Key.`
      )
    }
  } else if (/service_role/i.test(anonKey)) {
    throw new Error(
      `${PREFIX}NEXT_PUBLIC_SUPABASE_ANON_KEY enthält den Text "service_role" — vermutlich falscher Key. Nur den anon key verwenden.`
    )
  }

  return { url, anonKey }
}
