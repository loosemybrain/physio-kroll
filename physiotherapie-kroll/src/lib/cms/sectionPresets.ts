import type { BrandKey } from "@/components/brand/brandAssets"
import type { BlockSectionProps, SectionBackgroundPreset } from "@/types/cms"
import type { NavConfig } from "@/types/navigation"

export type ApplyPresetMode = "full" | "backgroundOnly"

export function getSectionPresetsForBrand(config: NavConfig | null | undefined): SectionBackgroundPreset[] {
  return (config?.presets?.sectionBackground ?? []).filter((p) => p && p.id && p.name && p.section)
}

export function applyPresetToSection(current: BlockSectionProps | undefined, preset: SectionBackgroundPreset, mode: ApplyPresetMode): BlockSectionProps {
  // Deep copy to avoid accidental shared references in state
  const presetSection = JSON.parse(JSON.stringify(preset.section)) as BlockSectionProps
  if (mode === "full") return presetSection
  return {
    ...(current ?? presetSection),
    background: presetSection.background,
  }
}

export function ensureDefaultPresets(config: NavConfig, brand: BrandKey): NavConfig {
  const existing = config.presets?.sectionBackground
  if (existing && existing.length > 0) return config

  return {
    ...config,
    presets: {
      ...(config.presets ?? {}),
      sectionBackground: defaultSectionPresets(brand),
    },
  }
}

function preset(id: string, name: string, section: BlockSectionProps, description?: string): SectionBackgroundPreset {
  return { id, name, description, section }
}

export function defaultSectionPresets(brand: BrandKey): SectionBackgroundPreset[] {
  if (brand === "physio-konzept") return konzeptPresets()
  return physioPresets()
}

function baseSection(): BlockSectionProps {
  return {
    layout: { width: "contained", paddingY: "lg" },
    background: { type: "none", parallax: false },
  }
}

function physioPresets(): SectionBackgroundPreset[] {
  return [
    preset(
      "p-clean-white",
      "Clean White Section",
      {
        ...baseSection(),
        background: { type: "color", parallax: false, color: { value: "#ffffff" } },
      },
      "Clean, neutral, contained"
    ),
    preset(
      "p-neutral-gray",
      "Neutral Gray Background",
      {
        ...baseSection(),
        background: { type: "color", parallax: false, color: { value: "#f3f4f6" } },
      },
      "Helles Grau für ruhige Abschnitte"
    ),
    preset(
      "p-soft-blue-gradient",
      "Soft Blue Gradient",
      {
        layout: { width: "full", paddingY: "xl", minHeight: "md" },
        background: {
          type: "gradient",
          parallax: false,
          gradient: {
            kind: "linear",
            direction: "to bottom right",
            stops: [
              { color: "#ffffff", pos: 0 },
              { color: "#e0f2fe", pos: 55 },
              { color: "#38bdf8", pos: 100 },
            ],
          },
        },
      },
      "Weicher Verlauf mit blauem Akzent"
    ),
    preset(
      "p-conic-accent-glow",
      "Conic Accent Glow",
      {
        layout: { width: "full", paddingY: "xl" },
        background: {
          type: "gradient",
          parallax: false,
          gradient: {
            kind: "conic",
            stops: [
              { color: "#e0f2fe", pos: 0 },
              { color: "#ffffff", pos: 45 },
              { color: "#38bdf8", pos: 100 },
            ],
          },
        },
      },
      "Conic Glow (alle Richtungen)"
    ),
    preset(
      "p-radial-spotlight",
      "Radial Spotlight",
      {
        layout: { width: "full", paddingY: "xl" },
        background: {
          type: "gradient",
          parallax: false,
          gradient: {
            kind: "radial",
            stops: [
              { color: "#ffffff", pos: 0 },
              { color: "#e0f2fe", pos: 45 },
              { color: "#0ea5e9", pos: 100 },
            ],
          },
        },
      },
      "Radialer Fokus (Spotlight)"
    ),
    preset(
      "p-image-dark-overlay",
      "Image Dark Overlay",
      {
        layout: { width: "full", paddingY: "xl", minHeight: "md" },
        background: {
          type: "image",
          parallax: true,
          image: {
            mediaId: null,
            fit: "cover",
            position: "center",
            overlay: { value: "#0b1220", opacity: 55 },
            blur: 0,
          },
        },
      },
      "Bild + dunkles Overlay (mediaId auswählen)"
    ),
    preset(
      "p-video-hero-dark",
      "Video Hero Dark",
      {
        layout: { width: "full", paddingY: "xl", minHeight: "screen" },
        background: {
          type: "video",
          parallax: true,
          video: {
            mediaId: null,
            posterMediaId: null,
            overlay: { value: "#0b1220", opacity: 60 },
          },
        },
      },
      "Video + dunkles Overlay (mediaId auswählen)"
    ),
  ]
}

function konzeptPresets(): SectionBackgroundPreset[] {
  return [
    preset(
      "k-minimal-contained",
      "Minimal Contained",
      baseSection(),
      "Contained + kein Background"
    ),
    preset(
      "k-deep-navy",
      "Deep Navy",
      {
        layout: { width: "full", paddingY: "xl" },
        background: { type: "color", parallax: false, color: { value: "#0b1220" } },
      },
      "Dunkler Vollbreite-Background"
    ),
    preset(
      "k-dark-elegant-gradient",
      "Dark Elegant Gradient",
      {
        layout: { width: "full", paddingY: "xl", minHeight: "md" },
        background: {
          type: "gradient",
          parallax: false,
          gradient: {
            kind: "linear",
            direction: "to bottom right",
            stops: [
              { color: "#0b1220", pos: 0 },
              { color: "#111827", pos: 55 },
              { color: "#f59e0b", pos: 100 },
            ],
          },
        },
      },
      "Dunkler Verlauf mit warmem Akzent"
    ),
    preset(
      "k-warm-conic-glow",
      "Warm Conic Glow",
      {
        layout: { width: "full", paddingY: "xl" },
        background: {
          type: "gradient",
          parallax: false,
          gradient: {
            kind: "conic",
            stops: [
              { color: "#111827", pos: 0 },
              { color: "#0b1220", pos: 45 },
              { color: "#f59e0b", pos: 100 },
            ],
          },
        },
      },
      "Conic Glow mit warmem Akzent"
    ),
    preset(
      "k-radial-center-focus",
      "Radial Center Focus",
      {
        layout: { width: "full", paddingY: "xl" },
        background: {
          type: "gradient",
          parallax: false,
          gradient: {
            kind: "radial",
            stops: [
              { color: "#111827", pos: 0 },
              { color: "#0b1220", pos: 55 },
              { color: "#f59e0b", pos: 100 },
            ],
          },
        },
      },
      "Radialer Fokus für dunkle Sections"
    ),
    preset(
      "k-muted-image-overlay",
      "Muted Image Overlay",
      {
        layout: { width: "full", paddingY: "xl", minHeight: "md" },
        background: {
          type: "image",
          parallax: true,
          image: {
            mediaId: null,
            fit: "cover",
            position: "center",
            overlay: { value: "#0b1220", opacity: 45 },
            blur: 0,
          },
        },
      },
      "Bild + muted Overlay (mediaId auswählen)"
    ),
  ]
}

