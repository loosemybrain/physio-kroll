-- Global block templates (persisted snapshots only; no editor wiring in phase 1)
-- Idempotent where practical

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.global_block_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NULL,
  block_type text NOT NULL,
  brand text NULL,
  page_type text NULL,
  page_subtype text NULL,
  source_block jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS global_block_templates_set_updated_at ON public.global_block_templates;
CREATE TRIGGER global_block_templates_set_updated_at
BEFORE UPDATE ON public.global_block_templates
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_global_block_templates_block_type
  ON public.global_block_templates (block_type);

CREATE INDEX IF NOT EXISTS idx_global_block_templates_brand
  ON public.global_block_templates (brand);

CREATE INDEX IF NOT EXISTS idx_global_block_templates_brand_page_meta
  ON public.global_block_templates (brand, page_type, page_subtype);

ALTER TABLE public.global_block_templates ENABLE ROW LEVEL SECURITY;

-- Policies: siehe Migration 20260402120100_global_block_templates_rls_is_admin.sql
-- (harte is_admin(auth.uid())-Policies, kein pauschales authenticated=true)
