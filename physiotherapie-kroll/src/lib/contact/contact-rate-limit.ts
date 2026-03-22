import type { BrandKey } from "@/components/brand/brandAssets"
import { createHash } from "crypto"

/**
 * Rate limit entry stored in memory
 */
interface RateLimitEntry {
  count: number
  firstRequestAt: number
  lastRequestAt: number
  resetAt: number
}

/**
 * In-memory rate limit store
 * WARNING: This is a local-only implementation suitable for development and single-instance deployments.
 * For production with multiple instances, use Redis or Upstash.
 */
class InMemoryRateLimitStore {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timer | null = null

  constructor() {
    // Cleanup old entries every 15 minutes
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => {
        this.cleanup()
      }, 15 * 60 * 1000)
    }
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key)
      }
    }
  }

  record(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now()
    let entry = this.store.get(key)

    // Initialize or reset if window has expired
    if (!entry || entry.resetAt < now) {
      entry = {
        count: 1,
        firstRequestAt: now,
        lastRequestAt: now,
        resetAt: now + config.windowMs,
      }
      this.store.set(key, entry)
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        retryAfterSeconds: 0,
      }
    }

    // Check if rate limit exceeded
    if (entry.count >= config.maxRequests) {
      const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000)
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds,
      }
    }

    // Increment count and allow
    entry.count++
    entry.lastRequestAt = now
    const resetInMs = entry.resetAt - now

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      retryAfterSeconds: Math.ceil(resetInMs / 1000),
    }
  }

  clear() {
    this.store.clear()
  }
}

/**
 * Global in-memory rate limit store
 */
let globalStore: InMemoryRateLimitStore | null = null

function getStore(): InMemoryRateLimitStore {
  if (!globalStore) {
    globalStore = new InMemoryRateLimitStore()
  }
  return globalStore
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  // Maximum number of requests
  maxRequests: number
  // Time window in milliseconds
  windowMs: number
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * Standard rate limit configs
 */
export const RATE_LIMIT_CONFIGS = {
  // Per-email + brand: 5 requests per 60 minutes
  perEmail: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
  } as RateLimitConfig,

  // Per-IP: 20 requests per 15 minutes (burst + sustained)
  perIP: {
    maxRequests: 20,
    windowMs: 15 * 60 * 1000,
  } as RateLimitConfig,

  // Per-IP burst: 2 requests per 60 seconds (prevents spam)
  perIPBurst: {
    maxRequests: 2,
    windowMs: 60 * 1000,
  } as RateLimitConfig,
}

/**
 * Hash an email + brand combination for rate limiting
 */
function hashEmailBrand(email: string, brand: BrandKey): string {
  return createHash("sha256").update(`${email}:${brand}`).digest("hex")
}

/**
 * Hash an IP address (can be truncated for privacy)
 */
function hashIP(ip: string): string {
  return createHash("sha256").update(ip).digest("hex")
}

/**
 * Extract client IP from request headers
 */
export function getClientIP(request: Request): string {
  // Check for common reverse proxy headers (in order of preference)
  const xForwardedFor = request.headers.get("x-forwarded-for")
  if (xForwardedFor) {
    // Take the first IP if multiple are present
    return xForwardedFor.split(",")[0].trim()
  }

  const xRealIP = request.headers.get("x-real-ip")
  if (xRealIP) {
    return xRealIP
  }

  const cfConnectingIP = request.headers.get("cf-connecting-ip")
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // Fallback: anonymous hash for unknown clients
  return "unknown"
}

/**
 * Check email-based rate limit
 */
export async function checkEmailRateLimit(
  email: string,
  brand: BrandKey
): Promise<RateLimitResult> {
  const key = `contact:email:${hashEmailBrand(email, brand)}`
  return getStore().record(key, RATE_LIMIT_CONFIGS.perEmail)
}

/**
 * Check IP-based rate limit (general)
 */
export async function checkIPRateLimit(request: Request): Promise<RateLimitResult> {
  const ip = getClientIP(request)
  const key = `contact:ip:${hashIP(ip)}`
  return getStore().record(key, RATE_LIMIT_CONFIGS.perIP)
}

/**
 * Check IP-based burst rate limit (fast submissions)
 */
export async function checkIPBurstRateLimit(request: Request): Promise<RateLimitResult> {
  const ip = getClientIP(request)
  const key = `contact:ip-burst:${hashIP(ip)}`
  return getStore().record(key, RATE_LIMIT_CONFIGS.perIPBurst)
}

/**
 * Combined rate limit check (email + IP + burst)
 * Returns the most restrictive result
 */
export async function checkAllRateLimits(
  email: string,
  brand: BrandKey,
  request: Request
): Promise<RateLimitResult> {
  const [emailLimit, ipLimit, burstLimit] = await Promise.all([
    checkEmailRateLimit(email, brand),
    checkIPRateLimit(request),
    checkIPBurstRateLimit(request),
  ])

  // Return the most restrictive (allowed=false takes precedence)
  if (!emailLimit.allowed) return emailLimit
  if (!ipLimit.allowed) return ipLimit
  if (!burstLimit.allowed) return burstLimit

  // All allowed, return the one with minimum remaining
  const minRemaining = Math.min(emailLimit.remaining, ipLimit.remaining, burstLimit.remaining)
  return {
    allowed: true,
    remaining: minRemaining,
    retryAfterSeconds: 0,
  }
}

/**
 * Reset rate limit for testing
 */
export function resetRateLimitStore() {
  if (globalStore) {
    globalStore.clear()
  }
}
