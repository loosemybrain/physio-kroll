-- Media Library Migration
-- Creates media_folders and media_assets tables with folder support

-- =========================
-- TABLES
-- =========================

-- media_folders table
create table if not exists public.media_folders (
  id uuid primary key default gen_random_uuid(),
  brand text not null check (brand in ('physiotherapy', 'physio-konzept')),
  parent_id uuid null references public.media_folders(id) on delete restrict,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_folders_brand_parent_name_unique unique (brand, parent_id, name)
);

create index if not exists media_folders_brand_idx on public.media_folders(brand);
create index if not exists media_folders_parent_idx on public.media_folders(parent_id);

-- media_assets table
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  brand text not null check (brand in ('physiotherapy', 'physio-konzept')),
  folder_id uuid null references public.media_folders(id) on delete set null,
  bucket text not null default 'media',
  object_key text not null,
  filename text not null,
  content_type text null,
  size_bytes bigint null,
  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_assets_bucket_object_key_unique unique (bucket, object_key)
);

create index if not exists media_assets_brand_idx on public.media_assets(brand);
create index if not exists media_assets_folder_idx on public.media_assets(folder_id);
create index if not exists media_assets_created_at_idx on public.media_assets(created_at desc);

-- updated_at triggers
drop trigger if exists media_folders_set_updated_at on public.media_folders;
create trigger media_folders_set_updated_at
before update on public.media_folders
for each row execute function public.set_updated_at();

drop trigger if exists media_assets_set_updated_at on public.media_assets;
create trigger media_assets_set_updated_at
before update on public.media_assets
for each row execute function public.set_updated_at();

-- =========================
-- RLS POLICIES
-- =========================

alter table public.media_folders enable row level security;
alter table public.media_assets enable row level security;

-- Public: read folders and assets (bucket is public, keep browsing consistent)
drop policy if exists "public read media folders" on public.media_folders;
create policy "public read media folders"
on public.media_folders for select
to anon, authenticated
using (true);

drop policy if exists "public read media assets" on public.media_assets;
create policy "public read media assets"
on public.media_assets for select
to anon, authenticated
using (true);

-- Admin: authenticated can CRUD folders
drop policy if exists "admin full access media folders" on public.media_folders;
create policy "admin full access media folders"
on public.media_folders for all
to authenticated
using (true)
with check (true);

-- Admin: authenticated can CRUD assets
drop policy if exists "admin full access media assets" on public.media_assets;
create policy "admin full access media assets"
on public.media_assets for all
to authenticated
using (true)
with check (true);

-- DEV / no-auth setup: allow anon to write (remove in production)
drop policy if exists "anon full access media folders" on public.media_folders;
create policy "anon full access media folders"
on public.media_folders for all
to anon
using (true)
with check (true);

drop policy if exists "anon full access media assets" on public.media_assets;
create policy "anon full access media assets"
on public.media_assets for all
to anon
using (true)
with check (true);
