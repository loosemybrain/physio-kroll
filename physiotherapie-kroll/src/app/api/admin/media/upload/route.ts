import { NextResponse } from "next/server"
import type { BrandKey } from "@/components/brand/brandAssets"
import { createMediaAsset } from "@/lib/supabase/mediaLibrary"
import { createSupabaseServerClient } from "@/lib/supabase/server"

function isValidBrand(v: unknown): v is BrandKey {
  return v === "physiotherapy" || v === "physio-konzept"
}

function safeFilename(name: string) {
  return name
    .trim()
    .replaceAll(" ", "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
}

function generateObjectKey(filename: string): string {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const ext = filename.includes(".") ? filename.split(".").pop() : ""
  const safeName = safeFilename(filename.replace(/\.[^/.]+$/, ""))
  return `media/${uuid}${ext ? `.${ext}` : ""}`
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
      return NextResponse.json({ error: uploadErr.message }, { status: 400 })
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
    const msg = e instanceof Error ? e.message : "Unknown error"
    const status = msg === "Unauthorized" ? 401 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}
