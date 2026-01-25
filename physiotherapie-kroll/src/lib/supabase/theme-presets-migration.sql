-- Theme Presets Migration
-- Run this after the main migrations.sql
-- Creates theme_presets and brand_settings tables with RLS policies

-- =========================
-- TABLES
-- =========================

-- theme_presets table
create table if not exists public.theme_presets (
  id uuid primary key default gen_random_uuid(),
  brand brand_key not null,
  name text not null,
  tokens jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint theme_presets_brand_name_unique unique (brand, name)
);

create index if not exists theme_presets_brand_idx on public.theme_presets(brand);
create index if not exists theme_presets_is_default_idx on public.theme_presets(is_default);

-- brand_settings table
create table if not exists public.brand_settings (
  brand brand_key primary key,
  active_theme_preset_id uuid references public.theme_presets(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at trigger for theme_presets
drop trigger if exists theme_presets_set_updated_at on public.theme_presets;
create trigger theme_presets_set_updated_at
before update on public.theme_presets
for each row execute function public.set_updated_at();

-- updated_at trigger for brand_settings
drop trigger if exists brand_settings_set_updated_at on public.brand_settings;
create trigger brand_settings_set_updated_at
before update on public.brand_settings
for each row execute function public.set_updated_at();

-- =========================
-- RLS POLICIES
-- =========================

alter table public.theme_presets enable row level security;
alter table public.brand_settings enable row level security;

-- Public: read theme presets (for SSR/public pages)
drop policy if exists "public read theme presets" on public.theme_presets;
create policy "public read theme presets"
on public.theme_presets for select
to anon, authenticated
using (true);

-- Public: read brand settings (for SSR/public pages)
drop policy if exists "public read brand settings" on public.brand_settings;
create policy "public read brand settings"
on public.brand_settings for select
to anon, authenticated
using (true);

-- Admin: authenticated can CRUD theme presets
drop policy if exists "admin full access theme presets" on public.theme_presets;
create policy "admin full access theme presets"
on public.theme_presets for all
to authenticated
using (true)
with check (true);

-- Admin: authenticated can update brand settings
drop policy if exists "admin full access brand settings" on public.brand_settings;
create policy "admin full access brand settings"
on public.brand_settings for all
to authenticated
using (true)
with check (true);

-- =========================
-- INITIAL DATA (optional)
-- =========================

-- Ensure brand_settings rows exist for both brands
insert into public.brand_settings (brand, active_theme_preset_id)
values 
  ('physiotherapy', null),
  ('physio-konzept', null)
on conflict (brand) do nothing;
