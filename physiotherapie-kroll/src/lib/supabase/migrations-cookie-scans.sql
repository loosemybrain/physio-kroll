-- Cookie-Scans: Speicherung von Scan-Ergebnissen (headless-browser-basiert)
-- Nur Admin kann Scans starten; Cookie-Seite zeigt nur freigegebene Scans.

-- Scan-Status: Laufzustand des Scans
do $$ begin
  create type cookie_scan_status as enum ('idle', 'running', 'success', 'failed');
exception when duplicate_object then null; end $$;

-- Freigabe-Status: Sichtbarkeit auf der Cookie-Seite
do $$ begin
  create type cookie_scan_approval_status as enum ('draft', 'reviewed', 'approved');
exception when duplicate_object then null; end $$;

-- cookie_scans
create table if not exists public.cookie_scans (
  id uuid primary key default gen_random_uuid(),
  target_url text not null,
  environment text not null default 'production',
  scanned_at timestamptz,
  status cookie_scan_status not null default 'idle',
  consent_mode text not null default 'none',
  raw_result_json jsonb,
  approval_status cookie_scan_approval_status not null default 'draft',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cookie_scans_status_idx on public.cookie_scans(status);
create index if not exists cookie_scans_approval_idx on public.cookie_scans(approval_status);
create index if not exists cookie_scans_created_idx on public.cookie_scans(created_at desc);

-- cookie_scan_items (einzelne Cookies pro Scan)
create table if not exists public.cookie_scan_items (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.cookie_scans(id) on delete cascade,
  name text not null,
  domain text not null default '',
  path text not null default '/',
  category text,
  purpose text,
  duration text,
  secure boolean not null default false,
  http_only boolean not null default false,
  same_site text,
  provider text,
  source_url text,
  is_third_party boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  constraint cookie_scan_items_unique_per_scan unique (scan_id, name, domain, path)
);

create index if not exists cookie_scan_items_scan_id_idx on public.cookie_scan_items(scan_id);

-- updated_at Trigger
drop trigger if exists cookie_scans_set_updated_at on public.cookie_scans;
create trigger cookie_scans_set_updated_at
before update on public.cookie_scans
for each row execute function public.set_updated_at();

-- RLS: Admin (authenticated) full access; anon read nur für approved (über API mit Filter)
alter table public.cookie_scans enable row level security;
alter table public.cookie_scan_items enable row level security;

drop policy if exists "admin full access cookie_scans" on public.cookie_scans;
create policy "admin full access cookie_scans"
on public.cookie_scans for all
to authenticated
using (true)
with check (true);

drop policy if exists "admin full access cookie_scan_items" on public.cookie_scan_items;
create policy "admin full access cookie_scan_items"
on public.cookie_scan_items for all
to authenticated
using (true)
with check (true);

-- Anon: nur Lesen freigegebener Scans (für Cookie-Seite)
drop policy if exists "anon read approved cookie_scans" on public.cookie_scans;
create policy "anon read approved cookie_scans"
on public.cookie_scans for select
to anon
using (approval_status = 'approved');

drop policy if exists "anon read approved cookie_scan_items" on public.cookie_scan_items;
create policy "anon read approved cookie_scan_items"
on public.cookie_scan_items for select
to anon
using (
  exists (
    select 1 from public.cookie_scans s
    where s.id = cookie_scan_items.scan_id and s.approval_status = 'approved'
  )
);
