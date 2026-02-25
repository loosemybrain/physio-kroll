import { NextResponse } from "next/server"
import type { BrandKey } from "@/types/navigation"
import type { FooterConfig } from "@/types/footer"

/* Inline validation — avoids cross-module resolution issues */
function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val)
}

function validateFooterConfig(raw: unknown): { ok: boolean; data?: FooterConfig; error?: string } {
  if (!isObject(raw)) return { ok: false, error: "Config must be an object" }
  if (!Array.isArray(raw.sections)) return { ok: false, error: "sections must be an array" }
  for (const s of raw.sections) {
    if (!isObject(s) || typeof s.id !== "string" || !Array.isArray(s.blocks)) {
      return { ok: false, error: "Each section needs id + blocks[]" }
    }
  }
  return { ok: true, data: raw as FooterConfig }
}

/**
 * POST /api/footer
 * Save footer config for a brand.
 * In a real setup this writes to Supabase; here we validate + echo back.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { brand, config } = body as { brand?: BrandKey; config?: unknown }

    if (!brand || !config) {
      return NextResponse.json({ error: "Missing brand or config" }, { status: 400 })
    }

    if (brand !== "physiotherapy" && brand !== "physio-konzept") {
      return NextResponse.json({ error: "Invalid brand" }, { status: 400 })
    }

    const parsed = validateFooterConfig(config)
    if (!parsed.ok || !parsed.data) {
      return NextResponse.json(
        { error: "Invalid config", details: parsed.error },
        { status: 422 }
      )
    }

    // In production: await supabase.from("footer").upsert({ brand, config: parsed.data })
    return NextResponse.json({ ok: true, brand, config: parsed.data })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
