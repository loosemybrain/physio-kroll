import { getNavigation } from "@/lib/supabase/navigation"
import { resolveMedia } from "@/lib/cms/resolveMedia"
import { HeaderClient } from "./HeaderClient"
import type { BrandKey } from "@/components/brand/brandAssets"
import { getNavTheme } from "@/lib/theme/navTheme"

interface HeaderProps {
  brand: BrandKey
}

/**
 * Server Component that fetches navigation and renders HeaderClient
 */
export async function Header({ brand }: HeaderProps) {
  const navConfig = await getNavigation(brand)

  const theme = getNavTheme(brand)

  if (!navConfig) {
    // Fallback: render minimal header with theme
    return (
      <header
        className={`sticky top-0 z-50 w-full transition-colors duration-200 ${theme.wrapper} ${theme.shadow}`}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className={`text-lg font-semibold ${theme.link.base}`}>Logo</div>
        </div>
      </header>
    )
  }

  // Resolve logo URL server-side
  const logoUrl = navConfig.logo ? await resolveMedia(navConfig.logo) : null

  return (
    <HeaderClient
      brand={brand}
      navConfig={{
        ...navConfig,
        logo: logoUrl ? { url: logoUrl } : null,
      }}
    />
  )
}
