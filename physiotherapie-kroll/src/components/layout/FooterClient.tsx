"use client"

import { usePathname } from "next/navigation"
import { getFooterTheme } from "@/lib/theme/footerTheme"
import { getContainerClass } from "@/lib/layout/container"
import { resolveContainerBg } from "@/lib/theme/resolveContainerBg"
import { resolveFooterBg, getGlassmorphismPreset } from "@/lib/theme/resolveFooterBg"
import { resolveBoxShadow } from "@/lib/shadow/resolveBoxShadow"
import type { BrandKey } from "@/components/brand/brandAssets"
import type { FooterConfig, FooterBlock, FooterSection } from "@/types/footer"
import { getPageHrefForBrand, resolveLegalLinksForFooter } from "@/lib/cms/legalLinks"
import type { ResolvedLegalLink } from "@/lib/cms/legalLinks"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { resolveMediaClient } from "@/lib/cms/resolveMediaClient"

export type LegalPageItem = { slug: string; title: string; page_subtype: string }

interface FooterClientProps {
  brand: BrandKey
  footerConfig: FooterConfig
  pagesMap: Map<string, string>
  /** Rechtliche Links (Datenschutz, Cookies, Impressum); nur angezeigte Links, wenn vom CMS vorhanden. */
  legalPages?: LegalPageItem[]
}

/**
 * Client Component that renders footer with brand-aware theme
 */
export function FooterClient({ brand, footerConfig, pagesMap, legalPages = [] }: FooterClientProps) {
  const theme = getFooterTheme(brand, footerConfig?.design)

  if (!footerConfig || footerConfig.sections.length === 0) {
    return null
  }

  const resolvedLegalLinks = resolveLegalLinksForFooter(
    footerConfig.legalLinks,
    legalPages,
    brand
  )

  return (
    <footer
      className="relative w-full border-t border-border overflow-hidden"
      aria-label="Footer"
    >
      {/* Outer Background Layer */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: theme.colors.bg,
          ...resolveFooterBg({
            mode: footerConfig?.background?.mode,
            color: footerConfig?.background?.color,
            gradientPreset: footerConfig?.background?.gradientPreset,
            gradient: footerConfig?.background?.gradient,
          }).style,
        }}
      >
        {/* Background Media (Image/Video) */}
        {footerConfig?.background?.mode === "image" && footerConfig?.background?.mediaUrl && (
          <img
            src={footerConfig.background.mediaUrl}
            alt="Footer background"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {footerConfig?.background?.mode === "video" && footerConfig?.background?.mediaUrl && (
          <video
            src={footerConfig.background.mediaUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* Overlay for readability */}
        {footerConfig?.background?.overlay?.enabled && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: footerConfig.background.overlay.color || "#000000",
              opacity: footerConfig.background.overlay.opacity || 0.3,
            }}
          />
        )}
      </div>

      {/* Subtle background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full blur-3xl opacity-5"
          style={{ backgroundColor: theme.colors.accent || "var(--primary)" }}
        />
        <div 
          className="absolute -top-40 -right-20 h-96 w-96 rounded-full blur-3xl opacity-5"
          style={{ backgroundColor: theme.colors.heading || "var(--foreground)" }}
        />
      </div>

      {/* Content Layer */}
      <div
        className={cn(
          "relative z-10",
          theme.text,
          theme.spacing.py
        )}
        style={{
          color: theme.colors.text,
        }}
      >
        <div className={getContainerClass(footerConfig?.layoutWidth ?? "contained")}>
          {/* Inner Glass Panel */}
          {footerConfig?.glassmorphism?.enabled !== false ? (
            <GlassPanelWrapper config={footerConfig}>
              <FooterContent
                brand={brand}
                footerConfig={footerConfig}
                theme={theme}
                pagesMap={pagesMap}
                resolvedLegalLinks={resolvedLegalLinks}
              />
            </GlassPanelWrapper>
          ) : (
            <FooterContent
              brand={brand}
              footerConfig={footerConfig}
              theme={theme}
              pagesMap={pagesMap}
              resolvedLegalLinks={resolvedLegalLinks}
            />
          )}
        </div>
      </div>
    </footer>
  )
}

/**
 * Footer Section Component
 */
function FooterSection({
  brand,
  section,
  theme,
  pagesMap,
}: {
  brand: BrandKey
  section: FooterSection
  theme: ReturnType<typeof getFooterTheme>
  pagesMap: Map<string, string>
}) {
  const spanClassMap = {
    2: "md:col-span-2",
    3: "md:col-span-3",
    4: "md:col-span-4",
    6: "md:col-span-6",
  } as const

  return (
    <div className={cn(spanClassMap[section.span])}>
      {section.title && (
        <h2 
          className={cn(
            "mb-4",
            theme.typography.heading.size,
            theme.typography.heading.weight,
            theme.typography.heading.font
          )}
          style={{ color: theme.colors.heading }}
        >
          {section.title}
        </h2>
      )}
      <div className={cn("space-y-4", theme.section.align)}>
        {section.blocks.map((block) => (
          <FooterBlock
            key={block.id}
            brand={brand}
            block={block}
            theme={theme}
            pagesMap={pagesMap}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Footer Block Component
 */
function FooterBlock({
  brand,
  block,
  theme,
  pagesMap,
}: {
  brand: BrandKey
  block: FooterBlock
  theme: ReturnType<typeof getFooterTheme>
  pagesMap: Map<string, string>
}) {
  switch (block.type) {
    case "text":
      return (
        <div 
          className={cn(
            "whitespace-pre-line",
            theme.typography.body.size,
            theme.typography.body.weight,
            theme.typography.body.font
          )}
          style={{ color: theme.colors.text }}
        >
          {block.text}
        </div>
      )

    case "links":
      return (
        <div>
          {block.title && (
            <h3 
              className={cn(
                "mb-2",
                theme.typography.heading.size,
                theme.typography.heading.weight,
                theme.typography.heading.font
              )}
              style={{ color: theme.colors.heading }}
            >
              {block.title}
            </h3>
          )}
          <ul className="space-y-2">
            {block.links.map((link) => (
              <li key={link.id}>
                <Link
                  href={link.href}
                  target={link.newTab ? "_blank" : undefined}
                  rel={link.newTab ? "noopener noreferrer" : undefined}
                  className={cn(
                    "transition-colors outline-none rounded",
                    theme.typography.body.size,
                    theme.link,
                    theme.linkHover,
                    theme.focus,
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )

    case "pages":
      if (block.pageSlugs.length === 0) {
        return null
      }

      return (
        <div>
          {block.title && (
            <h3 
              className={cn(
                "mb-2",
                theme.typography.heading.size,
                theme.typography.heading.weight,
                theme.typography.heading.font
              )}
              style={{ color: theme.colors.heading }}
            >
              {block.title}
            </h3>
          )}
          <ul className="space-y-2">
            {block.pageSlugs.map((slug) => (
              <li key={slug}>
                <Link
                  href={getPageHrefForBrand(brand, slug)}
                  className={cn(
                    "transition-colors outline-none rounded",
                    theme.typography.body.size,
                    theme.link,
                    theme.linkHover,
                    theme.focus,
                  )}
                >
                  {pagesMap.get(slug) || slug}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )

    case "logo": {
      const logoUrl = block.mediaId || block.url
      if (!logoUrl) {
        return null
      }

      // Try to resolve media ID first, then fall back to direct URL
      let resolvedLogoUrl: string | null = null
      if (block.mediaId) {
        resolvedLogoUrl = resolveMediaClient({ mediaId: block.mediaId })
      }
      if (!resolvedLogoUrl && block.url) {
        resolvedLogoUrl = block.url
      }

      if (!resolvedLogoUrl) {
        return null
      }

      const sizeClassMap = {
        sm: "h-9",
        md: "h-12",
        lg: "h-14",
      } as const

      const fitClass = block.fit === "cover" ? "object-cover" : "object-contain"

      const logoContent = (
        <Image
          src={resolvedLogoUrl}
          alt={block.alt || "Logo"}
          width={block.size === "sm" ? 120 : block.size === "lg" ? 200 : 160}
          height={block.size === "sm" ? 36 : block.size === "lg" ? 56 : 48}
          className={cn(fitClass, "w-auto")}
        />
      )

      if (block.href) {
        return (
          <Link
            href={block.href}
            className={cn("inline-block outline-none rounded", theme.focus)}
          >
            {logoContent}
          </Link>
        )
      }

      return <div>{logoContent}</div>
    }

    case "copyright":
      return (
        <div 
          className={cn(
            "text-xs",
            theme.typography.body.size,
            theme.typography.body.weight,
            theme.typography.body.font
          )}
          style={{ color: theme.colors.text }}
        >
          {block.text}
        </div>
      )

    default:
      return null
  }
}

/**
 * Glass Panel Wrapper - applies glassmorphism styles (Client)
 */
function GlassPanelWrapper({
  config,
  children,
}: {
  config?: FooterConfig
  children: React.ReactNode
}) {
  const intensity = config?.glassmorphism?.intensity || "medium"
  const preset = getGlassmorphismPreset(intensity)
  const panelShadowCss = resolveBoxShadow(config?.glassmorphism?.panelShadow)

  // Helper: convert hex to rgb
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "0, 0, 0"
  }

  const baseBg = `rgba(255, 255, 255, ${config?.glassmorphism?.panelOpacity ?? preset.panelOpacity})`

  return (
    <div
      className={cn(
        "relative rounded-3xl px-6 py-10 md:px-10 md:py-12",
        "border",
        preset.blur
      )}
      style={{
        borderColor: config?.glassmorphism?.borderColor 
          ? `rgba(${hexToRgb(config.glassmorphism.borderColor)}, ${config?.glassmorphism?.borderOpacity ?? preset.borderOpacity})`
          : `rgba(var(--border), ${config?.glassmorphism?.borderOpacity ?? preset.borderOpacity})`,
        ...resolveContainerBg({
          mode: "gradient",
          gradientPreset: "soft",
        }).style,
        backgroundColor: baseBg,
        backdropFilter: config?.glassmorphism?.blurPx 
          ? `blur(${config.glassmorphism.blurPx}px)`
          : `blur(${preset.blur === "backdrop-blur-sm" ? "4" : preset.blur === "backdrop-blur-md" ? "12" : "40"}px)`,
        boxShadow: panelShadowCss ?? "0 4px 24px -2px rgba(0, 0, 0, 0.08), 0 8px 16px -4px rgba(0, 0, 0, 0.04)",
      }}
    >
      {/* Highlight line */}
      {(config?.glassmorphism?.highlightLine ?? preset.highlightLine) && (
        <div 
          className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent to-transparent"
          style={{
            backgroundImage: `linear-gradient(to right, transparent, ${config?.glassmorphism?.highlightColor || "#e5e7eb"}, transparent)`,
          }}
        />
      )}
      {/* Optionale Panel-Tönung (Color Management) */}
      {config?.glassmorphism?.tintColor && (
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{ backgroundColor: config.glassmorphism.tintColor, opacity: 0.06 }}
          aria-hidden
        />
      )}
      {children}
    </div>
  )
}

/**
 * Dedizierter Legal-Bereich: Rendert aus footerConfig.legalLinks + aufgelöste CMS-Seiten.
 */
function LegalLinksBlock({
  resolvedLinks,
  legalLinksConfig,
  brand,
}: {
  resolvedLinks: ResolvedLegalLink[]
  legalLinksConfig: NonNullable<FooterConfig["legalLinks"]>
  brand: BrandKey
}) {
  const pathname = usePathname()
  if (resolvedLinks.length === 0) return null

  const alignClass = {
    left: "justify-start text-left",
    center: "justify-center text-center",
    right: "justify-end text-right",
  }[legalLinksConfig.align ?? "left"]

  const gapClass = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  }[legalLinksConfig.gap ?? "md"]

  const marginTopClass = {
    none: "",
    sm: "mt-4",
    md: "mt-8",
    lg: "mt-10",
  }[legalLinksConfig.marginTop ?? "md"]

  const fontSizeClass = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
  }[legalLinksConfig.fontSize ?? "sm"]

  const fontWeightClass = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
  }[legalLinksConfig.fontWeight ?? "normal"]

  const textStyle = legalLinksConfig.textColor ? { color: legalLinksConfig.textColor } : undefined
  const separatorStyle = legalLinksConfig.separatorColor ? { borderColor: legalLinksConfig.separatorColor } : undefined

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname?.startsWith(href))

  const linkClassName = cn(
    "transition-colors outline-none rounded",
    fontSizeClass,
    fontWeightClass,
    legalLinksConfig.uppercase && "uppercase"
  )

  const layout = legalLinksConfig.layout ?? "inline"

  const listContent = (
    <ul
      className={cn(
        layout === "inline" && "flex flex-wrap items-center",
        layout === "stacked" && "flex flex-col items-start",
        layout === "separated" && "flex flex-wrap items-center",
        layout === "chips" && "flex flex-wrap gap-2",
        gapClass,
        alignClass
      )}
    >
      {resolvedLinks.map((link, i) => (
        <li
          key={link.slug}
          className={cn(
            layout === "separated" && i > 0 && "border-l border-solid pl-4 ml-0",
            layout === "chips" && "rounded-md bg-muted/50 px-3 py-1"
          )}
          style={layout === "separated" && i > 0 ? separatorStyle : undefined}
        >
          <Link
            href={link.href}
            className={linkClassName}
            style={{
              ...textStyle,
              ...(isActive(link.href) && legalLinksConfig.activeColor ? { color: legalLinksConfig.activeColor, fontWeight: "500" } : {}),
            }}
            onMouseEnter={(e) => {
              if (legalLinksConfig.hoverColor) {
                (e.target as HTMLElement).style.color = legalLinksConfig.hoverColor
              }
            }}
            onMouseLeave={(e) => {
              if (textStyle?.color) {
                (e.target as HTMLElement).style.color = textStyle.color as string
              } else {
                (e.target as HTMLElement).style.color = ""
              }
            }}
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  )

  return (
    <nav aria-label={legalLinksConfig.title ?? "Rechtliches"} className={marginTopClass}>
      {legalLinksConfig.showTitle !== false && legalLinksConfig.title && (
        <h3
          className={cn(
            "mb-2 font-semibold text-sm",
            alignClass,
            legalLinksConfig.textColor && "mb-2"
          )}
          style={textStyle}
        >
          {legalLinksConfig.title}
        </h3>
      )}
      {listContent}
    </nav>
  )
}

/**
 * Footer Content - main grid and sections (Client)
 */
function FooterContent({
  brand,
  footerConfig,
  theme,
  pagesMap,
  resolvedLegalLinks,
}: {
  brand: BrandKey
  footerConfig: FooterConfig
  theme: ReturnType<typeof getFooterTheme>
  pagesMap: Map<string, string>
  resolvedLegalLinks: ResolvedLegalLink[]
}) {
  const legalLinksConfig = footerConfig.legalLinks
  const showLegalAsSection =
    legalLinksConfig?.enabled &&
    legalLinksConfig.placement === "section" &&
    resolvedLegalLinks.length > 0
  const showLegalInBottomBar =
    legalLinksConfig?.enabled &&
    legalLinksConfig.placement === "bottom-bar" &&
    resolvedLegalLinks.length > 0

  return (
    <>
      {/* Main Footer Sections */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-10 auto-rows-max">
        {footerConfig.sections.map((section) => (
          <FooterSection
            key={section.id}
            brand={brand}
            section={section}
            theme={theme}
            pagesMap={pagesMap}
          />
        ))}
      </div>

      {/* Legal-Bereich als eigene Sektion (placement === "section") */}
      {showLegalAsSection && legalLinksConfig && (
        <div
          className="pt-8 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <LegalLinksBlock
            resolvedLinks={resolvedLegalLinks}
            legalLinksConfig={legalLinksConfig}
            brand={brand}
          />
        </div>
      )}

      {/* Bottom Bar */}
      {footerConfig.bottomBar?.enabled && (
        <div className={cn("mt-12 pt-8 border-t", theme.bottomBar.class)}>
          <div className={cn("flex flex-col sm:flex-row items-center gap-4 flex-wrap", theme.bottomBar.align)}>
            {footerConfig.bottomBar.left && (
              <div>
                <FooterBlock
                  brand={brand}
                  block={footerConfig.bottomBar.left}
                  theme={theme}
                  pagesMap={pagesMap}
                />
              </div>
            )}
            {showLegalInBottomBar && legalLinksConfig && (
              <LegalLinksBlock
                resolvedLinks={resolvedLegalLinks}
                legalLinksConfig={legalLinksConfig}
                brand={brand}
              />
            )}
            {footerConfig.bottomBar.right && (
              <div>
                <FooterBlock
                  brand={brand}
                  block={footerConfig.bottomBar.right}
                  theme={theme}
                  pagesMap={pagesMap}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
