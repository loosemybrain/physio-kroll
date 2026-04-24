create table if not exists public.system_health_checks (
  id bigserial primary key,
  type text not null,
  status text not null check (status in ('ok', 'warning', 'error')),
  latency_ms integer not null,
  message text not null,
  checked_at timestamptz not null default now()
);

create index if not exists idx_system_health_checks_checked_at
  on public.system_health_checks(checked_at desc);
