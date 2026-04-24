import type { FooterSocialLinksConfig } from "@/types/footer"

type SocialKey = "facebook" | "instagram"
type SocialFillDirection = "bottom" | "top" | "left" | "right"

const NETWORK_COLORS: Record<SocialKey, string> = {
  facebook: "#1877F2",
  instagram: "#E1306C",
}

export const SOCIAL_FILL_RISE_DEFAULTS = {
  fillRiseUseNetworkColors: true,
  fillRiseIconRotate: true,
  fillRiseRotationDegrees: 360,
  fillRiseRotationAxis: "z" as const,
  fillRiseRotationDurationMs: 300,
  fillRiseDirection: "bottom" as SocialFillDirection,
  fillRiseBorderWidth: 2,
  fillRiseRadiusMode: "circle" as const,
}

export const SOCIAL_LIQUID_FILL_DEFAULTS = {
  liquidUseNetworkColors: true,
  liquidBorderWidth: 2,
  liquidWaveIntensity: "subtle" as const,
  liquidSpeed: "normal" as const,
}

export function clampFillRiseRotation(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return SOCIAL_FILL_RISE_DEFAULTS.fillRiseRotationDegrees
  return Math.max(0, Math.min(720, Math.round(value)))
}

export function clampFillRiseBorderWidth(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return SOCIAL_FILL_RISE_DEFAULTS.fillRiseBorderWidth
  return Math.max(0, Math.min(8, Math.round(value)))
}

export function clampLiquidBorderWidth(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return SOCIAL_LIQUID_FILL_DEFAULTS.liquidBorderWidth
  return Math.max(0, Math.min(8, Math.round(value)))
}

export function clampFillRiseRotationDuration(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return SOCIAL_FILL_RISE_DEFAULTS.fillRiseRotationDurationMs
  return Math.max(0, Math.min(2000, Math.round(value)))
}

export function getNetworkSocialColor(key: SocialKey): string {
  return NETWORK_COLORS[key]
}

export function getFillRiseTranslateVars(direction: FooterSocialLinksConfig["fillRiseDirection"]): {
  "--frx": string
  "--fry": string
} {
  switch (direction) {
    case "top":
      return { "--frx": "0%", "--fry": "-100%" }
    case "left":
      return { "--frx": "-100%", "--fry": "0%" }
    case "right":
      return { "--frx": "100%", "--fry": "0%" }
    case "bottom":
    default:
      return { "--frx": "0%", "--fry": "100%" }
  }
}

export function getFillRiseOverlayClass(direction: FooterSocialLinksConfig["fillRiseDirection"]): string {
  switch (direction) {
    case "top":
      return "-translate-y-full group-hover:translate-y-0 group-focus-visible:translate-y-0"
    case "left":
      return "-translate-x-full group-hover:translate-x-0 group-focus-visible:translate-x-0"
    case "right":
      return "translate-x-full group-hover:translate-x-0 group-focus-visible:translate-x-0"
    case "bottom":
    default:
      return "translate-y-full group-hover:translate-y-0 group-focus-visible:translate-y-0"
  }
}

export function getFillRiseIconStateClass(axis: FooterSocialLinksConfig["fillRiseRotationAxis"]): string {
  const rotationClass =
    axis === "x"
      ? "group-hover:transform-[rotateX(var(--fill-rise-rot,360deg))] group-focus-visible:transform-[rotateX(var(--fill-rise-rot,360deg))]"
      : axis === "y"
        ? "group-hover:transform-[rotateY(var(--fill-rise-rot,360deg))] group-focus-visible:transform-[rotateY(var(--fill-rise-rot,360deg))]"
        : "group-hover:transform-[rotate(var(--fill-rise-rot,360deg))] group-focus-visible:transform-[rotate(var(--fill-rise-rot,360deg))]"
  return `text-(--fill-rise-icon-base) ${rotationClass} group-hover:text-(--fill-rise-active-icon) group-focus-visible:text-(--fill-rise-active-icon)`
}

export function getFillRiseColor(input: {
  key: SocialKey
  socialLinks: FooterSocialLinksConfig
  accentFallback?: string
}): string {
  const { key, socialLinks, accentFallback } = input
  if (socialLinks.fillRiseUseNetworkColors) return NETWORK_COLORS[key]
  return (
    socialLinks.fillRiseFallbackColor ||
    socialLinks.hoverColor ||
    socialLinks.color ||
    accentFallback ||
    "var(--primary)"
  )
}

export function getLiquidFillColor(input: {
  key: SocialKey
  socialLinks: FooterSocialLinksConfig
  accentFallback?: string
}): string {
  const { key, socialLinks, accentFallback } = input
  if (socialLinks.liquidUseNetworkColors ?? SOCIAL_LIQUID_FILL_DEFAULTS.liquidUseNetworkColors) return NETWORK_COLORS[key]
  return (
    socialLinks.liquidFallbackColor ||
    socialLinks.hoverColor ||
    socialLinks.color ||
    accentFallback ||
    "var(--primary)"
  )
}

export function getLiquidFillDurationMs(speed: FooterSocialLinksConfig["liquidSpeed"]): number {
  return speed === "slow" ? 680 : 520
}
