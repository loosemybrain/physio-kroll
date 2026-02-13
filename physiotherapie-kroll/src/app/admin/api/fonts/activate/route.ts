import { createSupabaseServerClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { fontId, brand } = body

    if (!fontId || !brand) {
      return Response.json(
        { ok: false, error: "Missing fontId or brand" },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()

    const { error } = await supabase.rpc("set_active_font", {
      p_font_id: fontId,
      p_brand: brand,
    })

    if (error) {
      console.error("Activate font error:", error)
      return Response.json({ ok: false, error }, { status: 500 })
    }

    return Response.json({ ok: true })
  } catch (e) {
    console.error("Activate route failed:", e)
    return Response.json({ ok: false, error: String(e) }, { status: 500 })
  }
}