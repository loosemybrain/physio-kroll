# Cookie-Scan: Synchronisation mit realem DB-Schema

## 1. Gefundene Schema-Mismatches

| Ort | Mismatch | Anpassung |
|-----|----------|-----------|
| **public.cookie_scans** | Spalte `updated_at` existiert in der DB **nicht** (reales Schema bestätigt ohne diese Spalte). | Alle SELECTs/Responses von `updated_at` entfernt; Fallback: `created_at` bzw. `scanned_at` für Anzeige/API-Feld `updatedAt`. |
| **GET /api/cookie-scan/approved** | Query selektierte `updated_at`; `.single()` wirft bei 0 Treffern. | Select ohne `updated_at`, mit `created_at`; `.maybeSingle()`; klare Trennung von Fehler vs. „kein Scan“. |
| **GET /api/admin/cookie-scan** | Select und `mapScanRow` nutzten `updated_at`. | Select ohne `updated_at`; `updatedAt` in der Response = `created_at`. |
| **GET /api/admin/cookie-scan/:id** | `select("*")` und Response `updatedAt: scan.updated_at`. | Expliziter Select nur realer Spalten; `updatedAt: scan.created_at`. |
| **CookieScanTable.tsx** | Select `updated_at`; Stand-Label nutzte `scan.updated_at`. | Select `created_at` statt `updated_at`; `updatedAt` = `scanned_at ?? created_at ?? ""`; `.maybeSingle()`. |
| **Types (cookieScan.ts)** | `CookieScan.updated_at: string` als Pflichtfeld. | `updated_at` optional (`updated_at?: string`) mit JSDoc-Hinweis, dass die API `created_at`/`scanned_at` als Fallback liefert. |

**cookie_scan_items:** Es wurde nur das Schema von `cookie_scans` bestätigt. Alle Verwendungen von `cookie_scan_items` referenzieren nur Spalten, die im bisherigen Modell und in der bestehenden Migration vorkommen (`id`, `scan_id`, `name`, `domain`, `path`, `category`, `purpose`, `duration`, `secure`, `http_only`, `same_site`, `provider`, `source_url`, `is_third_party`, `notes`, `created_at`). Es wurden **keine** Referenzen auf `updated_at` oder andere nicht vorhandene Spalten bei Items gefunden; daher keine Code-Änderungen an cookie_scan_items.

---

## 2. Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `src/app/api/cookie-scan/approved/route.ts` | Select ohne `updated_at`, mit `created_at`; `.maybeSingle()`; Fehler und „kein Scan“ getrennt; Response `updatedAt`: `scanned_at ?? created_at ?? null`. |
| `src/app/api/admin/cookie-scan/route.ts` | Select ohne `updated_at`; `mapScanRow.updatedAt` = `created_at`. |
| `src/app/api/admin/cookie-scan/[id]/route.ts` | Expliziter Select (kein `*`) nur realer Spalten; Response `updatedAt`: `created_at`. |
| `src/app/api/admin/cookie-scan/run/route.ts` | Kommentar im catch: Garantie, dass running → failed gesetzt wird. |
| `src/components/legal/CookieScanTable.tsx` | Select `created_at` statt `updated_at`; `.maybeSingle()`; `updatedAt` = `scanned_at ?? created_at ?? ""`. |
| `src/types/cookieScan.ts` | `CookieScan.updated_at` optional (`updated_at?: string`) + JSDoc. |
| **Neu** `docs/cookie-scan-schema-sync.md` | Diese Dokumentation. |

---

## 3. updated_at: Entfernt (nicht nachgezogen)

- **Entscheidung:** `updated_at` wurde **nicht** in der Datenbank nachgezogen.
- **Code:** Alle Abfragen und Responses wurden auf das **reale Schema ohne updated_at** umgestellt.
- **Semantik:** Wo die API oder die UI ein „Aktualisierungsdatum“ brauchen (z. B. für „Stand“ oder Listen), wird **`created_at`** bzw. **`scanned_at`** verwendet:
  - Admin-Liste: `updatedAt` = `created_at`
  - Approved-API / CookieScanTable: `updatedAt` = `scanned_at ?? created_at` (bzw. `null` wenn beide fehlen)

---

## 4. Garantie: running → failed / success

- **Beim Start:** Insert mit `status: "running"`.
- **Bei Erfolg:** Update `status: "success"`, `error_message: null`, `scanned_at: now`.
- **Bei Scan-Fehler:** Update `status: "failed"`, `error_message: <Meldung>`, `scanned_at: now`.
- **Im catch (z. B. unerwarteter Fehler):** `ensureScanNotStuckRunning(supabase, scanId, "…")` setzt jeden Scan mit `id = scanId` und `status = 'running'` auf `status: "failed"` und setzt `error_message` sowie `scanned_at`. Der Aufruf ist in einem try/catch; Fehler werden nur geloggt, damit die 500-Response trotzdem zurückgeht. Damit bleibt **kein Scan dauerhaft auf „running“** stehen.

---

## 5. Fünf manuelle Tests

1. **GET /api/cookie-scan/approved (ohne freigegebenen Scan)**  
   - Erwartung: 200, Body `{ scan: null, items: [], message: "Kein freigegebener Cookie-Scan vorhanden." }`, kein Fehler wegen fehlender Spalte oder `.single()`.

2. **GET /api/cookie-scan/approved (mit freigegebenem Scan)**  
   - Erwartung: 200, `scan` mit `targetUrl`, `scannedAt`, `updatedAt` (aus `scanned_at`/`created_at`), `items` Array; keine Referenz auf `updated_at` in der DB.

3. **GET /api/admin/cookie-scan (als Admin)**  
   - Erwartung: 200, `scans` mit Einträgen, jeder mit `updatedAt` (aus `created_at`); keine Spaltenfehler.

4. **POST /api/admin/cookie-scan/run (Erfolg)**  
   - Erwartung: 200, `status: "success"`; in DB: `status = 'success'`, `error_message` null.  
   - Optional: Unmittelbar danach einen weiteren Request absichtlich fehlschlagen lassen (z. B. ungültige URL oder Timeout) und prüfen: `status: "failed"`, `error_message` gesetzt; in DB kein `running` für diesen Scan.

5. **Cookie-Seite (Tabelle)**  
   - Mit freigegebenem Scan: Tabelle und „Stand“ werden aus `scanned_at` bzw. `created_at` angezeigt, ohne `updated_at`.  
   - Ohne freigegebenen Scan: Hinweistext, kein Laufzeitfehler.
