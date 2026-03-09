-- Cookie-Scan Worker: optionale Spalten für Job-Verwaltung und Zombie-Erkennung.
-- Keine destruktiven Änderungen; bestehende Daten bleiben erhalten.

-- Falls status als Enum cookie_scan_status existiert: Wert 'queued' ergänzen
do $$
begin
  alter type cookie_scan_status add value 'queued';
exception
  when duplicate_object then null;
  when undefined_object then null; -- Typ existiert nicht (z. B. status ist text)
end $$;

-- started_at: wann der Worker den Job übernommen hat
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'cookie_scans') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cookie_scans' and column_name = 'started_at') then
      alter table public.cookie_scans add column started_at timestamptz;
    end if;
  end if;
end $$;

-- finished_at: wann der Scan abgeschlossen wurde (success/failed)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'cookie_scans') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cookie_scans' and column_name = 'finished_at') then
      alter table public.cookie_scans add column finished_at timestamptz;
    end if;
  end if;
end $$;

-- processed_by: optional Worker-Kennung (z. B. Hostname oder Container-ID)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'cookie_scans') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cookie_scans' and column_name = 'processed_by') then
      alter table public.cookie_scans add column processed_by text;
    end if;
  end if;
end $$;

-- Index für Worker-Polling: queued Jobs, älteste zuerst
create index if not exists cookie_scans_queued_idx on public.cookie_scans(created_at asc)
  where (status = 'queued' or status = 'running');

-- Index für Zombie-Bereinigung: running mit started_at
create index if not exists cookie_scans_running_started_idx on public.cookie_scans(started_at)
  where status = 'running';
