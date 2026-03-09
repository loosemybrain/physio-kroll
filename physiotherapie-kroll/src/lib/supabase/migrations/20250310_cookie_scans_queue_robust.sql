-- =============================================================================
-- Cookie-Scans: Queue-/Worker-taugliches Schema + atomare Job-Übernahme
-- =============================================================================
-- Zweck:
--   - CMS erzeugt nur Jobs mit status='queued'
--   - Worker übernimmt Jobs atomar (keine doppelte Verarbeitung)
--   - Zombie-Jobs (running zu lange) sind erkennbar und bereinigbar
--   - updated_at, started_at, finished_at, processing_token für klare Zustände
--
-- Bestehende Daten werden nicht gelöscht; Alt-Statuswerte werden migriert.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Fehlende Spalten ergänzen (idempotent)
-- -----------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'cookie_scans') then
    return;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cookie_scans' and column_name = 'updated_at') then
    alter table public.cookie_scans add column updated_at timestamptz not null default now();
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cookie_scans' and column_name = 'started_at') then
    alter table public.cookie_scans add column started_at timestamptz;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cookie_scans' and column_name = 'finished_at') then
    alter table public.cookie_scans add column finished_at timestamptz;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cookie_scans' and column_name = 'processing_token') then
    alter table public.cookie_scans add column processing_token uuid;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cookie_scans' and column_name = 'processed_by') then
    alter table public.cookie_scans add column processed_by text;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cookie_scans' and column_name = 'retry_count') then
    alter table public.cookie_scans add column retry_count integer not null default 0;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cookie_scans' and column_name = 'last_heartbeat_at') then
    alter table public.cookie_scans add column last_heartbeat_at timestamptz;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 2. Alt-Statuswerte migrieren (vor Constraint)
-- Nur ausführen, wenn status-Spalte existiert und ggf. alte Werte vorkommen.
-- Erlaubte Ziel-Status: queued, running, success, failed
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cookie_scans' and column_name = 'status') then
    return;
  end if;
  -- 'idle' -> 'queued' (kann vom Worker übernommen werden)
  update public.cookie_scans set status = 'queued' where status = 'idle';
  -- Alle anderen unbekannten Werte -> 'failed', damit kein Wildwuchs
  update public.cookie_scans
  set status = 'failed', error_message = coalesce(error_message, 'Migration: unbekannter Status bereinigt.')
  where status is null or status not in ('queued', 'running', 'success', 'failed');
end $$;

-- -----------------------------------------------------------------------------
-- 3. Check-Constraints für status (nur wenn noch nicht vorhanden)
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.cookie_scans'::regclass and conname = 'cookie_scans_status_check'
  ) then
    alter table public.cookie_scans
    add constraint cookie_scans_status_check
    check (status in ('queued', 'running', 'success', 'failed'));
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 4. Check-Constraint für approval_status (draft, reviewed, approved, rejected)
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.cookie_scans'::regclass and conname = 'cookie_scans_approval_status_check'
  ) then
    -- Zuerst evtl. unbekannte Werte auf 'draft' setzen
    update public.cookie_scans
    set approval_status = 'draft'
    where approval_status is null or approval_status not in ('draft', 'reviewed', 'approved', 'rejected');
    alter table public.cookie_scans
    add constraint cookie_scans_approval_status_check
    check (approval_status in ('draft', 'reviewed', 'approved', 'rejected'));
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 5. Trigger-Funktion für updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. Trigger auf cookie_scans (updated_at bei jedem UPDATE)
-- -----------------------------------------------------------------------------
drop trigger if exists cookie_scans_set_updated_at on public.cookie_scans;
create trigger cookie_scans_set_updated_at
  before update on public.cookie_scans
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 7. RPC: Atomare Job-Übernahme
-- -----------------------------------------------------------------------------
-- Ein Worker ruft diese Funktion auf; genau ein queued-Job wird ausgewählt,
-- auf running gesetzt und zurückgegeben. Kein anderer Worker erhält denselben Job.
-- Sortierung: created_at asc (ältester zuerst). SKIP LOCKED verhindert Konflikte.
-- Verwendung: supabase.rpc('cookie_scan_claim_next_job', { p_worker_id: 'worker-1' })
-- -----------------------------------------------------------------------------
create or replace function public.cookie_scan_claim_next_job(p_worker_id text)
returns setof public.cookie_scans
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  -- Atomare Übernahme: einen queued-Job auswählen und sofort sperren
  select id into v_id
  from public.cookie_scans
  where status = 'queued'
  order by created_at asc
  limit 1
  for update skip locked;

  if v_id is null then
    return;
  end if;

  -- Denselben Datensatz auf running setzen und zurückgeben
  return query
  update public.cookie_scans c
  set
    status = 'running',
    started_at = now(),
    updated_at = now(),
    processing_token = gen_random_uuid(),
    processed_by = p_worker_id
  where c.id = v_id
  returning c.*;
end;
$$;

comment on function public.cookie_scan_claim_next_job(text) is
'Übernimmt atomar einen queued-Job (ältester zuerst). Nur ein Worker erhält den Job. RPC nur serverseitig (Service Role) nutzen.';

-- -----------------------------------------------------------------------------
-- 8. RPC: Zombie-Bereinigung (running-Jobs älter als X Minuten -> failed)
-- -----------------------------------------------------------------------------
-- Verwendung: supabase.rpc('cookie_scan_mark_zombies_failed', { p_stale_minutes: 15 })
-- -----------------------------------------------------------------------------
create or replace function public.cookie_scan_mark_zombies_failed(p_stale_minutes int default 15)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cutoff timestamptz;
  v_count int;
begin
  v_cutoff := now() - (p_stale_minutes || ' minutes')::interval;

  with updated as (
    update public.cookie_scans
    set
      status = 'failed',
      error_message = coalesce(
        error_message,
        'Zombie-Recovery: Job wurde seit ' || p_stale_minutes || ' Minuten nicht abgeschlossen.'
      ),
      finished_at = now(),
      updated_at = now()
    where status = 'running'
      and coalesce(started_at, created_at) < v_cutoff
    returning id
  )
  select count(*)::int into v_count from updated;

  return v_count;
end;
$$;

comment on function public.cookie_scan_mark_zombies_failed(int) is
'Setzt veraltete running-Jobs (älter als p_stale_minutes) auf failed. Zombie-Recovery.';

-- -----------------------------------------------------------------------------
-- 9. RPC: Job abschließen (success oder failed)
-- -----------------------------------------------------------------------------
-- Worker kann damit einheitlich success/failed setzen. Alternativ direkt UPDATE.
-- Verwendung: supabase.rpc('cookie_scan_complete_job', { p_scan_id: '...', p_success: true })
-- bzw. p_success: false, p_error_message: '...'
-- -----------------------------------------------------------------------------
create or replace function public.cookie_scan_complete_job(
  p_scan_id uuid,
  p_success boolean,
  p_error_message text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows int;
begin
  if p_success then
    update public.cookie_scans
    set
      status = 'success',
      finished_at = now(),
      updated_at = now(),
      error_message = null
    where id = p_scan_id and status = 'running';
  else
    update public.cookie_scans
    set
      status = 'failed',
      finished_at = now(),
      updated_at = now(),
      error_message = coalesce(p_error_message, 'Unbekannter Fehler')
    where id = p_scan_id and status = 'running';
  end if;

  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

comment on function public.cookie_scan_complete_job(uuid, boolean, text) is
'Schließt einen running-Job als success oder failed ab. Nur laufende Jobs werden aktualisiert.';

-- -----------------------------------------------------------------------------
-- 10. Indizes
-- -----------------------------------------------------------------------------
create index if not exists cookie_scans_status_idx on public.cookie_scans(status);
create index if not exists cookie_scans_approval_status_idx on public.cookie_scans(approval_status);
create index if not exists cookie_scans_created_at_idx on public.cookie_scans(created_at desc);

-- Queued-Jobs für Worker (älteste zuerst)
create index if not exists cookie_scans_queued_created_idx
  on public.cookie_scans(created_at asc)
  where status = 'queued';

-- Zombie-Check: running mit started_at
create index if not exists cookie_scans_running_started_idx
  on public.cookie_scans(coalesce(started_at, created_at))
  where status = 'running';

-- Optional: Suche nach processing_token (z. B. für idempotente Abschlüsse)
create index if not exists cookie_scans_processing_token_idx
  on public.cookie_scans(processing_token)
  where processing_token is not null;

-- -----------------------------------------------------------------------------
-- 11. RLS / Berechtigungen für RPC
-- RPCs laufen mit security definer (als Owner). Für Anon/Public keine Ausführung
-- der Claim/Zombie/Complete-RPCs erlauben; nur Service Role / authenticated Admin.
-- Supabase: RPC sind standardmäßig für authentifizierte Nutzer aufrufbar.
-- Für rein serverseitige Nutzung: Nur mit Service Role Key aufrufen (Worker/CMS-Backend).
-- -----------------------------------------------------------------------------
-- Keine explizite GRANT für anon auf die neuen Funktionen = anon kann sie nicht aufrufen.
revoke execute on function public.cookie_scan_claim_next_job(text) from anon;
revoke execute on function public.cookie_scan_mark_zombies_failed(int) from anon;
revoke execute on function public.cookie_scan_complete_job(uuid, boolean, text) from anon;
grant execute on function public.cookie_scan_claim_next_job(text) to authenticated;
grant execute on function public.cookie_scan_claim_next_job(text) to service_role;
grant execute on function public.cookie_scan_mark_zombies_failed(int) to authenticated;
grant execute on function public.cookie_scan_mark_zombies_failed(int) to service_role;
grant execute on function public.cookie_scan_complete_job(uuid, boolean, text) to authenticated;
grant execute on function public.cookie_scan_complete_job(uuid, boolean, text) to service_role;
