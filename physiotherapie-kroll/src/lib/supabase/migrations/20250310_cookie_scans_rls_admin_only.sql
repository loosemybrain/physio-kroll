-- =============================================================================
-- Cookie-Scans: RLS verschärfen – kein pauschaler Zugriff für authenticated
-- =============================================================================
-- Bisher: authenticated hatte "admin full access" (alle Zeilen, alle Operationen).
-- Jetzt: Diese Policies werden entfernt. authenticated hat damit KEINE Berechtigung
-- mehr auf cookie_scans / cookie_scan_items.
--
-- Admin-Zugriffe laufen ausschließlich über die API mit Service Role (nach
-- serverseitiger Admin-Prüfung via requireAdminGuard). Worker nutzt Service Role.
--
-- anon: bestehende Policies "anon read approved cookie_scans" und
--       "anon read approved cookie_scan_items" bleiben unverändert (nur Lesen
--       freigegebener Daten). Sie werden in migrations-cookie-scans.sql bzw.
--       20250309_cookie_scans_schema_reconcile.sql angelegt.
-- =============================================================================

drop policy if exists "admin full access cookie_scans" on public.cookie_scans;
drop policy if exists "admin full access cookie_scan_items" on public.cookie_scan_items;
