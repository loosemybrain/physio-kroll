/**
 * API Route: Update font preset
 * POST /admin/api/fonts/update-preset
 * 
 * Requires authentication (admin only)
 */

import { NextRequest, NextResponse } from "next/server"
import { updateSansFontPreset } from "@/lib/fonts/storage"
import { isValidFontPresetId } from "@/lib/fonts/presets"

export async function POST(request: NextRequest) {
  try {
    // TODO: Add auth check here (verify admin role)
    // if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

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
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
