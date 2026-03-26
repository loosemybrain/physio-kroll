import { createSupabaseServerClient } from "@/lib/supabase/server"
import { requireAdminGuard } from "@/lib/auth/adminGuard"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const guard = await requireAdminGuard(supabase)
    if (!guard.ok) {
      return Response.json(
        { ok: false, error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      )
    }

    const body = await req.json()
    const { fontId, brand } = body

    if (!fontId || !brand) {
      return Response.json(
        { ok: false, error: "Missing fontId or brand" },
        { status: 400 }
      )
    }

    const { error } = await supabase.rpc("set_active_font", {
      p_font_id: fontId,
      p_brand: brand,
    })

    if (error) {
      console.error("Activate font error:", error)
      return Response.json({ ok: false, error: "Internal server error" }, { status: 500 })
    }

    return Response.json({ ok: true })
  } catch (e) {
    console.error("Activate route failed:", e)
    return Response.json({ ok: false, error: "Internal server error" }, { status: 500 })
  }
}