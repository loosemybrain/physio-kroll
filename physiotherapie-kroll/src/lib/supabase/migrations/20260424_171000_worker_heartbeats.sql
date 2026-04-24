create table if not exists public.worker_heartbeats (
  worker_id text not null,
  type text not null,
  status text not null check (status in ('running', 'idle', 'stale', 'offline')),
  last_seen_at timestamptz not null default now(),
  heartbeat_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  primary key (worker_id, type)
);

create index if not exists idx_worker_heartbeats_last_seen_at
  on public.worker_heartbeats(last_seen_at desc);
