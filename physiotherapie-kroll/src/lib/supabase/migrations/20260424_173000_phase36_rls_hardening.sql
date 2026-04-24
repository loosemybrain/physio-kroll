alter table public.admin_security_profile_snapshots enable row level security;
alter table public.admin_security_profile_snapshots force row level security;

alter table public.worker_heartbeats enable row level security;
alter table public.worker_heartbeats force row level security;

alter table public.system_health_checks enable row level security;
alter table public.system_health_checks force row level security;

comment on table public.admin_security_profile_snapshots is
  'Server-only read/write via service role; no browser access.';
comment on table public.worker_heartbeats is
  'Server-only read/write via service role; no browser access.';
comment on table public.system_health_checks is
  'Server-only read/write via service role; no browser access.';

revoke insert, update, delete on public.admin_security_profile_snapshots from anon, authenticated;
revoke insert, update, delete on public.worker_heartbeats from anon, authenticated;
revoke insert, update, delete on public.system_health_checks from anon, authenticated;

revoke select on public.admin_security_profile_snapshots from anon, authenticated;
revoke select on public.worker_heartbeats from anon, authenticated;
revoke select on public.system_health_checks from anon, authenticated;

drop policy if exists admin_security_profile_snapshots_select_admin on public.admin_security_profile_snapshots;
drop policy if exists worker_heartbeats_select_admin on public.worker_heartbeats;
drop policy if exists system_health_checks_select_admin on public.system_health_checks;

drop policy if exists admin_security_profile_snapshots_service_role_all on public.admin_security_profile_snapshots;
create policy admin_security_profile_snapshots_service_role_all
on public.admin_security_profile_snapshots
for all
to service_role
using (true)
with check (true);

drop policy if exists worker_heartbeats_service_role_all on public.worker_heartbeats;
create policy worker_heartbeats_service_role_all
on public.worker_heartbeats
for all
to service_role
using (true)
with check (true);

drop policy if exists system_health_checks_service_role_all on public.system_health_checks;
create policy system_health_checks_service_role_all
on public.system_health_checks
for all
to service_role
using (true)
with check (true);
