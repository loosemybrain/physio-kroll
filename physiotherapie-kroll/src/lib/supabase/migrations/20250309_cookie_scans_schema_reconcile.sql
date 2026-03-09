-- Reconcile-Migration: Cookie-Scans Schema an Code anpassen
-- Fügt nur fehlende Spalten hinzu, zerstört keine Daten.
-- Idempotent: kann mehrfach ausgeführt werden (Spalten werden nur angelegt, wenn nicht vorhanden).
-- Voraussetzung: Tabelle public.cookie_scans existiert (ggf. aus migrations-cookie-scans.sql).

-- 1) Enums sicher anlegen (falls noch nicht vorhanden)
do $$ begin
  create type cookie_scan_status as enum ('idle', 'running', 'success', 'failed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cookie_scan_approval_status as enum ('draft', 'reviewed', 'approved');
exception when duplicate_object then null; end $$;

-- 2) cookie_scans: fehlende Spalten hinzufügen (nur wenn Tabelle existiert)
do $$
declare
  cols text[] := array[
    'target_url', 'environment', 'scanned_at', 'status', 'consent_mode',
    'raw_result_json', 'approval_status', 'error_message', 'created_at', 'updated_at'
  ];
  col text;
begin
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'cookie_scans') then
    return;
  end if;
  foreach col in array cols
  loop
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'cookie_scans' and column_name = col
    ) then
      case col
        when 'target_url'       then execute 'alter table public.cookie_scans add column target_url text';
        when 'environment'      then execute 'alter table public.cookie_scans add column environment text not null default ''production''';
        when 'scanned_at'       then execute 'alter table public.cookie_scans add column scanned_at timestamptz';
        when 'status'           then execute 'alter table public.cookie_scans add column status cookie_scan_status not null default ''idle''';
        when 'consent_mode'     then execute 'alter table public.cookie_scans add column consent_mode text not null default ''none''';
        when 'raw_result_json'  then execute 'alter table public.cookie_scans add column raw_result_json jsonb';
        when 'approval_status'  then execute 'alter table public.cookie_scans add column approval_status cookie_scan_approval_status not null default ''draft''';
        when 'error_message'    then execute 'alter table public.cookie_scans add column error_message text';
        when 'created_at'       then execute 'alter table public.cookie_scans add column created_at timestamptz not null default now()';
        when 'updated_at'       then execute 'alter table public.cookie_scans add column updated_at timestamptz not null default now()';
        else null;
      end case;
    end if;
  end loop;
end $$;

-- 3) Fehlende Spalten in cookie_scans nachfüllen (bei bestehenden Zeilen ohne approval_status/status etc.)
-- approval_status: wo NULL oder Spalte fehlte → Default setzen (bereits durch ADD COLUMN default abgedeckt)
-- Für Tabellen, die VOR dem Enum/Spalten-Update angelegt wurden: ggf. bestehende Spalte "status" als text → Enum konvertieren wurde weggelassen, da "add column" nur bei Fehlen.

-- 4) cookie_scan_items: fehlende Spalten hinzufügen (nur wenn Tabelle existiert)
do $$
declare
  cols text[] := array[
  'scan_id', 'name', 'domain', 'path', 'category', 'purpose', 'duration',
  'secure', 'http_only', 'same_site', 'provider', 'source_url', 'is_third_party', 'notes', 'created_at'
  ];
  col text;
begin
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'cookie_scan_items') then
    return;
  end if;
  foreach col in array cols
  loop
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'cookie_scan_items' and column_name = col
    ) then
      case col
        when 'scan_id'       then execute 'alter table public.cookie_scan_items add column scan_id uuid references public.cookie_scans(id) on delete cascade';
        when 'name'          then execute 'alter table public.cookie_scan_items add column name text not null default ''''';
        when 'domain'        then execute 'alter table public.cookie_scan_items add column domain text not null default ''''';
        when 'path'          then execute 'alter table public.cookie_scan_items add column path text not null default ''/''';
        when 'category'      then execute 'alter table public.cookie_scan_items add column category text';
        when 'purpose'       then execute 'alter table public.cookie_scan_items add column purpose text';
        when 'duration'      then execute 'alter table public.cookie_scan_items add column duration text';
        when 'secure'        then execute 'alter table public.cookie_scan_items add column secure boolean not null default false';
        when 'http_only'     then execute 'alter table public.cookie_scan_items add column http_only boolean not null default false';
        when 'same_site'     then execute 'alter table public.cookie_scan_items add column same_site text';
        when 'provider'      then execute 'alter table public.cookie_scan_items add column provider text';
        when 'source_url'    then execute 'alter table public.cookie_scan_items add column source_url text';
        when 'is_third_party'then execute 'alter table public.cookie_scan_items add column is_third_party boolean not null default false';
        when 'notes'         then execute 'alter table public.cookie_scan_items add column notes text';
        when 'created_at'    then execute 'alter table public.cookie_scan_items add column created_at timestamptz not null default now()';
        else null;
      end case;
    end if;
  end loop;
end $$;

-- 5) Indizes (nur anlegen wenn nicht vorhanden)
create index if not exists cookie_scans_status_idx on public.cookie_scans(status);
create index if not exists cookie_scans_approval_idx on public.cookie_scans(approval_status);
create index if not exists cookie_scans_created_idx on public.cookie_scans(created_at desc);
create index if not exists cookie_scan_items_scan_id_idx on public.cookie_scan_items(scan_id);

-- 6) set_updated_at muss existieren (wird von anderen Migrationen angelegt)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 7) Trigger für updated_at auf cookie_scans
drop trigger if exists cookie_scans_set_updated_at on public.cookie_scans;
create trigger cookie_scans_set_updated_at
before update on public.cookie_scans
for each row execute function public.set_updated_at();

-- 8) RLS (Policies nur anlegen/ersetzen, keine Datenänderung)
alter table public.cookie_scans enable row level security;
alter table public.cookie_scan_items enable row level security;

drop policy if exists "admin full access cookie_scans" on public.cookie_scans;
create policy "admin full access cookie_scans"
on public.cookie_scans for all to authenticated using (true) with check (true);

drop policy if exists "admin full access cookie_scan_items" on public.cookie_scan_items;
create policy "admin full access cookie_scan_items"
on public.cookie_scan_items for all to authenticated using (true) with check (true);

drop policy if exists "anon read approved cookie_scans" on public.cookie_scans;
create policy "anon read approved cookie_scans"
on public.cookie_scans for select to anon using (approval_status = 'approved');

drop policy if exists "anon read approved cookie_scan_items" on public.cookie_scan_items;
create policy "anon read approved cookie_scan_items"
on public.cookie_scan_items for select to anon
using (
  exists (
    select 1 from public.cookie_scans s
    where s.id = cookie_scan_items.scan_id and s.approval_status = 'approved'
  )
);
