import "server-only"

import type { BrandKey } from "@/components/brand/brandAssets"
import type { ContactFormBlock, CMSPage } from "@/types/cms"
import { getPageBySlugAndBrand } from "@/lib/supabase/queries"

/**
 * Load contact form block from CMS using pageSlug and blockId
 * This is SERVER-ONLY and used to get the authoritative recipient email
 * from stored CMS data (NOT from client submission)
 * 
 * MUST be imported only in server-side code (e.g., API routes)
 * 
 * @param pageSlug - The page slug from the form submission
 * @param blockId - The block ID from the form submission  
 * @param brand - The brand to load the page for
 * @returns The contact form block with recipientEmail, or null if not found
 */
export async function getContactFormBlockFromCMS(
  pageSlug: string,
  blockId: string,
  brand: BrandKey
): Promise<ContactFormBlock | null> {
  try {
    // Validate inputs
    if (!pageSlug || typeof pageSlug !== "string") {
      console.warn("[contact-cms-resolver] Invalid pageSlug:", pageSlug)
      return null
    }
    
    if (!blockId || typeof blockId !== "string") {
      console.warn("[contact-cms-resolver] Invalid blockId:", blockId)
      return null
    }

    // Load the page with all blocks
    const page: CMSPage | null = await getPageBySlugAndBrand(pageSlug, brand)
    
    if (!page) {
      console.warn("[contact-cms-resolver] Page not found:", { pageSlug, brand })
      return null
    }
    
    // Find the contact form block with matching ID
    const block = page.blocks?.find(
      (b) => b.id === blockId && b.type === "contactForm"
    ) as ContactFormBlock | undefined
    
    if (!block) {
      console.warn("[contact-cms-resolver] ContactForm block not found:", {
        pageSlug,
        blockId,
        availableBlocks: page.blocks?.map((b) => ({ id: b.id, type: b.type })),
      })
      return null
    }
    
    return block
  } catch (error) {
    console.error("[contact-cms-resolver] Error loading ContactForm block from CMS:", error)
    return null
  }
}
