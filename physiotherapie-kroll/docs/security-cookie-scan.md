# Cookie-Scan: Sicherheitsmodell

## Source of Truth für „Admin“

- **Admin-Check:** `public.admin_users` + RPC `public.is_admin(uuid)` (siehe Migration `20260402120000_admin_users_and_is_admin.sql`). Ersten Admin per SQL (Service Role / SQL Editor) in `admin_users` eintragen.

Die Prüfung erfolgt **nur serverseitig** in den API-Routen über den zentralen Guard `requireAdminGuard()` in `src/lib/auth/adminGuard.ts`.

## Gültige Status- und Approval-Werte

- **status (Laufzustand):** `queued` | `running` | `success` | `failed`. Die DB und der Worker kennen kein `idle` mehr (historisch nach queued migriert).
- **approval_status (Freigabe):** `draft` | `reviewed` | `approved` | `rejected`. API und UI unterstützen alle vier Werte.

## Routen-Klassifikation

| Route | Zugriff | Beschreibung |
|-------|---------|--------------|
| `GET /api/cookie-scan/approved` | **Public** (anon) | Liest nur Scans mit `approval_status = 'approved'`. Keine Auth. Keine sensiblen Felder in der Response. |
| `GET /api/admin/cookie-scan` | **Admin** | Liste aller Scans. 401 wenn nicht eingeloggt, 403 wenn nicht Admin. |
| `POST /api/admin/cookie-scan/run` | **Admin** | Scan-Job anlegen. 401/403 wie oben. Lokale/private URLs blockiert (Bypass: COOKIE_SCAN_ALLOW_LOCALHOST=true). |
| `GET /api/admin/cookie-scan/:id` | **Admin** | Ein Scan inkl. Items. 401/403. |
| `PATCH /api/admin/cookie-scan/:id` | **Admin** | approval_status setzen (draft|reviewed|approved|rejected). 401/403. |
| `PATCH /api/admin/cookie-scan/:id/items/:itemId` | **Admin** | Item bearbeiten. 401/403. |
| Worker (RPC/DB) | **Internal** | Nutzt ausschließlich Service Role; keine HTTP-Route. |

## RLS und Server-Guards

- **RLS:** Auf `cookie_scans` und `cookie_scan_items` gibt es **keine** Policy für `authenticated`. Nur `anon` hat eine Policy: SELECT mit `approval_status = 'approved'` (bzw. Items zu solchen Scans). Admin-Zugriffe laufen nicht über RLS, sondern über Service Role nach Guard.
- **Admin-API:** Nach erfolgreicher Prüfung mit `requireAdminGuard()` nutzen die Routen `getSupabaseAdmin()` (Service Role). Damit umgehen sie RLS; die Berechtigung wird vollständig im Code durch den Guard durchgesetzt. Die Admin-API ruft **keine** Worker-RPCs auf.
- **Worker:** Nutzt Service Role (SUPABASE_SERVICE_ROLE_KEY). RLS wird umgangen. Die Queue-/Worker-RPCs sind **nur für service_role** ausführbar (Migration 20250311_cookie_scan_rpc_service_role_only.sql). `authenticated` und `anon` haben **kein** EXECUTE auf diese RPCs.

## Worker-RPCs (service_role only)

Folgende Funktionen dürfen **nur** mit Service Role aufgerufen werden:

- `public.cookie_scan_claim_next_job(p_worker_id text)`
- `public.cookie_scan_mark_zombies_failed(p_stale_minutes int)`
- `public.cookie_scan_complete_job(p_scan_id uuid, p_success boolean, p_error_message text)`

Nach der Migration haben nur noch `service_role` EXECUTE. Der Cookie-Scan-Worker (Docker) verwendet den Service-Role-Key und ist damit der einzige vorgesehene Aufrufer.

## Berechtigungsmatrix (final)

| Kontext | cookie_scans | cookie_scan_items | Worker-RPCs (claim/zombie/complete) |
|---------|--------------|-------------------|-------------------------------------|
| **Public Route** (GET /api/cookie-scan/approved) | Kein direkter Zugriff; Route nutzt getSupabasePublic() → anon. RLS: SELECT nur Zeilen mit approval_status = 'approved'. | Wie links (über Join/Subquery); RLS: SELECT nur Items zu approved Scans. | Kein Zugriff. |
| **Admin-Routen** | Über getSupabaseAdmin() (Service Role). Vollzugriff nach Guard. | Wie links. | Werden nicht aufgerufen; Admin legt nur Jobs an (INSERT). |
| **Worker / Internal** | Über Service Role (RPC + direkte UPDATE/INSERT). | Über Service Role. | EXECUTE nur service_role. |
| **anon** | SELECT nur approved. Kein INSERT/UPDATE/DELETE. | SELECT nur zu approved Scans. | Kein EXECUTE. |
| **authenticated** | Keine RLS-Policy → kein Zugriff. | Keine RLS-Policy → kein Zugriff. | Kein EXECUTE (nach Migration). |

## Keine sensiblen Daten in Public-Response

Die Route `GET /api/cookie-scan/approved` selektiert nur: `id`, `target_url`, `scanned_at`, `approval_status`, `created_at`. Es werden **nicht** ausgegeben: `error_message`, `raw_result_json`, `status` (queued/running/failed), `processed_by`, `processing_token` usw. Bei Fehlern erhält der Client eine generische Meldung; Details werden nur serverseitig geloggt.

## Private/Local URL-Validierung

Beim Anlegen eines Scan-Jobs (POST /api/admin/cookie-scan/run) werden lokale/private Ziel-URLs abgelehnt, sofern nicht `COOKIE_SCAN_ALLOW_LOCALHOST=true` gesetzt ist. Abgedeckt: localhost, 127.0.0.1, ::1, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, .local, IPv6 link-local (fe80::/10), unique-local (fd00::/8). Zentraler Helper: `src/lib/cookie-scan/isLocalOrPrivateUrl.ts`.

## Manuelle Sicherheitstests

1. **Nicht eingeloggt:** GET/POST/PATCH auf alle `/api/admin/cookie-scan*` ohne Cookie → 401, Body `{ "error": "Nicht authentifiziert." }`.
2. **Eingeloggt, nicht Admin:** User ohne Zeile in `public.admin_users` → 403, Body z. B. `{ "error": "Keine Berechtigung." }`.
3. **Admin:** User mit `user_id` in `public.admin_users` → 200/201 wie erwartet.
4. **Public approved:** GET `/api/cookie-scan/approved` ohne Auth → 200, nur freigegebene Daten; Response enthält kein `error_message`, kein `status` (außer implizit über gefilterte Daten).
5. **Direkter DB-Zugriff (anon):** Mit anon Key z. B. `supabase.from('cookie_scans').select('*')` → nur Zeilen mit `approval_status = 'approved'` (RLS). Kein INSERT/UPDATE/DELETE für anon.
6. **Worker-RPC mit anon/authenticated:** RPC-Aufruf mit anon oder authenticated Key → 403/Fehler; nur mit Service Role erfolgreich.

## 5 Verifikationstests (Konsistenz & Härtung)

1. **Worker-RPC nur service_role:** Nach Anwendung der Migration `20250311_cookie_scan_rpc_service_role_only.sql`: Mit anon- oder authenticated-Key `supabase.rpc('cookie_scan_claim_next_job', { p_worker_id: 'test' })` ausführen → erwarteter Fehler (kein EXECUTE). Mit Service-Role-Key → Aufruf möglich (leeres Ergebnis wenn keine queued Jobs).
2. **Status-Werte:** In DB und API kommen nur noch `queued`, `running`, `success`, `failed` vor. Admin-UI zeigt keine "idle"-Badges für Scans. Typ `CookieScanStatus` in `src/types/cookieScan.ts` enthält kein `idle`.
3. **Approval "rejected":** Im Admin-UI kann ein Scan auf "Abgelehnt" (rejected) gesetzt werden. PATCH `/api/admin/cookie-scan/:id` mit `{ "approvalStatus": "rejected" }` → 200; DB enthält `approval_status = 'rejected'`. Public-Route liefert weiterhin nur `approved`-Scans.
4. **Private URL 172.16:** POST `/api/admin/cookie-scan/run` mit `targetUrl: "https://172.16.1.1/"` ohne `COOKIE_SCAN_ALLOW_LOCALHOST` → 400 mit Hinweis auf private Adressen. Mit `COOKIE_SCAN_ALLOW_LOCALHOST=true` → 201 (wenn gewünscht für lokale Tests).
5. **Public approved unverändert:** GET `/api/cookie-scan/approved` ohne Auth → 200; nur Einträge mit `approval_status = 'approved'`; Response-Felder unverändert (kein status, kein error_message).
