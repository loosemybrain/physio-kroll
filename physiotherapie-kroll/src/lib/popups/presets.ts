"use client"

import type { AdminPopup } from "@/types/popups"

export const POPUP_PRESET_KEYS = ["customer_default", "appointment_reminder"] as const
export type PopupPresetKey = (typeof POPUP_PRESET_KEYS)[number]

export type PopupPresetMeta = {
  key: PopupPresetKey
  label: string
  description: string
}

export const POPUP_PRESETS: PopupPresetMeta[] = [
  {
    key: "customer_default",
    label: "Kunden-Preset (Standard)",
    description: "Neutraler Hinweis mit CTA, delay-Trigger, gut lesbares Standard-Design.",
  },
  {
    key: "appointment_reminder",
    label: "Termin-Erinnerung",
    description: "Kurzer Reminder mit CTA (z. B. Online-Termin / Anruf), dezentes Design.",
  },
]

export function applyPopupPreset(base: AdminPopup, preset: PopupPresetKey): AdminPopup {
  if (preset === "appointment_reminder") {
    return {
      ...base,
      name: "Termin-Erinnerung",
      slug: base.slug,
      isActive: false,
      content: {
        ...base.content,
        headline: "Termin vereinbaren",
        body: "Sichern Sie sich jetzt Ihren Wunschtermin. Wir beraten Sie gerne persönlich.",
        ctaLabel: "Jetzt Termin anfragen",
        ctaUrl: "https://example.com/termin",
        closeLabel: "Später",
      },
      trigger: {
        ...base.trigger,
        triggerType: "delay",
        triggerDelaySeconds: 5,
        triggerScrollPercent: null,
        showOncePerSession: true,
        showOncePerBrowser: false,
      },
      design: {
        ...base.design,
        designVariant: "promotion",
        layoutVariant: base.content.imageUrl ? "image_left" : "no_image",
        size: "medium",
        position: "center",
        animationVariant: "scale",
        bgColor: "#ffffff",
        textColor: "#111827",
        overlayOpacity: 0.55,
        borderRadius: "14px",
        shadowPreset: "xl",
        buttonVariant: "default",
        showCloseIcon: true,
      },
      behavior: {
        ...base.behavior,
        closeOnOverlay: true,
        closeOnEscape: true,
      },
      priority: Math.max(base.priority, 10),
    }
  }

  // customer_default
  return {
    ...base,
    name: "Kunden-Hinweis",
    slug: base.slug,
    isActive: false,
    content: {
      ...base.content,
      headline: "Wichtiger Hinweis",
      body: "Kurzer Text, den der Kunde schnell anpassen kann. Optional mit CTA-Link.",
      ctaLabel: "Mehr erfahren",
      ctaUrl: "https://example.com/info",
      closeLabel: "Schließen",
    },
    trigger: {
      ...base.trigger,
      triggerType: "delay",
      triggerDelaySeconds: 3,
      triggerScrollPercent: null,
      showOncePerSession: true,
      showOncePerBrowser: true,
    },
    design: {
      ...base.design,
      designVariant: "promotion",
      layoutVariant: base.content.imageUrl ? "image_top" : "no_image",
      size: "medium",
      position: "center",
      animationVariant: "fade",
      bgColor: "#ffffff",
      textColor: "#0f172a",
      overlayOpacity: 0.6,
      borderRadius: "12px",
      shadowPreset: "lg",
      buttonVariant: "default",
      showCloseIcon: true,
    },
    behavior: {
      ...base.behavior,
      closeOnOverlay: true,
      closeOnEscape: true,
    },
    priority: Math.max(base.priority, 5),
  }
}

