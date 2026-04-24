create table if not exists public.admin_security_profile_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text,
  role_ids text[] not null default '{}'::text[],
  is_admin_owner boolean not null default false,
  mfa_enabled boolean not null default false,
  mfa_verified boolean not null default false,
  current_aal text,
  snapshot_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_security_profile_snapshots_is_admin_owner
  on public.admin_security_profile_snapshots(is_admin_owner);

create index if not exists idx_admin_security_profile_snapshots_updated_at
  on public.admin_security_profile_snapshots(updated_at desc);
