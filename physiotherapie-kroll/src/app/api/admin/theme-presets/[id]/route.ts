import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { deleteThemePreset } from "@/lib/supabase/themePresets"

/**
 * DELETE /api/admin/theme-presets/[id]
 * Deletes a theme preset (if not default and not active).
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid preset ID" }, { status: 400 })
    }

    await deleteThemePreset(id)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    const status = msg === "Unauthorized" ? 401 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}
