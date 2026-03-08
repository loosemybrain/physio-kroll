import { NextResponse } from "next/server"
import { getThemePresetInlineVars } from "@/lib/theme/themePresetCss.server"
import type { BrandKey } from "@/components/brand/brandAssets"

const VALID_BRANDS: BrandKey[] = ["physiotherapy", "physio-konzept"]

/**
 * GET /api/theme?brand=physiotherapy|physio-konzept
 * Returns active theme preset CSS variables for the given brand.
 * Used by client-side theme sync when navigating between brands (e.g. toggle).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const brandParam = searchParams.get("brand") ?? "physiotherapy"
    const brand: BrandKey =
      brandParam === "physio-konzept" ? "physio-konzept" : "physiotherapy"

    if (!VALID_BRANDS.includes(brand)) {
      return NextResponse.json({ error: "Invalid brand" }, { status: 400 })
    }

    const { vars } = await getThemePresetInlineVars(brand)
    return NextResponse.json({ brand, vars })
  } catch (e) {
    console.error("[API /theme]", e)
    return NextResponse.json(
      { error: "Failed to load theme" },
      { status: 500 }
    )
  }
}
