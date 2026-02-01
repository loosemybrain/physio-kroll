import { NextResponse } from "next/server"
import type { BrandKey } from "@/components/brand/brandAssets"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getBrandPresets, saveBrandPresets } from "@/lib/supabase/sectionPresets.server"

/**
 * GET /api/admin/section-presets?brand=physiotherapy
 * - Returns presets for brand
 * - If missing/empty: seeds defaults and persists them (idempotent)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brand = (searchParams.get("brand") || "physiotherapy") as BrandKey
    if (brand !== "physiotherapy" && brand !== "physio-konzept") {
      return NextResponse.json({ error: "Invalid brand" }, { status: 400 })
    }

    const presets = await getBrandPresets(brand, { seedIfEmpty: true })
    return NextResponse.json({ presets }, { status: 200 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    const status = msg === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

/**
 * POST /api/admin/section-presets
 * Body: { brand, presets }
 * Saves presets into navigation.config.presets.sectionBackground (merge patch, no overwrite)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const brand = body?.brand as BrandKey
    if (!brand || (brand !== "physiotherapy" && brand !== "physio-konzept")) {
      return NextResponse.json({ error: "Invalid brand" }, { status: 400 })
    }
    const presets = body?.presets
    await saveBrandPresets(brand, presets)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    const status = msg === "Unauthorized" ? 401 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}

