import "server-only"

import type { BrandKey } from "@/components/brand/brandAssets"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabasePublic } from "@/lib/supabase/serverPublic"
import { unstable_noStore as noStore } from "next/cache"

export type MediaFolder = {
  id: string
  brand: BrandKey
  parent_id: string | null
  name: string
  sort_order: number
  created_at: string
  updated_at: string
}

export type MediaAsset = {
  id: string
  brand: BrandKey
  folder_id: string | null
  bucket: string
  object_key: string
  filename: string
  content_type: string | null
  size_bytes: number | null
  created_by: string | null
  created_at: string
  updated_at: string
}

function normalizeBrandKey(brand: BrandKey): BrandKey {
  if (brand === "physiotherapy" || brand === "physio-konzept") return brand
  return "physiotherapy"
}

export async function listMediaFolders(brand: BrandKey): Promise<MediaFolder[]> {
  noStore()
  const supabase = await getSupabasePublic()
  const normalizedBrand = normalizeBrandKey(brand)

  const { data, error } = await supabase
    .from("media_folders")
    .select("*")
    .eq("brand", normalizedBrand)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []).map((r) => ({
    id: String(r.id),
    brand: normalizedBrand,
    parent_id: r.parent_id ? String(r.parent_id) : null,
    name: String(r.name),
    sort_order: Number(r.sort_order) || 0,
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  }))
}

export async function createMediaFolder(
  brand: BrandKey,
  name: string,
  parentId: string | null = null
): Promise<string> {
  const supabase = await createSupabaseServerClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) throw new Error("Unauthorized")

  const normalizedBrand = normalizeBrandKey(brand)

  const { data, error } = await supabase
    .from("media_folders")
    .insert({
      brand: normalizedBrand,
      name: name.trim(),
      parent_id: parentId || null,
      sort_order: 0,
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error("Failed to create folder")

  return String(data.id)
}

export async function updateMediaFolder(folderId: string, name: string): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("media_folders")
    .update({ name: name.trim() })
    .eq("id", folderId)

  if (error) throw new Error(error.message)
}

export async function deleteMediaFolder(folderId: string): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) throw new Error("Unauthorized")

  // Check if folder has assets
  const { data: assets, error: checkErr } = await supabase
    .from("media_assets")
    .select("id")
    .eq("folder_id", folderId)
    .limit(1)

  if (checkErr) throw new Error(checkErr.message)
  if (assets && assets.length > 0) {
    throw new Error("Ordner enthält Dateien und kann nicht gelöscht werden")
  }

  // Check if folder has subfolders
  const { data: subfolders, error: subErr } = await supabase
    .from("media_folders")
    .select("id")
    .eq("parent_id", folderId)
    .limit(1)

  if (subErr) throw new Error(subErr.message)
  if (subfolders && subfolders.length > 0) {
    throw new Error("Ordner enthält Unterordner und kann nicht gelöscht werden")
  }

  const { error } = await supabase.from("media_folders").delete().eq("id", folderId)

  if (error) throw new Error(error.message)
}

export async function listMediaAssets(
  brand: BrandKey,
  folderId: string | null = null
): Promise<MediaAsset[]> {
  noStore()
  const supabase = await getSupabasePublic()
  const normalizedBrand = normalizeBrandKey(brand)

  let query = supabase
    .from("media_assets")
    .select("*")
    .eq("brand", normalizedBrand)

  if (folderId !== null) {
    query = query.eq("folder_id", folderId)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((r) => ({
    id: String(r.id),
    brand: normalizedBrand,
    folder_id: r.folder_id ? String(r.folder_id) : null,
    bucket: String(r.bucket || "media"),
    object_key: String(r.object_key),
    filename: String(r.filename),
    content_type: r.content_type ? String(r.content_type) : null,
    size_bytes: r.size_bytes ? Number(r.size_bytes) : null,
    created_by: r.created_by ? String(r.created_by) : null,
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  }))
}

export async function createMediaAsset(
  brand: BrandKey,
  bucket: string,
  objectKey: string,
  filename: string,
  contentType: string | null,
  sizeBytes: number | null,
  folderId: string | null = null
): Promise<string> {
  const supabase = await createSupabaseServerClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) throw new Error("Unauthorized")

  const normalizedBrand = normalizeBrandKey(brand)

  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      brand: normalizedBrand,
      bucket,
      object_key: objectKey,
      filename,
      content_type: contentType,
      size_bytes: sizeBytes,
      folder_id: folderId || null,
      created_by: userData.user.id,
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error("Failed to create asset")

  return String(data.id)
}

export async function updateMediaAssetFolder(assetId: string, folderId: string | null): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("media_assets")
    .update({ folder_id: folderId })
    .eq("id", assetId)

  if (error) throw new Error(error.message)
}

export async function deleteMediaAsset(assetId: string): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) throw new Error("Unauthorized")

  // 1. Fetch the media_assets row to get bucket and object_key
  const { data: asset, error: fetchError } = await supabase
    .from("media_assets")
    .select("bucket, object_key")
    .eq("id", assetId)
    .single()
  if (fetchError) throw new Error(fetchError.message)
  if (!asset) throw new Error("Asset not found")

  // 2. Remove the object from Supabase storage
  const { error: storageError } = await supabase.storage.from(asset.bucket).remove([asset.object_key])
  if (storageError) throw new Error(storageError.message)

  // 3. Delete the row from media_assets
  const { error: deleteError } = await supabase.from("media_assets").delete().eq("id", assetId)
  if (deleteError) throw new Error(deleteError.message)
}
