/**
 * Cookie-Scan-Logik für den Worker. Playwright läuft nur hier, nicht im CMS.
 */
const BROWSER_TIMEOUT_MS = 30_000;
const NAVIGATION_TIMEOUT_MS = 15_000;
function normalizeError(e) {
    const msg = e instanceof Error ? e.message : String(e);
    const lower = msg.toLowerCase();
    if (lower.includes("executable doesn't exist") ||
        lower.includes("chromium_headless_shell") ||
        lower.includes("browser executable doesn't exist")) {
        return "Chromium nicht installiert (Playwright). Im Container: Browser-Binaries müssen im Image sein.";
    }
    if (lower.includes("timeout") || lower.includes("timed out")) {
        return `Timeout: ${msg.slice(0, 120)}`;
    }
    if (lower.includes("net::") || lower.includes("econnrefused")) {
        return `Netzwerkfehler: ${msg.slice(0, 100)}`;
    }
    return msg.length > 200 ? `${msg.slice(0, 197)}…` : msg;
}
/**
 * Führt einen Cookie-Scan per Playwright/Chromium durch.
 * Browser wird immer geschlossen (inkl. bei Fehler).
 */
export async function runScan(targetUrl, options = { scanId: "" }) {
    const consentMode = options.consentMode ?? "none";
    const scanId = options.scanId ?? "";
    const playwright = await import("playwright");
    let browser = null;
    try {
        browser = await playwright.chromium.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        });
    }
    catch (e) {
        return { cookies: [], error: normalizeError(e) };
    }
    try {
        const context = await browser.newContext({
            userAgent: "Mozilla/5.0 (compatible; CookieScan/1.0)",
            ignoreHTTPSErrors: true,
        });
        const page = await context.newPage();
        page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);
        page.setDefaultTimeout(BROWSER_TIMEOUT_MS);
        await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: NAVIGATION_TIMEOUT_MS });
        if (consentMode === "accepted") {
            const selectors = [
                '[data-testid="accept-cookies"]',
                ".cookie-accept",
                "#accept-cookies",
                'button:has-text("Alle akzeptieren")',
                'button:has-text("Akzeptieren")',
            ];
            for (const sel of selectors) {
                try {
                    const loc = page.locator(sel).first();
                    if ((await loc.count()) > 0) {
                        await loc.click();
                        await new Promise((r) => setTimeout(r, 2000));
                        break;
                    }
                }
                catch {
                    // continue
                }
            }
        }
        const rawCookies = await context.cookies();
        await browser.close();
        browser = null;
        const baseHost = new URL(targetUrl).hostname;
        const seen = new Set();
        const items = [];
        for (const c of rawCookies) {
            const key = `${c.name}\t${c.domain}\t${c.path}`;
            if (seen.has(key))
                continue;
            seen.add(key);
            const domain = c.domain ?? "";
            const path = c.path ?? "/";
            const isThirdParty = domain !== "" &&
                !domain.endsWith(baseHost) &&
                !baseHost.endsWith(domain.replace(/^\./, ""));
            let duration = "Session";
            if (c.expires != null && c.expires > 0) {
                const days = Math.round((c.expires * 1000 - Date.now()) / (24 * 60 * 60 * 1000));
                duration = days > 365 ? "1 Jahr+" : days > 0 ? `${days} Tage` : "Session";
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
            });
        }
        return { cookies: items, rawCookies };
    }
    catch (e) {
        if (browser) {
            try {
                await browser.close();
            }
            catch {
                // ignore
            }
            browser = null;
        }
        return { cookies: [], error: normalizeError(e) };
    }
}
