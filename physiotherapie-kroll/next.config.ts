import type { NextConfig } from "next"
import { defaultSecurityHeaders, previewSecurityHeaders } from "./src/lib/security/headers"

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      // Preview: muss im Admin-iframe erlaubt sein (same-origin).
      {
        source: "/preview/:path*",
        headers: Object.entries(previewSecurityHeaders).map(([key, value]) => ({
          key,
          value,
        })),
      },
      {
        // Default: gilt für alles außer /preview/*
        source: "/((?!preview/).*)",
        headers: Object.entries(defaultSecurityHeaders).map(([key, value]) => ({
          key,
          value,
        })),
      },
    ]
  },
}

export default nextConfig
