import { NextResponse } from "next/server"
import type { BrandKey } from "@/components/brand/brandAssets"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { requireAdminGuard } from "@/lib/auth/adminGuard"
import {
  listMediaFolders,
  createMediaFolder,
  updateMediaFolder,
  deleteMediaFolder,
} from "@/lib/supabase/mediaLibrary"

function isValidBrand(v: unknown): v is BrandKey {
  return v === "physiotherapy" || v === "physio-konzept"
}

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const guard = await requireAdminGuard(supabase)
    if (!guard.ok) {
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const brand = searchParams.get("brand")
    if (!isValidBrand(brand)) {
      return NextResponse.json({ error: "Invalid brand" }, { status: 400 })
    }

    const folders = await listMediaFolders(brand)
    return NextResponse.json({ folders }, { status: 200 })
  } catch (e) {
    console.error("media folders GET failed:", e)
    return NextResponse.json({ error: "Request failed" }, { status: 500 })
  }
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

    const body = await request.json().catch(() => null)
    const brand = body?.brand
    const name = body?.name
    const parentId = body?.parentId

    if (!isValidBrand(brand)) {
      return NextResponse.json({ error: "Invalid brand" }, { status: 400 })
    }
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 })
    }
    if (parentId !== undefined && parentId !== null && typeof parentId !== "string") {
      return NextResponse.json({ error: "Invalid parentId" }, { status: 400 })
    }

    const folderId = await createMediaFolder(brand, name.trim(), parentId || null)
    return NextResponse.json({ success: true, folderId }, { status: 200 })
  } catch (e) {
    console.error("media folders POST failed:", e)
    return NextResponse.json({ error: "Request failed" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const guard = await requireAdminGuard(supabase)
    if (!guard.ok) {
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      )
    }

    const body = await request.json().catch(() => null)
    const folderId = body?.id
    const name = body?.name

    if (typeof folderId !== "string") {
      return NextResponse.json({ error: "Invalid folderId" }, { status: 400 })
    }
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 })
    }

    await updateMediaFolder(folderId, name.trim())
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (e) {
    console.error("media folders PATCH failed:", e)
    return NextResponse.json({ error: "Request failed" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const guard = await requireAdminGuard(supabase)
    if (!guard.ok) {
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get("id")

    if (!folderId || typeof folderId !== "string") {
      return NextResponse.json({ error: "Invalid folderId" }, { status: 400 })
    }

    await deleteMediaFolder(folderId)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (e) {
    console.error("media folders DELETE failed:", e)
    return NextResponse.json({ error: "Request failed" }, { status: 500 })
  }
}
