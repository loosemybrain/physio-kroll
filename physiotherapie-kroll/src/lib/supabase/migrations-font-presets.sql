/**
 * Supabase Migration: Font Presets
 * Creates singleton site_settings table for storing sans_preset preference
 * 
 * Idempotent: Safe to run multiple times
 */

-- ============================================================================
-- 1. Create site_settings table (singleton pattern)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sans_preset text NOT NULL DEFAULT 'inter-local',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT sans_preset_not_empty CHECK (char_length(sans_preset) > 0)
);

-- Singleton constraint: only one row allowed
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_settings_singleton
ON public.site_settings ((1));

-- ============================================================================
-- 2. RLS Policies
-- ============================================================================
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public (authenticated or not) to read site_settings
CREATE POLICY "Allow public read site_settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Allow only authenticated admins to update
-- (Adjust role check based on your auth scheme; example: auth.uid() in admin_users)
CREATE POLICY "Allow admin write site_settings"
ON public.site_settings
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin insert site_settings"
ON public.site_settings
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- 3. Trigger for updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_site_settings_updated_at
ON public.site_settings;

CREATE TRIGGER trigger_update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_site_settings_updated_at();

-- ============================================================================
-- 4. Insert default row if empty
-- ============================================================================
INSERT INTO public.site_settings (sans_preset)
SELECT 'inter-local'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);

-- ============================================================================
-- Comment for documentation
-- ============================================================================
COMMENT ON TABLE public.site_settings IS
'Singleton configuration table for site-wide settings (font presets, theme, etc)';

COMMENT ON COLUMN public.site_settings.sans_preset IS
'Font preset ID for sans-serif font. Values: "inter-local", "playfair-local", "lora", "merriweather", etc.';
