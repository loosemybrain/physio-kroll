# Cookie-Scan: Soll-Ist-Schema-Analyse

## 1. Vom Code erwartetes Schema (Soll)

### Tabelle `public.cookie_scans`

| Spalte | Typ | Nullable | Default | Verwendung im Code |
|--------|-----|----------|---------|---------------------|
| `id` | uuid | NOT NULL (PK) | gen_random_uuid() | Alle Routes, Types |
| `target_url` | text | NOT NULL | – | run/route (insert), admin/route (select), [id]/route (select), approved (select), CookieScanTable |
| `environment` | text | NOT NULL | 'production' | run/route (insert), admin/route (select), [id]/route (select) |
| `scanned_at` | timestamptz | NULL | – | run/route (update), admin/route, [id]/route, approved, CookieScanTable |
| `status` | cookie_scan_status | NOT NULL | 'idle' | run/route (insert/update), admin/route (select), [id]/route (select) |
| `consent_mode` | text | NOT NULL | 'none' | run/route (insert), admin/route, [id]/route |
| `raw_result_json` | jsonb | NULL | – | Types; Admin-Liste erwähnt "null raw_result_json" |
| `approval_status` | cookie_scan_approval_status | NOT NULL | 'draft' | run/route (insert), admin/route, [id]/route (select/PATCH), approved (filter/select), CookieScanTable (filter), RLS |
| `error_message` | text | NULL | – | run/route (update failed/success), admin/route (select), [id]/route (select) |
| `created_at` | timestamptz | NOT NULL | now() | admin/route (select/order), [id]/route (select) |
| `updated_at` | timestamptz | NOT NULL | now() | admin/route, [id]/route, approved, CookieScanTable; Trigger set_updated_at |

**Enums:**  
- `cookie_scan_status`: 'idle' \| 'running' \| 'success' \| 'failed'  
- `cookie_scan_approval_status`: 'draft' \| 'reviewed' \| 'approved'

---

### Tabelle `public.cookie_scan_items`

| Spalte | Typ | Nullable | Default | Verwendung im Code |
|--------|-----|----------|---------|---------------------|
| `id` | uuid | NOT NULL (PK) | gen_random_uuid() | Alle Routes, Types |
| `scan_id` | uuid | NOT NULL | – | FK cookie_scans(id) ON DELETE CASCADE; run (insert), [id]/route, approved, items/[itemId] |
| `name` | text | NOT NULL | – | run (insert), Selects, Types |
| `domain` | text | NOT NULL | '' | run (insert), Selects |
| `path` | text | NOT NULL | '/' | run (insert), Selects |
| `category` | text | NULL | – | run (insert), [id]/route, items (PATCH), approved, CookieScanTable |
| `purpose` | text | NULL | – | wie category |
| `duration` | text | NULL | – | wie category |
| `secure` | boolean | NOT NULL | false | run (insert), Selects |
| `http_only` | boolean | NOT NULL | false | run (insert), Selects |
| `same_site` | text | NULL | – | run (insert), Selects |
| `provider` | text | NULL | – | run (insert), [id]/route, items (PATCH), approved |
| `source_url` | text | NULL | – | run (insert), Types |
| `is_third_party` | boolean | NOT NULL | false | run (insert), Selects |
| `notes` | text | NULL | – | run (insert), [id]/route, items (PATCH) |
| `created_at` | timestamptz | NOT NULL | now() | [id]/route (select), Types |

**Constraint:** `unique (scan_id, name, domain, path)`.

---

## 2. Reales vorheriges Schema (Ist – angenommener Teilbestand)

Wenn die Tabelle `cookie_scans` nachträglich angelegt und `approval_status` bzw. weitere Spalten nachgezogen wurden, kann die DB in einem dieser Zustände sein:

- **Typischer Fehler:** `column cookie_scans.error_message does not exist`  
  → Tabelle hatte beim Anlegen **keine** Spalte `error_message`.
- Mögliche weitere fehlende Spalten (wenn nur eine ältere Version der Migration lief):
  - `error_message`
  - `approval_status`
  - `updated_at`
  - ggf. `environment`, `status` (als Enum), `consent_mode`, `raw_result_json`

**Annahme „minimales Ist“ (nur Basis-Spalten vorhanden):**

- `cookie_scans`: `id`, `target_url`, `scanned_at`, `created_at` (und evtl. weitere, aber **ohne** `error_message`, `approval_status`, `updated_at`).
- `cookie_scan_items`: kann vollständig oder mit gleichen Namen wie Soll sein; fehlende Spalten wären z. B. `source_url`, `notes`, `created_at` usw.

Die Reconcile-Migration geht davon aus: **Tabellen existieren**, aber es können **beliebige Spalten aus dem Soll-Schema fehlen**. Sie fügt nur fehlende Spalten hinzu und ändert keine Datentypen oder löscht Daten.

---

## 3. Migrations-SQL (Reconcile)

Die Migration liegt unter:

**`src/lib/supabase/migrations/20250309_cookie_scans_schema_reconcile.sql`**

Kurzüberblick:

- Enums `cookie_scan_status` und `cookie_scan_approval_status` anlegen (falls nicht vorhanden).
- Für `cookie_scans`: jede Soll-Spalte prüfen; wenn fehlend, `ALTER TABLE ... ADD COLUMN` mit passendem Typ/Default (idempotent).
- Für `cookie_scan_items`: dasselbe für alle Soll-Spalten.
- Indizes: `cookie_scans(status)`, `cookie_scans(approval_status)`, `cookie_scans(created_at desc)`, `cookie_scan_items(scan_id)` (alle `IF NOT EXISTS`).
- Funktion `public.set_updated_at()` sicherstellen, Trigger `cookie_scans_set_updated_at` auf `cookie_scans`.
- RLS aktivieren und Policies für Admin (authenticated) und Anon (nur Lesen von `approval_status = 'approved'`) setzen.

Voraussetzung: Die Tabellen `cookie_scans` und `cookie_scan_items` existieren bereits (z. B. durch `migrations-cookie-scans.sql`). Wenn sie noch nicht existieren, zuerst die vollständige Anlage-Migration ausführen, danach diese Reconcile-Migration (dann fügt sie ggf. keine Spalten hinzu, ist aber harmlos).

---

## 4. Geänderte / relevante Dateien

| Datei | Änderung |
|-------|----------|
| **Neu:** `src/lib/supabase/migrations/20250309_cookie_scans_schema_reconcile.sql` | Reconcile-Migration: fehlende Spalten + Indizes + Trigger + RLS. |
| `src/lib/supabase/migrations-cookie-scans.sql` | Unverändert; bleibt Referenz für „volle“ Neuanlage. |
| `src/types/cookieScan.ts` | Unverändert; entspricht dem Soll-Schema. |
| `src/app/api/admin/cookie-scan/route.ts` | Unverändert; verwendet nur Soll-Spalten. |
| `src/app/api/admin/cookie-scan/run/route.ts` | Unverändert; setzt success/failed und `error_message` korrekt. |
| `src/app/api/admin/cookie-scan/[id]/route.ts` | Unverändert; select/update nur Soll-Spalten. |
| `src/app/api/cookie-scan/approved/route.ts` | Unverändert; filtert auf `approval_status = 'approved'`. |
| `src/components/legal/CookieScanTable.tsx` | Unverändert; select nur Soll-Spalten. |
| `src/app/api/admin/cookie-scan/[id]/items/[itemId]/route.ts` | Unverändert; PATCH nur category, purpose, provider, notes. |

Es wurden **keine** Referenzen auf nicht existierende Spalten gefunden. Einzige Anpassung: neue Migration; Code bleibt wie er ist.

---

## 5. Statuslogik (success / failed ⇔ error_message)

- **success:**  
  - `run/route.ts`: nach erfolgreichem Scan  
    `.update({ status: "success", scanned_at: ..., error_message: null })`  
  → `error_message` ist explizit `null`.

- **failed:**  
  - Bei Scan-Fehler:  
    `.update({ status: "failed", error_message: scanError, scanned_at: ... })`  
  - Bei Catch (ensureScanNotStuckRunning):  
    `.update({ status: "failed", error_message: errorMessage, scanned_at: ... })`  
  → `error_message` ist gesetzt.

Damit gilt im Code: **success ⇒ error_message null**, **failed ⇒ error_message gesetzt**. Keine Anpassung nötig.

---

## 6. Fünf Verifikationstests

1. **Migration anwenden (idempotent)**  
   - `20250309_cookie_scans_schema_reconcile.sql` auf die bestehende Supabase-DB anwenden (Supabase SQL Editor oder CLI).  
   - Erwartung: Kein Fehler; bei erneuter Ausführung ebenfalls kein Fehler.

2. **Spalten prüfen**  
   - In Supabase: Table Editor → `cookie_scans` → Spalten prüfen.  
   - Erwartung: Unter anderem `error_message`, `approval_status`, `updated_at`, `environment`, `status`, `consent_mode`, `raw_result_json`, `target_url`, `scanned_at`, `created_at` vorhanden.

3. **Admin-Liste**  
   - GET `/api/admin/cookie-scan` (als Admin).  
   - Erwartung: 200, JSON mit `scans`; keine Meldung „column … does not exist“.

4. **Scan ausführen**  
   - POST `/api/admin/cookie-scan/run` mit `{ "targetUrl": "https://example.com" }`.  
   - Erwartung: 200, `status: "success"` oder `"failed"`; bei failed `error_message` im Response; in DB bei success `error_message` null, bei failed `error_message` gesetzt.

5. **Öffentliche Cookie-Seite**  
   - GET `/api/cookie-scan/approved` (ohne Auth).  
   - Erwartung: 200, entweder `scan: null, items: []` oder ein Scan mit `targetUrl`, `scannedAt`, `updatedAt` und Items ohne Fehler zu fehlenden Spalten.

---

## Kurzfassung

- **Soll-Schema** ist oben vollständig beschrieben und mit dem Code (Types, API-Routes, CookieScanTable) abgeglichen.
- **Ist** wurde als „Tabellen existieren, können aber ohne error_message/approval_status/updated_at usw. existieren“ angenommen.
- **Migrations-SQL** ist die Reconcile-Migration in `migrations/20250309_cookie_scans_schema_reconcile.sql`.
- **Geänderte Dateien:** nur die neue Migration; Code unverändert und ohne Referenzen auf nicht existierende Spalten.
- **Statuslogik** ist konsistent: success ⇒ `error_message` null, failed ⇒ `error_message` gesetzt.
- **Verifikation:** Migration anwenden, Spalten prüfen, Admin-Liste, Scan run, Approved-API testen.
