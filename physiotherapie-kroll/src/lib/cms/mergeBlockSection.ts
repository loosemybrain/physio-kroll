import type { BlockSectionProps, SectionBackground } from "@/types/cms"

/**
 * Merges saved block `section` with registry defaults per field (esp. `layout.width`).
 * Without this, a partial `section` from the DB (e.g. only `paddingY` + `background`)
 * replaces the whole default `section` in normalize and drops `layout.width: "full"` for legalHero.
 * BlockRenderer uses this so SSR and client see the same effective section → stable hydration.
 */
export function mergeBlockSectionWithDefaults(
  raw: BlockSectionProps | undefined,
  defaults: BlockSectionProps | undefined
): BlockSectionProps | undefined {
  if (!raw && !defaults) return undefined
  if (!defaults) return raw
  if (!raw) return defaults

  const rl = raw.layout
  const dl = defaults.layout

  return {
    layout: {
      width: rl?.width ?? dl?.width ?? "contained",
      paddingY: rl?.paddingY ?? dl?.paddingY ?? "lg",
      paddingX: rl?.paddingX ?? dl?.paddingX,
      minHeight: rl?.minHeight ?? dl?.minHeight,
    },
    background: {
      ...(defaults.background as object),
      ...((raw.background ?? {}) as object),
    } as SectionBackground,
    animation: raw.animation ?? defaults.animation,
    fullBleed: raw.fullBleed ?? defaults.fullBleed,
    anchor: raw.anchor ?? defaults.anchor,
  }
}
