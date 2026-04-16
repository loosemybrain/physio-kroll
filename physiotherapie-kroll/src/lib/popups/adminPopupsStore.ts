"use client"

import type { AdminPopup } from "@/types/popups"
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

function nowIso() {
  return new Date().toISOString()
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  const hex = (count: number) => {
    let result = ""
    for (let i = 0; i < count; i++) result += Math.floor(Math.random() * 16).toString(16)
    return result
  }
  const rnd = hex(12)
  const version = "4"
  const variant = (Math.floor(Math.random() * 4) + 8).toString(16)
  return `${hex(8)}-${hex(4)}-${version}${hex(3)}-${variant}${hex(3)}-${rnd}`
}

export type AdminPopupListItem = {
  id: string
  name: string
  slug: string | null
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
  allPages: boolean
  priority: number
  updatedAt: string
  assignedPages: Array<{ id: string; title: string; slug: string; brand: string | null }>
}

export async function listPopups(): Promise<AdminPopupListItem[]> {
  const res = await fetch("/api/admin/popups", { cache: "no-store" })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error || `Failed to load popups (${res.status})`)
  }
  return (await res.json()) as AdminPopupListItem[]
}

export async function getPopup(id: string): Promise<AdminPopup | null> {
  const res = await fetch(`/api/admin/popups/${id}`, { cache: "no-store" })
  if (res.status === 404) return null
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error || `Failed to load popup (${res.status})`)
  }
  const p = (await res.json()) as any
  return mapApiToAdminPopup(p)
}

export async function upsertPopup(next: AdminPopup): Promise<AdminPopup> {
  const payload = mapAdminPopupToApi(next)
  const res = await fetch(`/api/admin/popups/${next.id}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({} as any))
    const parts: string[] = []
    parts.push(body?.error || `Failed to save popup (${res.status})`)
    if (body?.details) parts.push(`details: ${String(body.details)}`)
    if (body?.code) parts.push(`code: ${String(body.code)}`)
    if (body?.hint) parts.push(`hint: ${String(body.hint)}`)
    throw new Error(parts.join(" | "))
  }
  const saved = (await res.json()) as any
  return mapApiToAdminPopup(saved)
}

export async function deletePopup(id: string) {
  const res = await fetch(`/api/admin/popups/${id}`, { method: "DELETE" })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error || `Failed to delete popup (${res.status})`)
  }
}

export function createEmptyPopup(input?: Partial<Pick<AdminPopup, "name" | "slug">>): AdminPopup {
  const id = uuid()
  const name = input?.name ?? "Neues Popup"
  const slug = input?.slug ?? null

  const designVariant: PopupDesignVariant = "promotion"
  const triggerType: PopupTriggerType = "delay"
  const size: PopupSize = "medium"
  const position: PopupPosition = "center"
  const layoutVariant: PopupLayoutVariant = "image_top"
  const animationVariant: PopupAnimationVariant = "fade"

  return {
    id,
    name,
    slug,
    isActive: false,
    internalNotes: null,
    content: {
      headline: "Hinweis",
      body: "Hier steht der Popup-Text.",
      imageUrl: null,
      ctaLabel: null,
      ctaUrl: null,
      closeLabel: "Schließen",
    },
    scheduling: {
      startsAt: null,
      endsAt: null,
    },
    trigger: {
      triggerType,
      triggerDelaySeconds: 3,
      triggerScrollPercent: null,
      showOncePerSession: true,
      showOncePerBrowser: false,
    },
    allPages: false,
    selectedPageIds: [],
    design: {
      designVariant,
      size,
      position,
      layoutVariant,
      animationVariant,
      animationFadeInMs: 620,
      animationFadeOutMs: 220,
      bgColor: null,
      textColor: null,
      overlayOpacity: 0.5,
      borderRadius: "12px",
      shadowPreset: "lg",
      buttonVariant: "default",
      showCloseIcon: true,
    },
    behavior: {
      closeOnOverlay: true,
      closeOnEscape: true,
    },
    priority: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

function safeEnum<T extends readonly string[]>(allowed: T, value: unknown, fallback: T[number]): T[number] {
  if (typeof value !== "string") return fallback
  return (allowed as readonly string[]).includes(value) ? (value as T[number]) : fallback
}

function mapApiToAdminPopup(p: any): AdminPopup {
  const triggerType = safeEnum(POPUP_TRIGGER_TYPES, p.triggerType ?? p.trigger_type, "delay") as PopupTriggerType
  const designVariant = safeEnum(POPUP_DESIGN_VARIANTS, p.designVariant ?? p.design_variant, "promotion") as PopupDesignVariant
  const size = safeEnum(POPUP_SIZES, p.size, "medium") as PopupSize
  const position = safeEnum(POPUP_POSITIONS, p.position, "center") as PopupPosition
  const layoutVariant = safeEnum(POPUP_LAYOUT_VARIANTS, p.layoutVariant ?? p.layout_variant, "image_top") as PopupLayoutVariant
  const animationVariant = safeEnum(POPUP_ANIMATION_VARIANTS, p.animationVariant ?? p.animation_variant, "fade") as PopupAnimationVariant

  return {
    id: String(p.id),
    name: String(p.name ?? ""),
    slug: p.slug ?? null,
    isActive: !!p.isActive,
    internalNotes: p.internalNotes ?? null,
    content: {
      headline: p.headline ?? null,
      body: p.body ?? null,
      imageUrl: p.imageUrl ?? null,
      ctaLabel: p.ctaLabel ?? null,
      ctaUrl: p.ctaUrl ?? null,
      closeLabel: p.closeLabel ?? null,
    },
    scheduling: {
      startsAt: p.startsAt ?? null,
      endsAt: p.endsAt ?? null,
    },
    trigger: {
      triggerType,
      triggerDelaySeconds: p.triggerDelaySeconds ?? null,
      triggerScrollPercent: p.triggerScrollPercent ?? null,
      showOncePerSession: p.showOncePerSession ?? true,
      showOncePerBrowser: p.showOncePerBrowser ?? false,
    },
    allPages: p.allPages ?? false,
    selectedPageIds: Array.isArray(p.selectedPageIds) ? (p.selectedPageIds as any[]).map(String) : [],
    design: {
      designVariant,
      size,
      position,
      layoutVariant,
      animationVariant,
      animationFadeInMs: Number.isFinite(p.animationFadeInMs ?? p.animation_fade_in_ms) ? (p.animationFadeInMs ?? p.animation_fade_in_ms) : 620,
      animationFadeOutMs: Number.isFinite(p.animationFadeOutMs ?? p.animation_fade_out_ms) ? (p.animationFadeOutMs ?? p.animation_fade_out_ms) : 220,
      bgColor: p.bgColor ?? null,
      textColor: p.textColor ?? null,
      overlayOpacity: p.overlayOpacity ?? null,
      borderRadius: p.borderRadius ?? null,
      shadowPreset: p.shadowPreset ?? null,
      buttonVariant: p.buttonVariant ?? null,
      showCloseIcon: p.showCloseIcon ?? true,
    },
    behavior: {
      closeOnOverlay: p.closeOnOverlay ?? true,
      closeOnEscape: p.closeOnEscape ?? true,
    },
    priority: Number.isFinite(p.priority) ? p.priority : 0,
    createdAt: p.createdAt ?? nowIso(),
    updatedAt: p.updatedAt ?? nowIso(),
  }
}

function mapAdminPopupToApi(p: AdminPopup) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    isActive: p.isActive,
    internalNotes: p.internalNotes,

    headline: p.content.headline,
    body: p.content.body,
    imageUrl: p.content.imageUrl,
    ctaLabel: p.content.ctaLabel,
    ctaUrl: p.content.ctaUrl,
    closeLabel: p.content.closeLabel,

    startsAt: p.scheduling.startsAt,
    endsAt: p.scheduling.endsAt,

    triggerType: p.trigger.triggerType,
    triggerDelaySeconds: p.trigger.triggerDelaySeconds,
    triggerScrollPercent: p.trigger.triggerScrollPercent,
    showOncePerSession: p.trigger.showOncePerSession,
    showOncePerBrowser: p.trigger.showOncePerBrowser,

    allPages: p.allPages,
    selectedPageIds: p.selectedPageIds,

    designVariant: p.design.designVariant,
    size: p.design.size,
    position: p.design.position,
    layoutVariant: p.design.layoutVariant,
    animationVariant: p.design.animationVariant,
    animationFadeInMs: p.design.animationFadeInMs,
    animationFadeOutMs: p.design.animationFadeOutMs,
    bgColor: p.design.bgColor,
    textColor: p.design.textColor,
    overlayOpacity: p.design.overlayOpacity,
    borderRadius: p.design.borderRadius,
    shadowPreset: p.design.shadowPreset,
    buttonVariant: p.design.buttonVariant,
    showCloseIcon: p.design.showCloseIcon,
    closeOnOverlay: p.behavior.closeOnOverlay,
    closeOnEscape: p.behavior.closeOnEscape,

    priority: p.priority,
  }
}

