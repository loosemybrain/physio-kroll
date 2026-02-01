import { NextResponse } from "next/server"
import type { BrandKey } from "@/components/brand/brandAssets"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  listMediaAssets,
  createMediaAsset,
  updateMediaAssetFolder,
  deleteMediaAsset,
} from "@/lib/supabase/mediaLibrary"

function isValidBrand(v: unknown): v is BrandKey {
  return v === "physiotherapy" || v === "physio-konzept"
}

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brand = searchParams.get("brand")
    const folderId = searchParams.get("folderId")

    if (!isValidBrand(brand)) {
      return NextResponse.json({ error: "Invalid brand" }, { status: 400 })
    }

    const assets = await listMediaAssets(brand, folderId === "null" || folderId === "" ? null : folderId || null)
    return NextResponse.json({ assets }, { status: 200 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    const status = msg === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const brand = body?.brand
    const bucket = body?.bucket
    const objectKey = body?.objectKey
    const filename = body?.filename
    const contentType = body?.contentType
    const sizeBytes = body?.sizeBytes
    const folderId = body?.folderId

    if (!isValidBrand(brand)) {
      return NextResponse.json({ error: "Invalid brand" }, { status: 400 })
    }
    if (typeof bucket !== "string" || !bucket) {
      return NextResponse.json({ error: "Invalid bucket" }, { status: 400 })
    }
    if (typeof objectKey !== "string" || !objectKey) {
      return NextResponse.json({ error: "Invalid objectKey" }, { status: 400 })
    }
    if (typeof filename !== "string" || !filename) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 })
    }
    if (contentType !== null && typeof contentType !== "string") {
      return NextResponse.json({ error: "Invalid contentType" }, { status: 400 })
    }
    if (sizeBytes !== null && typeof sizeBytes !== "number") {
      return NextResponse.json({ error: "Invalid sizeBytes" }, { status: 400 })
    }
    if (folderId !== null && folderId !== undefined && typeof folderId !== "string") {
      return NextResponse.json({ error: "Invalid folderId" }, { status: 400 })
    }

    const assetId = await createMediaAsset(
      brand,
      bucket,
      objectKey,
      filename,
      contentType || null,
      sizeBytes || null,
      folderId || null
    )
    return NextResponse.json({ success: true, assetId }, { status: 200 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    const status = msg === "Unauthorized" ? 401 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const assetId = body?.id
    const folderId = body?.folderId

    if (typeof assetId !== "string") {
      return NextResponse.json({ error: "Invalid assetId" }, { status: 400 })
    }
    if (folderId !== null && folderId !== undefined && typeof folderId !== "string") {
      return NextResponse.json({ error: "Invalid folderId" }, { status: 400 })
    }

    await updateMediaAssetFolder(assetId, folderId || null)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    const status = msg === "Unauthorized" ? 401 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assetId = searchParams.get("id")

    if (!assetId || typeof assetId !== "string") {
      return NextResponse.json({ error: "Invalid assetId" }, { status: 400 })
    }

    await deleteMediaAsset(assetId)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    const status = msg === "Unauthorized" ? 401 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}
