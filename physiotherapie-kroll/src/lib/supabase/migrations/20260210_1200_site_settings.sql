/**
 * Supabase Migration: Site Settings (Font Presets)
 * 
 * Creates singleton table for site-wide settings (font presets, etc.)
 * 
 * Idempotent: Safe to run multiple times
 * Timestamp: 2026-02-10 12:00
 */

-- ============================================================================
-- 1. Generic set_updated_at function (if not exists)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. Create site_settings table (singleton pattern: id='singleton')
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id text PRIMARY KEY DEFAULT 'singleton',
  sans_preset text NOT NULL DEFAULT 'inter-local',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT sans_preset_not_empty CHECK (char_length(sans_preset) > 0)
);

-- ============================================================================
-- 3. Insert singleton row (if not exists)
-- ============================================================================
INSERT INTO public.site_settings (id, sans_preset)
VALUES ('singleton', 'inter-local')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. Create updated_at trigger
-- ============================================================================
DROP TRIGGER IF EXISTS site_settings_set_updated_at
ON public.site_settings;

CREATE TRIGGER site_settings_set_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 5. Enable Row Level Security
-- ============================================================================
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. RLS Policies
-- ============================================================================

-- Policy: SELECT allowed for anon and authenticated users
DROP POLICY IF EXISTS "Allow anon/authenticated read site_settings" ON public.site_settings;
CREATE POLICY "Allow anon/authenticated read site_settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Policy: INSERT/UPDATE/DELETE allowed only for service_role
DROP POLICY IF EXISTS "Allow service_role write site_settings" ON public.site_settings;
CREATE POLICY "Allow service_role write site_settings"
ON public.site_settings
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 7. Comments for documentation
-- ============================================================================
COMMENT ON TABLE public.site_settings IS
'Singleton configuration table for site-wide settings (font presets, theme, etc). Only one row with id="singleton".';

COMMENT ON COLUMN public.site_settings.sans_preset IS
'Font preset ID for sans-serif font. Default: "inter-local" (GDPR-safe). Values: "inter-local", "playfair-local", "lora", "merriweather", etc.';
