-- =========================================================
-- EXTRA THEME PRESETS (6x physiotherapy, 6x physio-konzept)
-- =========================================================
-- Safe to run multiple times (ON CONFLICT DO NOTHING)
-- Applies new presets only; does not change active preset.

-- ---------- Physiotherapy (6) ----------
insert into public.theme_presets (brand, name, tokens, is_default)
values
(
  'physiotherapy',
  'Ice Blue',
  '{
    "--primary": "oklch(0.72 0.14 230)",
    "--primary-foreground": "oklch(0.14 0.02 230)",
    "--background": "oklch(0.98 0.01 230)",
    "--foreground": "oklch(0.20 0.02 230)",
    "--accent": "oklch(0.78 0.12 220)",
    "--border": "oklch(0.90 0.02 230)",
    "--hero-accent": "oklch(0.70 0.16 225)"
  }'::jsonb,
  false
),
(
  'physiotherapy',
  'Lavender Calm',
  '{
    "--primary": "oklch(0.70 0.13 305)",
    "--primary-foreground": "oklch(0.14 0.02 305)",
    "--background": "oklch(0.98 0.01 305)",
    "--foreground": "oklch(0.20 0.02 305)",
    "--accent": "oklch(0.78 0.11 300)",
    "--border": "oklch(0.90 0.02 305)",
    "--hero-accent": "oklch(0.72 0.15 300)"
  }'::jsonb,
  false
),
(
  'physiotherapy',
  'Citrus Fresh',
  '{
    "--primary": "oklch(0.80 0.16 105)",
    "--primary-foreground": "oklch(0.16 0.02 105)",
    "--background": "oklch(0.98 0.01 105)",
    "--foreground": "oklch(0.20 0.02 105)",
    "--accent": "oklch(0.82 0.14 95)",
    "--border": "oklch(0.90 0.02 105)",
    "--hero-accent": "oklch(0.78 0.18 98)"
  }'::jsonb,
  false
),
(
  'physiotherapy',
  'Coral Care',
  '{
    "--primary": "oklch(0.72 0.16 25)",
    "--primary-foreground": "oklch(0.14 0.02 25)",
    "--background": "oklch(0.98 0.01 25)",
    "--foreground": "oklch(0.20 0.02 25)",
    "--accent": "oklch(0.78 0.14 30)",
    "--border": "oklch(0.90 0.02 25)",
    "--hero-accent": "oklch(0.72 0.18 28)"
  }'::jsonb,
  false
),
(
  'physiotherapy',
  'Forest Deep',
  '{
    "--primary": "oklch(0.62 0.15 155)",
    "--primary-foreground": "oklch(0.98 0.01 155)",
    "--background": "oklch(0.15 0.01 155)",
    "--foreground": "oklch(0.94 0.01 155)",
    "--accent": "oklch(0.66 0.14 150)",
    "--border": "oklch(0.28 0.01 155)",
    "--hero-accent": "oklch(0.70 0.16 150)"
  }'::jsonb,
  false
),
(
  'physiotherapy',
  'Graphite Mint',
  '{
    "--primary": "oklch(0.78 0.10 165)",
    "--primary-foreground": "oklch(0.12 0.01 165)",
    "--background": "oklch(0.18 0.01 260)",
    "--foreground": "oklch(0.94 0.01 260)",
    "--accent": "oklch(0.80 0.12 160)",
    "--border": "oklch(0.30 0.01 260)",
    "--hero-accent": "oklch(0.78 0.14 160)"
  }'::jsonb,
  false
)
on conflict (brand, name) do nothing;

-- ---------- Physio-Konzept (6) ----------
insert into public.theme_presets (brand, name, tokens, is_default)
values
(
  'physio-konzept',
  'Night Teal',
  '{
    "--primary": "oklch(0.70 0.14 190)",
    "--primary-foreground": "oklch(0.96 0.01 190)",
    "--background": "oklch(0.14 0.01 200)",
    "--foreground": "oklch(0.94 0.01 200)",
    "--accent": "oklch(0.74 0.12 185)",
    "--border": "oklch(0.28 0.01 200)",
    "--hero-accent": "oklch(0.72 0.16 188)"
  }'::jsonb,
  false
),
(
  'physio-konzept',
  'Burgundy Night',
  '{
    "--primary": "oklch(0.62 0.16 15)",
    "--primary-foreground": "oklch(0.96 0.01 15)",
    "--background": "oklch(0.14 0.01 15)",
    "--foreground": "oklch(0.94 0.01 15)",
    "--accent": "oklch(0.66 0.14 20)",
    "--border": "oklch(0.28 0.01 15)",
    "--hero-accent": "oklch(0.68 0.18 18)"
  }'::jsonb,
  false
),
(
  'physio-konzept',
  'Amber Studio',
  '{
    "--primary": "oklch(0.78 0.14 70)",
    "--primary-foreground": "oklch(0.16 0.02 70)",
    "--background": "oklch(0.16 0.01 70)",
    "--foreground": "oklch(0.94 0.01 70)",
    "--accent": "oklch(0.80 0.12 78)",
    "--border": "oklch(0.30 0.01 70)",
    "--hero-accent": "oklch(0.76 0.16 74)"
  }'::jsonb,
  false
),
(
  'physio-konzept',
  'Slate Rose',
  '{
    "--primary": "oklch(0.72 0.10 350)",
    "--primary-foreground": "oklch(0.16 0.02 350)",
    "--background": "oklch(0.15 0.01 270)",
    "--foreground": "oklch(0.94 0.01 270)",
    "--accent": "oklch(0.76 0.10 345)",
    "--border": "oklch(0.30 0.01 270)",
    "--hero-accent": "oklch(0.74 0.12 348)"
  }'::jsonb,
  false
),
(
  'physio-konzept',
  'Midnight Violet',
  '{
    "--primary": "oklch(0.68 0.16 295)",
    "--primary-foreground": "oklch(0.96 0.01 295)",
    "--background": "oklch(0.13 0.01 295)",
    "--foreground": "oklch(0.94 0.01 295)",
    "--accent": "oklch(0.72 0.14 290)",
    "--border": "oklch(0.28 0.01 295)",
    "--hero-accent": "oklch(0.70 0.18 292)"
  }'::jsonb,
  false
),
(
  'physio-konzept',
  'Copper Mono',
  '{
    "--primary": "oklch(0.76 0.12 55)",
    "--primary-foreground": "oklch(0.14 0.02 55)",
    "--background": "oklch(0.18 0.01 55)",
    "--foreground": "oklch(0.94 0.01 55)",
    "--accent": "oklch(0.78 0.10 60)",
    "--border": "oklch(0.30 0.01 55)",
    "--hero-accent": "oklch(0.74 0.14 58)"
  }'::jsonb,
  false
)

on conflict (brand, name) do nothing;

-- =========================================================
-- PHYSIO-KONZEPT – LIGHT PRESETS
-- =========================================================

insert into public.theme_presets (brand, name, tokens, is_default)
values
(
  'physio-konzept',
  'Soft Linen',
  '{
    "--primary": "oklch(0.62 0.08 85)",
    "--primary-foreground": "oklch(0.18 0.02 85)",
    "--background": "oklch(0.97 0.02 85)",
    "--foreground": "oklch(0.22 0.02 85)",
    "--accent": "oklch(0.74 0.10 80)",
    "--border": "oklch(0.90 0.02 85)",
    "--hero-accent": "oklch(0.68 0.12 82)"
  }'::jsonb,
  false
),
(
  'physio-konzept',
  'Warm Clay',
  '{
    "--primary": "oklch(0.60 0.10 45)",
    "--primary-foreground": "oklch(0.18 0.02 45)",
    "--background": "oklch(0.96 0.02 45)",
    "--foreground": "oklch(0.22 0.02 45)",
    "--accent": "oklch(0.72 0.12 50)",
    "--border": "oklch(0.88 0.02 45)",
    "--hero-accent": "oklch(0.66 0.14 48)"
  }'::jsonb,
  false
),
(
  'physio-konzept',
  'Sage Bright',
  '{
    "--primary": "oklch(0.64 0.08 135)",
    "--primary-foreground": "oklch(0.18 0.02 135)",
    "--background": "oklch(0.97 0.02 135)",
    "--foreground": "oklch(0.22 0.02 135)",
    "--accent": "oklch(0.74 0.10 130)",
    "--border": "oklch(0.90 0.02 135)",
    "--hero-accent": "oklch(0.68 0.12 132)"
  }'::jsonb,
  false
),
(
  'physio-konzept',
  'Stone Paper',
  '{
    "--primary": "oklch(0.58 0.04 260)",
    "--primary-foreground": "oklch(0.18 0.02 260)",
    "--background": "oklch(0.97 0.01 260)",
    "--foreground": "oklch(0.22 0.02 260)",
    "--accent": "oklch(0.70 0.06 255)",
    "--border": "oklch(0.90 0.01 260)",
    "--hero-accent": "oklch(0.64 0.08 258)"
  }'::jsonb,
  false
)
on conflict (brand, name) do nothing;

