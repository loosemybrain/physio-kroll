import "server-only"

import type { BrandKey } from "@/components/brand/brandAssets"
import type { CMSBlock, CMSPage } from "@/types/cms"
import { getSupabaseAdmin } from "./server"

let adminPromise: ReturnType<typeof getSupabaseAdmin> | null = null
async function supabaseAdmin() {
  if (!adminPromise) adminPromise = getSupabaseAdmin()
  return adminPromise
}

/**
 * Transforms database row to CMSBlock
 */
function transformBlockToCMS(block: any): CMSBlock | null {
  try {
    const props = (block.props ?? {}) as Record<string, unknown>
    return {
      id: block.id,
      type: block.type,
      props,
    } as CMSBlock
  } catch (error) {
    console.error("Error transforming block:", error)
    return null
  }
}

/**
 * Transforms database rows to CMSPage
 */
function transformPageToCMS(
  page: any,
  blocks: any[]
): CMSPage {
  const cmsBlocks = blocks
    .map(transformBlockToCMS)
    .filter((block): block is CMSBlock => block !== null)
    .sort((a, b) => {
      const aOrder = blocks.find((bl) => bl.id === a.id)?.sort ?? 0
      const bOrder = blocks.find((bl) => bl.id === b.id)?.sort ?? 0
      return aOrder - bOrder
    })

  return {
    id: page.id,
    title: page.title,
    slug: page.slug,
    blocks: cmsBlocks,
    meta: undefined, // Migration doesn't include meta fields
  }
}

/**
 * Loads a page by slug and brand from Supabase
 * 
 * @param slug - The page slug
 * @param brand - The brand key (physiotherapy | physio-konzept)
 * @returns The CMS page with blocks, or null if not found
 */
export async function getPageBySlugAndBrand(
  slug: string,
  brand: BrandKey
): Promise<CMSPage | null> {
  try {
    const supabase = await supabaseAdmin()
    // Fetch the page
    const { data: page, error: pageError } = await supabase
      .from("pages")
      .select("*")
      .eq("slug", slug)
      .eq("brand", brand)
      .eq("status", "published")
      .single()

    if (pageError) {
      console.error("Error fetching page:", pageError)
      return null
    }

    if (!page) {
      return null
    }

    // Fetch all blocks for this page, ordered by sort
    const { data: blocks, error: blocksError } = await supabase
      .from("blocks")
      .select("*")
      .eq("page_id", page.id)
      .order("sort", { ascending: true })

    if (blocksError) {
      console.error("Error fetching blocks:", blocksError)
      return null
    }

    return transformPageToCMS(page, blocks ?? [])
  } catch (error) {
    console.error("Error in getPageBySlugAndBrand:", error)
    return null
  }
}

/**
 * Gets all published pages for a specific brand
 * 
 * @param brand - The brand key
 * @returns Array of pages (without blocks)
 */
export async function getPagesByBrand(brand: BrandKey) {
  try {
    const supabase = await supabaseAdmin()
    const { data, error } = await supabase
      .from("pages")
      .select("id, title, slug, created_at, updated_at")
      .eq("brand", brand)
      .eq("status", "published")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching pages:", error)
      return []
    }

    return data ?? []
  } catch (error) {
    console.error("Error in getPagesByBrand:", error)
    return []
  }
}

/**
 * Gets a single page by ID (with blocks)
 * 
 * @param pageId - The page ID
 * @returns The CMS page with blocks, or null if not found
 */
export async function getPageById(pageId: string): Promise<CMSPage | null> {
  try {
    const supabase = await supabaseAdmin()
    const { data: page, error: pageError } = await supabase
      .from("pages")
      .select("*")
      .eq("id", pageId)
      .single()

    if (pageError || !page) {
      console.error("Error fetching page:", pageError)
      return null
    }

    const { data: blocks, error: blocksError } = await supabase
      .from("blocks")
      .select("*")
      .eq("page_id", pageId)
      .order("sort", { ascending: true })

    if (blocksError) {
      console.error("Error fetching blocks:", blocksError)
      return null
    }

    return transformPageToCMS(page, blocks ?? [])
  } catch (error) {
    console.error("Error in getPageById:", error)
    return null
  }
}

