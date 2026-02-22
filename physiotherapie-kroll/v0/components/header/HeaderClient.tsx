"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, Search } from "lucide-react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import type { NavConfig, NavLink } from "@/types/navigation"
import type { BrandKey } from "@/types/navigation"
import { getNavTheme } from "@/lib/theme/navTheme"
import {
  getLogoSizeClasses,
  getLogoImageDimensions,
} from "@/lib/theme/logoSize"

/* ------------------------------------------------------------------ */
/*  Font preset resolution                                            */
/* ------------------------------------------------------------------ */

const BRAND_FONT_MAP: Record<BrandKey, string> = {
  physiotherapy: "font-sans",
  "physio-konzept": "font-serif",
}

function resolveFontClass(
  brand: BrandKey,
  preset?: NavConfig["headerFontPreset"]
): string {
  switch (preset) {
    case "sans":
      return "font-sans"
    case "serif":
      return "font-serif"
    case "mono":
      return "font-mono"
    case "brand":
    default:
      return BRAND_FONT_MAP[brand] ?? "font-sans"
  }
}

/* ------------------------------------------------------------------ */
/*  Grid column templates (desktop)                                    */
/* ------------------------------------------------------------------ */

function getGridTemplate(cols: 3 | 4 | 5, hasSecondary: boolean, hasInfo: boolean): string {
  // Collapse empty columns gracefully
  if (cols === 5 && hasInfo && hasSecondary)
    return "auto 1fr auto auto auto"
  if (cols === 5 && hasSecondary)
    return "auto 1fr auto auto"
  if (cols === 4 && hasSecondary)
    return "auto 1fr auto auto"
  if (cols === 4)
    return "auto 1fr auto"
  // 3 columns (default)
  return "auto 1fr auto"
}

/* ------------------------------------------------------------------ */
/*  HeaderClient                                                       */
/* ------------------------------------------------------------------ */

interface HeaderClientProps {
  brand: BrandKey
  navConfig: NavConfig
}

export function HeaderClient({ brand, navConfig }: HeaderClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const prefersReducedMotion = useReducedMotion()
  const headerRef = useRef<HTMLElement>(null)

  /* ---- theme, sizing, font ---- */
  const theme = getNavTheme(brand)
  const logoSize = navConfig.logoSize || "md"
  const logoFit = navConfig.logoFit || "contain"
  const logoClasses = getLogoSizeClasses(logoSize)
  const logoDimensions = getLogoImageDimensions(logoSize)
  const fontClass = resolveFontClass(brand, navConfig.headerFontPreset)

  /* ---- layout ---- */
  const cols = navConfig.headerLayoutColumns ?? 4
  const hasSecondary =
    (navConfig.secondaryLinks ?? []).length > 0
  const hasInfo = !!navConfig.infoBadge
  const gridTemplate = getGridTemplate(cols, hasSecondary, hasInfo)

  /* ---- visible links (filtered + sorted) ---- */
  const visibleLinks = useMemo(
    () =>
      navConfig.links
        .filter(
          (link) =>
            link.visibility === "both" || link.visibility === brand
        )
        .sort((a, b) => a.sort - b.sort),
    [navConfig.links, brand]
  )

  const visibleSecondary = useMemo(
    () =>
      (navConfig.secondaryLinks ?? [])
        .filter(
          (link) =>
            link.visibility === "both" || link.visibility === brand
        )
        .sort((a, b) => a.sort - b.sort),
    [navConfig.secondaryLinks, brand]
  )

  /* ---- logo resolution ---- */
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoAlt, setLogoAlt] = useState<string>("Logo")

  useEffect(() => {
    const resolveLogo = async () => {
      if (!navConfig.logo) {
        setLogoUrl(null)
        setLogoAlt("Logo")
        return
      }
      if ("url" in navConfig.logo && navConfig.logo.url) {
        setLogoUrl(navConfig.logo.url)
        setLogoAlt(navConfig.logo.alt || "Logo")
        return
      }
      if ("mediaId" in navConfig.logo && navConfig.logo.mediaId) {
        try {
          const { createSupabaseBrowserClient } = await import(
            "@/lib/supabase/client"
          )
          const supabase = createSupabaseBrowserClient()
          const { data, error } = await supabase
            .from("media")
            .select("url, alt")
            .eq("id", navConfig.logo.mediaId)
            .single()
          if (error || !data) {
            setLogoUrl(null)
            return
          }
          setLogoUrl(data.url)
          setLogoAlt(navConfig.logo.alt || data.alt || "Logo")
        } catch {
          setLogoUrl(null)
        }
        return
      }
      setLogoUrl(null)
    }
    resolveLogo()
  }, [navConfig.logo])

  /* ---- scroll detection (sticky state) ---- */
  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 8)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  /* ---- href helpers ---- */
  const getLinkHref = useCallback((link: NavLink): string => {
    if (link.type === "page" && link.pageSlug != null) return `/${link.pageSlug}`
    if (link.type === "url" && link.href) return link.href
    return "#"
  }, [])

  const getCtaHref = useCallback((): string => {
    if (!navConfig.cta?.enabled) return "#"
    if (navConfig.cta.type === "page" && navConfig.cta.pageSlug)
      return `/${navConfig.cta.pageSlug}`
    if (navConfig.cta.type === "url" && navConfig.cta.href)
      return navConfig.cta.href
    return "#"
  }, [navConfig.cta])

  /* ---- search ---- */
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; title: string; slug: string }>
  >([])

  useEffect(() => {
    if (!navConfig.searchEnabled) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
      } else if (
        e.key === "/" &&
        !searchOpen &&
        document.activeElement?.tagName !== "INPUT"
      ) {
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
    const timeout = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery)}`
        )
        if (res.ok) setSearchResults(await res.json())
      } catch {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery, searchOpen])

  /* ---- active link check ---- */
  const isLinkActive = useCallback(
    (href: string) =>
      pathname === href || (href !== "/" && pathname?.startsWith(href)),
    [pathname]
  )

  /* ---- motion presets ---- */
  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 400, damping: 30 }

  const staggerChildren = prefersReducedMotion ? 0 : 0.05

  /* ---- Desktop Nav Link ---- */
  const DesktopLink = ({
    link,
    secondary,
  }: {
    link: NavLink
    secondary?: boolean
  }) => {
    const href = getLinkHref(link)
    const active = isLinkActive(href)
    return (
      <Link
        href={href}
        target={link.newTab ? "_blank" : undefined}
        rel={link.newTab ? "noopener noreferrer" : undefined}
        className={cn(
          "relative py-1 text-sm font-medium transition-colors duration-200",
          fontClass,
          secondary ? "text-xs" : "",
          theme.link.base,
          theme.link.hover,
          active && theme.link.active,
          theme.focus
        )}
      >
        {link.label}
        {/* Animated active indicator -- layout-safe absolute underline */}
        {active && (
          <motion.span
            layoutId={secondary ? "nav-indicator-sec" : "nav-indicator"}
            className={cn(
              "absolute -bottom-1 left-0 right-0 h-0.5 rounded-full",
              theme.indicator
            )}
            transition={transition}
          />
        )}
      </Link>
    )
  }

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  return (
    <>
      <motion.header
        ref={headerRef}
        initial={false}
        animate={isScrolled ? "scrolled" : "top"}
        className={cn(
          "sticky top-0 z-50 w-full transition-colors duration-300",
          theme.wrapper,
          isScrolled && theme.wrapperScrolled
        )}
      >
        <motion.div
          variants={{
            top: { paddingTop: 6, paddingBottom: 6 },
            scrolled: { paddingTop: 2, paddingBottom: 2 },
          }}
          animate={isScrolled ? "scrolled" : "top"}
          transition={
            prefersReducedMotion ? { duration: 0 } : { duration: 0.25 }
          }
          className="container mx-auto px-4"
        >
          {/* ---- Desktop: CSS Grid ---- */}
          <div
            className="hidden md:grid items-center gap-6 h-16"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {/* Col 1: Logo */}
            <motion.div
              variants={{
                top: { scale: 1 },
                scrolled: { scale: 0.92 },
              }}
              animate={isScrolled ? "scrolled" : "top"}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 0.25 }
              }
              className="origin-left"
            >
              <Link
                href="/"
                className={cn(
                  "flex items-center shrink-0",
                  logoClasses.width,
                  "h-16",
                  theme.focus
                )}
                aria-label="Zur Startseite"
              >
                <div className="relative flex items-center justify-start shrink-0 h-16 w-auto">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt={logoAlt || `${brand} Logo`}
                      width={logoDimensions.width}
                      height={logoDimensions.height}
                      className={cn(
                        "h-full w-auto shrink-0",
                        logoFit === "cover"
                          ? "object-cover"
                          : "object-contain",
                        logoClasses.maxWidth
                      )}
                      priority
                      sizes="(max-width: 768px) 140px, 180px"
                    />
                  ) : (
                    <span
                      className={cn(
                        "font-semibold text-sm truncate shrink-0",
                        fontClass
                      )}
                    >
                      {brand === "physio-konzept"
                        ? "Physio-Konzept"
                        : "Physiotherapie"}
                    </span>
                  )}
                </div>
              </Link>
            </motion.div>

            {/* Col 2: Primary Nav */}
            <motion.nav
              className="flex items-center gap-6 justify-center"
              aria-label="Hauptnavigation"
              variants={{
                top: { gap: 24 },
                scrolled: { gap: 16 },
              }}
              animate={isScrolled ? "scrolled" : "top"}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 0.25 }
              }
            >
              {visibleLinks.map((link) => (
                <DesktopLink key={link.id} link={link} />
              ))}
            </motion.nav>

            {/* Col 3 (optional): Secondary / Utility */}
            {cols >= 4 && hasSecondary && (
              <nav
                className="flex items-center gap-4 justify-end"
                aria-label="Sekundäre Navigation"
              >
                {visibleSecondary.map((link) => (
                  <DesktopLink key={link.id} link={link} secondary />
                ))}
              </nav>
            )}

            {/* Col 4 (optional): Info badge */}
            {cols >= 5 && hasInfo && navConfig.infoBadge && (
              <div className="flex items-center justify-center">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary",
                    fontClass
                  )}
                >
                  {navConfig.infoBadge}
                </span>
              </div>
            )}

            {/* Last Col: Actions */}
            <div className="flex items-center gap-3 justify-end">
              {navConfig.searchEnabled && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Suche öffnen (Ctrl+K)"
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
                    fontClass,
                    theme.cta.default,
                    theme.cta.hover,
                    theme.focus
                  )}
                >
                  <Link href={getCtaHref()}>{navConfig.cta.label}</Link>
                </Button>
              )}
            </div>
          </div>

          {/* ---- Mobile: Flex ---- */}
          <div className="flex md:hidden items-center justify-between h-14">
            {/* Logo */}
            <Link
              href="/"
              className={cn(
                "flex items-center shrink-0",
                theme.focus
              )}
              aria-label="Zur Startseite"
            >
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={logoAlt || `${brand} Logo`}
                  width={logoDimensions.width}
                  height={logoDimensions.height}
                  className="h-10 w-auto object-contain"
                  priority
                  sizes="120px"
                />
              ) : (
                <span className={cn("font-semibold text-sm", fontClass)}>
                  {brand === "physio-konzept"
                    ? "Physio-Konzept"
                    : "Physiotherapie"}
                </span>
              )}
            </Link>

            {/* Mobile menu button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
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
                  "w-[300px] sm:w-[380px] transition-colors duration-200",
                  theme.mobile.container,
                  theme.border
                )}
              >
                <SheetHeader>
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                </SheetHeader>
                <nav
                  className="flex flex-col gap-1 mt-8"
                  aria-label="Mobile Navigation"
                >
                  <AnimatePresence>
                    {visibleLinks.map((link, i) => {
                      const href = getLinkHref(link)
                      const active = isLinkActive(href)
                      return (
                        <motion.div
                          key={link.id}
                          initial={
                            prefersReducedMotion
                              ? false
                              : { opacity: 0, x: 20 }
                          }
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: prefersReducedMotion
                              ? 0
                              : i * staggerChildren,
                            duration: prefersReducedMotion ? 0 : 0.25,
                          }}
                        >
                          <Link
                            href={href}
                            target={link.newTab ? "_blank" : undefined}
                            rel={
                              link.newTab
                                ? "noopener noreferrer"
                                : undefined
                            }
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              "block text-base font-medium transition-colors duration-200 rounded-lg px-4 py-3",
                              fontClass,
                              theme.mobile.link.base,
                              theme.mobile.link.hover,
                              active && theme.mobile.link.active,
                              theme.focus
                            )}
                          >
                            {link.label}
                          </Link>
                        </motion.div>
                      )
                    })}

                    {/* Secondary links */}
                    {visibleSecondary.length > 0 && (
                      <>
                        <div className="my-2 h-px bg-border" />
                        {visibleSecondary.map((link, i) => {
                          const href = getLinkHref(link)
                          const active = isLinkActive(href)
                          return (
                            <motion.div
                              key={link.id}
                              initial={
                                prefersReducedMotion
                                  ? false
                                  : { opacity: 0, x: 20 }
                              }
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                delay: prefersReducedMotion
                                  ? 0
                                  : (visibleLinks.length + i) *
                                    staggerChildren,
                                duration: prefersReducedMotion ? 0 : 0.25,
                              }}
                            >
                              <Link
                                href={href}
                                target={
                                  link.newTab ? "_blank" : undefined
                                }
                                rel={
                                  link.newTab
                                    ? "noopener noreferrer"
                                    : undefined
                                }
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                  "block text-sm font-medium transition-colors duration-200 rounded-lg px-4 py-2.5",
                                  fontClass,
                                  theme.mobile.link.base,
                                  theme.mobile.link.hover,
                                  active && theme.mobile.link.active,
                                  theme.focus
                                )}
                              >
                                {link.label}
                              </Link>
                            </motion.div>
                          )
                        })}
                      </>
                    )}
                  </AnimatePresence>

                  {/* Mobile actions */}
                  <div className="mt-6 flex flex-col gap-3 px-4">
                    {navConfig.searchEnabled && (
                      <Button
                        variant="ghost"
                        className={cn(
                          "justify-start",
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
                          fontClass,
                          theme.cta.default,
                          theme.cta.hover,
                          theme.focus
                        )}
                        asChild
                      >
                        <Link
                          href={getCtaHref()}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {navConfig.cta.label}
                        </Link>
                      </Button>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </motion.div>
      </motion.header>

      {/* ---- Search CommandDialog ---- */}
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
