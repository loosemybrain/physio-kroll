import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin.server"
import { requireAdminGuard } from "@/lib/auth/adminGuard"
import { uploadFontFile, createCustomFont } from "@/lib/fonts/storage.custom"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const authClient = await createSupabaseServerClient()
    const guard = await requireAdminGuard(authClient)
    if (!guard.ok) {
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      )
    }

    // 2) FormData
    const formData = await request.formData()
    const file = formData.get("file") as File
    const name = formData.get("name") as string
    const label = formData.get("label") as string
    const description = (formData.get("description") as string) || ""
    const fontWeight = (formData.get("fontWeight") as string) || "100 900"
    const fontStyle = (formData.get("fontStyle") as string) || "normal"
    const brand = (formData.get("brand") as string) || "physiotherapie"

    // 3) Validation
    if (!file) return NextResponse.json({ error: "Keine Datei hochgeladen" }, { status: 400 })
    if (!name || !label) return NextResponse.json({ error: "Name und Label sind erforderlich" }, { status: 400 })

    if (!file.name.endsWith(".woff2")) {
      return NextResponse.json({ error: "Nur .woff2 Dateien sind erlaubt" }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Datei zu groß (max 10MB)" }, { status: 400 })
    }

    // 4) Admin Client für Storage + DB writes
    const admin = await getSupabaseAdmin()

    // 5) Upload (Storage)
    const { path, url } = await uploadFontFile(file, admin)

    // 6) DB insert
    const customFont = await createCustomFont(admin, {
      name,
      label,
      description,
      path,
      url,
      fontWeight,
      fontStyle,
      brand,
    })

    return NextResponse.json({ success: true, font: customFont })
  } catch (error) {
    console.error("Font upload error:", error)
    return NextResponse.json(
      { error: "Font-Upload fehlgeschlagen", details: null },
      { status: 500 }
    )
  }
}