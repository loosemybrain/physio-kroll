import { z } from "zod"
import type { BrandKey } from "@/components/brand/brandAssets"

/**
 * Sanitizes a string for use in plaintext emails and logs
 * - Removes control characters
 * - Prevents header injection by rejecting CRLF patterns
 * - Trims whitespace
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") return ""
  
  let sanitized = input
    // Remove control characters (except tab, newline internally in message body, which will be handled separately)
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "")
    // Remove header injection patterns (CRLF)
    .replace(/(\r\n|\r|\n)(?=[\s]*(?:Subject|From|To|Cc|Bcc|Date|Reply-To))/gi, "")
    .trim()
  
  return sanitized
}

/**
 * Zod schema for contact form submission
 * Includes honeypot field, timing validation, and brand routing
 */
export const contactSubmissionSchema = z.object({
  // Core fields
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name must not exceed 200 characters")
    .transform(sanitizeString),
  
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must not exceed 255 characters")
    .toLowerCase()
    .trim(),
  
  phone: z
    .union([
      z
        .string()
        .max(50, "Phone number must not exceed 50 characters")
        .regex(/^[\d\s\-\+\(\)]+$/, "Invalid phone number format")
        .transform(sanitizeString),
      z.literal(""),
    ])
    .optional()
    .transform((val) => (val === "" || !val ? undefined : val)),
  
  subject: z
    .union([
      z
        .string()
        .max(200, "Subject must not exceed 200 characters")
        .transform(sanitizeString),
      z.literal(""),
    ])
    .optional()
    .transform((val) => (val === "" || !val ? undefined : val)),
  
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(3000, "Message must not exceed 3000 characters")
    .transform(sanitizeString),
  
  // Privacy consent
  privacyAccepted: z
    .boolean()
    .refine((val) => val === true, {
      message: "You must accept the privacy policy",
    }),
  
  // Brand identification (from pathname, but must match allowed brands)
  brand: z
    .enum(["physiotherapy", "physio-konzept"] as const)
    .default("physiotherapy"),
  
  // Anti-spam: honeypot field (must be empty)
  website: z
    .string()
    .max(0, "Spam detected (honeypot filled)")
    .optional()
    .or(z.literal("")),
  
  // Anti-spam: form timing (milliseconds from form render to submit)
  formStartedAt: z
    .number()
    .int("Form start time must be an integer")
    .refine(
      (val) => {
        // Accept timestamps from the last 24 hours (loose check)
        const now = Date.now()
        const maxAge = 24 * 60 * 60 * 1000 // 24 hours
        return now - val < maxAge && now - val >= 0
      },
      "Invalid form start time"
    ),
  
  // Additional context (optional)
  pageSlug: z
    .string()
    .default(""),
  
  blockId: z
    .string()
    .uuid()
    .optional(),
  
  locale: z
    .enum(["de", "en"])
    .optional()
    .default("de"),
})

export type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>

/**
 * Runtime validation with better error messages for client
 */
export function validateContactSubmission(
  data: unknown
): { success: true; data: ContactSubmissionInput } | { success: false; error: string; fieldErrors?: Record<string, string> } {
  try {
    const result = contactSubmissionSchema.safeParse(data)
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues?.forEach((err) => {
        const path = err.path.join(".")
        fieldErrors[path] = err.message
      })
      
      return {
        success: false,
        error: "Validation failed",
        fieldErrors,
      }
    }
    
    return { success: true, data: result.data }
  } catch (err) {
    return {
      success: false,
      error: "Unexpected validation error",
    }
  }
}
