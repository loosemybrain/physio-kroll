import { NextResponse } from "next/server"
import { getNavigation, saveNavigation } from "@/lib/supabase/navigation"
import { resolveMedia } from "@/lib/cms/resolveMedia"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { BrandKey } from "@/components/brand/brandAssets"
import type { NavConfig } from "@/types/navigation"

/**
 * GET /api/navigation?brand=physiotherapy
 * Returns navigation config for a brand with resolved media URLs
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const brand = (searchParams.get("brand") || "physiotherapy") as BrandKey

    if (process.env.NODE_ENV === "development") {
      console.log("[API /navigation] Requested brand:", brand)
    }

    const navConfig = await getNavigation(brand)
    
    if (process.env.NODE_ENV === "development") {
      console.log("[API /navigation] Config logo:", navConfig.logo, "logoSize:", navConfig.logoSize)
    }

    if (!navConfig) {
      return NextResponse.json({
        logo: null,
        links: [],
        searchEnabled: true,
        cta: null,
      })
    }

    // Resolve logo URL server-side
    let resolvedLogo = null
    if (navConfig.logo) {
      const logoUrl = await resolveMedia(navConfig.logo)
      if (logoUrl) {
        resolvedLogo = {
          url: logoUrl,
          alt: navConfig.logo.alt || null,
        }
      } else if ("mediaId" in navConfig.logo && navConfig.logo.mediaId) {
        // If resolution failed but we have mediaId, keep it for client-side resolution
        resolvedLogo = {
          mediaId: navConfig.logo.mediaId,
          alt: navConfig.logo.alt || null,
        }
      } else if ("url" in navConfig.logo && navConfig.logo.url) {
        // Keep original URL if resolution failed
        resolvedLogo = {
          url: navConfig.logo.url,
          alt: navConfig.logo.alt || null,
        }
      }
    }

    return NextResponse.json({
      ...navConfig,
      logo: resolvedLogo,
    })
  } catch (error) {
    console.error("Error in navigation API:", error)
    return NextResponse.json(
      {
        logo: null,
        links: [],
        searchEnabled: true,
        cta: null,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/navigation
 * Saves navigation config for a brand
 * Requires authentication
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // Ignore in API route
          },
        },
      }
    )

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { brand, config } = body

    if (!brand || (brand !== "physiotherapy" && brand !== "physio-konzept")) {
      return NextResponse.json({ error: "Invalid brand" }, { status: 400 })
    }

    const result = await saveNavigation(brand as BrandKey, config as NavConfig)

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to save navigation" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in navigation POST API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
