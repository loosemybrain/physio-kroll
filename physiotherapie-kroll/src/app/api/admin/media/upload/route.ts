import { NextResponse } from "next/server"
import type { BrandKey } from "@/components/brand/brandAssets"
import { createMediaAsset } from "@/lib/supabase/mediaLibrary"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { requireAdminGuard } from "@/lib/auth/adminGuard"

function isValidBrand(v: unknown): v is BrandKey {
  return v === "physiotherapy" || v === "physio-konzept"
}

function generateObjectKey(filename: string): string {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const ext = filename.includes(".") ? filename.split(".").pop() : ""
  return `media/${uuid}${ext ? `.${ext}` : ""}`
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const guard = await requireAdminGuard(supabase)
    if (!guard.ok) {
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const brand = formData.get("brand") as string | null
    const folderId = formData.get("folderId") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }
    if (!isValidBrand(brand)) {
      return NextResponse.json({ error: "Invalid brand" }, { status: 400 })
    }

    const objectKey = generateObjectKey(file.name)

    const { error: uploadErr } = await supabase.storage
      .from("media")
      .upload(objectKey, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      })

    if (uploadErr) {
      console.error("media upload storage error:", uploadErr)
      return NextResponse.json({ error: "Upload failed" }, { status: 400 })
    }

    const assetId = await createMediaAsset(
      brand,
      "media",
      objectKey,
      file.name,
      file.type || null,
      file.size || null,
      folderId || null
    )

    const { data: urlData } = supabase.storage.from("media").getPublicUrl(objectKey)

    return NextResponse.json(
      {
        success: true,
        assetId,
        url: urlData.publicUrl,
        objectKey,
      },
      { status: 200 }
    )
  } catch (e) {
    console.error("media upload failed:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
