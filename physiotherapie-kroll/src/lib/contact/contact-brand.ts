import type { BrandKey } from "@/components/brand/brandAssets"

/**
 * Determines the brand from a given page slug or URL
 * Uses the same logic as the client-side BrandProvider
 */
export function getBrandFromSlug(slug: string): BrandKey {
  if (slug.startsWith("konzept") || slug === "/konzept") {
    return "physio-konzept"
  }
  return "physiotherapy"
}

/**
 * Returns the contact recipient email for a given brand
 * Falls back to a default if not configured
 */
export function getContactEmailForBrand(
  brand: BrandKey,
  options?: {
    physiotherapy?: string
    "physio-konzept"?: string
    fallback?: string
  }
): string | null {
  const email =
    brand === "physio-konzept" ? options?.["physio-konzept"] : options?.physiotherapy

  if (email) return email

  // Try environment variables
  if (brand === "physio-konzept") {
    return process.env.CONTACT_EMAIL_PHYSIOKONZEPT || null
  } else {
    return process.env.CONTACT_EMAIL_PHYSIOTHERAPY || null
  }
}

/**
 * Validates that a brand is known and allowed
 */
export function isValidBrand(brand: unknown): brand is BrandKey {
  return brand === "physiotherapy" || brand === "physio-konzept"
}

/**
 * Returns all configured contact emails (for admin views, etc.)
 */
export function getAllContactEmails(): Record<BrandKey, string | null> {
  return {
    physiotherapy: process.env.CONTACT_EMAIL_PHYSIOTHERAPY || null,
    "physio-konzept": process.env.CONTACT_EMAIL_PHYSIOKONZEPT || null,
  }
}
