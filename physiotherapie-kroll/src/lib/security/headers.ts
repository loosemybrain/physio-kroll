/**
 * Security Headers Configuration
 * Includes CSP to block external Google Font requests
 * 
 * Add to next.config.js or middleware
 */

function buildCsp(options: { frameAncestors: "'none'" | "'self'" }): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${options.frameAncestors}`,

    // Next.js: Prod meist ohne unsafe-eval möglich; wenn nötig, später gezielt zuschalten
    "script-src 'self' 'unsafe-inline'",

    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-src 'self'",
  ].join("; ")
}

export const defaultSecurityHeaders = {
  "Content-Security-Policy": buildCsp({ frameAncestors: "'none'" }),
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
} as const

export const previewSecurityHeaders = {
  // Preview darf im Admin-iframe aus derselben Origin gerendert werden.
  "Content-Security-Policy": buildCsp({ frameAncestors: "'self'" }),
  // X-Frame-Options darf hier NICHT DENY sein (sonst blockt der Browser immer).
  // SAMEORIGIN passt zur CSP-Strategie frame-ancestors 'self'.
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
} as const

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
