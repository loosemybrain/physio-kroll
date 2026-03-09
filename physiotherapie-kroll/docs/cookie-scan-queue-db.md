# Cookie-Scan: Queue-/Worker-Schema und RPCs (DB-Ebene)

## Zweck

- **Queue-Flow:** CMS legt nur Jobs mit `status='queued'` an; Worker übernehmen atomar.
- **Keine doppelte Verarbeitung:** Eine PostgreSQL-RPC wählt genau einen queued-Job aus und setzt ihn auf `running` – nur ein Worker erhält den Job.
- **Zombie-Recovery:** Veraltete `running`-Jobs können per RPC auf `failed` gesetzt werden.
- **Klare Constraints:** `status` und `approval_status` sind eingeschränkt; Alt-Daten werden migriert.

---

## 1. Neue/erweiterte Spalten (public.cookie_scans)

| Spalte | Typ | Nullable | Default | Zweck |
|--------|-----|----------|---------|--------|
| `updated_at` | timestamptz | NOT NULL | now() | Wird bei jedem UPDATE per Trigger gesetzt |
| `started_at` | timestamptz | NULL | – | Zeitpunkt, zu dem ein Worker den Job übernommen hat |
| `finished_at` | timestamptz | NULL | – | Zeitpunkt des Abschlusses (success/failed) |
| `processing_token` | uuid | NULL | – | Einmaliger Token pro Übernahme; optional für Idempotenz |
| `processed_by` | text | NULL | – | Worker-Kennung (z. B. Hostname, Container-ID) |
| `retry_count` | integer | NOT NULL | 0 | Anzahl Retries (für spätere Erweiterung) |
| `last_heartbeat_at` | timestamptz | NULL | – | Optional: letzter Lebenszeichen des Workers |

---

## 2. Constraints

- **cookie_scans_status_check:** `status IN ('queued', 'running', 'success', 'failed')`
- **cookie_scans_approval_status_check:** `approval_status IN ('draft', 'reviewed', 'approved', 'rejected')`

Alt-Werte vor Einführung der Constraints:
- `status = 'idle'` → wird auf `queued` gesetzt
- Sonstige ungültige Status → `failed` mit Fehlermeldung
- Ungültige `approval_status` → `draft`

---

## 3. Trigger

- **cookie_scans_set_updated_at:** BEFORE UPDATE auf `cookie_scans` → setzt `new.updated_at = now()`.
- Nutzt die bestehende Funktion `public.set_updated_at()`.

---

## 4. RPC-Funktionen

### cookie_scan_claim_next_job(p_worker_id text)

- **Zweck:** Atomare Job-Übernahme. Wählt einen Datensatz mit `status='queued'` (ältester nach `created_at`), sperrt ihn mit `FOR UPDATE SKIP LOCKED`, setzt `status='running'`, `started_at=now()`, `updated_at=now()`, `processing_token=gen_random_uuid()`, `processed_by=p_worker_id` und gibt den aktualisierten Datensatz zurück.
- **Rückgabe:** Ein Zeile (oder leer, wenn kein queued-Job).
- **Nur serverseitig** (Service Role / authenticated); `anon` hat kein EXECUTE.

### cookie_scan_mark_zombies_failed(p_stale_minutes int DEFAULT 15)

- **Zweck:** Zombie-Recovery. Setzt alle Zeilen mit `status='running'` und `coalesce(started_at, created_at) < now() - p_stale_minutes` auf `status='failed'`, setzt `error_message` und `finished_at`, `updated_at`.
- **Rückgabe:** Anzahl der aktualisierten Zeilen (int).
- **Nur serverseitig.**

### cookie_scan_complete_job(p_scan_id uuid, p_success boolean, p_error_message text DEFAULT NULL)

- **Zweck:** Job abschließen. Nur Zeilen mit `id=p_scan_id` und `status='running'` werden aktualisiert. Bei `p_success=true`: `status='success'`, `finished_at=now()`, `error_message=null`. Bei `p_success=false`: `status='failed'`, `error_message=coalesce(p_error_message, 'Unbekannter Fehler')`, `finished_at=now()`.
- **Rückgabe:** boolean (ob mindestens eine Zeile aktualisiert wurde).
- **Hinweis:** Der Worker kann weiterhin direkt `UPDATE cookie_scans SET ...` ausführen (z. B. um zusätzlich `scanned_at`, `raw_result_json` zu setzen). Die RPC ist eine Alternative für einheitliches Abschließen.

---

## 5. Indizes

- `cookie_scans_status_idx` auf `(status)`
- `cookie_scans_approval_status_idx` auf `(approval_status)`
- `cookie_scans_created_at_idx` auf `(created_at desc)`
- `cookie_scans_queued_created_idx` auf `(created_at asc)` WHERE `status = 'queued'`
- `cookie_scans_running_started_idx` auf `(coalesce(started_at, created_at))` WHERE `status = 'running'`
- `cookie_scans_processing_token_idx` auf `(processing_token)` WHERE `processing_token IS NOT NULL`

---

## 6. Migration

**Datei:** `src/lib/supabase/migrations/20250310_cookie_scans_queue_robust.sql`

- Enthält alle oben genannten Änderungen (Spalten, Migrations-Updates für Alt-Daten, Constraints, Trigger, RPCs, Indizes, Berechtigungen).
- Idempotent wo sinnvoll (Spalten nur bei IF NOT EXISTS, Constraints nur wenn nicht vorhanden).
- Keine destruktiven Drops; bestehende Daten bleiben erhalten.

---

## 7. Fünf manuelle Verifikationstests

1. **Migration anwenden**  
   SQL in Supabase ausführen. Erwartung: Kein Fehler; bei erneuter Ausführung keine Duplikat-Fehler (idempotent).

2. **Claim-RPC**  
   Als Service Role: `select * from cookie_scan_claim_next_job('test-worker');` – einmal mit einem queued-Job: eine Zeile mit `status='running'`, `processed_by='test-worker'`, `processing_token` gesetzt. Zweiter Aufruf sofort danach: keine weitere Zeile (gleicher Job nicht nochmal). Neuer queued-Job: wird beim nächsten Aufruf zurückgegeben.

3. **Doppelte Verarbeitung verhindern**  
   Zwei parallele Aufrufe von `cookie_scan_claim_next_job('worker-a')` und `cookie_scan_claim_next_job('worker-b')` bei zwei queued-Jobs: Jeder Worker erhält genau einen unterschiedlichen Job (verschiedene `id`).

4. **Zombie-RPC**  
   Einen Datensatz manuell auf `status='running'`, `started_at = now() - interval '20 minutes'` setzen. Dann `select cookie_scan_mark_zombies_failed(15);` ausführen. Erwartung: Rückgabe 1; der Datensatz hat `status='failed'` und eine Fehlermeldung.

5. **Öffentliche/Admin-Queries**  
   GET `/api/cookie-scan/approved`: nur Zeilen mit `approval_status='approved'`; Antwort enthält keine queued/running-Jobs. GET `/api/admin/cookie-scan`: Liste mit allen Status (queued, running, success, failed) und `updated_at`; kein 500 bei fehlenden oder neuen Spalten.
