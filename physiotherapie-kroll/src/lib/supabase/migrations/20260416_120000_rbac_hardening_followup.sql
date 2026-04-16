-- RBAC hardening follow-up
-- - atomic role update function
-- - operational user active check
-- - display_name backfill/trigger hardening
-- - defensive legacy admin migration

-- Harden shared trigger function context.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;

-- Helper: active means status != disabled (missing profile treated as active).
CREATE OR REPLACE FUNCTION public.is_user_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT (up.status IS DISTINCT FROM 'disabled')
      FROM public.user_profiles up
      WHERE up.user_id = _user_id
    ),
    true
  );
$$;

REVOKE ALL ON FUNCTION public.is_user_active(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_user_active(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_active(uuid) TO service_role;

-- Atomic role replacement for admin user management routes.
CREATE OR REPLACE FUNCTION public.admin_set_user_roles(
  _target_user_id uuid,
  _roles text[],
  _assigned_by uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text;
BEGIN
  IF _target_user_id IS NULL THEN
    RAISE EXCEPTION 'target user id required';
  END IF;

  IF _roles IS NULL OR array_length(_roles, 1) IS NULL THEN
    RAISE EXCEPTION 'roles required';
  END IF;

  -- Validate role ids exist.
  FOREACH _role IN ARRAY _roles LOOP
    IF NOT EXISTS (SELECT 1 FROM public.roles r WHERE r.id = _role) THEN
      RAISE EXCEPTION 'unknown role: %', _role;
    END IF;
  END LOOP;

  DELETE FROM public.user_roles
  WHERE user_id = _target_user_id;

  INSERT INTO public.user_roles (user_id, role_id, assigned_by)
  SELECT _target_user_id, DISTINCT_ROLE.role_id, _assigned_by
  FROM (
    SELECT DISTINCT unnest(_roles) AS role_id
  ) AS DISTINCT_ROLE;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_roles(uuid, text[], uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_roles(uuid, text[], uuid) TO service_role;

-- Refresh auth user trigger to propagate display_name from metadata.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user_rbac()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _display_name text;
BEGIN
  _display_name := NULLIF(
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      NEW.raw_user_meta_data ->> 'name',
      NEW.raw_user_meta_data ->> 'full_name'
    ),
    ''
  );

  INSERT INTO public.user_profiles (user_id, display_name, status)
  VALUES (NEW.id, _display_name, 'active')
  ON CONFLICT (user_id) DO UPDATE
  SET display_name = COALESCE(public.user_profiles.display_name, EXCLUDED.display_name);

  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Backfill display names where still missing.
UPDATE public.user_profiles up
SET display_name = NULLIF(
  COALESCE(
    u.raw_user_meta_data ->> 'display_name',
    u.raw_user_meta_data ->> 'name',
    u.raw_user_meta_data ->> 'full_name'
  ),
  ''
)
FROM auth.users u
WHERE u.id = up.user_id
  AND (up.display_name IS NULL OR btrim(up.display_name) = '');

-- Defensive legacy admin migration (table may not exist in every environment).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'admin_users'
  ) THEN
    INSERT INTO public.user_roles (user_id, role_id)
    SELECT au.user_id, 'admin'
    FROM public.admin_users au
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
END;
$$;

