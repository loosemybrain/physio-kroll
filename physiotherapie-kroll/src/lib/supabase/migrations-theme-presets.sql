-- =========================================
-- THEME PRESETS (brand-aware, 1..n presets per brand)
-- =========================================

create table if not exists public.theme_presets (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  name text not null,
  tokens jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint theme_presets_unique_name_per_brand unique (brand, name)
);

-- brand check (idempotent)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'theme_presets_brand_check'
      and conrelid = 'public.theme_presets'::regclass
  ) then
    alter table public.theme_presets
      add constraint theme_presets_brand_check
      check (brand in ('physiotherapy', 'physio-konzept'));
  end if;
end $$;

create index if not exists theme_presets_brand_idx on public.theme_presets(brand);

-- =========================================
-- TABLE: brand_settings (1 row per brand)
-- =========================================
create table if not exists public.brand_settings (
  brand text primary key,
  active_theme_preset_id uuid references public.theme_presets(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- brand check (idempotent)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'brand_settings_brand_check'
      and conrelid = 'public.brand_settings'::regclass
  ) then
    alter table public.brand_settings
      add constraint brand_settings_brand_check
      check (brand in ('physiotherapy', 'physio-konzept'));
  end if;
end $$;

-- updated_at triggers (use existing public.set_updated_at())
drop trigger if exists theme_presets_set_updated_at on public.theme_presets;
create trigger theme_presets_set_updated_at
before update on public.theme_presets
for each row execute function public.set_updated_at();

drop trigger if exists brand_settings_set_updated_at on public.brand_settings;
create trigger brand_settings_set_updated_at
before update on public.brand_settings
for each row execute function public.set_updated_at();

-- =========================================
-- RLS
-- =========================================
alter table public.theme_presets enable row level security;
alter table public.brand_settings enable row level security;

-- clean slate policies (idempotent)
drop policy if exists "public read theme presets" on public.theme_presets;
drop policy if exists "admin full access theme presets" on public.theme_presets;

drop policy if exists "public read brand settings" on public.brand_settings;
drop policy if exists "admin full access brand settings" on public.brand_settings;

-- Public read (needed so website can apply presets)
create policy "public read theme presets"
on public.theme_presets
for select
to anon, authenticated
using (true);

create policy "public read brand settings"
on public.brand_settings
for select
to anon, authenticated
using (true);

-- Admin full access
create policy "admin full access theme presets"
on public.theme_presets
for all
to authenticated
using (true)
with check (true);

create policy "admin full access brand settings"
on public.brand_settings
for all
to authenticated
using (true)
with check (true);

-- seed: brand_settings rows (so .single() nicht scheitert)
insert into public.brand_settings (brand)
values ('physiotherapy'), ('physio-konzept')
on conflict (brand) do nothing;
