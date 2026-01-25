import "server-only"

import type { BrandKey } from "@/components/brand/brandAssets"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabasePublic } from "@/lib/supabase/serverPublic"
import { unstable_noStore as noStore } from "next/cache"

export type ThemePreset = {
  id: string
  brand: BrandKey
  name: string
  tokens: unknown
  is_default: boolean
}

export type BrandSettings = {
  brand: BrandKey
  active_theme_preset_id: string | null
}

export type ActiveThemePreset = {
  presetId: string | null
  presetName: string | null
  tokens: unknown
}

function normalizeBrandKey(brand: BrandKey): BrandKey {
  if (brand === "physiotherapy" || brand === "physio-konzept") return brand
  return "physiotherapy"
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

export async function getThemePresets(brand: BrandKey): Promise<ThemePreset[]> {
  // Public read should not be cached in SSR contexts that depend on DB state.
  noStore()
  const supabase = await getSupabasePublic()
  const normalizedBrand = normalizeBrandKey(brand)

  const { data, error } = await supabase
    .from("theme_presets")
    .select("id, brand, name, tokens, is_default")
    .eq("brand", normalizedBrand)
    .order("is_default", { ascending: false })
    .order("name", { ascending: true })

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as Array<Record<string, unknown>>
  return rows
    .map((r) => ({
      id: String(r.id),
      brand: normalizedBrand,
      name: String(r.name ?? ""),
      tokens: (r.tokens ?? {}) as unknown,
      is_default: Boolean(r.is_default),
    }))
    .filter((p) => p.id && p.name)
}

/**
 * Admin: Get theme presets with authentication (uses server cookies + RLS).
 * Returns all presets for the brand, including non-default ones.
 */
export async function getThemePresetsAuthed(brand: BrandKey): Promise<ThemePreset[]> {
  noStore()
  const supabase = await createSupabaseServerClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) throw new Error("Unauthorized")

  const normalizedBrand = normalizeBrandKey(brand)

  const { data, error } = await supabase
    .from("theme_presets")
    .select("id, brand, name, tokens, is_default")
    .eq("brand", normalizedBrand)
    .order("is_default", { ascending: false })
    .order("name", { ascending: true })

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as Array<Record<string, unknown>>
  return rows
    .map((r) => ({
      id: String(r.id),
      brand: normalizedBrand,
      name: String(r.name ?? ""),
      tokens: (r.tokens ?? {}) as unknown,
      is_default: Boolean(r.is_default),
    }))
    .filter((p) => p.id && p.name)
}

export async function getBrandSettings(brand: BrandKey): Promise<BrandSettings | null> {
  noStore()
  const supabase = await getSupabasePublic()
  const normalizedBrand = normalizeBrandKey(brand)

  const { data, error } = await supabase
    .from("brand_settings")
    .select("brand, active_theme_preset_id")
    .eq("brand", normalizedBrand)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return {
    brand: normalizedBrand,
    active_theme_preset_id: (data as any).active_theme_preset_id ?? null,
  }
}

/**
 * Admin: Get brand settings with authentication (uses server cookies + RLS).
 */
export async function getBrandSettingsAuthed(brand: BrandKey): Promise<BrandSettings | null> {
  noStore()
  const supabase = await createSupabaseServerClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) throw new Error("Unauthorized")

  const normalizedBrand = normalizeBrandKey(brand)

  const { data, error } = await supabase
    .from("brand_settings")
    .select("brand, active_theme_preset_id")
    .eq("brand", normalizedBrand)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return {
    brand: normalizedBrand,
    active_theme_preset_id: (data as any).active_theme_preset_id ?? null,
  }
}

/**
 * Upserts `brand_settings.active_theme_preset_id` for the brand.
 * Auth required (uses server cookies + RLS).
 */
export async function setActiveThemePreset(brand: BrandKey, presetId: string | null): Promise<string | null> {
  const supabase = await createSupabaseServerClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) throw new Error("Unauthorized")

  const normalizedBrand = normalizeBrandKey(brand)

  const { data, error } = await supabase
    .from("brand_settings")
    .upsert(
      {
        brand: normalizedBrand,
        active_theme_preset_id: presetId,
      },
      { onConflict: "brand" }
    )
    .select("active_theme_preset_id")
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as any)?.active_theme_preset_id ?? null
}

/**
 * Public/server: load active preset for a single brand (no cache).
 */
export async function getActiveThemePresetForBrand(brand: BrandKey): Promise<ActiveThemePreset | null> {
  noStore()
  const supabase = await getSupabasePublic()
  const normalizedBrand = normalizeBrandKey(brand)

  const { data: bs, error: bsErr } = await supabase
    .from("brand_settings")
    .select("brand, active_theme_preset_id")
    .eq("brand", normalizedBrand)
    .maybeSingle()

  if (bsErr) throw new Error(bsErr.message)
  if (!bs) return null

  const presetId = (bs as any).active_theme_preset_id ?? null
  if (!presetId) return { presetId: null, presetName: null, tokens: {} }

  const { data: tp, error: tpErr } = await supabase
    .from("theme_presets")
    .select("id, name, tokens")
    .eq("id", presetId)
    .maybeSingle()

  if (tpErr) throw new Error(tpErr.message)

  return {
    presetId,
    presetName: tp?.name ? String((tp as any).name) : null,
    tokens: (tp as any)?.tokens ?? {},
  }
}

export async function getActiveThemePresetsForBrands(brands: BrandKey[]): Promise<Record<BrandKey, ActiveThemePreset>> {
  noStore()
  const out: Record<BrandKey, ActiveThemePreset> = {
    physiotherapy: { presetId: null, presetName: null, tokens: {} },
    "physio-konzept": { presetId: null, presetName: null, tokens: {} },
  }

  const unique = Array.from(new Set(brands.map(normalizeBrandKey)))
  const supabase = await getSupabasePublic()

  const { data: bsRows, error: bsErr } = await supabase
    .from("brand_settings")
    .select("brand, active_theme_preset_id")
    .in("brand", unique)

  if (bsErr) throw new Error(bsErr.message)

  const presetIds = new Set<string>()
  const brandToPresetId: Partial<Record<BrandKey, string | null>> = {}

  for (const row of (bsRows ?? []) as any[]) {
    const b = row.brand as BrandKey
    if (b !== "physiotherapy" && b !== "physio-konzept") continue
    const presetId = row.active_theme_preset_id ?? null
    brandToPresetId[b] = presetId
    if (typeof presetId === "string" && presetId) presetIds.add(presetId)
  }

  let presetsById = new Map<string, { name: string | null; tokens: unknown }>()
  if (presetIds.size > 0) {
    const ids = Array.from(presetIds)
    const { data: tpRows, error: tpErr } = await supabase
      .from("theme_presets")
      .select("id, name, tokens")
      .in("id", ids)

    if (tpErr) throw new Error(tpErr.message)

    presetsById = new Map(
      (tpRows ?? []).map((r: any) => [
        String(r.id),
        { name: typeof r.name === "string" ? r.name : null, tokens: r.tokens ?? {} },
      ])
    )
  }

  for (const b of unique) {
    if (b !== "physiotherapy" && b !== "physio-konzept") continue
    const presetId = brandToPresetId[b] ?? null
    if (!presetId) {
      out[b] = { presetId: null, presetName: null, tokens: {} }
      continue
    }
    const hit = presetsById.get(presetId)
    out[b] = {
      presetId,
      presetName: hit?.name ?? null,
      tokens: hit?.tokens ?? {},
    }
  }

  return out
}

/**
 * Duplicates a theme preset for the same brand.
 * Auth required (uses server cookies + RLS).
 * Returns the new preset ID.
 */
export async function duplicateThemePreset(presetId: string): Promise<string> {
  const supabase = await createSupabaseServerClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) throw new Error("Unauthorized")

  // Load original preset
  const { data: original, error: fetchErr } = await supabase
    .from("theme_presets")
    .select("brand, name, tokens")
    .eq("id", presetId)
    .maybeSingle()

  if (fetchErr) throw new Error(fetchErr.message)
  if (!original) throw new Error("Preset not found")

  const brand = normalizeBrandKey(original.brand as BrandKey)
  const baseName = String(original.name ?? "")

  // Find existing names to avoid conflicts
  const { data: existing, error: listErr } = await supabase
    .from("theme_presets")
    .select("name")
    .eq("brand", brand)
    .ilike("name", `${baseName}%`)

  if (listErr) throw new Error(listErr.message)

  const existingNames = new Set((existing ?? []).map((r) => String(r.name).toLowerCase()))
  let newName = `${baseName} – Kopie`
  let counter = 2
  while (existingNames.has(newName.toLowerCase())) {
    newName = `${baseName} – Kopie ${counter}`
    counter++
  }

  // Insert duplicate
  const { data: inserted, error: insertErr } = await supabase
    .from("theme_presets")
    .insert({
      brand,
      name: newName,
      tokens: original.tokens,
      is_default: false,
    })
    .select("id")
    .single()

  if (insertErr) throw new Error(insertErr.message)
  if (!inserted) throw new Error("Failed to create duplicate")

  return String(inserted.id)
}

/**
 * Deletes a theme preset.
 * Auth required (uses server cookies + RLS).
 * Throws if preset is default or currently active.
 */
export async function deleteThemePreset(presetId: string): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) throw new Error("Unauthorized")

  // Load preset to check constraints
  const { data: preset, error: fetchErr } = await supabase
    .from("theme_presets")
    .select("id, brand, is_default")
    .eq("id", presetId)
    .maybeSingle()

  if (fetchErr) throw new Error(fetchErr.message)
  if (!preset) throw new Error("Preset not found")

  const brand = normalizeBrandKey(preset.brand as BrandKey)

  // Check if default
  if (preset.is_default) {
    throw new Error("Standard-Presets können nicht gelöscht werden")
  }

  // Check if active
  const settings = await getBrandSettings(brand)
  if (settings?.active_theme_preset_id === presetId) {
    throw new Error("Aktives Preset kann nicht gelöscht werden. Bitte zuerst ein anderes Preset aktivieren.")
  }

  // Delete
  const { error: deleteErr } = await supabase.from("theme_presets").delete().eq("id", presetId)

  if (deleteErr) throw new Error(deleteErr.message)
}

/**
 * Creates a new theme preset.
 * Auth required (uses server cookies + RLS).
 * Returns the new preset ID.
 */
export async function createThemePreset(
  brand: BrandKey,
  name: string,
  tokens: unknown
): Promise<string> {
  const supabase = await createSupabaseServerClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) throw new Error("Unauthorized")

  const normalizedBrand = normalizeBrandKey(brand)

  // Check for duplicate name
  const { data: existing, error: checkErr } = await supabase
    .from("theme_presets")
    .select("id")
    .eq("brand", normalizedBrand)
    .eq("name", name)
    .maybeSingle()

  if (checkErr) throw new Error(checkErr.message)
  if (existing) {
    throw new Error(`Ein Preset mit dem Namen "${name}" existiert bereits für dieses Brand.`)
  }

  // Insert new preset
  const { data: inserted, error: insertErr } = await supabase
    .from("theme_presets")
    .insert({
      brand: normalizedBrand,
      name,
      tokens: tokens ?? {},
      is_default: false,
    })
    .select("id")
    .single()

  if (insertErr) throw new Error(insertErr.message)
  if (!inserted) throw new Error("Failed to create preset")

  return String(inserted.id)
}

/**
 * Updates a theme preset (name and/or tokens).
 * Auth required (uses server cookies + RLS).
 */
export async function updateThemePreset(
  presetId: string,
  patch: { name?: string; tokens?: unknown }
): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) throw new Error("Unauthorized")

  // Build update object
  const update: Record<string, unknown> = {}
  if (patch.name !== undefined) {
    update.name = patch.name.trim()
    if (!update.name) throw new Error("Name darf nicht leer sein")
  }
  if (patch.tokens !== undefined) {
    update.tokens = patch.tokens
  }

  if (Object.keys(update).length === 0) {
    throw new Error("Keine Änderungen angegeben")
  }

  // Check for duplicate name if name is being updated
  if (patch.name !== undefined) {
    const { data: preset, error: fetchErr } = await supabase
      .from("theme_presets")
      .select("brand")
      .eq("id", presetId)
      .maybeSingle()

    if (fetchErr) throw new Error(fetchErr.message)
    if (!preset) throw new Error("Preset nicht gefunden")

    const { data: existing, error: checkErr } = await supabase
      .from("theme_presets")
      .select("id")
      .eq("brand", preset.brand)
      .eq("name", update.name)
      .neq("id", presetId)
      .maybeSingle()

    if (checkErr) throw new Error(checkErr.message)
    if (existing) {
      throw new Error(`Ein Preset mit dem Namen "${update.name}" existiert bereits für dieses Brand.`)
    }
  }

  // Update
  const { error: updateErr } = await supabase
    .from("theme_presets")
    .update(update)
    .eq("id", presetId)

  if (updateErr) throw new Error(updateErr.message)
}

