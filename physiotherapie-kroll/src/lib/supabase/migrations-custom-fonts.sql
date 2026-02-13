-- Custom Fonts Management Table
-- Stores metadata for custom uploaded fonts

CREATE TABLE IF NOT EXISTS custom_fonts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  label text NOT NULL,
  description text,
  file_name text NOT NULL, -- z.B. "MyFont-Variable.woff2"
  file_url text NOT NULL, -- Supabase Storage URL
  font_weight text DEFAULT '100 900', -- z.B. "100 900" für Variable Fonts
  font_style text DEFAULT 'normal', -- 'normal' oder 'italic'
  source text DEFAULT 'custom', -- 'custom' für hochgeladen
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  active boolean DEFAULT true,
  UNIQUE(name) -- Eindeutige Font-Namen
);

-- Index für schnellere Abfragen
CREATE INDEX IF NOT EXISTS idx_custom_fonts_active ON custom_fonts(active);
CREATE INDEX IF NOT EXISTS idx_custom_fonts_created_at ON custom_fonts(created_at DESC);

-- Enable RLS
ALTER TABLE custom_fonts ENABLE ROW LEVEL SECURITY;

-- Policy: Admins können alle Fonts lesen
CREATE POLICY "admins_read_fonts"
  ON custom_fonts
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Admins können Fonts erstellen
CREATE POLICY "admins_create_fonts"
  ON custom_fonts
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Admins können Fonts updaten
CREATE POLICY "admins_update_fonts"
  ON custom_fonts
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Admins können Fonts löschen
CREATE POLICY "admins_delete_fonts"
  ON custom_fonts
  FOR DELETE
  USING (auth.role() = 'authenticated');
