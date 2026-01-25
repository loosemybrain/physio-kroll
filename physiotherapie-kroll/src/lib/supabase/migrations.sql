-- Supabase schema for Physio CMS (pages + blocks + media)
-- Notes:
-- - We keep brand + title columns because the existing Admin UI requires them.
-- - Public readers can only access published pages/blocks.

create extension if not exists "pgcrypto";

-- Brand enum (matches frontend BrandKey)
do $$ begin
  create type brand_key as enum ('physiotherapy', 'physio-konzept');
exception when duplicate_object then null; end $$;

-- Page status enum
do $$ begin
  create type page_status as enum ('draft', 'published');
exception when duplicate_object then null; end $$;

-- 1) pages
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  brand brand_key not null,
  status page_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) blocks
create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  type text not null,
  sort int not null,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blocks_unique_sort_per_page unique (page_id, sort)
);

create index if not exists blocks_page_sort_idx on public.blocks(page_id, sort);

-- 3) media
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  alt text,
  filename text not null,
  size bigint,
  type text,
  created_at timestamptz not null default now()
);

create index if not exists media_created_at_idx on public.media(created_at desc);

-- updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists pages_set_updated_at on public.pages;
create trigger pages_set_updated_at
before update on public.pages
for each row execute function public.set_updated_at();

drop trigger if exists blocks_set_updated_at on public.blocks;
create trigger blocks_set_updated_at
before update on public.blocks
for each row execute function public.set_updated_at();

-- =========================
-- RLS
-- =========================
alter table public.pages enable row level security;
alter table public.blocks enable row level security;
alter table public.media enable row level security;

-- Public: read published pages/blocks
drop policy if exists "public read published pages" on public.pages;
create policy "public read published pages"
on public.pages for select
to anon
using (status = 'published');

drop policy if exists "public read published blocks" on public.blocks;
create policy "public read published blocks"
on public.blocks for select
to anon
using (
  exists (
    select 1 from public.pages p
    where p.id = blocks.page_id and p.status = 'published'
  )
);

-- Admin: authenticated can read/write all
drop policy if exists "admin full access pages" on public.pages;
create policy "admin full access pages"
on public.pages for all
to authenticated
using (true)
with check (true);

drop policy if exists "admin full access blocks" on public.blocks;
create policy "admin full access blocks"
on public.blocks for all
to authenticated
using (true)
with check (true);

drop policy if exists "admin full access media" on public.media;
create policy "admin full access media"
on public.media for all
to authenticated
using (true)
with check (true);

-- DEV / no-auth setup:
-- Your current Admin UI does not use Supabase Auth yet.
-- If you keep it like that, you must allow anon to write, otherwise Save/Publish will fail.
-- IMPORTANT: remove these policies (or restrict them) once you add proper admin auth.

drop policy if exists "anon full access pages" on public.pages;
create policy "anon full access pages"
on public.pages for all
to anon
using (true)
with check (true);

drop policy if exists "anon full access blocks" on public.blocks;
create policy "anon full access blocks"
on public.blocks for all
to anon
using (true)
with check (true);

drop policy if exists "anon full access media" on public.media;
create policy "anon full access media"
on public.media for all
to anon
using (true)
with check (true);

-- Storage:
-- Create a Storage bucket named: media
-- Recommended policies:
-- - Read: public (if bucket is public)
-- - Write: authenticated only
