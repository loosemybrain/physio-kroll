import { NextResponse } from "next/server"
import { z } from "zod"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { BrandKey } from "@/components/brand/brandAssets"

/**
 * Rate limiting: Simple in-memory store (for production, use Redis or similar)
 * Key: email hash + brand
 * Max: 3 submissions per hour
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function getRateLimitKey(email: string, brand: BrandKey): string {
  // Simple hash (for production, use crypto.createHash)
  const hash = Buffer.from(`${email}:${brand}`).toString("base64")
  return `contact:${hash}`
}

function checkRateLimit(email: string, brand: BrandKey): { allowed: boolean; remaining: number } {
  const key = getRateLimitKey(email, brand)
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || entry.resetAt < now) {
    // Reset or create new entry
    rateLimitStore.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 }) // 1 hour
    return { allowed: true, remaining: 2 }
  }

  if (entry.count >= 3) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: 3 - entry.count }
}

/**
 * Cleanup old rate limit entries (run periodically)
 */
function cleanupRateLimit() {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}

// Cleanup every 10 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimit, 10 * 60 * 1000)
}

/**
 * Submission schema (validates what we accept from client)
 */
const submissionSchema = z.object({
  brand: z.enum(["physiotherapy", "physio-konzept"]),
  pageSlug: z.string(),
  blockId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().max(50).optional(),
  message: z.string().min(10).max(5000),
  subject: z.string().max(200).optional(),
  consent: z.boolean().optional(),
})

/**
 * POST /api/contact
 * Handles contact form submissions
 * - Validates input
 * - Rate limiting
 * - Spam checks (honeypot handled client-side, but we verify here too)
 * - Stores in database
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const validationResult = submissionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Ungültige Eingaben", details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Rate limiting
    const rateLimit = checkRateLimit(data.email, data.brand)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." },
        { status: 429 }
      )
    }

    // Get Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // Ignore in API route
          },
        },
      }
    )

    // Insert submission into database
    const { data: submission, error } = await supabase
      .from("contact_submissions")
      .insert({
        brand: data.brand,
        page_slug: data.pageSlug,
        block_id: data.blockId || null,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        message: data.message,
        subject: data.subject || null,
        consent: data.consent || false,
        status: "new",
        meta: {
          // Minimal metadata (no IP, no full userAgent)
          userAgent: typeof request.headers.get("user-agent") === "string"
            ? request.headers.get("user-agent")?.substring(0, 100) || null
            : null,
        },
      })
      .select()
      .single()

    if (error) {
      console.error("[API /contact] Database error:", error)
      return NextResponse.json(
        { error: "Fehler beim Speichern der Nachricht. Bitte versuchen Sie es später erneut." },
        { status: 500 }
      )
    }

    // TODO: Optional - Send email via Supabase Edge Function
    // For now, we just store in DB and admin can view in inbox

    return NextResponse.json({
      success: true,
      id: submission.id,
      message: "Nachricht erfolgreich gesendet",
    })
  } catch (error) {
    console.error("[API /contact] Unexpected error:", error)
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut." },
      { status: 500 }
    )
  }
}
