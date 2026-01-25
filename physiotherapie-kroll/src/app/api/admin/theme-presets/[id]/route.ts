import { NextResponse } from "next/server"
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
