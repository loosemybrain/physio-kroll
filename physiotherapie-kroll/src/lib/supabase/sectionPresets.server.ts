import type { BrandKey } from "@/components/brand/brandAssets"
import type { BlockSectionProps, SectionBackgroundPreset } from "@/types/cms"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { defaultSectionPresets } from "@/lib/cms/sectionPresets"

function normalizeBrandKey(brand: string | BrandKey): BrandKey {
  if (brand === "physio" || brand === "physiotherapy") return "physiotherapy"
  if (brand === "konzept" || brand === "physio-konzept") return "physio-konzept"
  if (brand === "physiotherapy" || brand === "physio-konzept") return brand
  return "physiotherapy"
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v)
}

function getRecord(v: unknown): Record<string, unknown> | null {
  return isRecord(v) ? v : null
}

function validateAndNormalizePresets(input: unknown): { ok: true; presets: SectionBackgroundPreset[] } | { ok: false; error: string } {
  if (!Array.isArray(input)) return { ok: false, error: "presets muss ein Array sein" }
  const presets = input as unknown[]

  const normalized: SectionBackgroundPreset[] = []

  for (const raw of presets) {
    const p = getRecord(raw)
    if (!p) return { ok: false, error: "Preset ist ungültig" }
    const id = p["id"]
    const name = p["name"]
    const description = p["description"]
    const section = p["section"]
    if (typeof id !== "string" || !id) return { ok: false, error: "Preset.id fehlt" }
    if (typeof name !== "string" || !name) return { ok: false, error: `Preset.name fehlt (${id})` }
    if (typeof description !== "undefined" && typeof description !== "string") {
      return { ok: false, error: `Preset.description ist ungültig (${id})` }
    }
    const sectionRec = getRecord(section)
    if (!sectionRec) return { ok: false, error: `Preset.section fehlt (${id})` }
    const backgroundRec = getRecord(sectionRec["background"])
    if (!backgroundRec) return { ok: false, error: `Preset.section.background fehlt (${id})` }
    const bgType = backgroundRec["type"]
    if (typeof bgType !== "string") return { ok: false, error: `background.type fehlt (${id})` }

    // Minimal validation for gradient stops
    if (bgType === "gradient") {
      const gradientRec = getRecord(backgroundRec["gradient"])
      const stopsRaw = gradientRec ? gradientRec["stops"] : undefined
      const stops = Array.isArray(stopsRaw) ? stopsRaw : null
      if (!Array.isArray(stops) || stops.length < 2 || stops.length > 5) {
        return { ok: false, error: `Gradient stops müssen 2–5 sein (${id})` }
      }
      for (const stopRaw of stops) {
        const s = getRecord(stopRaw)
        if (!s) return { ok: false, error: `Gradient stop ist ungültig (${id})` }
        const pos = s["pos"]
        const color = s["color"]
        if (typeof pos !== "number") return { ok: false, error: `Gradient pos fehlt (${id})` }
        s["pos"] = clamp(pos, 0, 100)
        if (typeof color !== "string" || !color) return { ok: false, error: `Gradient color fehlt (${id})` }
      }
    }

    // Normalize overlay opacity (project uses 0..100)
    const overlayCandidate =
      bgType === "color"
        ? getRecord(getRecord(backgroundRec["color"])?.["overlay"])
        : bgType === "image"
          ? getRecord(getRecord(backgroundRec["image"])?.["overlay"])
          : bgType === "video"
            ? getRecord(getRecord(backgroundRec["video"])?.["overlay"])
            : null
    if (overlayCandidate && typeof overlayCandidate["opacity"] === "number") {
      overlayCandidate["opacity"] = clamp(overlayCandidate["opacity"] as number, 0, 100)
    }

    normalized.push({
      id,
      name,
      description: typeof description === "string" ? description : undefined,
      section: sectionRec as unknown as BlockSectionProps,
    })
  }

  return { ok: true, presets: normalized }
}

async function createSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Ignore in API route / server util
        },
      },
    }
  )
}

export async function getBrandPresets(brand: BrandKey, opts?: { seedIfEmpty?: boolean }): Promise<SectionBackgroundPreset[]> {
  const supabase = await createSupabase()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error("Unauthorized")

  const normalizedBrand = normalizeBrandKey(brand)

  const { data, error } = await supabase
    .from("navigation")
    .select("config")
    .eq("brand", normalizedBrand)
    .maybeSingle()

  if (error) throw new Error(error.message)

  const cfg = isRecord(data) ? (data["config"] as unknown) : undefined
  const cfgRec = getRecord(cfg)
  const presetsRec = cfgRec ? getRecord(cfgRec["presets"]) : null
  const presets = (presetsRec && Array.isArray(presetsRec["sectionBackground"]) ? presetsRec["sectionBackground"] : []) as SectionBackgroundPreset[]
  if (presets.length > 0) return presets

  if (opts?.seedIfEmpty) {
    const seeded = defaultSectionPresets(normalizedBrand)
    await saveBrandPresets(normalizedBrand, seeded)
    return seeded
  }

  return []
}

export async function saveBrandPresets(brand: BrandKey, presets: SectionBackgroundPreset[]): Promise<void> {
  const supabase = await createSupabase()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error("Unauthorized")

  const normalizedBrand = normalizeBrandKey(brand)

  const validated = validateAndNormalizePresets(presets)
  if (!validated.ok) throw new Error(validated.error)

  const { data, error } = await supabase
    .from("navigation")
    .select("config")
    .eq("brand", normalizedBrand)
    .maybeSingle()

  if (error) throw new Error(error.message)

  const prevConfig = (isRecord(data) ? getRecord(data["config"]) : null) ?? {}
  const prevPresets = (prevConfig["presets"] as Record<string, unknown> | undefined) ?? {}

  const nextConfig = {
    ...prevConfig,
    presets: {
      ...prevPresets,
      sectionBackground: validated.presets,
    },
  }

  const { error: upsertErr } = await supabase
    .from("navigation")
    .upsert(
      { brand: normalizedBrand, config: nextConfig as unknown },
      { onConflict: "brand" }
    )

  if (upsertErr) throw new Error(upsertErr.message)
}

