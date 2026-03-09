# Cookie-Scan (Playwright)

Der Cookie-Scan nutzt Playwright mit Chromium, um die Website headless aufzurufen und Cookies aus dem Browser-Kontext zu erfassen (inkl. HttpOnly).

## Browser installieren

Nach `npm install` müssen die Playwright-Browser einmalig installiert werden:

```bash
npm run install:cookie-scan
```

bzw.

```bash
npx playwright install chromium
```

Ohne diesen Schritt schlägt der Scan mit einer Meldung wie „Executable doesn't exist … chromium_headless_shell“ fehl. Die Fehlermeldung im Admin weist darauf hin.

## Build / CI

- **Build:** Für `next build` wird Playwright/Chromium nicht benötigt.
- **Lokal:** Für den Admin „Cookie-Scan starten“ muss Chromium installiert sein (`npm run install:cookie-scan`).
- **Serverless (z. B. Vercel):** Playwright in einer Next.js API-Route ist dort in der Regel **nicht** geeignet (kein Chromium-Binary, Speicher, Timeout). Den Scan in einen Worker, Job-Queue oder externen Prozess auslagern; die Logik in `runCookieScan.ts` bleibt wiederverwendbar.

## Zombie-Scans bereinigen

Scans mit `status = 'running'` sollten durch die Run-Route nie dauerhaft bestehen bleiben (bei Fehler/Abwurf wird auf `failed` gesetzt). Falls dennoch alte „running“-Datensätze existieren, einmalig in der Supabase SQL-Konsole ausführen:

```sql
UPDATE public.cookie_scans
SET status = 'failed', error_message = 'Bereinigung: Scan war dauerhaft running.'
WHERE status = 'running';
```
