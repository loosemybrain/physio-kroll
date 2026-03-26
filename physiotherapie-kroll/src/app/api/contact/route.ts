import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import {
  validateContactSubmission,
  type ContactSubmissionInput,
} from "@/lib/contact/contact-schema"
import {
  isValidBrand,
} from "@/lib/contact/contact-brand"
import { checkAllRateLimits, type RateLimitResult } from "@/lib/contact/contact-rate-limit"
import { checkHoneypot, isSubmitTooFast } from "@/lib/contact/contact-honeypot"
import { sendContactEmail } from "@/lib/contact/contact-mailer"
import {
  resolveRecipientEmail,
  type EmailResolutionResult,
} from "@/lib/contact/contact-email-resolver"
import { getContactFormBlockFromCMS } from "@/lib/contact/contact-cms-resolver.server"

/**
 * Logging helper (respect privacy, avoid excess logging)
 */
function logContactSubmission(
  level: "info" | "warn" | "error",
  message: string,
  context: Record<string, unknown> = {}
) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level,
    message,
    ...context,
  }

  if (level === "error") {
    console.error("[API /contact]", logEntry)
  } else if (level === "warn") {
    console.warn("[API /contact]", logEntry)
  } else {
    console.log("[API /contact]", logEntry)
  }
}

/**
 * Sanitize email for logging (first char + domain)
 */
function partialEmail(email: string): string {
  const [local, domain] = email.split("@")
  if (!local || !domain) return "***"
  return `${local.charAt(0)}***@${domain}`
}

/**
 * Check Origin and Host for CSRF protection
 */
type AllowedHosts = {
  allowedHostnames: Set<string>
  allowedHosts: Set<string> // may include port, e.g. "localhost:3000"
  allowedSuffixHostnames: Set<string> // e.g. "vercel.app" allows *.vercel.app
}

function normalizeHostEntry(raw: string): string | null {
  const v = raw.trim()
  if (!v) return null

  // Support entries written as URLs (we only take their host part).
  if (v.includes("://")) {
    try {
      const u = new URL(v)
      return u.host.toLowerCase()
    } catch {
      return null
    }
  }

  // Support hostname[:port] (no path).
  if (v.includes("/") || v.includes("?") || v.includes("#")) return null
  return v.toLowerCase()
}

function getAllowedHostsFromEnv(): AllowedHosts {
  const allowedHostnames = new Set<string>()
  const allowedHosts = new Set<string>()
  const allowedSuffixHostnames = new Set<string>()

  const envList = (process.env.CONTACT_ALLOWED_ORIGINS || "localhost")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  const derived: string[] = []
  if (process.env.VERCEL_URL) derived.push(process.env.VERCEL_URL)
  if (process.env.NEXT_PUBLIC_SITE_URL) derived.push(process.env.NEXT_PUBLIC_SITE_URL)

  const all = [...envList, ...derived]
  for (const raw of all) {
    const normalized = normalizeHostEntry(raw)
    if (!normalized) continue

    // Explicit, controlled wildcard modeling:
    // - ".vercel.app" or "*.vercel.app" => allow any subdomain of vercel.app
    if (normalized.startsWith("*.")) {
      const suffix = normalized.slice(2)
      if (suffix) allowedSuffixHostnames.add(suffix)
      continue
    }
    if (normalized.startsWith(".")) {
      const suffix = normalized.slice(1)
      if (suffix) allowedSuffixHostnames.add(suffix)
      continue
    }

    // Exact host (with optional port)
    if (normalized.includes(":")) {
      allowedHosts.add(normalized)
    } else {
      allowedHostnames.add(normalized)
    }
  }

  return { allowedHostnames, allowedHosts, allowedSuffixHostnames }
}

function isAllowedHostname(hostname: string, allow: AllowedHosts): boolean {
  const h = hostname.toLowerCase()
  if (allow.allowedHostnames.has(h)) return true
  for (const suffix of allow.allowedSuffixHostnames) {
    if (h === suffix || h.endsWith(`.${suffix}`)) return true
  }
  return false
}

function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")
  const allow = getAllowedHostsFromEnv()

  // Preferred: Origin header (explicit cross-origin signal).
  if (origin) {
    let originUrl: URL
    try {
      originUrl = new URL(origin)
    } catch {
      logContactSubmission("warn", "Origin rejected (invalid URL)", { origin: "invalid" })
      return false
    }

    const hostnameAllowed = isAllowedHostname(originUrl.hostname, allow)
    const hostAllowed = allow.allowedHosts.has(originUrl.host.toLowerCase())
    if (!hostnameAllowed && !hostAllowed) {
      logContactSubmission("warn", "Origin rejected", {
        originHost: originUrl.host,
      })
      return false
    }

    return true
  }

  // Fallback: Referer only when Origin is missing (controlled, no substring matching).
  if (referer) {
    let refUrl: URL
    try {
      refUrl = new URL(referer)
    } catch {
      logContactSubmission("warn", "Referer rejected (invalid URL)", { referer: "invalid" })
      return false
    }

    const hostnameAllowed = isAllowedHostname(refUrl.hostname, allow)
    const hostAllowed = allow.allowedHosts.has(refUrl.host.toLowerCase())
    if (!hostnameAllowed && !hostAllowed) {
      logContactSubmission("warn", "Referer rejected", {
        refererHost: refUrl.host,
      })
      return false
    }

    return true
  }

  // Neither header present => reject to avoid CSRF bypass.
  logContactSubmission("warn", "Request rejected (missing origin and referer)")
  return false
}

/**
 * GET should not be allowed
 */
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

/**
 * HEAD should not be allowed
 */
export async function HEAD() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

/**
 * POST /api/contact
 * 
 * Comprehensive contact form submission handler with:
 * - Full validation (schema + business logic)
 * - Honeypot check
 * - Timing check (anti-bot)
 * - Multi-level rate limiting (email + IP + burst)
 * - Brand-aware routing
 * - Database storage
 * - Email notification
 * - Comprehensive logging
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()

  try {
    // --- SECURITY: Pre-validation checks ---

    // 1. Check method (should be POST)
    if (request.method !== "POST") {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
    }

    // 2. Check Content-Type
    const contentType = request.headers.get("content-type")
    if (!contentType?.includes("application/json")) {
      logContactSubmission("warn", "Invalid content type", { contentType })
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    // 3. Check Origin / Referer for CSRF
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Request rejected" }, { status: 403 })
    }

    // 4. Check payload size (max 50KB)
    const contentLength = request.headers.get("content-length")
    if (contentLength && parseInt(contentLength) > 50 * 1024) {
      logContactSubmission("warn", "Payload too large")
      return NextResponse.json({ error: "Payload too large" }, { status: 413 })
    }

    // --- PARSE & VALIDATE BODY ---

    let body: unknown
    try {
      body = await request.json()
    } catch (err) {
      logContactSubmission("warn", "Invalid JSON", { error: String(err) })
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    // Validate with schema
    const validation = validateContactSubmission(body)
    if (!validation.success) {
      logContactSubmission("warn", "Validation failed", {
        requestId,
        fieldErrors: validation.fieldErrors,
      })
      return NextResponse.json(
        {
          error: validation.error,
          fieldErrors: validation.fieldErrors,
        },
        { status: 400 }
      )
    }

    const data: ContactSubmissionInput = validation.data

    // --- ANTI-SPAM: Honeypot ---

    const honeypot = checkHoneypot(body as Record<string, unknown>)
    if (honeypot.triggered) {
      logContactSubmission("warn", "Honeypot triggered", {
        requestId,
        field: honeypot.field,
        email: partialEmail(data.email),
      })

      // Return generic success to not reveal honeypot to bot
      return NextResponse.json({
        success: true,
        message: "Nachricht erfolgreich gesendet",
        requestId,
      })
    }

    // --- ANTI-SPAM: Timing check ---

    const tooFast = isSubmitTooFast(data.formStartedAt, 2000) // 2 second minimum
    if (tooFast) {
      logContactSubmission("warn", "Submission too fast (bot detection)", {
        requestId,
        email: partialEmail(data.email),
      })

      // Return generic success to not teach bots
      return NextResponse.json({
        success: true,
        message: "Nachricht erfolgreich gesendet",
        requestId,
      })
    }

    // --- RATE LIMITING: Multi-level checks ---

    const rateLimit: RateLimitResult = await checkAllRateLimits(data.email, data.brand, request)
    if (!rateLimit.allowed) {
      logContactSubmission("warn", "Rate limit exceeded", {
        requestId,
        email: partialEmail(data.email),
        brand: data.brand,
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      })

      const response = NextResponse.json(
        {
          error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut.",
        },
        { status: 429 }
      )
      response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds))
      return response
    }

    // --- BRAND VALIDATION ---

    if (!isValidBrand(data.brand)) {
      logContactSubmission("error", "Invalid brand", {
        requestId,
        brand: data.brand,
      })
      return NextResponse.json({ error: "Invalid brand" }, { status: 400 })
    }

    // --- RESOLVE RECIPIENT EMAIL (from CMS block, not from client) ---
    
    // Load recipient email from CMS (serverseitig, nicht vom Client vertrauenswürdig)
    let cmsRecipientEmailFromBlock: string | undefined = undefined
    
    if (data.pageSlug && data.blockId) {
      const contactFormBlock = await getContactFormBlockFromCMS(
        data.pageSlug,
        data.blockId,
        data.brand
      )
      
      if (contactFormBlock) {
        cmsRecipientEmailFromBlock = contactFormBlock.props?.recipientEmail as string | undefined
      }
    }
    
    // Resolve email with priority: TestMode > CMS Block > ENV > Fallback
    const emailResolution: EmailResolutionResult = resolveRecipientEmail({
      cmsRecipientEmail: cmsRecipientEmailFromBlock, // Use ONLY the server-loaded CMS value
      brand: data.brand,
      allowTestMode: true,
    })

    if (!emailResolution.success || !emailResolution.recipientEmail) {
      logContactSubmission("error", "Failed to resolve recipient email", {
        requestId,
        brand: data.brand,
        resolution: emailResolution,
        envVars: {
          CONTACT_EMAIL_PHYSIOTHERAPY: process.env.CONTACT_EMAIL_PHYSIOTHERAPY ? "SET" : "MISSING",
          CONTACT_EMAIL_PHYSIOKONZEPT: process.env.CONTACT_EMAIL_PHYSIOKONZEPT ? "SET" : "MISSING",
          CONTACT_FALLBACK_EMAIL: process.env.CONTACT_FALLBACK_EMAIL ? "SET" : "MISSING",
          CONTACT_TEST_MODE: process.env.CONTACT_TEST_MODE,
          CONTACT_TEST_EMAIL: process.env.CONTACT_TEST_EMAIL ? "SET" : "MISSING",
        },
      })
      console.error("[Contact API] Email Resolution Failed:", {
        success: emailResolution.success,
        reason: emailResolution.reason,
        source: emailResolution.source,
        brand: data.brand,
      })
      return NextResponse.json(
        { error: "Nachricht konnte nicht versendet werden. Bitte kontaktieren Sie direkt." },
        { status: 500 }
      )
    }

    const recipientEmail = emailResolution.recipientEmail

    // --- STORE IN DATABASE ---

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

    const { data: submission, error: dbError } = await supabase
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
        consent: data.privacyAccepted,
        status: "new",
        meta: {
          userAgent: request.headers.get("user-agent")?.substring(0, 150) || null,
          locale: data.locale,
          formStartedAt: data.formStartedAt,
        },
      })
      .select()
      .single()

    if (dbError || !submission) {
      logContactSubmission("error", "Database insertion failed", {
        requestId,
        dbError: String(dbError),
        email: partialEmail(data.email),
        brand: data.brand,
      })
      return NextResponse.json(
        {
          error:
            "Fehler beim Speichern der Nachricht. Bitte versuchen Sie es später erneut.",
        },
        { status: 500 }
      )
    }

    // --- SEND EMAIL ---

    let emailResult: { success: boolean; error?: string } = { success: false }
    try {
      emailResult = await sendContactEmail({
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
        brand: data.brand,
        recipientEmail,
        // Additional context for email formatting
        testMode: emailResolution.testMode,
        originalRecipient: emailResolution.originalEmail,
        pageSlug: data.pageSlug,
        requestId,
      })

      if (!emailResult.success) {
        logContactSubmission("error", "Email send failed", {
          requestId,
          submissionId: submission.id,
          error: emailResult.error,
          email: partialEmail(data.email),
          testMode: emailResolution.testMode,
          emailSource: emailResolution.source,
        })
        // Note: We still return success to the client, but mark in logs
        // The submission is stored in DB for manual follow-up
      }
    } catch (err) {
      logContactSubmission("error", "Email service error", {
        requestId,
        submissionId: submission.id,
        error: String(err),
        testMode: emailResolution.testMode,
      })
      // Continue anyway - submission is stored
    }

    // --- LOG SUCCESS ---

    const duration = Date.now() - startTime
    logContactSubmission("info", "Submission successful", {
      requestId,
      submissionId: submission.id,
      email: partialEmail(data.email),
      brand: data.brand,
      durationMs: duration,
      emailSent: emailResult.success,
      testMode: emailResolution.testMode,
      emailSource: emailResolution.source,
      recipientEmail: partialEmail(recipientEmail),
    })

    // --- RETURN SUCCESS ---

    return NextResponse.json({
      success: true,
      id: submission.id,
      message: "Nachricht erfolgreich gesendet",
      requestId,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logContactSubmission("error", "Unexpected error", {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      durationMs: duration,
    })

    return NextResponse.json(
      {
        error: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
      },
      { status: 500 }
    )
  }
}
