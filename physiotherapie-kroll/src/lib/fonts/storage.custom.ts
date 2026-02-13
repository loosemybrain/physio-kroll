import type { SupabaseClient } from "@supabase/supabase-js"

type CreateFontPayload = {
  name: string
  label: string
  description?: string
  path: string
  url: string
  fontWeight: string
  fontStyle: string
  brand: string
}

const BUCKET = "fonts"

/**
 * Uploads a .woff2 font file to Supabase Storage.
 * Requires SERVICE ROLE client.
 */
export async function uploadFontFile(
  file: File,
  supabase: SupabaseClient
): Promise<{ path: string; url: string }> {
  if (!file.name.endsWith(".woff2")) {
    throw new Error("Only .woff2 files are allowed")
  }

  const arrayBuffer = await file.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)

  const safeName = file.name.replace(/[^\w.\-]+/g, "_")
  const filePath = `custom/${Date.now()}_${safeName}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, bytes, {
      contentType: "font/woff2",
      upsert: false,
    })

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`)
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath)

  return {
    path: filePath,
    url: publicUrlData.publicUrl,
  }
}

/**
 * Creates a new custom font database entry.
 */
export async function createCustomFont(
  supabase: SupabaseClient,
  payload: CreateFontPayload
) {
  const {
    name,
    label,
    description = "",
    path,
    url,
    fontWeight,
    fontStyle,
    brand,
  } = payload

  const { data, error } = await supabase
    .from("custom_fonts")
    .insert({
      name,
      display_name: label,
      file_path: path,
      file_url: url,
      font_family: name,
      font_weight: fontWeight,
      font_style: fontStyle,
      mime_type: "font/woff2",
      active: false,
      brand,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Database insert failed: ${error.message}`)
  }

  return data
}

export async function getCustomFonts(
  supabase: SupabaseClient,
  opts?: { brand?: string; onlyActive?: boolean }
) {
  const brand = opts?.brand
  const onlyActive = opts?.onlyActive ?? false

  let q = supabase
    .from("custom_fonts")
    .select("*")
    .order("created_at", { ascending: false })

  if (brand) q = q.eq("brand", brand)
  if (onlyActive) q = q.eq("active", true)

  const { data, error } = await q

  if (error) {
    throw new Error(`Database fetch failed: ${error.message}`)
  }

  return data
}

/**
 * Deletes font file + DB entry.
 */
export async function deleteCustomFont(
  supabase: SupabaseClient,
  fontId: string
) {
  // 1) Get file path
  const { data: font, error: fetchError } = await supabase
    .from("custom_fonts")
    .select("file_path")
    .eq("id", fontId)
    .single()

  if (fetchError || !font) {
    throw new Error("Font not found")
  }

  // 2) Remove file from storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([font.file_path])

  if (storageError) {
    throw new Error(`Storage delete failed: ${storageError.message}`)
  }

  // 3) Remove DB entry
  const { error: deleteError } = await supabase
    .from("custom_fonts")
    .delete()
    .eq("id", fontId)

  if (deleteError) {
    throw new Error(`Database delete failed: ${deleteError.message}`)
  }

  return true
}