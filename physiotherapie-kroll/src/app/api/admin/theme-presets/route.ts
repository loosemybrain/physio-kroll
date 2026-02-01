import { NextResponse } from "next/server"
import type { BrandKey } from "@/components/brand/brandAssets"
import { createSupabaseServerClient } from "@/lib/supabase/server"

import {
  getBrandSettingsAuthed,
  getThemePresetsAuthed,
  setActiveThemePreset,
  duplicateThemePreset,
  createThemePreset,
  updateThemePreset,
} from "@/lib/supabase/themePresets"

function isValidBrand(v: unknown): v is BrandKey {
  return v === "physiotherapy" || v === "physio-konzept"
}

/**
 * GET /api/admin/theme-presets?brand=physiotherapy
 * Returns presets + active preset id for brand.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brand = searchParams.get("brand")
    if (!isValidBrand(brand)) {
      return NextResponse.json({ error: "Invalid brand" }, { status: 400 })
    }

    const [presets, settings] = await Promise.all([
      getThemePresetsAuthed(brand),
      getBrandSettingsAuthed(brand),
    ])

    return NextResponse.json(
      {
        brand,
        presets,
        activeThemePresetId: settings?.active_theme_preset_id ?? null,
      },
      { status: 200 }
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    const status = msg === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

/**
 * POST /api/admin/theme-presets
 * Body: 
 *   - { brand, presetId } - Set active preset
 *   - { action: "duplicate", presetId } - Duplicate preset
 *   - { action: "create", brand, name, tokens } - Create new preset
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)

    // Handle create action
    if (body?.action === "create") {
      const brand = body?.brand
      const name = body?.name
      const tokens = body?.tokens

      if (!isValidBrand(brand)) {
        return NextResponse.json({ error: "Invalid brand" }, { status: 400 })
      }
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json({ error: "Invalid name" }, { status: 400 })
      }
      if (tokens !== null && typeof tokens !== "object") {
        return NextResponse.json({ error: "Invalid tokens" }, { status: 400 })
      }

      const newId = await createThemePreset(brand, name.trim(), tokens ?? {})
      return NextResponse.json({ success: true, presetId: newId }, { status: 200 })
    }

    // Handle update action
    if (body?.action === "update") {
      const presetId = body?.id
      const name = body?.name
      const tokens = body?.tokens

      if (typeof presetId !== "string") {
        return NextResponse.json({ error: "Invalid presetId" }, { status: 400 })
      }
      if (name !== undefined && typeof name !== "string") {
        return NextResponse.json({ error: "Invalid name" }, { status: 400 })
      }
      if (tokens !== undefined && typeof tokens !== "object") {
        return NextResponse.json({ error: "Invalid tokens" }, { status: 400 })
      }

      await updateThemePreset(presetId, { name, tokens })
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Handle duplicate action
    if (body?.action === "duplicate") {
      const presetId = body?.presetId
      if (typeof presetId !== "string") {
        return NextResponse.json({ error: "Invalid presetId" }, { status: 400 })
      }
      const newId = await duplicateThemePreset(presetId)
      return NextResponse.json({ success: true, presetId: newId }, { status: 200 })
    }

    // Handle set active (original behavior)
    const brand = body?.brand
    const presetId = body?.presetId

    if (!isValidBrand(brand)) {
      return NextResponse.json({ error: "Invalid brand" }, { status: 400 })
    }

    if (presetId !== null && typeof presetId !== "string") {
      return NextResponse.json({ error: "Invalid presetId" }, { status: 400 })
    }

    const activeThemePresetId = await setActiveThemePreset(brand, presetId)
    return NextResponse.json({ success: true, activeThemePresetId }, { status: 200 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    const status = msg === "Unauthorized" ? 401 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}

