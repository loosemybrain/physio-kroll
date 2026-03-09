# Cookie-Scan-Worker

Separater Worker für Cookie-Scans. Playwright/Chromium läuft **nur hier**, nicht im CMS. Das CMS legt nur Jobs (`status=queued`) an; der Worker holt sie, führt den Scan aus und schreibt Ergebnisse in Supabase.

## Start

```bash
cd cookie-scan-worker
npm install
npm run build
# ENV setzen (siehe unten)
npm start
```

## Docker

```bash
# Im Projektroot (physiotherapie-kroll)
docker compose build cookie-scan-worker
docker compose up -d cookie-scan-worker
```

Oder nur Worker-Build im Worker-Verzeichnis:

```bash
cd cookie-scan-worker
docker build -t cookie-scan-worker .
docker run --env-file .env cookie-scan-worker
```

## ENV-Variablen

| Variable | Pflicht | Beschreibung |
|----------|--------|--------------|
| `SUPABASE_URL` | ja | Supabase-Projekt-URL (z. B. `https://xxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | ja | Service-Role-Key (niemals im Client verwenden) |
| `COOKIE_SCAN_POLL_INTERVAL` | nein | Polling-Intervall in ms (Standard: 5000) |
| `COOKIE_SCAN_WORKER_ID` | nein | Kennung dieses Workers (z. B. für `processed_by`) |
| `COOKIE_SCAN_ZOMBIE_STALE_MINUTES` | nein | Minuten nach denen running-Jobs als Zombie gelten (Standard: 15) |

## Ablauf

1. **CMS:** Admin klickt „Scan starten“ → `POST /api/admin/cookie-scan/run` legt einen Eintrag in `cookie_scans` mit `status='queued'` an.
2. **Worker:** Pollt regelmäßig nach Zeilen mit `status='queued'` (älteste zuerst).
3. **Übernahme:** Worker ruft die RPC `cookie_scan_claim_next_job(worker_id)` auf. Die Datenbank wählt atomar einen queued-Job (ältester zuerst), setzt `status='running'`, `started_at`, `processing_token`, `processed_by` und gibt den Datensatz zurück. Kein anderes Worker-Instanz erhält denselben Job (FOR UPDATE SKIP LOCKED).
4. **Scan:** Playwright/Chromium öffnet `target_url`, sammelt Cookies, schließt den Browser.
5. **Ergebnis:** Bei Erfolg: `status='success'`, `scanned_at`/`finished_at`, Einträge in `cookie_scan_items`, `raw_result_json`. Bei Fehler: `status='failed'`, `error_message`.
6. **Zombies:** Beim Start und periodisch wird die RPC `cookie_scan_mark_zombies_failed(stale_minutes)` aufgerufen. „running“-Jobs älter als die Schwelle werden auf `failed` gesetzt (Zombie-Recovery). Schwelle: ENV `COOKIE_SCAN_ZOMBIE_STALE_MINUTES` (Standard 15).

## Statusmaschine

- `queued` → vom CMS gesetzt beim Anlegen
- `running` → Worker hat den Job übernommen
- `success` → Scan fertig, Items geschrieben
- `failed` → Fehler oder Zombie-Bereinigung

## Fehlerbilder

- **Chromium nicht installiert:** Im Docker-Image ist Chromium enthalten (Playwright-Basis-Image). Lokal ohne Docker: `npx playwright install chromium` im Worker-Verzeichnis.
- **SUPABASE_URL/KEY fehlt:** Worker beendet sich mit Fehlermeldung.
- **Job bleibt queued:** Kein Worker läuft oder Worker kann Supabase nicht erreichen.
- **Job bleibt running:** Worker abgestürzt oder Timeout; nach 15 Minuten setzt der nächste Worker-Lauf (oder derselbe nach Neustart) den Job auf `failed` (Zombie-Bereinigung).

## Manuelle Zombie-Bereinigung

Falls kein Worker läuft und alte `running`-Einträge bereinigt werden sollen:

```sql
UPDATE public.cookie_scans
SET status = 'failed', error_message = 'Manuelle Bereinigung: running ohne Worker.'
WHERE status = 'running';
```
