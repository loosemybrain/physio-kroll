import { NextResponse } from "next/server"
import type { BrandKey } from "@/components/brand/brandAssets"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { requireAdminGuard } from "@/lib/auth/adminGuard"
import { getBrandPresets, saveBrandPresets } from "@/lib/supabase/sectionPresets.server"

/**
 * GET /api/admin/section-presets?brand=physiotherapy
 * - Returns presets for brand
 * - If missing/empty: seeds defaults and persists them (idempotent)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const guard = await requireAdminGuard(supabase)
    if (!guard.ok) {
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const brand = (searchParams.get("brand") || "physiotherapy") as BrandKey
    if (brand !== "physiotherapy" && brand !== "physio-konzept") {
      return NextResponse.json({ error: "Invalid brand" }, { status: 400 })
    }

    const presets = await getBrandPresets(brand, { seedIfEmpty: true })
    return NextResponse.json({ presets }, { status: 200 })
  } catch (e) {
    console.error("section-presets GET failed:", e)
    return NextResponse.json({ error: "Request failed" }, { status: 500 })
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
    const guard = await requireAdminGuard(supabase)
    if (!guard.ok) {
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      )
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
    console.error("section-presets POST failed:", e)
    return NextResponse.json({ error: "Request failed" }, { status: 500 })
  }
}

