import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { requireAdminGuard } from "@/lib/auth/adminGuard"
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
    const guard = await requireAdminGuard(supabase)
    if (!guard.ok) {
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      )
    }

    const { id } = await params
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid preset ID" }, { status: 400 })
    }

    await deleteThemePreset(id)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (e) {
    console.error("theme-presets delete failed:", e)
    return NextResponse.json({ error: "Request failed" }, { status: 500 })
  }
}
