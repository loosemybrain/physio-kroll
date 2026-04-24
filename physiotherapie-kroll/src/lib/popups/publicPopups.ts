"use client"

import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { POPUP_TRIGGER_TYPES, type PublicPopup, type PopupTriggerType } from "@/types/popups"

type PopupPagePublicRow = { popup_id: string; page_id: string }
const IS_DEV = process.env.NODE_ENV !== "production"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

/**
 * PostgREST/Supabase-Fehler sind oft Klasseninstanzen — im Browser/DevTools wirken sie wie `{}`.
 * Für Diagnose nur primitive Felder durchreichen.
 */
function summarizeDbError(e: unknown): Record<string, string | undefined> | null {
  if (e == null) return null
  if (typeof e === "object") {
    const o = e as Record<string, unknown>
    const message = typeof o.message === "string" ? o.message : undefined
    const code = typeof o.code === "string" ? o.code : undefined
    const details = typeof o.details === "string" ? o.details : undefined
    const hint = typeof o.hint === "string" ? o.hint : undefined
    if (message || code || details || hint) {
      return { message, code, details, hint }
    }
  }
  return { message: String(e) }
}

function logPublicPopupError(args: {
  stage: "mapping" | "all_pages" | "mapped_popups"
  tableOrView: "popup_pages_public" | "popups_public"
  pageId: string
  error: unknown
  extra?: Record<string, unknown>
}) {
  if (!IS_DEV) return
  const summary = summarizeDbError(args.error)
  console.error("[popups-public] fetch error", {
    stage: args.stage,
    tableOrView: args.tableOrView,
    pageId: args.pageId,
    errorSummary: summary,
    ...args.extra,
  })
  if (summary) {
    console.error("[popups-public] fetch error (JSON)", JSON.stringify({ stage: args.stage, tableOrView: args.tableOrView, pageId: args.pageId, errorSummary: summary, ...args.extra }))
  }
}

/** PostgREST `.in("id", …)` bricht bei ungültigen UUIDs komplett ab — nur syntaktisch gültige IDs durchlassen. */
const POPUP_ID_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function filterValidPopupIds(ids: string[]): { valid: string[]; dropped: string[] } {
  const valid: string[] = []
  const dropped: string[] = []
  for (const id of ids) {
    if (POPUP_ID_UUID_RE.test(id)) valid.push(id)
    else dropped.push(id)
  }
  return { valid, dropped }
}

function normalizeTriggerType(raw: unknown): PopupTriggerType {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : ""
  return (POPUP_TRIGGER_TYPES as readonly string[]).includes(s) ? (s as PopupTriggerType) : "delay"
}

function mapPublicPopupRow(r: Record<string, unknown>): PublicPopup {
  return {
    id: asString(r.id),
    headline: asNullableString(r.headline),
    body: asNullableString(r.body),
    imageUrl: asNullableString(r.image_url ?? r.imageUrl),
    ctaLabel: asNullableString(r.cta_label ?? r.ctaLabel),
    ctaUrl: asNullableString(r.cta_url ?? r.ctaUrl),
    closeLabel: asNullableString(r.close_label ?? r.closeLabel),

    triggerType: normalizeTriggerType(r.trigger_type ?? r.triggerType ?? "delay"),
    triggerDelaySeconds: asNullableNumber(r.trigger_delay_seconds ?? r.triggerDelaySeconds),
    triggerScrollPercent: asNullableNumber(r.trigger_scroll_percent ?? r.triggerScrollPercent),
    showOncePerSession: asBool(r.show_once_per_session ?? r.showOncePerSession, true),
    showOncePerBrowser: asBool(r.show_once_per_browser ?? r.showOncePerBrowser, false),

    allPages: asBool(r.all_pages ?? r.allPages, false),

    designVariant: (r.design_variant ?? r.designVariant ?? "promotion") as PublicPopup["designVariant"],
    size: (r.size ?? "medium") as PublicPopup["size"],
    position: (r.position ?? "center") as PublicPopup["position"],
    layoutVariant: (r.layout_variant ?? r.layoutVariant ?? "image_top") as PublicPopup["layoutVariant"],
    animationVariant: (r.animation_variant ?? r.animationVariant ?? "fade") as PublicPopup["animationVariant"],
    animationFadeInMs: asNullableNumber(r.animation_fade_in_ms ?? r.animationFadeInMs) ?? 620,
    animationFadeOutMs: asNullableNumber(r.animation_fade_out_ms ?? r.animationFadeOutMs) ?? 220,
    bgColor: asNullableString(r.bg_color ?? r.bgColor),
    textColor: asNullableString(r.text_color ?? r.textColor),
    overlayOpacity: asNullableNumber(r.overlay_opacity ?? r.overlayOpacity),
    borderRadius: asNullableString(r.border_radius ?? r.borderRadius),
    shadowPreset: asNullableString(r.shadow_preset ?? r.shadowPreset),
    buttonVariant: asNullableString(r.button_variant ?? r.buttonVariant),
    showCloseIcon: asBool(r.show_close_icon ?? r.showCloseIcon, true),
    closeOnOverlay: asBool(r.close_on_overlay ?? r.closeOnOverlay, true),
    closeOnEscape: asBool(r.close_on_escape ?? r.closeOnEscape, true),

    priority: asNullableNumber(r.priority) ?? 0,
    updatedAt: asString(r.updated_at ?? r.updatedAt, new Date().toISOString()),
  }
}

export async function fetchActivePopupsForPage(pageId: string): Promise<PublicPopup[]> {
  const supabase = getSupabaseBrowserClient()

  const { data: allPagesRows, error: allPagesErr } = await supabase
    .from("popups_public")
    .select("*")
    .eq("all_pages", true)

  if (allPagesErr) {
    logPublicPopupError({
      stage: "all_pages",
      tableOrView: "popups_public",
      pageId,
      error: allPagesErr,
      extra: { query: "all_pages = true" },
    })
  }

  const { data: mappings, error: mapErr } = await supabase
    .from("popup_pages_public")
    .select("popup_id, page_id")
    .eq("page_id", pageId)

  if (mapErr) {
    logPublicPopupError({
      stage: "mapping",
      tableOrView: "popup_pages_public",
      pageId,
      error: mapErr,
    })
  }

  const mappingRows = Array.isArray(mappings) ? (mappings as PopupPagePublicRow[]) : []
  const rawPopupIds = mapErr
    ? []
    : Array.from(
        new Set(
          mappingRows
            .map((m) => (typeof m.popup_id === "string" ? m.popup_id.trim() : ""))
            .filter((id) => id.length > 0)
        )
      )

  const { valid: popupIds, dropped: droppedPopupIds } = filterValidPopupIds(rawPopupIds)
  if (IS_DEV && droppedPopupIds.length > 0) {
    console.error("[popups-public] dropped invalid popup_id values (mapping)", {
      tableOrView: "popup_pages_public",
      pageId,
      droppedCount: droppedPopupIds.length,
      sample: droppedPopupIds.slice(0, 5),
    })
  }

  let mappedRows: unknown[] = []
  let mappedErr: { message?: string; code?: string; details?: string; hint?: string } | null = null
  if (!mapErr && popupIds.length > 0) {
    const { data: mappedData, error: mappedQueryErr } = await supabase
      .from("popups_public")
      .select("*")
      .in("id", popupIds)

    if (mappedQueryErr) {
      mappedErr = mappedQueryErr
      logPublicPopupError({
        stage: "mapped_popups",
        tableOrView: "popups_public",
        pageId,
        error: mappedQueryErr,
        extra: { popupIdsCount: popupIds.length },
      })
    } else if (Array.isArray(mappedData)) {
      mappedRows = mappedData
    }
  }

  if (allPagesErr && mapErr) {
    if (IS_DEV) {
      const fatalPayload = {
        pageId,
        views: ["popups_public", "popup_pages_public"],
        allPagesError: summarizeDbError(allPagesErr),
        mappingError: summarizeDbError(mapErr),
      }
      console.error("[popups-public] fatal: both all_pages and mapping failed", fatalPayload)
      console.error("[popups-public] fatal (JSON)", JSON.stringify(fatalPayload))
    }
    return []
  }

  const combinedRows = [...(Array.isArray(allPagesRows) ? allPagesRows : []), ...mappedRows]
  const byId = new Map<string, Record<string, unknown>>()
  for (const row of combinedRows) {
    if (!isRecord(row)) continue
    const id = asString(row.id).trim()
    if (!id) continue
    byId.set(id, row)
  }

  const result = Array.from(byId.values()).map(mapPublicPopupRow)

  if (IS_DEV && result.length === 0) {
    const allPagesRowCount = Array.isArray(allPagesRows) ? allPagesRows.length : 0
    const mappedRowCount = mappedRows.length
    const anyQueryError = !!(allPagesErr || mapErr || mappedErr)
    const payload = {
      pageId,
      views: ["popups_public", "popup_pages_public"],
      allPagesRowCount,
      mappedRowCount,
      mappingRowCount: mappingRows.length,
      validMappedIdCount: popupIds.length,
      allPagesError: summarizeDbError(allPagesErr),
      mappingError: summarizeDbError(mapErr),
      mappedPopupsError: summarizeDbError(mappedErr),
    }
    if (anyQueryError) {
      console.error("[popups-public] no popups after merge", payload)
      console.error("[popups-public] no popups after merge (JSON)", JSON.stringify(payload))
    } else {
      console.info("[popups-public] no active popups for this page (queries ok, zero rows)", payload)
      console.info(
        "[popups-public] Hinweis: popups_public enthält nur Zeilen mit is_active=true, gültigem Zeitraum (starts_at/ends_at), und ggf. popup_pages_public-Zuordnung zur pageId — prüfen Sie im Admin: Aktiv, Zeitraum, „Alle Seiten“ oder Seitenauswahl."
      )
    }
  }

  return result
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

