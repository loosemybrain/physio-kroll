-- Navigation table for global site navigation
-- Stores navigation configuration per brand (physiotherapy | physio-konzept)

CREATE TABLE IF NOT EXISTS public.navigation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL CHECK (brand IN ('physiotherapy', 'physio-konzept')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(brand)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_navigation_brand ON public.navigation(brand);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER navigation_updated_at
  BEFORE UPDATE ON public.navigation
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- RLS Policies
ALTER TABLE public.navigation ENABLE ROW LEVEL SECURITY;

-- Allow public read access (navigation is public)
CREATE POLICY "Navigation is publicly readable"
  ON public.navigation
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only authenticated users can insert/update/delete
CREATE POLICY "Only authenticated users can modify navigation"
  ON public.navigation
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default navigation for both brands
INSERT INTO public.navigation (brand, config)
VALUES 
  ('physiotherapy', '{"logo": null, "links": [], "searchEnabled": true, "cta": null}'::jsonb),
  ('physio-konzept', '{"logo": null, "links": [], "searchEnabled": true, "cta": null}'::jsonb)
ON CONFLICT (brand) DO NOTHING;
