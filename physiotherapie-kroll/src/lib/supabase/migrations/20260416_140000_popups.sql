-- Popups system (admin-managed, public-rendered)
-- - Tables: public.popups, public.popup_pages
-- - RLS: admin-only CRUD; public read via views with field-level exposure
-- - Constraints: enum-like checks + trigger requirements

-- ---------------------------------------------------------------------------
-- 1) Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.popups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Base
  name text NOT NULL,
  slug text NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT false,
  internal_notes text NULL,

  -- Content
  headline text NULL,
  body text NULL,
  image_url text NULL,
  cta_label text NULL,
  cta_url text NULL,
  close_label text NULL,

  -- Scheduling
  starts_at timestamptz NULL,
  ends_at timestamptz NULL,

  -- Trigger
  trigger_type text NOT NULL DEFAULT 'delay',
  trigger_delay_seconds integer NULL,
  trigger_scroll_percent integer NULL,
  show_once_per_session boolean NOT NULL DEFAULT true,
  show_once_per_browser boolean NOT NULL DEFAULT false,

  -- Target pages
  all_pages boolean NOT NULL DEFAULT false,

  -- Design
  size text NOT NULL DEFAULT 'medium',
  position text NOT NULL DEFAULT 'center',
  layout_variant text NOT NULL DEFAULT 'image_top',
  animation_variant text NOT NULL DEFAULT 'fade',
  bg_color text NULL,
  text_color text NULL,
  overlay_opacity numeric NULL,
  border_radius text NULL,
  shadow_preset text NULL,
  button_variant text NULL,
  show_close_icon boolean NOT NULL DEFAULT true,
  close_on_overlay boolean NOT NULL DEFAULT true,
  close_on_escape boolean NOT NULL DEFAULT true,

  -- Control
  priority integer NOT NULL DEFAULT 0,

  -- Meta
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT popups_trigger_type_check CHECK (trigger_type IN ('immediate', 'delay', 'scroll')),
  CONSTRAINT popups_trigger_delay_check CHECK (trigger_delay_seconds IS NULL OR trigger_delay_seconds >= 0),
  CONSTRAINT popups_trigger_scroll_check CHECK (trigger_scroll_percent IS NULL OR (trigger_scroll_percent >= 0 AND trigger_scroll_percent <= 100)),
  CONSTRAINT popups_delay_requires_seconds CHECK (
    trigger_type <> 'delay' OR trigger_delay_seconds IS NOT NULL
  ),
  CONSTRAINT popups_scroll_requires_percent CHECK (
    trigger_type <> 'scroll' OR trigger_scroll_percent IS NOT NULL
  ),
  CONSTRAINT popups_time_window_check CHECK (
    ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at
  ),
  CONSTRAINT popups_size_check CHECK (size IN ('small', 'medium', 'large')),
  CONSTRAINT popups_position_check CHECK (position IN ('center', 'top_center', 'bottom_center')),
  CONSTRAINT popups_layout_check CHECK (layout_variant IN ('image_top', 'image_left', 'no_image')),
  CONSTRAINT popups_animation_check CHECK (animation_variant IN ('fade', 'scale', 'slide_up')),
  CONSTRAINT popups_overlay_opacity_check CHECK (
    overlay_opacity IS NULL OR (overlay_opacity >= 0 AND overlay_opacity <= 1)
  )
);

CREATE TABLE IF NOT EXISTS public.popup_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  popup_id uuid NOT NULL REFERENCES public.popups (id) ON DELETE CASCADE,
  page_id uuid NOT NULL REFERENCES public.pages (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT popup_pages_unique UNIQUE (popup_id, page_id)
);

CREATE INDEX IF NOT EXISTS idx_popups_active_priority_updated
  ON public.popups (is_active, priority DESC, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_popups_starts_at ON public.popups (starts_at);
CREATE INDEX IF NOT EXISTS idx_popups_ends_at ON public.popups (ends_at);
CREATE INDEX IF NOT EXISTS idx_popup_pages_page_id ON public.popup_pages (page_id);
CREATE INDEX IF NOT EXISTS idx_popup_pages_popup_id ON public.popup_pages (popup_id);

-- ---------------------------------------------------------------------------
-- 2) updated_at trigger (reuses public.set_updated_at)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS popups_set_updated_at ON public.popups;
CREATE TRIGGER popups_set_updated_at
BEFORE UPDATE ON public.popups
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3) RLS (defense in depth; admin routes may use service_role after guard)
-- ---------------------------------------------------------------------------
ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popups FORCE ROW LEVEL SECURITY;

ALTER TABLE public.popup_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popup_pages FORCE ROW LEVEL SECURITY;

-- Admin-only CRUD via RBAC helper (authenticated + is_admin)
DROP POLICY IF EXISTS popups_select_admin ON public.popups;
DROP POLICY IF EXISTS popups_insert_admin ON public.popups;
DROP POLICY IF EXISTS popups_update_admin ON public.popups;
DROP POLICY IF EXISTS popups_delete_admin ON public.popups;

CREATE POLICY popups_select_admin
ON public.popups
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY popups_insert_admin
ON public.popups
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY popups_update_admin
ON public.popups
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY popups_delete_admin
ON public.popups
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS popup_pages_select_admin ON public.popup_pages;
DROP POLICY IF EXISTS popup_pages_insert_admin ON public.popup_pages;
DROP POLICY IF EXISTS popup_pages_update_admin ON public.popup_pages;
DROP POLICY IF EXISTS popup_pages_delete_admin ON public.popup_pages;

CREATE POLICY popup_pages_select_admin
ON public.popup_pages
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY popup_pages_insert_admin
ON public.popup_pages
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY popup_pages_update_admin
ON public.popup_pages
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY popup_pages_delete_admin
ON public.popup_pages
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- 4) Public read: views with field-level exposure
-- ---------------------------------------------------------------------------
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
  p.priority,
  p.updated_at
FROM public.popups p
WHERE
  p.is_active = true
  AND (p.starts_at IS NULL OR p.starts_at <= now())
  AND (p.ends_at IS NULL OR p.ends_at >= now());

DROP VIEW IF EXISTS public.popup_pages_public;
CREATE VIEW public.popup_pages_public AS
SELECT
  pp.popup_id,
  pp.page_id
FROM public.popup_pages pp
JOIN public.popups p ON p.id = pp.popup_id
WHERE
  p.is_active = true
  AND (p.starts_at IS NULL OR p.starts_at <= now())
  AND (p.ends_at IS NULL OR p.ends_at >= now());

-- Tighten privileges: revoke base tables from anon/authenticated; grant views for public read.
REVOKE ALL ON TABLE public.popups FROM anon, authenticated;
REVOKE ALL ON TABLE public.popup_pages FROM anon, authenticated;

GRANT SELECT ON TABLE public.popups_public TO anon, authenticated;
GRANT SELECT ON TABLE public.popup_pages_public TO anon, authenticated;

