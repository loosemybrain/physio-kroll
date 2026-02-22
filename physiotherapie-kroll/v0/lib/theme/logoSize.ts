const sizeMap = {
  sm: { width: "w-24", maxWidth: "max-w-24", imgW: 96, imgH: 40 },
  md: { width: "w-36", maxWidth: "max-w-36", imgW: 144, imgH: 48 },
  lg: { width: "w-48", maxWidth: "max-w-48", imgW: 192, imgH: 56 },
} as const

type LogoSize = "sm" | "md" | "lg"

export function getLogoSizeClasses(size: LogoSize) {
  const s = sizeMap[size] ?? sizeMap.md
  return { width: s.width, maxWidth: s.maxWidth }
}

export function getLogoImageDimensions(size: LogoSize) {
  const s = sizeMap[size] ?? sizeMap.md
  return { width: s.imgW, height: s.imgH }
}
