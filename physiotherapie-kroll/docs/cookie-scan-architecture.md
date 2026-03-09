# Cookie-Scan: Architektur (CMS + Worker)

## Übersicht

- **CMS (Next.js):** Erzeugt nur Scan-Jobs. Kein Playwright, kein Browser in der App-Runtime.
- **Worker (Docker/Node):** Holt Jobs aus Supabase, führt Playwright/Chromium-Scan aus, schreibt Ergebnisse zurück.
- **Endkunden** müssen nichts lokal installieren; der Worker läuft z. B. in Docker mit vorkonfiguriertem Chromium.

## Flow

1. Admin klickt „Scan starten“ → `POST /api/admin/cookie-scan/run` → Insert in `cookie_scans` mit `status='queued'`.
2. Worker pollt `cookie_scans` nach `status='queued'`, übernimmt einen Job atomar (`queued` → `running`), führt Scan aus, setzt `success`/`failed` und schreibt `cookie_scan_items`/`raw_result_json`.
3. Admin-UI listet Scans (queued/running/success/failed), pollt die Liste solange etwas „queued“ oder „running“ ist.
4. Öffentliche Cookie-Seite: `GET /api/cookie-scan/approved` liefert nur freigegebene Scans (`approval_status='approved'`); keine Playwright-Initialisierung.

## Statusmaschine

| Status   | Bedeutung |
|----------|-----------|
| `queued` | Job angelegt, wartet auf Worker |
| `running` | Worker hat Job übernommen, Scan läuft |
| `success` | Scan fertig, Ergebnisse in DB |
| `failed`  | Fehler oder Zombie-Bereinigung |

## Dateien / Verzeichnisse

- **CMS:** `src/app/api/admin/cookie-scan/` (run = nur Job anlegen; GET/PATCH wie bisher), `src/components/admin/CookieScanAdminClient.tsx`, `src/app/api/cookie-scan/approved/route.ts`.
- **Worker:** `cookie-scan-worker/` (eigenes Node-Projekt, Playwright, Supabase Service Role).
- **Migrationen:** `src/lib/supabase/migrations/` (u. a. `20250309_cookie_scan_worker_schema.sql` für optionale Spalten `started_at`, `finished_at`, `processed_by`).

## Worker starten

- Lokal: `cd cookie-scan-worker && npm i && npm run build && SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm start`
- Docker: `docker compose up -d cookie-scan-worker` (aus Projektroot, mit gesetzten ENV-Variablen).

Details und ENV: siehe `cookie-scan-worker/README.md`.

## Zombie-Scans

- Worker setzt beim Start und implizit beim Polling „running“-Jobs, die älter als 15 Minuten sind, auf `failed` (Meldung: Worker-Timeout/Zombie).
- Optional: manuelle Bereinigung per SQL (siehe Worker-README).

## Sicherheit

- Service-Role-Key nur im Worker und in CMS-Server-Routen; nie im Browser.
- Öffentlich nur `GET /api/cookie-scan/approved` mit Filter `approval_status='approved'`.
- Scan starten nur für authentifizierte Admins (`POST /api/admin/cookie-scan/run`).

## 5 manuelle Tests

1. **Job anlegen (ohne Worker):** Als Admin „Scan starten“ klicken → Toast „Scan in Warteschlange“, in der Liste erscheint ein Scan mit Status „Warteschlange“ (queued). Kein Browser startet im CMS.
2. **Worker verarbeitet Job:** Worker starten (lokal oder Docker), nach kurzer Zeit wechselt der Scan zu „running“, dann „success“ oder „failed“. Bei success: Cookie-Items in der DB und in der Detailansicht sichtbar.
3. **GET /api/cookie-scan/approved:** Ohne Auth aufrufen → 200, nur freigegebene Scans (approval_status=approved). Kein Crash bei fehlendem oder queued/running Scan.
4. **Zombie-Bereinigung:** Einen Scan manuell auf `running` setzen und `started_at` auf 20 Minuten in der Vergangenheit. Worker starten oder laufen lassen → nach Bereinigung (Start oder spätestens 5 Min) steht der Scan auf `failed` mit Meldung „Worker-Timeout (Zombie)“.
5. **Lokale URL blockieren:** Ohne `COOKIE_SCAN_ALLOW_LOCALHOST=true` einen Scan mit targetUrl `http://localhost:3000` starten → 400 mit Hinweis, öffentliche URL zu verwenden.
