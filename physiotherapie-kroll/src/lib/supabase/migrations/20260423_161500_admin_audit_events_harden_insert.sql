-- Hardening follow-up:
-- No direct INSERT from regular authenticated clients into admin_audit_events.
-- Writes are expected via trusted server-side paths (service_role / server-only code).

DROP POLICY IF EXISTS admin_audit_events_insert_admin_owner ON public.admin_audit_events;

REVOKE INSERT ON TABLE public.admin_audit_events FROM authenticated;
REVOKE INSERT ON TABLE public.admin_audit_events FROM anon;
