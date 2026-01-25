"use client";

import { createBrowserClient } from "@supabase/ssr";

function serializeCookie(
  name: string,
  value: string,
  options?: {
    maxAge?: number
    path?: string
    domain?: string
    // Some cookie libs (and Supabase types) allow boolean here: true => Strict, false => omit.
    sameSite?: boolean | "lax" | "strict" | "none" | "Lax" | "Strict" | "None"
    secure?: boolean
    expires?: Date
  }
) {
  const isHttps =
    typeof window !== "undefined" && typeof window.location !== "undefined"
      ? window.location.protocol === "https:"
      : false

  const parts: string[] = []
  parts.push(`${name}=${value}`)
  parts.push(`Path=${options?.path || "/"}`)
  if (options?.domain) parts.push(`Domain=${options.domain}`)
  if (typeof options?.maxAge === "number") parts.push(`Max-Age=${options.maxAge}`)
  if (options?.expires instanceof Date) parts.push(`Expires=${options.expires.toUTCString()}`)
  let sameSite = options?.sameSite
  // Browsers reject SameSite=None without Secure (and Secure won't work on http://localhost).
  if (!isHttps && typeof sameSite === "string" && sameSite.toLowerCase() === "none") {
    sameSite = "lax"
  }
  if (sameSite === false) {
    // omit SameSite entirely
  } else if (sameSite === true) {
    parts.push("SameSite=Strict")
  } else if (typeof sameSite === "string" && sameSite) {
    const ss = sameSite.toLowerCase()
    if (ss === "lax" || ss === "strict" || ss === "none") {
      parts.push(`SameSite=${ss[0].toUpperCase()}${ss.slice(1)}`)
    }
  } else {
    parts.push("SameSite=Lax")
  }
  // Secure cookies won't be stored on http://localhost
  if (options?.secure && isHttps) parts.push("Secure")
  return parts.join("; ")
}

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (typeof document === "undefined") return [];
          const raw = document.cookie;
          if (!raw) return [];
          return raw.split(/;\s*/).map((cookie) => {
            const idx = cookie.indexOf("=")
            if (idx === -1) return { name: cookie, value: "" }
            const name = cookie.slice(0, idx)
            const value = cookie.slice(idx + 1)
            return { name, value }
          })
        },
        setAll(cookiesToSet) {
          if (typeof document === "undefined") return;
          cookiesToSet.forEach(({ name, value, options }) => {
            document.cookie = serializeCookie(name, value, options)
          });
        },
      },
    }
  );
}

/**
 * Convenience helper (lazy) for client-only usage.
 * Avoids creating a client at module scope (can run during server evaluation).
 */
let _supabase: ReturnType<typeof createSupabaseBrowserClient> | null = null
export function getSupabaseBrowserClient() {
  if (!_supabase) _supabase = createSupabaseBrowserClient()
  return _supabase
}
