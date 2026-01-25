import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type MediaRow = {
  id: string;
  url: string;
  path: string | null;
  alt: string | null;
  filename: string;
  size: number | null;
  type: string | null;
  created_at: string;
};

function safeFilename(name: string) {
  return name
    .trim()
    .replaceAll(" ", "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");
}

function ymFolder(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function uploadMedia(input: { file: File; alt?: string }) {
  const supabase = createSupabaseBrowserClient();
  const { file, alt } = input;

  // Pfad: media/2026-01/<uuid>-<filename>
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const path = `media/${ymFolder()}/${uuid}-${safeFilename(file.name)}`;

  // 1) Storage Upload
  const { error: uploadErr } = await supabase.storage
    .from("media")
    .upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadErr) throw uploadErr;

  // 2) Public URL (Bucket ist public)
  const { data: pub } = supabase.storage.from("media").getPublicUrl(path);
  const publicUrl = pub.publicUrl;

  // 3) DB Insert (path + url + meta)
  const { data, error: dbErr } = await supabase
    .from("media")
    .insert({
      path,
      url: publicUrl,
      alt: alt ?? null,
      filename: file.name,
      size: file.size,
      type: file.type || null,
    })
    .select("*")
    .single();

  if (dbErr) throw dbErr;

  return data as MediaRow;
}

export async function listMedia() {
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("media")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as MediaRow[];
}

/**
 * Deletes a media item from storage and database
 */
export async function deleteMedia(mediaId: string, path: string | null) {
  const supabase = createSupabaseBrowserClient();

  // 1) Delete from storage if path exists
  if (path) {
    const { error: storageErr } = await supabase.storage
      .from("media")
      .remove([path]);

    if (storageErr) {
      console.warn("Error deleting from storage:", storageErr);
      // Continue with DB delete even if storage delete fails
    }
  }

  // 2) Delete from database
  const { error: dbErr } = await supabase
    .from("media")
    .delete()
    .eq("id", mediaId);

  if (dbErr) throw dbErr;
}

/**
 * Wenn du irgendwann url nicht mehr speichern willst:
 * -> aus path publicUrl ableiten
 */
export function getMediaPublicUrl(path: string) {
  const supabase = createSupabaseBrowserClient();
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}
