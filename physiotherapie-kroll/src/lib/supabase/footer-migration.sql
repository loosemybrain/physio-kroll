-- Footer table migration
-- Creates public.footer table with RLS, triggers, and seed data

-- 1) footer table
create table if not exists public.footer (
  id uuid primary key default gen_random_uuid(),
  brand brand_key not null unique,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint footer_brand_check check (brand in ('physiotherapy', 'physio-konzept'))
);

create index if not exists footer_brand_idx on public.footer(brand);

-- 2) updated_at trigger
drop trigger if exists footer_set_updated_at on public.footer;
create trigger footer_set_updated_at
before update on public.footer
for each row execute function public.set_updated_at();

-- 3) RLS
alter table public.footer enable row level security;

-- Public: read footer configs
drop policy if exists "public read footer" on public.footer;
create policy "public read footer"
on public.footer for select
to anon
using (true);

-- Admin: authenticated can read/write all
drop policy if exists "admin full access footer" on public.footer;
create policy "admin full access footer"
on public.footer for all
to authenticated
using (true)
with check (true);

-- DEV / no-auth setup (remove in production):
drop policy if exists "anon full access footer" on public.footer;
create policy "anon full access footer"
on public.footer for all
to anon
using (true)
with check (true);

-- 4) Seed data (default footer configs for both brands)
insert into public.footer (brand, config)
values 
  (
    'physiotherapy',
    '{
      "sections": [
        {
          "id": "section-1",
          "title": "Kontakt",
          "span": 6,
          "blocks": [
            {
              "type": "text",
              "id": "text-1",
              "text": "Physiotherapie Kroll\nMusterstraße 123\n12345 Musterstadt"
            },
            {
              "type": "links",
              "id": "links-1",
              "title": "Kontakt",
              "links": [
                {
                  "id": "link-1",
                  "label": "Kontakt",
                  "href": "/kontakt",
                  "newTab": false
                }
              ]
            }
          ]
        },
        {
          "id": "section-2",
          "title": "Rechtliches",
          "span": 6,
          "blocks": [
            {
              "type": "links",
              "id": "links-2",
              "title": "Rechtliches",
              "links": [
                {
                  "id": "link-2",
                  "label": "Impressum",
                  "href": "/impressum",
                  "newTab": false
                },
                {
                  "id": "link-3",
                  "label": "Datenschutz",
                  "href": "/datenschutz",
                  "newTab": false
                }
              ]
            }
          ]
        }
      ],
      "bottomBar": {
        "enabled": true,
        "left": {
          "type": "copyright",
          "id": "copyright-1",
          "text": "© 2024 Physiotherapie Kroll. Alle Rechte vorbehalten."
        }
      }
    }'::jsonb
  ),
  (
    'physio-konzept',
    '{
      "sections": [
        {
          "id": "section-1",
          "title": "Kontakt",
          "span": 6,
          "blocks": [
            {
              "type": "text",
              "id": "text-1",
              "text": "Physio-Konzept\nMusterstraße 123\n12345 Musterstadt"
            },
            {
              "type": "links",
              "id": "links-1",
              "title": "Kontakt",
              "links": [
                {
                  "id": "link-1",
                  "label": "Kontakt",
                  "href": "/kontakt",
                  "newTab": false
                }
              ]
            }
          ]
        },
        {
          "id": "section-2",
          "title": "Rechtliches",
          "span": 6,
          "blocks": [
            {
              "type": "links",
              "id": "links-2",
              "title": "Rechtliches",
              "links": [
                {
                  "id": "link-2",
                  "label": "Impressum",
                  "href": "/impressum",
                  "newTab": false
                },
                {
                  "id": "link-3",
                  "label": "Datenschutz",
                  "href": "/datenschutz",
                  "newTab": false
                }
              ]
            }
          ]
        }
      ],
      "bottomBar": {
        "enabled": true,
        "left": {
          "type": "copyright",
          "id": "copyright-1",
          "text": "© 2024 Physio-Konzept. Alle Rechte vorbehalten."
        }
      }
    }'::jsonb
  )
on conflict (brand) do nothing;
