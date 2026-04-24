-- Admin audit event store for dashboard/security observability.
-- Service-role writes are allowed (service_role typically bypasses RLS in Supabase).

CREATE TABLE IF NOT EXISTS public.admin_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  category text NOT NULL,
  severity text NOT NULL,
  outcome text NOT NULL,
  actor_user_id uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  target_user_id uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  route text NULL,
  entity_type text NULL,
  entity_id text NULL,
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT admin_audit_events_category_check
    CHECK (category IN ('auth', 'security', 'user', 'content', 'operations', 'compliance')),
  CONSTRAINT admin_audit_events_severity_check
    CHECK (severity IN ('info', 'warning', 'high', 'critical')),
  CONSTRAINT admin_audit_events_outcome_check
    CHECK (outcome IN ('success', 'failure', 'info'))
);

CREATE INDEX IF NOT EXISTS admin_audit_events_created_at_desc_idx
  ON public.admin_audit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_events_category_idx
  ON public.admin_audit_events (category);
CREATE INDEX IF NOT EXISTS admin_audit_events_event_type_idx
  ON public.admin_audit_events (event_type);
CREATE INDEX IF NOT EXISTS admin_audit_events_actor_user_id_idx
  ON public.admin_audit_events (actor_user_id);
CREATE INDEX IF NOT EXISTS admin_audit_events_target_user_id_idx
  ON public.admin_audit_events (target_user_id);

ALTER TABLE public.admin_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_audit_events_select_admin_owner ON public.admin_audit_events;
CREATE POLICY admin_audit_events_select_admin_owner
ON public.admin_audit_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role_id IN ('admin', 'owner')
  )
);

DROP POLICY IF EXISTS admin_audit_events_insert_admin_owner ON public.admin_audit_events;
CREATE POLICY admin_audit_events_insert_admin_owner
ON public.admin_audit_events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role_id IN ('admin', 'owner')
  )
);
