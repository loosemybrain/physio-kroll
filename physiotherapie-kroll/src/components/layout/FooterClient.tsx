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
import { Facebook, Instagram } from "lucide-react"
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

function resolveCopyrightText(raw: string): string {
  const nowYear = String(new Date().getFullYear())
  // Preferred explicit placeholders in CMS text.
  let text = raw.replace(/\{\{\s*year\s*\}\}|\{\s*year\s*\}/gi, nowYear)
  // Backward-compatible: replace leading copyright year, e.g. "© 2024 ...".
  text = text.replace(/^(\s*©\s*)\d{4}\b/, `$1${nowYear}`)
  return text
}

type ResolvedSocialItem = {
  key: "facebook" | "instagram"
  href: string
  label: string
  iconVariant: string
}

function normalizeSocialUrl(input?: string): string | null {
  if (!input) return null
  const trimmed = input.trim()
  if (!trimmed) return null
  const candidate =
    /^https?:\/\//i.test(trimmed) || trimmed.startsWith("//") ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(candidate)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    return url.toString()
  } catch {
    return null
  }
}

function resolveSocialItems(config?: FooterConfig["socialLinks"]): ResolvedSocialItem[] {
  if (!config?.enabled) return []
  const items: ResolvedSocialItem[] = []

  const normalizedFacebook = normalizeSocialUrl(config.items.facebook.url)
  if (config.items.facebook.enabled && normalizedFacebook) {
    items.push({
      key: "facebook",
      href: normalizedFacebook,
      label: config.items.facebook.label?.trim() || "Facebook",
      iconVariant: config.items.facebook.iconVariant || "facebook",
    })
  }

  const normalizedInstagram = normalizeSocialUrl(config.items.instagram.url)
  if (config.items.instagram.enabled && normalizedInstagram) {
    items.push({
      key: "instagram",
      href: normalizedInstagram,
      label: config.items.instagram.label?.trim() || "Instagram",
      iconVariant: config.items.instagram.iconVariant || "instagram",
    })
  }

  return items
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

      const alignXMap = {
        left: "justify-start",
        center: "justify-center",
        right: "justify-end",
      } as const

      const alignYMap = {
        top: "items-start",
        center: "items-center",
        bottom: "items-end",
      } as const

      const fitClass = block.fit === "cover" ? "object-cover" : "object-contain"
      const sizeClass = sizeClassMap[block.size || "md"]

      const logoContent = (
        <Image
          src={resolvedLogoUrl}
          alt={block.alt || "Logo"}
          width={block.size === "sm" ? 120 : block.size === "lg" ? 200 : 160}
          height={block.size === "sm" ? 36 : block.size === "lg" ? 56 : 48}
          className={cn(fitClass, "w-auto")}
        />
      )

      // Use h-full for container if Y alignment is specified and not default center
      const useFullHeight = block.alignY && block.alignY !== "center"
      const containerHeightClass = useFullHeight ? "h-full" : sizeClass

      // For Links with full height, we need display: flex (not inline-flex)
      const containerClasses = cn(
        "flex outline-none rounded",
        containerHeightClass,
        alignXMap[block.alignX || "center"],
        alignYMap[block.alignY || "center"]
      )

      if (block.href) {
        return (
          <Link
            href={block.href}
            className={cn(containerClasses, theme.focus)}
          >
            {logoContent}
          </Link>
        )
      }

      return (
        <div className={containerClasses}>
          {logoContent}
        </div>
      )
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
          {resolveCopyrightText(block.text)}
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

  const marginTopStyle = {
    none: undefined,
    sm: "1rem",
    md: "2rem",
    lg: "2.5rem",
  }[legalLinksConfig.marginTop ?? "md"]

  const marginBottomStyle = {
    none: undefined,
    sm: "1rem",
    md: "2rem",
    lg: "2.5rem",
  }[legalLinksConfig.marginBottom ?? "none"]

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
    <nav
      aria-label={legalLinksConfig.title ?? "Rechtliches"}
      style={{
        ...(marginTopStyle ? { marginTop: marginTopStyle } : {}),
        ...(marginBottomStyle ? { marginBottom: marginBottomStyle } : {}),
      }}
    >
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

function SocialLinksBlock({
  socialLinks,
  resolvedItems,
  theme,
}: {
  socialLinks: NonNullable<FooterConfig["socialLinks"]>
  resolvedItems: ResolvedSocialItem[]
  theme: ReturnType<typeof getFooterTheme>
}) {
  if (!socialLinks.enabled || resolvedItems.length === 0) return null

  const alignClass = {
    left: "justify-start text-left",
    center: "justify-center text-center",
    right: "justify-end text-right",
  }[socialLinks.align]
  const isBottomBarPlacement = socialLinks.placement.startsWith("bottomBar")
  const bottomBarAlignClass = isBottomBarPlacement
    ? socialLinks.align === "center"
      ? "mx-auto"
      : socialLinks.align === "right"
        ? "ml-auto"
        : "mr-auto"
    : ""

  const gapClass = {
    xs: "gap-1",
    sm: "gap-2",
    md: "gap-3",
    lg: "gap-4",
  }[socialLinks.gap]

  const iconSizeClass = {
    xs: "h-3.5 w-3.5",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-7 w-7",
  }[socialLinks.iconSize]

  const iconWrapSizeClass = {
    xs: "h-6 w-6",
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-10 w-10",
    xl: "h-12 w-12",
  }[socialLinks.iconSize]

  const withSurface = socialLinks.iconStyle === "round" || socialLinks.iconStyle === "square" || socialLinks.iconStyle === "outline"
  const withEnhancedSurface = withSurface || socialLinks.iconStyle === "soft" || socialLinks.iconStyle === "pill"
  const hoverEffect = socialLinks.hoverEffect ?? "none"
  const hoverLinkClass = cn(
    hoverEffect === "lift" && "hover:-translate-y-1 hover:scale-105",
    hoverEffect === "shrink" && "hover:scale-90 hover:opacity-85",
    hoverEffect === "flip" && "hover:rotate-6 hover:scale-105",
    hoverEffect === "draw" &&
      "hover:outline hover:outline-2 hover:outline-primary/70 hover:outline-offset-2 hover:bg-primary/5"
  )
  const hoverIconClass = cn(
    hoverEffect === "none" && "group-hover:opacity-90",
    hoverEffect === "lift" && "group-hover:scale-110",
    hoverEffect === "shrink" && "group-hover:scale-90",
    hoverEffect === "flip" && "group-hover:scale-x-[-1]",
    hoverEffect === "draw" && "group-hover:scale-105"
  )

  const iconStyleClass = cn(
    withEnhancedSurface && "border",
    socialLinks.iconStyle === "round" && "rounded-full",
    socialLinks.iconStyle === "square" && "rounded-md",
    socialLinks.iconStyle === "outline" && "rounded-md bg-transparent",
    socialLinks.iconStyle === "soft" && "rounded-lg bg-muted/20",
    socialLinks.iconStyle === "pill" && "rounded-full px-2.5",
    socialLinks.iconStyle === "minimal" && "bg-transparent border-0",
    socialLinks.iconStyle === "default" && "rounded bg-transparent border-0",
    "inline-flex items-center justify-center transition-all duration-200 ease-out",
    hoverIconClass
  )

  const getLinkRel = () =>
    socialLinks.openInNewTab ? "noopener noreferrer nofollow" : undefined

  const renderIcon = (item: ResolvedSocialItem) => {
    const iconClass = cn(
      iconSizeClass,
      socialLinks.iconSet === "monochrome" && "opacity-85",
      socialLinks.iconSet === "simple" && "stroke-[1.6]"
    )
    if (item.key === "facebook") {
      if (item.iconVariant === "facebook-f" || socialLinks.iconSet === "simple") {
        return <span className={cn("font-bold leading-none", socialLinks.iconSize === "xl" ? "text-xl" : "text-base")}>f</span>
      }
      return <Facebook className={cn(iconClass, item.iconVariant === "facebook-round" && "stroke-[1.8]")} aria-hidden />
    }
    return (
      <Instagram
        className={cn(
          iconClass,
          item.iconVariant === "instagram-outline" && "stroke-[1.5]",
          item.iconVariant === "instagram-round" && "stroke-2"
        )}
        aria-hidden
      />
    )
  }

  const iconSetStyle = (item: ResolvedSocialItem): React.CSSProperties => {
    if (socialLinks.iconSet === "brand") {
      return {
        color: item.key === "facebook" ? "#1877F2" : "#E1306C",
      }
    }
    if (socialLinks.iconSet === "monochrome") {
      return {
        color: socialLinks.color || "#374151",
        filter: "grayscale(1)",
      }
    }
    return {
      color: socialLinks.color || theme.colors.text,
    }
  }

  return (
    <nav
      aria-label={socialLinks.title || "Social Media"}
      className={cn(isBottomBarPlacement && "flex items-center gap-3", bottomBarAlignClass)}
    >
      {socialLinks.title ? (
        <h3
          className={cn(
            "text-sm font-semibold",
            !isBottomBarPlacement && "mb-2",
            alignClass,
            isBottomBarPlacement && "mb-0 shrink-0"
          )}
          style={{ color: socialLinks.labelColor || theme.colors.heading }}
        >
          {socialLinks.title}
        </h3>
      ) : null}
      <ul
        className={cn(
          "flex items-center",
          !isBottomBarPlacement && "flex-wrap",
          alignClass,
          gapClass,
          isBottomBarPlacement && "flex-nowrap"
        )}
      >
        {resolvedItems.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              target={socialLinks.openInNewTab ? "_blank" : undefined}
              rel={getLinkRel()}
              aria-label={item.label}
              className={cn(
                "group inline-flex items-center gap-2 rounded outline-none transition-all duration-200 ease-out",
                hoverLinkClass
              )}
              style={{ color: socialLinks.color || theme.colors.text }}
              onMouseEnter={(e) => {
                if (socialLinks.hoverColor) {
                  e.currentTarget.style.color = socialLinks.hoverColor
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = socialLinks.color || theme.colors.text
              }}
            >
              <span
                className={cn(iconStyleClass, iconWrapSizeClass)}
                style={{
                  ...iconSetStyle(item),
                  backgroundColor:
                    withEnhancedSurface && socialLinks.backgroundColor ? socialLinks.backgroundColor : undefined,
                  borderColor: withEnhancedSurface && socialLinks.borderColor ? socialLinks.borderColor : undefined,
                }}
              >
                {renderIcon(item)}
              </span>
              {socialLinks.showLabels ? (
                <span
                  className="text-sm transition-colors"
                  style={{ color: socialLinks.labelColor || socialLinks.color || theme.colors.text }}
                >
                  {item.label}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
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
  const socialLinksConfig = footerConfig.socialLinks
  const resolvedSocialItems = resolveSocialItems(socialLinksConfig)
  const showSocialTop =
    socialLinksConfig?.enabled &&
    socialLinksConfig.placement === "top" &&
    resolvedSocialItems.length > 0
  const showSocialSection =
    socialLinksConfig?.enabled &&
    socialLinksConfig.placement === "section" &&
    resolvedSocialItems.length > 0
  const showSocialBottom =
    socialLinksConfig?.enabled &&
    socialLinksConfig.placement === "bottom" &&
    resolvedSocialItems.length > 0
  const showSocialBottomBar =
    socialLinksConfig?.enabled &&
    (socialLinksConfig.placement === "bottomBar" ||
      socialLinksConfig.placement === "bottomBarLeft" ||
      socialLinksConfig.placement === "bottomBarCenter" ||
      socialLinksConfig.placement === "bottomBarRight") &&
    resolvedSocialItems.length > 0

  const legalToBottomBarGap = {
    none: "0rem",
    sm: "1rem",
    md: "2rem",
    lg: "2.5rem",
  }[legalLinksConfig?.marginBottom ?? "none"]

  const baseBottomBarGap = {
    none: "0rem",
    sm: "1rem",
    md: "2rem",
    lg: "3rem",
  }[footerConfig.bottomBar?.marginTop ?? "lg"]

  const bottomBarMarginTop = showLegalAsSection
    ? `calc(${baseBottomBarGap} + ${legalToBottomBarGap})`
    : baseBottomBarGap
  return (
    <>
      {showSocialTop && socialLinksConfig && (
        <div className="mb-6">
          <SocialLinksBlock socialLinks={socialLinksConfig} resolvedItems={resolvedSocialItems} theme={theme} />
        </div>
      )}

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
          className={cn("pt-8", legalLinksConfig.separatorColor ? "border-t" : "border-t-0")}
          style={legalLinksConfig.separatorColor ? { borderColor: legalLinksConfig.separatorColor } : undefined}
        >
          <LegalLinksBlock
            resolvedLinks={resolvedLegalLinks}
            legalLinksConfig={legalLinksConfig}
            brand={brand}
          />
        </div>
      )}

      {showSocialSection && socialLinksConfig && (
        <div className="pt-6">
          <SocialLinksBlock socialLinks={socialLinksConfig} resolvedItems={resolvedSocialItems} theme={theme} />
        </div>
      )}

      {/* Bottom Bar */}
      {footerConfig.bottomBar?.enabled && (
        <div className={cn("pt-8 border-t", theme.bottomBar.class)} style={{ marginTop: bottomBarMarginTop }}>
          {showSocialBottomBar && socialLinksConfig ? (
            socialLinksConfig.align === "left" ? (
              <div className="flex w-full items-center gap-4">
                <SocialLinksBlock socialLinks={socialLinksConfig} resolvedItems={resolvedSocialItems} theme={theme} />
                <div className="ml-auto flex items-center gap-4">
                  {footerConfig.bottomBar.left && (
                    <FooterBlock
                      brand={brand}
                      block={footerConfig.bottomBar.left}
                      theme={theme}
                      pagesMap={pagesMap}
                    />
                  )}
                  {showLegalInBottomBar && legalLinksConfig && (
                    <LegalLinksBlock
                      resolvedLinks={resolvedLegalLinks}
                      legalLinksConfig={legalLinksConfig}
                      brand={brand}
                    />
                  )}
                  {footerConfig.bottomBar.right && (
                    <FooterBlock
                      brand={brand}
                      block={footerConfig.bottomBar.right}
                      theme={theme}
                      pagesMap={pagesMap}
                    />
                  )}
                </div>
              </div>
            ) : socialLinksConfig.align === "center" ? (
              <div className="flex w-full items-center justify-center gap-4">
                {footerConfig.bottomBar.left && (
                  <FooterBlock
                    brand={brand}
                    block={footerConfig.bottomBar.left}
                    theme={theme}
                    pagesMap={pagesMap}
                  />
                )}
                {showLegalInBottomBar && legalLinksConfig && (
                  <LegalLinksBlock
                    resolvedLinks={resolvedLegalLinks}
                    legalLinksConfig={legalLinksConfig}
                    brand={brand}
                  />
                )}
                <SocialLinksBlock socialLinks={socialLinksConfig} resolvedItems={resolvedSocialItems} theme={theme} />
                {footerConfig.bottomBar.right && (
                  <FooterBlock
                    brand={brand}
                    block={footerConfig.bottomBar.right}
                    theme={theme}
                    pagesMap={pagesMap}
                  />
                )}
              </div>
            ) : (
              <div className="flex w-full items-center gap-4">
                <div className="flex items-center gap-4">
                  {footerConfig.bottomBar.left && (
                    <FooterBlock
                      brand={brand}
                      block={footerConfig.bottomBar.left}
                      theme={theme}
                      pagesMap={pagesMap}
                    />
                  )}
                  {showLegalInBottomBar && legalLinksConfig && (
                    <LegalLinksBlock
                      resolvedLinks={resolvedLegalLinks}
                      legalLinksConfig={legalLinksConfig}
                      brand={brand}
                    />
                  )}
                  {footerConfig.bottomBar.right && (
                    <FooterBlock
                      brand={brand}
                      block={footerConfig.bottomBar.right}
                      theme={theme}
                      pagesMap={pagesMap}
                    />
                  )}
                </div>
                <div className="ml-auto">
                  <SocialLinksBlock socialLinks={socialLinksConfig} resolvedItems={resolvedSocialItems} theme={theme} />
                </div>
              </div>
            )
          ) : (
            <div className={cn("flex flex-wrap items-center gap-4", theme.bottomBar.align)}>
              {footerConfig.bottomBar.left && (
                <FooterBlock
                  brand={brand}
                  block={footerConfig.bottomBar.left}
                  theme={theme}
                  pagesMap={pagesMap}
                />
              )}
              {showLegalInBottomBar && legalLinksConfig && (
                <LegalLinksBlock
                  resolvedLinks={resolvedLegalLinks}
                  legalLinksConfig={legalLinksConfig}
                  brand={brand}
                />
              )}
              {footerConfig.bottomBar.right && (
                <FooterBlock
                  brand={brand}
                  block={footerConfig.bottomBar.right}
                  theme={theme}
                  pagesMap={pagesMap}
                />
              )}
            </div>
          )}
        </div>
      )}

      {showSocialBottom && socialLinksConfig && (
        <div className="pt-6">
          <SocialLinksBlock socialLinks={socialLinksConfig} resolvedItems={resolvedSocialItems} theme={theme} />
        </div>
      )}
    </>
  )
}
