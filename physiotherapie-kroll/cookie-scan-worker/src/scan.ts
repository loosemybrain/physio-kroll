/**
 * Cookie-Scan-Logik für den Worker. Playwright läuft nur hier, nicht im CMS.
 */

import type { BrowserContext, Page } from "playwright"

const BROWSER_TIMEOUT_MS = 30_000
const NAVIGATION_TIMEOUT_MS = 15_000
const INITIAL_WAIT_MS = 1200
const POST_CONSENT_WAIT_MS = 1500
const POST_INTERACTION_WAIT_MS = 1000

export interface RawScannedCookie {
  name: string
  domain: string
  path: string
  value?: string
  expires?: number
  httpOnly?: boolean
  secure?: boolean
  sameSite?: "Strict" | "Lax" | "None"
}

interface DocumentCookieEntry {
  name: string
  value?: string
}

export interface CookieItemInsert {
  scan_id: string
  name: string
  domain: string
  path: string
  category: string | null
  purpose: string | null
  duration: string
  secure: boolean
  http_only: boolean
  same_site: string | null
  provider: string | null
  source_url: string
  is_third_party: boolean
  notes: string | null
}

function normalizeError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e)
  const lower = msg.toLowerCase()
  if (
    lower.includes("executable doesn't exist") ||
    lower.includes("chromium_headless_shell") ||
    lower.includes("browser executable doesn't exist")
  ) {
    return "Chromium nicht installiert (Playwright). Im Container: Browser-Binaries müssen im Image sein."
  }
  if (lower.includes("timeout") || lower.includes("timed out")) {
    return `Timeout: ${msg.slice(0, 120)}`
  }
  if (lower.includes("net::") || lower.includes("econnrefused")) {
    return `Netzwerkfehler: ${msg.slice(0, 100)}`
  }
  return msg.length > 200 ? `${msg.slice(0, 197)}…` : msg
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseDocumentCookies(raw: string): DocumentCookieEntry[] {
  if (!raw || typeof raw !== "string") return []
  return raw
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const idx = entry.indexOf("=")
      if (idx <= 0) {
        return { name: entry }
      }
      return { name: entry.slice(0, idx).trim(), value: entry.slice(idx + 1).trim() }
    })
    .filter((entry) => entry.name.length > 0)
}

function normalizeCookieKey(
  cookie: Pick<RawScannedCookie, "name" | "domain" | "path">,
  fallbackHost: string
): string {
  const domain = (cookie.domain || fallbackHost).toLowerCase()
  const path = cookie.path || "/"
  return `${cookie.name}\t${domain}\t${path}`
}

function dedupeRawCookies(
  cookies: RawScannedCookie[],
  fallbackHost: string
): RawScannedCookie[] {
  const seen = new Set<string>()
  const deduped: RawScannedCookie[] = []
  for (const cookie of cookies) {
    const key = normalizeCookieKey(cookie, fallbackHost)
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(cookie)
  }
  return deduped
}

function mergeRawCookiesPhased(
  fallbackHost: string,
  ...groups: RawScannedCookie[][]
): RawScannedCookie[] {
  const merged: RawScannedCookie[] = []
  const seen = new Set<string>()
  for (const group of groups) {
    for (const cookie of group) {
      const key = normalizeCookieKey(cookie, fallbackHost)
      if (seen.has(key)) continue
      seen.add(key)
      merged.push(cookie)
    }
  }
  return merged
}

async function collectContextCookies(
  context: BrowserContext,
  phaseName: string
): Promise<RawScannedCookie[]> {
  try {
    const cookies = (await context.cookies()) as RawScannedCookie[]
    console.log(`[scan] ${phaseName}: context.cookies=${cookies.length}`)
    return cookies
  } catch (e) {
    console.warn(`[scan] ${phaseName}: context.cookies Fehler: ${normalizeError(e)}`)
    return []
  }
}

async function collectDocumentCookies(page: Page, phaseName: string): Promise<DocumentCookieEntry[]> {
  try {
    const raw = await page.evaluate(() => document.cookie)
    const parsed = parseDocumentCookies(raw)
    console.log(`[scan] ${phaseName}: document.cookie=${parsed.length}`)
    return parsed
  } catch (e) {
    console.warn(`[scan] ${phaseName}: document.cookie Fehler: ${normalizeError(e)}`)
    return []
  }
}

async function attemptConsentAccept(page: Page): Promise<string | null> {
  const acceptRegex =
    /\b(alle akzeptieren|akzeptieren|zustimmen|einverstanden|accept all|accept|allow all|agree)\b/i
  const selectors = [
    "button",
    '[role="button"]',
    'input[type="button"]',
    'input[type="submit"]',
    "a[role='button']",
  ]

  for (const selector of selectors) {
    let count = 0
    try {
      count = await page.locator(selector).count()
    } catch {
      continue
    }
    if (count === 0) continue
    const limit = Math.min(count, 80)
    for (let i = 0; i < limit; i++) {
      const candidate = page.locator(selector).nth(i)
      try {
        if (!(await candidate.isVisible()) || !(await candidate.isEnabled())) continue
        const text = ((await candidate.innerText().catch(() => "")) || "").trim()
        const aria = ((await candidate.getAttribute("aria-label").catch(() => "")) || "").trim()
        const value = ((await candidate.getAttribute("value").catch(() => "")) || "").trim()
        const combined = `${text} ${aria} ${value}`.replace(/\s+/g, " ").trim()
        if (!combined || !acceptRegex.test(combined)) continue
        await candidate.click({ timeout: 3000, force: false })
        const detail = `${selector} -> "${combined.slice(0, 120)}"`
        console.log(`[scan] Consent-Klick ausgeführt: ${detail}`)
        return detail
      } catch {
        // nächster Kandidat
      }
    }
  }
  return null
}

/**
 * Führt einen Cookie-Scan per Playwright/Chromium durch.
 * Browser wird immer geschlossen (inkl. bei Fehler).
 */
export async function runScan(
  targetUrl: string,
  options: { consentMode?: "none" | "accepted"; scanId: string } = { scanId: "" }
): Promise<{ cookies: CookieItemInsert[]; rawCookies?: unknown; error?: string }> {
  const consentMode = options.consentMode ?? "none"
  const scanId = options.scanId ?? ""

  const playwright = await import("playwright")
  let browser: Awaited<ReturnType<typeof playwright.chromium.launch>> | null = null

  try {
    browser = await playwright.chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    })
  } catch (e) {
    return { cookies: [], error: normalizeError(e) }
  }

  try {
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (compatible; CookieScan/1.0)",
      ignoreHTTPSErrors: true,
    })
    const page = await context.newPage()
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS)
    page.setDefaultTimeout(BROWSER_TIMEOUT_MS)

    console.log(`[scan] Navigation gestartet: ${targetUrl}`)
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: NAVIGATION_TIMEOUT_MS })
    console.log("[scan] Navigation abgeschlossen (domcontentloaded)")

    const baseHost = new URL(targetUrl).hostname

    const cookiesInitial = await collectContextCookies(context, "cookiesInitial")
    const documentCookiesInitial = await collectDocumentCookies(page, "cookiesInitial")

    await delay(INITIAL_WAIT_MS)
    const cookiesAfterWait = await collectContextCookies(context, "cookiesAfterWait")
    const documentCookiesAfterWait = await collectDocumentCookies(page, "cookiesAfterWait")

    let consentClickDetail: string | null = null
    if (consentMode === "accepted") {
      console.log("[scan] Consent-Modus aktiv: Suche nach Accept-Button")
      consentClickDetail = await attemptConsentAccept(page)
      if (!consentClickDetail) {
        console.log("[scan] Kein passender Consent-Button gefunden")
      }
    } else {
      console.log("[scan] Consent-Modus inaktiv")
    }

    if (consentClickDetail) {
      await delay(POST_CONSENT_WAIT_MS)
    }
    const cookiesAfterConsent = await collectContextCookies(context, "cookiesAfterConsent")
    const documentCookiesAfterConsent = await collectDocumentCookies(page, "cookiesAfterConsent")

    try {
      const viewport = page.viewportSize()
      const scrollY = viewport?.height ? Math.round(viewport.height * 0.5) : 300
      await page.mouse.move(100, 120)
      await page.mouse.move(220, 220)
      await page.mouse.wheel(0, scrollY)
      await delay(500)
      await page.mouse.wheel(0, -Math.round(scrollY / 2))
    } catch (e) {
      console.warn(`[scan] Interaktion konnte nicht vollständig simuliert werden: ${normalizeError(e)}`)
    }
    await delay(POST_INTERACTION_WAIT_MS)
    const cookiesAfterInteraction = await collectContextCookies(context, "cookiesAfterInteraction")
    const documentCookiesAfterInteraction = await collectDocumentCookies(page, "cookiesAfterInteraction")

    const phasedRawCookies = mergeRawCookiesPhased(
      baseHost,
      cookiesInitial,
      cookiesAfterWait,
      cookiesAfterConsent,
      cookiesAfterInteraction
    )
    const rawCookies = dedupeRawCookies(phasedRawCookies, baseHost)

    await browser.close()
    browser = null

    const seen = new Set<string>()
    const items: CookieItemInsert[] = []

    for (const c of rawCookies as RawScannedCookie[]) {
      const key = `${c.name}\t${c.domain}\t${c.path}`
      if (seen.has(key)) continue
      seen.add(key)
      const domain = c.domain ?? ""
      const path = c.path ?? "/"
      const isThirdParty =
        domain !== "" &&
        !domain.endsWith(baseHost) &&
        !baseHost.endsWith(domain.replace(/^\./, ""))
      let duration = "Session"
      if (c.expires != null && c.expires > 0) {
        const days = Math.round(
          (c.expires * 1000 - Date.now()) / (24 * 60 * 60 * 1000)
        )
        duration = days > 365 ? "1 Jahr+" : days > 0 ? `${days} Tage` : "Session"
      }
      items.push({
        scan_id: scanId,
        name: c.name,
        domain,
        path,
        category: null,
        purpose: null,
        duration,
        secure: c.secure ?? false,
        http_only: c.httpOnly ?? false,
        same_site: c.sameSite ?? null,
        provider: domain || null,
        source_url: targetUrl,
        is_third_party: isThirdParty,
        notes: null,
      })
    }
    console.log(`[scan] Finale Cookie-Anzahl: ${items.length}`)
    return {
      cookies: items,
      rawCookies: {
        phases: {
          cookiesInitial: cookiesInitial.length,
          cookiesAfterWait: cookiesAfterWait.length,
          cookiesAfterConsent: cookiesAfterConsent.length,
          cookiesAfterInteraction: cookiesAfterInteraction.length,
        },
        documentCookiePhases: {
          cookiesInitial: documentCookiesInitial.map((c) => c.name),
          cookiesAfterWait: documentCookiesAfterWait.map((c) => c.name),
          cookiesAfterConsent: documentCookiesAfterConsent.map((c) => c.name),
          cookiesAfterInteraction: documentCookiesAfterInteraction.map((c) => c.name),
        },
        consentClicked: consentClickDetail,
        cookies: rawCookies,
      },
    }
  } catch (e) {
    if (browser) {
      try {
        await browser.close()
      } catch {
        // ignore
      }
      browser = null
    }
    return { cookies: [], error: normalizeError(e) }
  }
}
