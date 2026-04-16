-- LEGACY bootstrap (replaced as source of truth by user_roles in 20260415_120000_rbac_roles_user_profiles_user_roles.sql)
-- Idempotent / safe to re-run where DROP/CREATE allows

-- ---------------------------------------------------------------------------
-- A) admin_users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_users_select_own ON public.admin_users;
CREATE POLICY admin_users_select_own
ON public.admin_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- C) is_admin (SECURITY DEFINER, für RLS + App-Guard via RPC)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = _user_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;
