/**
 * Security Headers Configuration
 * Includes CSP to block external Google Font requests
 * 
 * Add to next.config.js or middleware
 */

export const securityHeaders = {
  // Content-Security-Policy: Block external font requests
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-eval for now
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'", // ⚠️ KEY: Only allow self-hosted fonts, block googleapis/gstatic
    "img-src 'self' data: https:",
    "connect-src 'self' https://supabase.co",
    "frame-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),

  // Prevent clickjacking
  "X-Frame-Options": "DENY",

  // Disable MIME type sniffing
  "X-Content-Type-Options": "nosniff",

  // Enable XSS protection
  "X-XSS-Protection": "1; mode=block",

  // Referrer policy
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Permissions policy (formerly Feature-Policy)
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
}

// Usage in next.config.js:
/*
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: Object.entries(securityHeaders).map(([key, value]) => ({
          key,
          value,
        })),
      },
    ]
  }
*/
