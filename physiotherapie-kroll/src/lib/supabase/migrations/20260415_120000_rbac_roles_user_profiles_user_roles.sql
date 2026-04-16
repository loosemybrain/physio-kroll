-- RBAC-Light foundation (roles, user_profiles, user_roles)
-- Source of truth for authorization becomes public.user_roles.
-- Idempotent migration: safe to re-run.

-- ---------------------------------------------------------------------------
-- 1) Base tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
  id text PRIMARY KEY,
  label text NOT NULL,
  description text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_profiles_status_check CHECK (status IN ('active', 'invited', 'disabled'))
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role_id text NOT NULL REFERENCES public.roles (id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles (role_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles (status);

-- ---------------------------------------------------------------------------
-- 2) Role seeds (idempotent)
-- ---------------------------------------------------------------------------
INSERT INTO public.roles (id, label, description)
VALUES
  ('user', 'User', 'Default role for authenticated users'),
  ('editor', 'Editor', 'Can edit content when granted by policy'),
  ('admin', 'Admin', 'Administrative access'),
  ('owner', 'Owner', 'Top-level administrative access')
ON CONFLICT (id) DO UPDATE
SET
  label = EXCLUDED.label,
  description = EXCLUDED.description;

-- ---------------------------------------------------------------------------
-- 3) Utility trigger function for updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_profiles_set_updated_at ON public.user_profiles;
CREATE TRIGGER user_profiles_set_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4) Role helper functions (source of truth: user_roles)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_has_role(_user_id uuid, _role_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role_id = _role_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role_id IN ('admin', 'owner')
  );
$$;

REVOKE ALL ON FUNCTION public.user_has_role(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_role(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- 5) Automatic profile + default role assignment on new auth.users
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user_rbac()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, status)
  VALUES (NEW.id, 'active')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_rbac ON auth.users;
CREATE TRIGGER on_auth_user_created_rbac
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user_rbac();

REVOKE ALL ON FUNCTION public.handle_new_auth_user_rbac() FROM PUBLIC;

-- Backfill for existing users: profile + default user role
INSERT INTO public.user_profiles (user_id, status)
SELECT u.id, 'active'
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, 'user'
FROM auth.users u
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Legacy migration: existing admin_users => user_roles.admin
INSERT INTO public.user_roles (user_id, role_id)
SELECT au.user_id, 'admin'
FROM public.admin_users au
ON CONFLICT (user_id, role_id) DO NOTHING;

COMMENT ON TABLE public.admin_users IS
'LEGACY admin list. Maintained for compatibility/migration history; production authorization source is public.user_roles.';

-- ---------------------------------------------------------------------------
-- 6) RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roles_select_authenticated ON public.roles;
CREATE POLICY roles_select_authenticated
ON public.roles
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS roles_service_role_all ON public.roles;
CREATE POLICY roles_service_role_all
ON public.roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS user_profiles_select_own ON public.user_profiles;
CREATE POLICY user_profiles_select_own
ON public.user_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_profiles_service_role_all ON public.user_profiles;
CREATE POLICY user_profiles_service_role_all
ON public.user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS user_roles_select_own ON public.user_roles;
CREATE POLICY user_roles_select_own
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_roles_service_role_all ON public.user_roles;
CREATE POLICY user_roles_service_role_all
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMENT ON TABLE public.roles IS
'Role catalog for RBAC-Light. Authorization source of truth is public.user_roles.';

COMMENT ON TABLE public.user_profiles IS
'Profile/status metadata for authenticated users.';

COMMENT ON TABLE public.user_roles IS
'User to role assignments. Canonical authorization source of truth.';
