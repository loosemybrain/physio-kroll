# Cookie-Scan (CMS-Seite)

Der **Scan wird nicht mehr in der App ausgeführt.** Das CMS legt nur Jobs an (`status=queued`). Ein separater **Cookie-Scan-Worker** (Docker/Node) holt die Jobs, führt Playwright/Chromium aus und schreibt die Ergebnisse in Supabase.

- **Worker:** siehe `cookie-scan-worker/README.md` und `docs/cookie-scan-architecture.md`.
- **Architektur:** CMS erzeugt Jobs → Worker verarbeitet → Admin-UI zeigt Status (queued/running/success/failed).
- Die Datei `runCookieScan.ts` wird von der App **nicht mehr verwendet**; die Scan-Logik lebt im Worker.
