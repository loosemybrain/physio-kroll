-- Popups: configurable fade durations for open/close animation

ALTER TABLE public.popups
ADD COLUMN IF NOT EXISTS animation_fade_in_ms integer NOT NULL DEFAULT 620,
ADD COLUMN IF NOT EXISTS animation_fade_out_ms integer NOT NULL DEFAULT 220;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'popups_animation_fade_in_ms_check'
  ) THEN
    ALTER TABLE public.popups
    ADD CONSTRAINT popups_animation_fade_in_ms_check
    CHECK (animation_fade_in_ms >= 100 AND animation_fade_in_ms <= 4000);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'popups_animation_fade_out_ms_check'
  ) THEN
    ALTER TABLE public.popups
    ADD CONSTRAINT popups_animation_fade_out_ms_check
    CHECK (animation_fade_out_ms >= 80 AND animation_fade_out_ms <= 3000);
  END IF;
END;
$$;

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
  p.animation_fade_in_ms,
  p.animation_fade_out_ms,
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
