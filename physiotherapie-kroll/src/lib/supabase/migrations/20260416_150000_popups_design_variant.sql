-- Popups: add explicit design_variant (promotion/announcement)
-- Keep existing popup system (tables, triggers, RLS, views) intact.

-- 1) Column + constraint (idempotent)
ALTER TABLE public.popups
ADD COLUMN IF NOT EXISTS design_variant text NOT NULL DEFAULT 'promotion';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'popups_design_variant_check'
  ) THEN
    ALTER TABLE public.popups
    ADD CONSTRAINT popups_design_variant_check
    CHECK (design_variant IN ('promotion', 'announcement'));
  END IF;
END;
$$;

-- Backfill legacy rows (should already be covered by DEFAULT, but defensive).
UPDATE public.popups
SET design_variant = 'promotion'
WHERE design_variant IS NULL OR btrim(design_variant) = '';

-- 2) Public view: expose design_variant (rendering-relevant)
-- Important: don't use CREATE OR REPLACE here because adding a column can
-- shift ordinal positions and Postgres will treat it as a rename.
DROP VIEW IF EXISTS public.popups_public;
CREATE VIEW public.popups_public AS
SELECT
  p.id,
  p.headline,
  p.body,
  p.image_url,
  p.cta_label,
  p.cta_url,
  p.close_label,
  p.trigger_type,
  p.trigger_delay_seconds,
  p.trigger_scroll_percent,
  p.show_once_per_session,
  p.show_once_per_browser,
  p.all_pages,
  p.size,
  p.position,
  p.layout_variant,
  p.animation_variant,
  p.bg_color,
  p.text_color,
  p.overlay_opacity,
  p.border_radius,
  p.shadow_preset,
  p.button_variant,
  p.show_close_icon,
  p.close_on_overlay,
  p.close_on_escape,
  p.design_variant,
  p.priority,
  p.updated_at
FROM public.popups p
WHERE
  p.is_active = true
  AND (p.starts_at IS NULL OR p.starts_at <= now())
  AND (p.ends_at IS NULL OR p.ends_at >= now());

GRANT SELECT ON TABLE public.popups_public TO anon, authenticated;

