"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { BrandKey } from "@/components/brand/brandAssets";

function brandFromPath(pathname: string): BrandKey {
  // URL structure:
  // /physio/...      -> physiotherapy (default)
  // /konzept/...     -> physio-konzept
  if (pathname === "/konzept" || pathname.startsWith("/konzept/")) return "physio-konzept";
  return "physiotherapy";
}

/**
 * Applies the brand class to <html> without causing hydration mismatch.
 * Uses an inline script to set the brand class immediately on page load,
 * before React hydration, to prevent visual flash.
 */
export function BrandShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't set brand class on root - it affects entire page background
  // Individual components will handle their own brand styling
  useEffect(() => {
    if (typeof window !== "undefined") {
      const brand = brandFromPath(window.location.pathname);
      const root = document.documentElement;
      // Only set data attribute for debugging / future CSS targeting
      root.dataset.brand = brand;
    }
  }, []); // Only run once on mount

  // Update data attribute when pathname changes (client-side navigation)
  useEffect(() => {
    const brand = brandFromPath(pathname || "/");
    const root = document.documentElement;
    // Only set data attribute for debugging / future CSS targeting
    root.dataset.brand = brand;
  }, [pathname]);

  return <>{children}</>;
}
