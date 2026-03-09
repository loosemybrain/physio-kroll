/**
 * @deprecated Scan wird vom Cookie-Scan-Worker (cookie-scan-worker/) ausgeführt.
 * Diese Datei wird von der App nicht mehr verwendet; Logik ist im Worker dupliziert.
 */
import "server-only"
import type { CookieScanItemInsert, RawScannedCookie } from "@/types/cookieScan"

const BROWSER_TIMEOUT_MS = 30_000
const NAVIGATION_TIMEOUT_MS = 15_000

/** Hinweis für fehlendes Chromium-Binary (nach "npx playwright install chromium"). */
export const COOKIE_SCAN_INSTALL_HINT =
  'Chromium für Playwright ist nicht installiert. Lokal ausführen: "npm run install:cookie-scan" bzw. "npx playwright install chromium".'

/**
 * Klassifiziert Launch-/Playwright-Fehler und liefert eine verständliche Meldung fürs Admin-UI.
 * Keine rohen Stacktraces nach außen.
 */
function normalizePlaywrightError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e)
  const lower = msg.toLowerCase()

  if (
    lower.includes("executable doesn't exist") ||
    lower.includes("chromium_headless_shell") ||
    lower.includes("browser executable doesn't exist")
  ) {
    return COOKIE_SCAN_INSTALL_HINT
  }
  if (lower.includes("timeout") || lower.includes("timed out")) {
    return `Timeout beim Cookie-Scan: ${msg.slice(0, 120)}`
  }
  if (lower.includes("net::") || lower.includes("econnrefused")) {
    return `Netzwerkfehler beim Aufruf der Ziel-URL: ${msg.slice(0, 100)}`
  }

  return msg.length > 200 ? `${msg.slice(0, 197)}…` : msg
}

/**
 * Führt einen Cookie-Scan per Headless-Browser durch.
 * Erfasst Cookies aus dem Browser-Kontext (inkl. HttpOnly, wenn vom Browser bereitgestellt).
 * Kein document.cookie – serverseitig/Playwright.
 *
 * Hosting-Hinweis: Läuft aktuell in der Next.js API-Route (in-process). Auf Serverless-Umgebungen
 * (z. B. Vercel) ist Playwright oft nicht geeignet (Binary, Speicher, Timeout). Scan dann in
 * Worker/Job/externem Prozess auslagern; diese Funktion als reine Scan-Logik wiederverwendbar halten.
 */
export async function runCookieScan(
  targetUrl: string,
  options: { consentMode?: "none" | "accepted"; environment?: string } = {}
): Promise<{ cookies: CookieScanItemInsert[]; error?: string }> {
  const consentMode = options.consentMode ?? "none"

  let playwright: typeof import("playwright")
  try {
    playwright = await import("playwright")
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return {
      cookies: [],
      error: `Playwright nicht geladen: ${err}. Bitte "npm run install:cookie-scan" ausführen.`,
    }
  }

  let browser: Awaited<ReturnType<typeof playwright.chromium.launch>> | null = null

  try {
    browser = await playwright.chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
  } catch (e) {
    return {
      cookies: [],
      error: normalizePlaywrightError(e),
    }
  }

  try {
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (compatible; CookieScan/1.0)",
      ignoreHTTPSErrors: true,
    })

    const page = await context.newPage()
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS)
    page.setDefaultTimeout(BROWSER_TIMEOUT_MS)

    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: NAVIGATION_TIMEOUT_MS })

    if (consentMode === "accepted") {
      try {
        const selectors = [
          '[data-testid="accept-cookies"]',
          '.cookie-accept',
          '#accept-cookies',
          'button:has-text("Alle akzeptieren")',
          'button:has-text("Akzeptieren")',
        ]
        for (const sel of selectors) {
          try {
            const loc = page.locator(sel).first()
            if ((await loc.count()) > 0) {
              await loc.click()
              await new Promise((r) => setTimeout(r, 2000))
              break
            }
          } catch {
            // Nächsten Selektor versuchen
          }
        }
      } catch {
        // Consent-Button nicht gefunden – weiter mit bisherigen Cookies
      }
    }

    const rawCookies = await context.cookies()
    await browser.close()
    browser = null

    const baseHost = new URL(targetUrl).hostname
    const seen = new Set<string>()
    const items: CookieScanItemInsert[] = []

    for (const c of rawCookies as RawScannedCookie[]) {
      const key = `${c.name}\t${c.domain}\t${c.path}`
      if (seen.has(key)) continue
      seen.add(key)

      const domain = c.domain ?? ""
      const path = c.path ?? "/"
      const isThirdParty = domain !== "" && !domain.endsWith(baseHost) && !baseHost.endsWith(domain.replace(/^\./, ""))

      let duration = ""
      if (c.expires != null && c.expires > 0) {
        const days = Math.round((c.expires * 1000 - Date.now()) / (24 * 60 * 60 * 1000))
        duration = days > 365 ? "1 Jahr+" : days > 0 ? `${days} Tage` : "Session"
      } else {
        duration = "Session"
      }

      items.push({
        scan_id: "", // wird vom Aufrufer gesetzt
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

    return { cookies: items }
  } catch (e) {
    if (browser) {
      try {
        await browser.close()
      } catch {
        // Ignorieren beim Aufräumen
      }
      browser = null
    }
    return {
      cookies: [],
      error: normalizePlaywrightError(e),
    }
  }
}

/**
 * Setzt scan_id in allen Items (nach Erstellen des Scans).
 */
export function assignScanId(items: CookieScanItemInsert[], scanId: string): CookieScanItemInsert[] {
  return items.map((it) => ({ ...it, scan_id: scanId }))
}
