-- Contact Form Submissions Migration
-- DSGVO-konform: Minimal PII, keine IP-Speicherung, RLS für Datenschutz

-- Submission status enum
do $$ begin
  create type submission_status as enum ('new', 'read', 'archived');
exception when duplicate_object then null; end $$;

-- contact_submissions table
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  brand text not null check (brand in ('physiotherapy', 'physio-konzept')),
  page_slug text not null,
  block_id uuid, -- optional reference to block
  name text not null,
  email text not null,
  phone text,
  message text not null,
  subject text,
  consent boolean default false,
  created_at timestamptz not null default now(),
  status submission_status not null default 'new',
  meta jsonb default '{}'::jsonb -- datensparsam: z.B. gekürzter userAgent, keine IP
);

-- Indices for performance
create index if not exists contact_submissions_created_at_idx on public.contact_submissions(created_at desc);
create index if not exists contact_submissions_brand_idx on public.contact_submissions(brand);
create index if not exists contact_submissions_page_slug_idx on public.contact_submissions(page_slug);
create index if not exists contact_submissions_status_idx on public.contact_submissions(status);

-- RLS
alter table public.contact_submissions enable row level security;

-- anon: INSERT only (for form submissions)
-- Important: Only allow specific fields, no meta manipulation
drop policy if exists "anon insert contact submissions" on public.contact_submissions;
create policy "anon insert contact submissions"
on public.contact_submissions for insert
to anon
with check (
  true -- Allow insert, but validation happens in API route
);

-- authenticated: SELECT/UPDATE/DELETE (for admin inbox)
drop policy if exists "authenticated full access contact submissions" on public.contact_submissions;
create policy "authenticated full access contact submissions"
on public.contact_submissions for all
to authenticated
using (true)
with check (true);

-- DEV / no-auth setup: Allow anon to read for development
-- IMPORTANT: Remove this policy once you add proper admin auth
drop policy if exists "anon read contact submissions" on public.contact_submissions;
create policy "anon read contact submissions"
on public.contact_submissions for select
to anon
using (true);
