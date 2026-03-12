/**
 * Client-side image optimization for upload.
 * Resizes and compresses images (JPEG, PNG, WebP) with intent-based presets.
 * Output prefers WebP. EXIF is stripped via canvas re-encode.
 *
 * Anpassbare Schwellenwerte (in dieser Datei):
 * - INTENT_MAX_DIMENSIONS: max. Breite/Höhe pro Verwendungszweck (hero, gallery, …)
 * - MODE_TARGET_KB: Zielgröße in KB pro Modus (auto, near-lossless, balanced, strong)
 * - MODE_QUALITY_STEPS: Qualitätsstufen (0–1) pro Modus für iterative Kompression
 * - MIN_QUALITY: untere Qualitätsgrenze
 * - MAX_DIMENSION: maximale Kantenlänge (4096)
 *
 * Modal-Schwelle (nur bei großen Bildern): IMAGE_OPTIMIZATION_MODAL_SIZE_THRESHOLD_BYTES
 * in MediaLibrary.tsx (z. B. 700 * 1024 = 700 KB).
 */

export type OptimizeImageIntent =
  | "hero"
  | "gallery"
  | "card"
  | "thumbnail"
  | "logo"
  | "general"

export type OptimizeMode = "auto" | "near-lossless" | "balanced" | "strong"

export type OptimizeImageOptions = {
  intent?: OptimizeImageIntent
  mode?: OptimizeMode
  maxWidth?: number
  maxHeight?: number
  targetMaxKB?: number
  preferWebP?: boolean
}

export type OptimizeImageResult = {
  file: File
  originalSize: number
  optimizedSize: number
  originalMimeType: string
  outputMimeType: string
  width?: number
  height?: number
  targetReached: boolean
  appliedMode: OptimizeMode
  appliedIntent: OptimizeImageIntent
}

const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const

const INTENT_MAX_DIMENSIONS: Record<OptimizeImageIntent, { width: number; height: number }> = {
  hero: { width: 1920, height: 1400 },
  gallery: { width: 1600, height: 1600 },
  card: { width: 1200, height: 1200 },
  thumbnail: { width: 600, height: 600 },
  logo: { width: 1200, height: 600 },
  general: { width: 1600, height: 1600 },
}

const MODE_TARGET_KB: Record<OptimizeMode, number> = {
  auto: 500,
  "near-lossless": 800,
  balanced: 500,
  strong: 300,
}

/** Quality steps to try (descending). Used when iterating to reach target size. */
const MODE_QUALITY_STEPS: Record<OptimizeMode, number[]> = {
  "near-lossless": [0.92, 0.88, 0.84],
  balanced: [0.86, 0.8, 0.74, 0.68],
  strong: [0.78, 0.7, 0.62, 0.55],
  auto: [0.86, 0.8, 0.74, 0.68],
}

const MIN_QUALITY = 0.5
const MAX_DIMENSION = 4096

export function isOptimizableImageType(mimeType: string): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(mimeType as (typeof SUPPORTED_IMAGE_TYPES)[number])
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Bild konnte nicht geladen werden"))
    img.src = src
  })
}

function getOutputMimeType(
  preferWebP: boolean,
  hasAlpha: boolean,
  originalMime: string
): "image/webp" | "image/png" {
  if (preferWebP !== false) return "image/webp"
  if (hasAlpha && originalMime === "image/png") return "image/png"
  return "image/webp"
}

function getOutputExtension(mime: string): string {
  return mime === "image/webp" ? "webp" : "png"
}

function scaleDimensions(
  width: number,
  height: number,
  maxW: number,
  maxH: number
): { width: number; height: number } {
  if (width <= maxW && height <= maxH) return { width, height }
  const ratio = Math.min(maxW / width, maxH / height, 1)
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: "image/webp" | "image/png",
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      mime,
      mime === "image/png" ? undefined : quality
    )
  })
}

export async function optimizeImageForUpload(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<OptimizeImageResult> {
  const mime = (file.type || "").toLowerCase()
  if (!isOptimizableImageType(mime)) {
    throw new Error(`Nicht unterstütztes Format: ${file.type}. Erlaubt: jpg, png, webp.`)
  }

  const intent = options.intent ?? "general"
  const mode = options.mode ?? "auto"
  const preferWebP = options.preferWebP !== false
  const targetMaxKB = options.targetMaxKB ?? MODE_TARGET_KB[mode]
  const intentDims = INTENT_MAX_DIMENSIONS[intent]
  const maxWidth = options.maxWidth ?? intentDims.width
  const maxHeight = options.maxHeight ?? intentDims.height

  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    let width = img.naturalWidth || img.width
    let height = img.naturalHeight || img.height

    if (width <= 0 || height <= 0) {
      throw new Error("Bilddimensionen konnten nicht gelesen werden")
    }

    const cappedW = Math.min(maxWidth, MAX_DIMENSION)
    const cappedH = Math.min(maxHeight, MAX_DIMENSION)
    const { width: outW, height: outH } = scaleDimensions(width, height, cappedW, cappedH)

    const canvas = document.createElement("canvas")
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas 2D nicht verfügbar")

    ctx.drawImage(img, 0, 0, outW, outH)

    const hasAlpha =
      mime === "image/png" ||
      (file.type === "image/webp" && file.size > 0)
    const outputMime = getOutputMimeType(preferWebP, hasAlpha, mime)
    const ext = getOutputExtension(outputMime)
    const baseName = file.name.replace(/\.[^.]+$/, "") || "image"
    const outputFileName = `${baseName}.${ext}`

    const qualitySteps = MODE_QUALITY_STEPS[mode]
    const targetBytes = targetMaxKB * 1024
    const originalSize = file.size

    let bestBlob: Blob
    const alreadySmall = originalSize <= targetBytes
    if (alreadySmall) {
      bestBlob = await canvasToBlob(canvas, outputMime, 0.9)
    } else {
      bestBlob = await canvasToBlob(canvas, outputMime, qualitySteps[0])
      for (let i = 0; i < qualitySteps.length; i++) {
        const q = qualitySteps[i]
        const blob = await canvasToBlob(canvas, outputMime, q)
        bestBlob = blob
        if (blob.size <= targetBytes) break
      }
    }

    const optimizedFile = new File([bestBlob], outputFileName, {
      type: outputMime,
      lastModified: Date.now(),
    })

    const targetReached = bestBlob.size <= targetBytes

    return {
      file: optimizedFile,
      originalSize,
      optimizedSize: bestBlob.size,
      originalMimeType: mime,
      outputMimeType: outputMime,
      width: outW,
      height: outH,
      targetReached,
      appliedMode: mode,
      appliedIntent: intent,
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}
