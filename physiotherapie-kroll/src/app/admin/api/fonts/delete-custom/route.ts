import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient, getSupabaseAdmin } from "@/lib/supabase/server"
import { requireAdminGuard } from "@/lib/auth/adminGuard"
import { deleteCustomFont } from "@/lib/fonts/storage.custom"

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

    const { fontId } = await request.json()

    if (!fontId) {
      return NextResponse.json(
        { error: "Font ID ist erforderlich" },
        { status: 400 }
      )
    }

    // Admin client für DB/Storage Mutationen
    const admin = await getSupabaseAdmin()

    // Font löschen (Datei + DB entry)
    await deleteCustomFont(admin, fontId)

    return NextResponse.json({
      success: true,
      message: "Font gelöscht",
    })
  } catch (error) {
    console.error("Font delete error:", error)
    return NextResponse.json(
      { error: "Löschen fehlgeschlagen" },
      { status: 500 }
    )
  }
}
