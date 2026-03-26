/**
 * API Route: Update font preset
 * POST /admin/api/fonts/update-preset
 * 
 * Requires authentication (admin only)
 */

import { NextRequest, NextResponse } from "next/server"
import { updateSansFontPreset } from "@/lib/fonts/storage.server"
import { isValidFontPresetId } from "@/lib/fonts/presets"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { requireAdminGuard } from "@/lib/auth/adminGuard"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const guard = await requireAdminGuard(supabase)
    if (!guard.ok) {
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      )
    }

    const { presetId } = await request.json()

    // Validate preset ID
    if (!isValidFontPresetId(presetId)) {
      return NextResponse.json({ error: "Invalid preset ID" }, { status: 400 })
    }

    // Update in database
    const success = await updateSansFontPreset(presetId)

    if (success) {
      return NextResponse.json({ success: true, presetId })
    } else {
      return NextResponse.json({ error: "Database update failed" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error updating font preset:", error)
    return NextResponse.json({ error: "Request failed" }, { status: 500 })
  }
}
