export const LAST_PUBLIC_HOME_KEY = "pk-last-public-home" as const

export type PublicHomePath = "/" | "/konzept"

export function readLastPublicHome(): PublicHomePath {
  if (typeof window === "undefined") return "/"
  try {
    const v = window.localStorage.getItem(LAST_PUBLIC_HOME_KEY)
    if (v === "/konzept" || v === "/") return v
  } catch {
    /* ignore */
  }
  return "/"
}

export function writeLastPublicHome(path: PublicHomePath) {
  try {
    window.localStorage.setItem(LAST_PUBLIC_HOME_KEY, path)
  } catch {
    /* ignore */
  }
}
