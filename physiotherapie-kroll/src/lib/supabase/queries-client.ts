"use client"

import { getSupabaseBrowserClient } from "./client"

/**
 * Gets all pages for admin panel (both published and draft)
 * Client-side version for use in Client Components
 * 
 * @returns Array of pages with admin-relevant fields
 */
export async function getAllPagesForAdmin() {
  try {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from("pages")
      .select("id, title, slug, brand, status, updated_at")
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching pages:", error)
      return []
    }

    return data ?? []
  } catch (error) {
    console.error("Error in getAllPagesForAdmin:", error)
    return []
  }
}
