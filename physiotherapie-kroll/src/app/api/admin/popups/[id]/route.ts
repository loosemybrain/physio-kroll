import { NextResponse } from "next/server"
import { requireAdminWithServiceRole } from "@/lib/api/adminServiceRoute"
import {
  POPUP_ANIMATION_VARIANTS,
  POPUP_DESIGN_VARIANTS,
  POPUP_LAYOUT_VARIANTS,
  POPUP_POSITIONS,
  POPUP_SIZES,
  POPUP_TRIGGER_TYPES,
  type PopupAnimationVariant,
  type PopupDesignVariant,
  type PopupLayoutVariant,
  type PopupPosition,
  type PopupSize,
  type PopupTriggerType,
} from "@/types/popups"

function isUuid(v: unknown): v is string {
  if (typeof v !== "string") return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
}

function isStringOrNull(v: unknown): v is string | null {
  return v === null || typeof v === "string"
}

function isBoolean(v: unknown): v is boolean {
  return typeof v === "boolean"
}

function isNumberOrNull(v: unknown): v is number | null {
  return v === null || typeof v === "number"
}

type IncomingPopup = {
  id: string
  name: string
  slug: string | null
  isActive: boolean
  internalNotes: string | null

  headline: string | null
  body: string | null
  imageUrl: string | null
  ctaLabel: string | null
  ctaUrl: string | null
  closeLabel: string | null

  startsAt: string | null
  endsAt: string | null

  triggerType: PopupTriggerType
  triggerDelaySeconds: number | null
  triggerScrollPercent: number | null
  showOncePerSession: boolean
  showOncePerBrowser: boolean

  allPages: boolean
  selectedPageIds: string[]

  designVariant: PopupDesignVariant
  size: PopupSize
  position: PopupPosition
  layoutVariant: PopupLayoutVariant
  animationVariant: PopupAnimationVariant
  animationFadeInMs: number
  animationFadeOutMs: number
  bgColor: string | null
  textColor: string | null
  overlayOpacity: number | null
  borderRadius: string | null
  shadowPreset: string | null
  buttonVariant: string | null
  showCloseIcon: boolean
  closeOnOverlay: boolean
  closeOnEscape: boolean

  priority: number
}

function parseIncoming(body: unknown): { ok: true; value: IncomingPopup } | { ok: false; status: number; error: string } {
  if (!body || typeof body !== "object") return { ok: false, status: 400, error: "Invalid payload" }
  const b = body as Record<string, unknown>

  const id = b.id
  if (!isUuid(id)) return { ok: false, status: 400, error: "Invalid id" }

  const name = b.name
  if (typeof name !== "string" || !name.trim()) return { ok: false, status: 400, error: "Missing name" }

  const slug = b.slug
  if (!isStringOrNull(slug)) return { ok: false, status: 400, error: "Invalid slug" }

  const isActive = b.isActive
  if (!isBoolean(isActive)) return { ok: false, status: 400, error: "Invalid isActive" }

  const internalNotes = b.internalNotes
  if (!isStringOrNull(internalNotes)) return { ok: false, status: 400, error: "Invalid internalNotes" }

  const headline = b.headline
  if (!isStringOrNull(headline)) return { ok: false, status: 400, error: "Invalid headline" }
  const bodyText = b.body
  if (!isStringOrNull(bodyText)) return { ok: false, status: 400, error: "Invalid body" }
  const imageUrl = b.imageUrl
  if (!isStringOrNull(imageUrl)) return { ok: false, status: 400, error: "Invalid imageUrl" }
  const ctaLabel = b.ctaLabel
  if (!isStringOrNull(ctaLabel)) return { ok: false, status: 400, error: "Invalid ctaLabel" }
  const ctaUrl = b.ctaUrl
  if (!isStringOrNull(ctaUrl)) return { ok: false, status: 400, error: "Invalid ctaUrl" }
  const closeLabel = b.closeLabel
  if (!isStringOrNull(closeLabel)) return { ok: false, status: 400, error: "Invalid closeLabel" }

  const startsAt = b.startsAt
  if (!isStringOrNull(startsAt)) return { ok: false, status: 400, error: "Invalid startsAt" }
  const endsAt = b.endsAt
  if (!isStringOrNull(endsAt)) return { ok: false, status: 400, error: "Invalid endsAt" }

  const triggerType = b.triggerType
  if (typeof triggerType !== "string" || !new Set(POPUP_TRIGGER_TYPES).has(triggerType as PopupTriggerType)) {
    return { ok: false, status: 400, error: "Invalid triggerType" }
  }
  const triggerDelaySeconds = b.triggerDelaySeconds
  if (!isNumberOrNull(triggerDelaySeconds)) return { ok: false, status: 400, error: "Invalid triggerDelaySeconds" }
  const triggerScrollPercent = b.triggerScrollPercent
  if (!isNumberOrNull(triggerScrollPercent)) return { ok: false, status: 400, error: "Invalid triggerScrollPercent" }
  const showOncePerSession = b.showOncePerSession
  if (!isBoolean(showOncePerSession)) return { ok: false, status: 400, error: "Invalid showOncePerSession" }
  const showOncePerBrowser = b.showOncePerBrowser
  if (!isBoolean(showOncePerBrowser)) return { ok: false, status: 400, error: "Invalid showOncePerBrowser" }

  const allPages = b.allPages
  if (!isBoolean(allPages)) return { ok: false, status: 400, error: "Invalid allPages" }
  const selectedPageIdsRaw = b.selectedPageIds
  const selectedPageIds = Array.isArray(selectedPageIdsRaw) ? selectedPageIdsRaw.filter((x) => isUuid(x)) : []

  const designVariant = b.designVariant
  if (typeof designVariant !== "string" || !new Set(POPUP_DESIGN_VARIANTS).has(designVariant as PopupDesignVariant)) {
    return { ok: false, status: 400, error: "Invalid designVariant" }
  }

  const size = b.size
  if (typeof size !== "string" || !new Set(POPUP_SIZES).has(size as PopupSize)) return { ok: false, status: 400, error: "Invalid size" }
  const position = b.position
  if (typeof position !== "string" || !new Set(POPUP_POSITIONS).has(position as PopupPosition)) return { ok: false, status: 400, error: "Invalid position" }
  const layoutVariant = b.layoutVariant
  if (typeof layoutVariant !== "string" || !new Set(POPUP_LAYOUT_VARIANTS).has(layoutVariant as PopupLayoutVariant)) {
    return { ok: false, status: 400, error: "Invalid layoutVariant" }
  }
  const animationVariant = b.animationVariant
  if (typeof animationVariant !== "string" || !new Set(POPUP_ANIMATION_VARIANTS).has(animationVariant as PopupAnimationVariant)) {
    return { ok: false, status: 400, error: "Invalid animationVariant" }
  }

  const bgColor = b.bgColor
  if (!isStringOrNull(bgColor)) return { ok: false, status: 400, error: "Invalid bgColor" }
  const animationFadeInMsRaw = b.animationFadeInMs
  if (animationFadeInMsRaw !== undefined && (typeof animationFadeInMsRaw !== "number" || !Number.isFinite(animationFadeInMsRaw))) {
    return { ok: false, status: 400, error: "Invalid animationFadeInMs" }
  }
  const animationFadeOutMsRaw = b.animationFadeOutMs
  if (animationFadeOutMsRaw !== undefined && (typeof animationFadeOutMsRaw !== "number" || !Number.isFinite(animationFadeOutMsRaw))) {
    return { ok: false, status: 400, error: "Invalid animationFadeOutMs" }
  }
  const animationFadeInMs = typeof animationFadeInMsRaw === "number" ? animationFadeInMsRaw : 620
  const animationFadeOutMs = typeof animationFadeOutMsRaw === "number" ? animationFadeOutMsRaw : 220
  const textColor = b.textColor
  if (!isStringOrNull(textColor)) return { ok: false, status: 400, error: "Invalid textColor" }
  const overlayOpacity = b.overlayOpacity
  if (!isNumberOrNull(overlayOpacity)) return { ok: false, status: 400, error: "Invalid overlayOpacity" }
  const borderRadius = b.borderRadius
  if (!isStringOrNull(borderRadius)) return { ok: false, status: 400, error: "Invalid borderRadius" }
  const shadowPreset = b.shadowPreset
  if (!isStringOrNull(shadowPreset)) return { ok: false, status: 400, error: "Invalid shadowPreset" }
  const buttonVariant = b.buttonVariant
  if (!isStringOrNull(buttonVariant)) return { ok: false, status: 400, error: "Invalid buttonVariant" }

  const showCloseIcon = b.showCloseIcon
  if (!isBoolean(showCloseIcon)) return { ok: false, status: 400, error: "Invalid showCloseIcon" }
  const closeOnOverlay = b.closeOnOverlay
  if (!isBoolean(closeOnOverlay)) return { ok: false, status: 400, error: "Invalid closeOnOverlay" }
  const closeOnEscape = b.closeOnEscape
  if (!isBoolean(closeOnEscape)) return { ok: false, status: 400, error: "Invalid closeOnEscape" }

  const priority = b.priority
  if (typeof priority !== "number" || !Number.isFinite(priority)) return { ok: false, status: 400, error: "Invalid priority" }

  return {
    ok: true,
    value: {
      id,
      name: name.trim(),
      slug: slug && slug.trim() ? slug.trim() : null,
      isActive,
      internalNotes: internalNotes && internalNotes.trim() ? internalNotes.trim() : null,

      headline: headline && headline.trim() ? headline.trim() : null,
      body: bodyText && bodyText.trim() ? bodyText.trim() : null,
      imageUrl: imageUrl && imageUrl.trim() ? imageUrl.trim() : null,
      ctaLabel: ctaLabel && ctaLabel.trim() ? ctaLabel.trim() : null,
      ctaUrl: ctaUrl && ctaUrl.trim() ? ctaUrl.trim() : null,
      closeLabel: closeLabel && closeLabel.trim() ? closeLabel.trim() : null,

      startsAt: startsAt && startsAt.trim() ? startsAt : null,
      endsAt: endsAt && endsAt.trim() ? endsAt : null,

      triggerType: triggerType as PopupTriggerType,
      triggerDelaySeconds,
      triggerScrollPercent,
      showOncePerSession,
      showOncePerBrowser,

      allPages,
      selectedPageIds,

      designVariant: designVariant as PopupDesignVariant,
      size: size as PopupSize,
      position: position as PopupPosition,
      layoutVariant: layoutVariant as PopupLayoutVariant,
      animationVariant: animationVariant as PopupAnimationVariant,
      animationFadeInMs: Math.max(100, Math.min(4000, Math.trunc(animationFadeInMs))),
      animationFadeOutMs: Math.max(80, Math.min(3000, Math.trunc(animationFadeOutMs))),
      bgColor: bgColor && bgColor.trim() ? bgColor.trim() : null,
      textColor: textColor && textColor.trim() ? textColor.trim() : null,
      overlayOpacity,
      borderRadius: borderRadius && borderRadius.trim() ? borderRadius.trim() : null,
      shadowPreset: shadowPreset && shadowPreset.trim() ? shadowPreset.trim() : null,
      buttonVariant: buttonVariant && buttonVariant.trim() ? buttonVariant.trim() : null,
      showCloseIcon,
      closeOnOverlay,
      closeOnEscape,

      priority: Math.trunc(priority),
    },
  }
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireAdminWithServiceRole()
    if (!gate.ok) return gate.response

    const { adminClient } = gate.ctx
    const { id } = await ctx.params
    if (!isUuid(id)) return NextResponse.json({ error: "Invalid popup id" }, { status: 400 })

    const { data: popup, error } = await adminClient.from("popups").select("*").eq("id", id).single()
    if (error || !popup) {
      return NextResponse.json({ error: "Popup not found" }, { status: 404 })
    }

    const { data: mappings, error: mapErr } = await adminClient
      .from("popup_pages")
      .select("page_id")
      .eq("popup_id", id)

    if (mapErr) {
      console.error("admin popup pages load error:", mapErr)
      return NextResponse.json({ error: "Failed to load popup pages" }, { status: 500 })
    }

    return NextResponse.json(
      {
        id: popup.id,
        name: popup.name,
        slug: popup.slug ?? null,
        isActive: popup.is_active ?? false,
        internalNotes: popup.internal_notes ?? null,

        headline: popup.headline ?? null,
        body: popup.body ?? null,
        imageUrl: popup.image_url ?? null,
        ctaLabel: popup.cta_label ?? null,
        ctaUrl: popup.cta_url ?? null,
        closeLabel: popup.close_label ?? null,

        startsAt: popup.starts_at ?? null,
        endsAt: popup.ends_at ?? null,

        triggerType: (popup.trigger_type ?? "delay") as PopupTriggerType,
        triggerDelaySeconds: popup.trigger_delay_seconds ?? null,
        triggerScrollPercent: popup.trigger_scroll_percent ?? null,
        showOncePerSession: popup.show_once_per_session ?? true,
        showOncePerBrowser: popup.show_once_per_browser ?? false,

        allPages: popup.all_pages ?? false,
        selectedPageIds: (mappings ?? []).map((m: Record<string, unknown>) => String(m.page_id)),

        designVariant: (popup.design_variant ?? "promotion") as PopupDesignVariant,
        size: (popup.size ?? "medium") as PopupSize,
        position: (popup.position ?? "center") as PopupPosition,
        layoutVariant: (popup.layout_variant ?? "image_top") as PopupLayoutVariant,
        animationVariant: (popup.animation_variant ?? "fade") as PopupAnimationVariant,
        animationFadeInMs: popup.animation_fade_in_ms ?? 620,
        animationFadeOutMs: popup.animation_fade_out_ms ?? 220,
        bgColor: popup.bg_color ?? null,
        textColor: popup.text_color ?? null,
        overlayOpacity: popup.overlay_opacity ?? null,
        borderRadius: popup.border_radius ?? null,
        shadowPreset: popup.shadow_preset ?? null,
        buttonVariant: popup.button_variant ?? null,
        showCloseIcon: popup.show_close_icon ?? true,
        closeOnOverlay: popup.close_on_overlay ?? true,
        closeOnEscape: popup.close_on_escape ?? true,

        priority: popup.priority ?? 0,
        createdAt: popup.created_at,
        updatedAt: popup.updated_at,
      },
      { status: 200 }
    )
  } catch (e) {
    console.error("admin popup GET failed:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireAdminWithServiceRole()
    if (!gate.ok) return gate.response

    const { adminClient } = gate.ctx
    const { id } = await ctx.params
    if (!isUuid(id)) return NextResponse.json({ error: "Invalid popup id" }, { status: 400 })

    const body = await req.json().catch(() => null)
    const parsed = parseIncoming(body)
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    if (parsed.value.id !== id) return NextResponse.json({ error: "Payload id mismatch" }, { status: 400 })

    const v = parsed.value

    if (v.isActive && !v.allPages && v.selectedPageIds.length === 0) {
      return NextResponse.json(
        {
          error:
            "Popup ist aktiv, aber ohne Seitenzuordnung: Bitte mindestens eine Seite auswählen oder „Auf allen Seiten“ aktivieren. Sonst erscheint das Popup in popups_public / popup_pages_public nicht.",
        },
        { status: 400 }
      )
    }

    const { data: saved, error } = await adminClient
      .from("popups")
      .upsert(
        {
          id: v.id,
          name: v.name,
          slug: v.slug,
          is_active: v.isActive,
          internal_notes: v.internalNotes,

          headline: v.headline,
          body: v.body,
          image_url: v.imageUrl,
          cta_label: v.ctaLabel,
          cta_url: v.ctaUrl,
          close_label: v.closeLabel,

          starts_at: v.startsAt,
          ends_at: v.endsAt,

          trigger_type: v.triggerType,
          trigger_delay_seconds: v.triggerDelaySeconds,
          trigger_scroll_percent: v.triggerScrollPercent,
          show_once_per_session: v.showOncePerSession,
          show_once_per_browser: v.showOncePerBrowser,

          all_pages: v.allPages,

          design_variant: v.designVariant,
          size: v.size,
          position: v.position,
          layout_variant: v.layoutVariant,
          animation_variant: v.animationVariant,
          animation_fade_in_ms: v.animationFadeInMs,
          animation_fade_out_ms: v.animationFadeOutMs,
          bg_color: v.bgColor,
          text_color: v.textColor,
          overlay_opacity: v.overlayOpacity,
          border_radius: v.borderRadius,
          shadow_preset: v.shadowPreset,
          button_variant: v.buttonVariant,
          show_close_icon: v.showCloseIcon,
          close_on_overlay: v.closeOnOverlay,
          close_on_escape: v.closeOnEscape,

          priority: v.priority,
        },
        { onConflict: "id" }
      )
      .select("*")
      .single()

    if (error || !saved) {
      console.error("admin popup upsert error:", error)
      return NextResponse.json(
        {
          error: "Failed to save popup",
          details: error?.message ?? null,
          hint: (error as { hint?: unknown } | null)?.hint ?? null,
          code: (error as { code?: unknown } | null)?.code ?? null,
        },
        { status: 500 }
      )
    }

    // Replace page mappings deterministically
    const { error: delErr } = await adminClient.from("popup_pages").delete().eq("popup_id", id)
    if (delErr) {
      console.error("admin popup_pages delete error:", delErr)
      return NextResponse.json({ error: "Failed to save popup pages" }, { status: 500 })
    }

    if (!v.allPages && v.selectedPageIds.length > 0) {
      const rows = v.selectedPageIds.map((pageId) => ({ popup_id: id, page_id: pageId }))
      const { error: insErr } = await adminClient.from("popup_pages").insert(rows)
      if (insErr) {
        console.error("admin popup_pages insert error:", insErr)
        return NextResponse.json({ error: "Failed to save popup pages" }, { status: 500 })
      }
    }

    const { data: mappings, error: mapErr } = await adminClient
      .from("popup_pages")
      .select("page_id")
      .eq("popup_id", id)

    if (mapErr) {
      console.error("admin popup_pages reload error:", mapErr)
      return NextResponse.json({ error: "Failed to reload popup pages" }, { status: 500 })
    }

    return NextResponse.json(
      {
        id: saved.id,
        name: saved.name,
        slug: saved.slug ?? null,
        isActive: saved.is_active ?? false,
        internalNotes: saved.internal_notes ?? null,

        headline: saved.headline ?? null,
        body: saved.body ?? null,
        imageUrl: saved.image_url ?? null,
        ctaLabel: saved.cta_label ?? null,
        ctaUrl: saved.cta_url ?? null,
        closeLabel: saved.close_label ?? null,

        startsAt: saved.starts_at ?? null,
        endsAt: saved.ends_at ?? null,

        triggerType: (saved.trigger_type ?? "delay") as PopupTriggerType,
        triggerDelaySeconds: saved.trigger_delay_seconds ?? null,
        triggerScrollPercent: saved.trigger_scroll_percent ?? null,
        showOncePerSession: saved.show_once_per_session ?? true,
        showOncePerBrowser: saved.show_once_per_browser ?? false,

        allPages: saved.all_pages ?? false,
        selectedPageIds: (mappings ?? []).map((m: Record<string, unknown>) => String(m.page_id)),

        designVariant: (saved.design_variant ?? "promotion") as PopupDesignVariant,
        size: (saved.size ?? "medium") as PopupSize,
        position: (saved.position ?? "center") as PopupPosition,
        layoutVariant: (saved.layout_variant ?? "image_top") as PopupLayoutVariant,
        animationVariant: (saved.animation_variant ?? "fade") as PopupAnimationVariant,
        animationFadeInMs: saved.animation_fade_in_ms ?? 620,
        animationFadeOutMs: saved.animation_fade_out_ms ?? 220,
        bgColor: saved.bg_color ?? null,
        textColor: saved.text_color ?? null,
        overlayOpacity: saved.overlay_opacity ?? null,
        borderRadius: saved.border_radius ?? null,
        shadowPreset: saved.shadow_preset ?? null,
        buttonVariant: saved.button_variant ?? null,
        showCloseIcon: saved.show_close_icon ?? true,
        closeOnOverlay: saved.close_on_overlay ?? true,
        closeOnEscape: saved.close_on_escape ?? true,

        priority: saved.priority ?? 0,
        createdAt: saved.created_at,
        updatedAt: saved.updated_at,
      },
      { status: 200 }
    )
  } catch (e) {
    console.error("admin popup PUT failed:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireAdminWithServiceRole()
    if (!gate.ok) return gate.response

    const { adminClient } = gate.ctx
    const { id } = await ctx.params
    if (!isUuid(id)) return NextResponse.json({ error: "Invalid popup id" }, { status: 400 })

    // mappings are ON DELETE CASCADE, but we delete explicit first for determinism/logging
    const { error: delMapErr } = await adminClient.from("popup_pages").delete().eq("popup_id", id)
    if (delMapErr) {
      console.error("admin popup_pages delete error:", delMapErr)
      return NextResponse.json({ error: "Failed to delete popup" }, { status: 500 })
    }

    const { error: delErr } = await adminClient.from("popups").delete().eq("id", id)
    if (delErr) {
      console.error("admin popup delete error:", delErr)
      return NextResponse.json({ error: "Failed to delete popup" }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e) {
    console.error("admin popup DELETE failed:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

