"use client"

import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { PublicPopup } from "@/types/popups"

type PopupPagePublicRow = { popup_id: string; page_id: string }

function mapPublicPopupRow(r: any): PublicPopup {
  return {
    id: String(r.id),
    headline: r.headline ?? null,
    body: r.body ?? null,
    imageUrl: r.image_url ?? r.imageUrl ?? null,
    ctaLabel: r.cta_label ?? r.ctaLabel ?? null,
    ctaUrl: r.cta_url ?? r.ctaUrl ?? null,
    closeLabel: r.close_label ?? r.closeLabel ?? null,

    triggerType: (r.trigger_type ?? r.triggerType ?? "delay") as any,
    triggerDelaySeconds: r.trigger_delay_seconds ?? r.triggerDelaySeconds ?? null,
    triggerScrollPercent: r.trigger_scroll_percent ?? r.triggerScrollPercent ?? null,
    showOncePerSession: r.show_once_per_session ?? r.showOncePerSession ?? true,
    showOncePerBrowser: r.show_once_per_browser ?? r.showOncePerBrowser ?? false,

    allPages: r.all_pages ?? r.allPages ?? false,

    designVariant: (r.design_variant ?? r.designVariant ?? "promotion") as any,
    size: (r.size ?? "medium") as any,
    position: (r.position ?? "center") as any,
    layoutVariant: (r.layout_variant ?? r.layoutVariant ?? "image_top") as any,
    animationVariant: (r.animation_variant ?? r.animationVariant ?? "fade") as any,
    animationFadeInMs: r.animation_fade_in_ms ?? r.animationFadeInMs ?? 620,
    animationFadeOutMs: r.animation_fade_out_ms ?? r.animationFadeOutMs ?? 220,
    bgColor: r.bg_color ?? r.bgColor ?? null,
    textColor: r.text_color ?? r.textColor ?? null,
    overlayOpacity: r.overlay_opacity ?? r.overlayOpacity ?? null,
    borderRadius: r.border_radius ?? r.borderRadius ?? null,
    shadowPreset: r.shadow_preset ?? r.shadowPreset ?? null,
    buttonVariant: r.button_variant ?? r.buttonVariant ?? null,
    showCloseIcon: r.show_close_icon ?? r.showCloseIcon ?? true,
    closeOnOverlay: r.close_on_overlay ?? r.closeOnOverlay ?? true,
    closeOnEscape: r.close_on_escape ?? r.closeOnEscape ?? true,

    priority: Number.isFinite(r.priority) ? r.priority : 0,
    updatedAt: r.updated_at ?? r.updatedAt ?? new Date().toISOString(),
  }
}

export async function fetchActivePopupsForPage(pageId: string): Promise<PublicPopup[]> {
  const supabase = getSupabaseBrowserClient()

  const { data: mappings, error: mapErr } = await supabase
    .from("popup_pages_public")
    .select("popup_id, page_id")
    .eq("page_id", pageId)

  if (mapErr) {
    console.error("popup_pages_public load error:", mapErr)
  }

  const popupIds = Array.from(
    new Set(((mappings ?? []) as unknown as PopupPagePublicRow[]).map((m) => String(m.popup_id)))
  )

  // Always include all_pages=true popups; additionally include page-mapped popups.
  let q = supabase.from("popups_public").select("*").eq("all_pages", true)
  if (popupIds.length > 0) {
    q = supabase.from("popups_public").select("*").or(`all_pages.eq.true,id.in.(${popupIds.join(",")})`)
  }

  const { data, error } = await q
  if (error) {
    console.error("popups_public load error:", error)
    return []
  }

  const rows = (data ?? []) as any[]
  return rows.map(mapPublicPopupRow)
}

export function pickTopPopup(popups: PublicPopup[]): PublicPopup | null {
  if (!popups.length) return null
  const sorted = [...popups].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority
    const bt = new Date(b.updatedAt).getTime()
    const at = new Date(a.updatedAt).getTime()
    return bt - at
  })
  return sorted[0] ?? null
}

