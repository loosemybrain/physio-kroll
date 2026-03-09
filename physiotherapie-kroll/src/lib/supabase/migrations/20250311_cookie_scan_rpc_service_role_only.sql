-- =============================================================================
-- Cookie-Scan: Worker-/Queue-RPCs nur für service_role
-- =============================================================================
-- Bisher: authenticated und service_role hatten EXECUTE auf die drei RPCs.
-- Ziel: Nur service_role darf diese RPCs aufrufen (Worker nutzt Service Role).
-- Admin-API nutzt getSupabaseAdmin() (Service Role) für Tabellenzugriff und
-- ruft diese RPCs nicht auf – daher kein Bedarf für authenticated.
--
-- Defensiv: Zuerst revoke von authenticated und public, dann grant nur service_role.
-- anon wurde bereits in 20250310_cookie_scans_queue_robust.sql entzogen.
-- =============================================================================

-- Revoke EXECUTE von authenticated (und public, falls irgendwo vererbt)
revoke execute on function public.cookie_scan_claim_next_job(text) from authenticated;
revoke execute on function public.cookie_scan_claim_next_job(text) from public;

revoke execute on function public.cookie_scan_mark_zombies_failed(int) from authenticated;
revoke execute on function public.cookie_scan_mark_zombies_failed(int) from public;

revoke execute on function public.cookie_scan_complete_job(uuid, boolean, text) from authenticated;
revoke execute on function public.cookie_scan_complete_job(uuid, boolean, text) from public;

-- Sicherstellen: Nur service_role hat EXECUTE (grant ist idempotent)
grant execute on function public.cookie_scan_claim_next_job(text) to service_role;
grant execute on function public.cookie_scan_mark_zombies_failed(int) to service_role;
grant execute on function public.cookie_scan_complete_job(uuid, boolean, text) to service_role;

-- Kommentar: Nach dieser Migration dürfen nur noch Aufrufer mit service_role
-- (z. B. Cookie-Scan-Worker mit SUPABASE_SERVICE_ROLE_KEY) diese RPCs nutzen.
