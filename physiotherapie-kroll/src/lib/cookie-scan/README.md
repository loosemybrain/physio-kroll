# Cookie-Scan (Next-App)

Der **Scan wird nicht in der App ausgeführt.** Das CMS legt nur Jobs an (`status=queued`). Ein separater **Cookie-Scan-Worker** (Docker/Node) holt die Jobs, führt Playwright/Chromium aus und schreibt die Ergebnisse in Supabase.

- **Worker:** siehe `cookie-scan-worker/README.md` und `docs/cookie-scan-architecture.md`.
- **Architektur:** CMS erzeugt Jobs → Worker verarbeitet → Admin-UI zeigt Status (queued/running/success/failed).
- Die frühere Datei `runCookieScan.ts` (Playwright in der App) wurde entfernt; die einzige Scan-Logik lebt im Worker. Die App enthält nur noch Hilfen wie `isLocalOrPrivateUrl.ts`.
