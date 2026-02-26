/**
 * Security Headers Configuration
 * Includes CSP to block external Google Font requests
 * 
 * Add to next.config.js or middleware
 */

export const securityHeaders = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",

    // Next.js: Prod meist ohne unsafe-eval möglich; wenn nötig, später gezielt zuschalten
    "script-src 'self' 'unsafe-inline'",

    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-src 'self'",
  ].join("; "),

  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
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
