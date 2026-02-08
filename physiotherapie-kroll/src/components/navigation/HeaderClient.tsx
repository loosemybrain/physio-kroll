"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import type { BrandKey } from "@/components/brand/brandAssets"
import type { NavConfig, NavLink } from "@/types/navigation"
import { getNavTheme } from "@/lib/theme/navTheme"
import { getLogoSizeClasses, getLogoImageDimensions } from "@/lib/theme/logoSize"

interface HeaderClientProps {
  brand: BrandKey
  navConfig: NavConfig
}

/**
 * Client Component for Header with interactive elements
 */
export function HeaderClient({ brand, navConfig }: HeaderClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const pathname = usePathname()
  
  // Get theme for current brand
  const theme = getNavTheme(brand)
  
  // Debug logging (dev only)
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("[Header] Brand:", brand, "Logo:", navConfig.logo, "LogoSize:", navConfig.logoSize)
    }
  }, [brand, navConfig.logo, navConfig.logoSize])
  
  // Get logo size classes
  const logoSize = navConfig.logoSize || "md"
  const logoFit = navConfig.logoFit || "contain"
  const logoClasses = getLogoSizeClasses(logoSize)
  const logoDimensions = getLogoImageDimensions(logoSize)

  // Filter and sort links based on visibility
  const visibleLinks = navConfig.links
    .filter((link) => link.visibility === "both" || link.visibility === brand)
    .sort((a, b) => a.sort - b.sort)

  // Resolve logo URL (server-side resolved or client-side fallback)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoAlt, setLogoAlt] = useState<string>("Logo")

  useEffect(() => {
    const resolveLogo = async () => {
      if (!navConfig.logo) {
        setLogoUrl(null)
        setLogoAlt("Logo")
        return
      }

      // If logo has url, use it directly
      if ("url" in navConfig.logo && navConfig.logo.url) {
        setLogoUrl(navConfig.logo.url)
        setLogoAlt(navConfig.logo.alt || "Logo")
        return
      }

      // If logo has mediaId, fetch from database
      if ("mediaId" in navConfig.logo && navConfig.logo.mediaId) {
        try {
          const { createSupabaseBrowserClient } = await import("@/lib/supabase/client")
          const supabase = createSupabaseBrowserClient()
          const { data, error } = await supabase
            .from("media")
            .select("url, alt")
            .eq("id", navConfig.logo.mediaId)
            .single()

          if (error || !data) {
            console.error("Error fetching logo from database:", error)
            setLogoUrl(null)
            setLogoAlt("Logo")
            return
          }

          setLogoUrl(data.url)
          setLogoAlt(navConfig.logo.alt || data.alt || "Logo")
        } catch (error) {
          console.error("Error resolving logo:", error)
          setLogoUrl(null)
          setLogoAlt("Logo")
        }
        return
      }

      setLogoUrl(null)
      setLogoAlt("Logo")
    }

    resolveLogo()
  }, [navConfig.logo])

  // Get link href
  const getLinkHref = (link: NavLink): string => {
    if (link.type === "page" && link.pageSlug) {
      return `/${link.pageSlug}`
    }
    if (link.type === "url" && link.href) {
      return link.href
    }
    return "#"
  }

  // Get CTA href
  const getCtaHref = (): string => {
    if (!navConfig.cta || !navConfig.cta.enabled) return "#"
    if (navConfig.cta.type === "page" && navConfig.cta.pageSlug) {
      return `/${navConfig.cta.pageSlug}`
    }
    if (navConfig.cta.type === "url" && navConfig.cta.href) {
      return navConfig.cta.href
    }
    return "#"
  }

  // Search functionality
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; title: string; slug: string }>
  >([])

  // Keyboard shortcut: Ctrl+K or / to open search
  useEffect(() => {
    if (!navConfig.searchEnabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
      } else if (e.key === "/" && !searchOpen && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [navConfig.searchEnabled, searchOpen])

  useEffect(() => {
    if (!searchOpen) {
      setSearchQuery("")
      setSearchResults([])
      return
    }

    const searchTimeout = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        if (response.ok) {
          const data = await response.json()
          setSearchResults(data)
        }
      } catch (error) {
        console.error("Error searching:", error)
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [searchQuery, searchOpen])

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-colors duration-200",
          theme.wrapper,
          theme.shadow
        )}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className={cn("flex items-center gap-2", logoClasses.width)}>
            {logoUrl ? (
              <div className={cn("relative", logoClasses.height, logoClasses.maxWidth)}>
                <Image
                  src={logoUrl}
                  alt={logoAlt || `${brand} Logo`}
                  width={logoDimensions.width}
                  height={logoDimensions.height}
                  className={cn(
                    "h-full w-auto",
                    logoFit === "contain" ? "object-contain" : "object-cover"
                  )}
                  priority
                  sizes="(max-width: 768px) 140px, 180px"
                />
              </div>
            ) : (
              <span className={cn("font-semibold", logoClasses.height, "flex items-center")}>
                {brand === "physio-konzept" ? "Physio-Konzept" : "Physiotherapie"}
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {visibleLinks.map((link) => {
              const href = getLinkHref(link)
              const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href))
              
              return (
                <Link
                  key={link.id}
                  href={href}
                  target={link.newTab ? "_blank" : undefined}
                  rel={link.newTab ? "noopener noreferrer" : undefined}
                  className={cn(
                    "text-sm font-medium transition-colors duration-200",
                    theme.link.base,
                    theme.link.hover,
                    isActive && theme.link.active,
                    theme.focus
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {navConfig.searchEnabled && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                aria-label="Suche öffnen"
                className={cn(
                  "transition-colors duration-200",
                  theme.iconButton.base,
                  theme.iconButton.hover,
                  theme.focus
                )}
              >
                <Search className="h-5 w-5" />
              </Button>
            )}
            {navConfig.cta?.enabled && (
              <Button
                variant={navConfig.cta.variant || "default"}
                asChild
                className={cn(
                  "transition-colors duration-200",
                  theme.cta.default,
                  theme.cta.hover,
                  theme.focus
                )}
              >
                <Link href={getCtaHref()}>
                  {navConfig.cta.label}
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Menü öffnen"
                className={cn(
                  "transition-colors duration-200",
                  theme.iconButton.base,
                  theme.iconButton.hover,
                  theme.focus
                )}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className={cn(
                "w-[300px] sm:w-[400px] transition-colors duration-200",
                theme.mobile.container,
                theme.border
              )}
            >
              {/* Accessible title for screen readers */}
              <SheetHeader>
                <VisuallyHidden.Root asChild>
                  <SheetTitle>Navigation</SheetTitle>
                </VisuallyHidden.Root>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8" aria-label="Mobile navigation">
                {visibleLinks.map((link) => {
                  const href = getLinkHref(link)
                  const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href))
                  
                  return (
                    <Link
                      key={link.id}
                      href={href}
                      target={link.newTab ? "_blank" : undefined}
                      rel={link.newTab ? "noopener noreferrer" : undefined}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "text-base font-medium transition-colors duration-200 rounded-md px-3 py-2",
                        theme.mobile.link.base,
                        theme.mobile.link.hover,
                        isActive && theme.mobile.link.active,
                        theme.focus
                      )}
                    >
                      {link.label}
                    </Link>
                  )
                })}
                {navConfig.searchEnabled && (
                  <Button
                    variant="ghost"
                    className={cn(
                      "justify-start transition-colors duration-200",
                      theme.mobile.link.base,
                      theme.mobile.link.hover,
                      theme.focus
                    )}
                    onClick={() => {
                      setMobileMenuOpen(false)
                      setSearchOpen(true)
                    }}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Suche
                  </Button>
                )}
                {navConfig.cta?.enabled && (
                  <Button
                    variant={navConfig.cta.variant || "default"}
                    className={cn(
                      "mt-4 transition-colors duration-200",
                      theme.cta.default,
                      theme.cta.hover,
                      theme.focus
                    )}
                    asChild
                  >
                    <Link href={getCtaHref()} onClick={() => setMobileMenuOpen(false)}>
                      {navConfig.cta.label}
                    </Link>
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Search Dialog */}
      {navConfig.searchEnabled && (
        <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
          <CommandInput
            placeholder="Seiten durchsuchen..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {searchResults.length === 0 && searchQuery.length >= 2 && (
              <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>
            )}
            {searchQuery.length < 2 && (
              <CommandEmpty>Mindestens 2 Zeichen eingeben...</CommandEmpty>
            )}
            {searchResults.length > 0 && (
              <CommandGroup heading="Seiten">
                {searchResults.map((page) => (
                  <CommandItem
                    key={page.id}
                    onSelect={() => {
                      window.location.href = `/${page.slug}`
                      setSearchOpen(false)
                    }}
                  >
                    {page.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </CommandDialog>
      )}
    </>
  )
}
