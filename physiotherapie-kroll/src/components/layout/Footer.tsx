import { getFooterServer } from "@/lib/supabase/footer.server"
import { resolveMedia } from "@/lib/cms/resolveMedia"
import { getFooterTheme } from "@/lib/theme/footerTheme"
import { getContainerClass } from "@/lib/layout/container"
import { resolveContainerBg } from "@/lib/theme/resolveContainerBg"
import { resolveFooterBg, getGlassmorphismPreset } from "@/lib/theme/resolveFooterBg"
import type { BrandKey } from "@/components/brand/brandAssets"
import type { FooterConfig, FooterBlock, FooterSection } from "@/types/footer"
import Image from "next/image"
import Link from "next/link"
import { getSupabasePublic } from "@/lib/supabase/serverPublic"
import { cn } from "@/lib/utils"
import { Facebook, Instagram } from "lucide-react"

interface FooterProps {
  brand: BrandKey
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
 * Server Component that fetches footer config and renders it
 */
export async function Footer({ brand }: FooterProps) {
  const footerConfig = await getFooterServer(brand)
  const theme = getFooterTheme(brand, footerConfig?.design)

  if (!footerConfig || footerConfig.sections.length === 0) {
    return null
  }

  // Load pages for pages blocks (only published)
  const supabase = await getSupabasePublic()
  const { data: pages } = await supabase
    .from("pages")
    .select("id, slug, title, status")
    .eq("status", "published")
    .order("title", { ascending: true })

  const pagesMap = new Map(pages?.map((p) => [p.slug, p.title]) || [])

  // Resolve all logo URLs upfront
  const resolvedLogos = new Map<string, string | null>()
  for (const section of footerConfig.sections) {
    for (const block of section.blocks) {
      if (block.type === "logo" && block.mediaId) {
        if (!resolvedLogos.has(block.mediaId)) {
          resolvedLogos.set(block.mediaId, await resolveMedia({ mediaId: block.mediaId }))
        }
      }
    }
  }
  if (footerConfig.bottomBar?.left?.type === "logo" && footerConfig.bottomBar.left.mediaId) {
    const mediaId = footerConfig.bottomBar.left.mediaId
    if (!resolvedLogos.has(mediaId)) {
      resolvedLogos.set(mediaId, await resolveMedia({ mediaId }))
    }
  }
  if (footerConfig.bottomBar?.right?.type === "logo" && footerConfig.bottomBar.right.mediaId) {
    const mediaId = footerConfig.bottomBar.right.mediaId
    if (!resolvedLogos.has(mediaId)) {
      resolvedLogos.set(mediaId, await resolveMedia({ mediaId }))
    }
  }

  // Resolve footer background media if exists
  let resolvedBgMedia: string | null = null
  if (footerConfig?.background?.mediaId) {
    resolvedBgMedia = await resolveMedia({ mediaId: footerConfig.background.mediaId })
  } else if (footerConfig?.background?.mediaUrl) {
    resolvedBgMedia = footerConfig.background.mediaUrl
  }

  return (
    <footer
      className="relative w-full border-t border-border overflow-hidden"
      aria-label="Footer"
    >
      {/* Outer Background Layer (resolveSectionBg-style) */}
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
        {footerConfig?.background?.mode === "image" && resolvedBgMedia && (
          <Image
            src={resolvedBgMedia}
            alt="Footer background"
            fill
            className="object-cover"
            priority={false}
          />
        )}
        {footerConfig?.background?.mode === "video" && resolvedBgMedia && (
          <video
            src={resolvedBgMedia}
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

      {/* Subtle background orbs (pointer-events-none) */}
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

      {/* Content Layer (relative z-index over background) */}
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
                footerConfig={footerConfig}
                theme={theme}
                pagesMap={pagesMap}
                resolvedLogos={resolvedLogos}
              />
            </GlassPanelWrapper>
          ) : (
            <FooterContent
              footerConfig={footerConfig}
              theme={theme}
              pagesMap={pagesMap}
              resolvedLogos={resolvedLogos}
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
  section,
  theme,
  pagesMap,
  resolvedLogos,
}: {
  section: FooterSection
  theme: ReturnType<typeof getFooterTheme>
  pagesMap: Map<string, string>
  resolvedLogos: Map<string, string | null>
}) {
  const spanClassMap = {
    2: "md:col-span-2",
    3: "md:col-span-3",
    4: "md:col-span-4",
    6: "md:col-span-6",
  } as const

  return (
    <div className={cn(spanClassMap[section.span], "h-full")}>
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
      <div className={cn("space-y-4 h-full", theme.section.align)}>
        {section.blocks.map((block) => (
          <FooterBlock
            key={block.id}
            block={block}
            theme={theme}
            pagesMap={pagesMap}
            resolvedLogos={resolvedLogos}
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
  block,
  theme,
  pagesMap,
  resolvedLogos,
}: {
  block: FooterBlock
  theme: ReturnType<typeof getFooterTheme>
  pagesMap: Map<string, string>
  resolvedLogos: Map<string, string | null>
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
      const publishedSlugs = block.pageSlugs.filter((slug) => pagesMap.has(slug))

      if (publishedSlugs.length === 0) {
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
            {publishedSlugs.map((slug) => (
              <li key={slug}>
                <Link
                  href={`/${slug}`}
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
        resolvedLogoUrl = resolvedLogos.get(block.mediaId) || null
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
          {block.text}
        </div>
      )

    default:
      return null
  }
}

/**
 * Glass Panel Wrapper - applies glassmorphism styles
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

  // Helper: convert hex to rgb
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "0, 0, 0"
  }

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
        backgroundColor: `rgba(255, 255, 255, ${config?.glassmorphism?.panelOpacity ?? preset.panelOpacity})`,
        backdropFilter: config?.glassmorphism?.blurPx 
          ? `blur(${config.glassmorphism.blurPx}px)`
          : `blur(${preset.blur === "backdrop-blur-sm" ? "4" : preset.blur === "backdrop-blur-md" ? "12" : "40"}px)`,
        boxShadow: "0 4px 24px -2px rgba(0, 0, 0, 0.08), 0 8px 16px -4px rgba(0, 0, 0, 0.04)",
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
      {children}
    </div>
  )
}

/**
 * Render legal links based on configuration and available pages
 */
function LegalLinksRenderer({
  legalLinks,
  theme,
  pagesMap,
}: {
  legalLinks: FooterConfig["legalLinks"]
  theme: ReturnType<typeof getFooterTheme>
  pagesMap: Map<string, string>
}) {
  if (!legalLinks?.enabled) {
    return null
  }

  // Build list of legal links to show
  const legalSlugs: Array<{ slug: string; label: string; subtype: string }> = []
  if (legalLinks.items?.imprint) {
    legalSlugs.push({ slug: "impressum", label: "Impressum", subtype: "imprint" })
  }
  if (legalLinks.items?.privacy) {
    legalSlugs.push({ slug: "datenschutz", label: "Datenschutz", subtype: "privacy" })
  }
  if (legalLinks.items?.cookies) {
    legalSlugs.push({ slug: "cookies", label: "Cookies", subtype: "cookies" })
  }

  // Filter to only published pages
  const publishedLegalLinks = legalSlugs.filter((item) => pagesMap.has(item.slug))

  if (publishedLegalLinks.length === 0) {
    return null
  }

  // Determine margin-top spacing
  const marginTopMap = {
    none: "mt-0",
    sm: "mt-4",
    md: "mt-6",
    lg: "mt-10",
  } as const

  // Determine alignment classes
  const alignMap = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  } as const

  // Determine layout classes
  const layoutMap = {
    inline: "flex flex-wrap gap-2",
    stacked: "flex flex-col gap-2",
    separated: "flex gap-4 divide-x",
    chips: "flex flex-wrap gap-3",
  } as const

  const fontSizeMap = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
  } as const

  const fontWeightMap = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
  } as const

  const containerClass = cn(
    "flex flex-col",
    marginTopMap[legalLinks.marginTop || "md"],
    legalLinks.placement === "bottom-bar" ? "pt-6 border-t" : ""
  )

  const linksContainerClass = cn(
    legalLinks.placement === "bottom-bar" 
      ? "flex flex-wrap gap-2" 
      : layoutMap[legalLinks.layout || "inline"],
    alignMap[legalLinks.align || "left"]
  )

  const linkClass = cn(
    "transition-colors outline-none rounded",
    fontSizeMap[legalLinks.fontSize || "sm"],
    fontWeightMap[legalLinks.fontWeight || "normal"],
    legalLinks.uppercase ? "uppercase" : ""
  )

  return (
    <div className={containerClass}>
      {legalLinks.placement !== "bottom-bar" && legalLinks.showTitle !== false && legalLinks.title && (
        <h3
          className={cn(
            "mb-3",
            theme.typography.heading.size,
            theme.typography.heading.weight,
            theme.typography.heading.font
          )}
          style={{ color: theme.colors.heading }}
        >
          {legalLinks.title}
        </h3>
      )}
      <ul className={linksContainerClass}>
        {publishedLegalLinks.map((item) => (
          <li
            key={item.slug}
            className={legalLinks.layout === "separated" ? "px-2 first:pl-0 last:pr-0" : ""}
          >
            <Link
              href={`/${item.slug}`}
              className={linkClass}
              style={{
                color: legalLinks.textColor || theme.colors.text,
              }}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SocialLinksRenderer({
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
              rel={socialLinks.openInNewTab ? "noopener noreferrer nofollow" : undefined}
              aria-label={item.label}
              className={cn(
                "group inline-flex items-center gap-2 rounded outline-none transition-all duration-200 ease-out",
                hoverLinkClass
              )}
              style={{ color: socialLinks.color || theme.colors.text }}
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
                <span className="text-sm" style={{ color: socialLinks.labelColor || socialLinks.color || theme.colors.text }}>
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
 * Footer Content - main grid and sections
 */
function FooterContent({
  footerConfig,
  theme,
  pagesMap,
  resolvedLogos,
}: {
  footerConfig: FooterConfig
  theme: ReturnType<typeof getFooterTheme>
  pagesMap: Map<string, string>
  resolvedLogos: Map<string, string | null>
}) {
  const socialLinksConfig = footerConfig.socialLinks
  const resolvedSocialItems = resolveSocialItems(socialLinksConfig)
  const showSocialTop = socialLinksConfig?.enabled && socialLinksConfig.placement === "top" && resolvedSocialItems.length > 0
  const showSocialSection = socialLinksConfig?.enabled && socialLinksConfig.placement === "section" && resolvedSocialItems.length > 0
  const showSocialBottom = socialLinksConfig?.enabled && socialLinksConfig.placement === "bottom" && resolvedSocialItems.length > 0
  const showSocialBottomBar =
    socialLinksConfig?.enabled &&
    (socialLinksConfig.placement === "bottomBar" ||
      socialLinksConfig.placement === "bottomBarLeft" ||
      socialLinksConfig.placement === "bottomBarCenter" ||
      socialLinksConfig.placement === "bottomBarRight") &&
    resolvedSocialItems.length > 0
  return (
    <>
      {showSocialTop && socialLinksConfig && (
        <div className="mb-6">
          <SocialLinksRenderer socialLinks={socialLinksConfig} resolvedItems={resolvedSocialItems} theme={theme} />
        </div>
      )}

      {/* Main Footer Sections */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-10 auto-rows-max">
        {footerConfig.sections.map((section) => (
          <FooterSection
            key={section.id}
            section={section}
            theme={theme}
            pagesMap={pagesMap}
            resolvedLogos={resolvedLogos}
          />
        ))}
      </div>

      {/* Legal Links (if placement is "section") */}
      {footerConfig.legalLinks?.enabled &&
        footerConfig.legalLinks?.placement !== "bottom-bar" && (
          <LegalLinksRenderer
            legalLinks={footerConfig.legalLinks}
            theme={theme}
            pagesMap={pagesMap}
          />
        )}

      {showSocialSection && socialLinksConfig && (
        <div className="pt-6">
          <SocialLinksRenderer socialLinks={socialLinksConfig} resolvedItems={resolvedSocialItems} theme={theme} />
        </div>
      )}

      {/* Bottom Bar */}
      {footerConfig.bottomBar?.enabled && (
        <div className={cn("mt-12 pt-8 border-t", theme.bottomBar.class)}>
          {showSocialBottomBar && socialLinksConfig ? (
            socialLinksConfig.align === "left" ? (
              <div className="flex w-full items-center gap-4">
                <SocialLinksRenderer socialLinks={socialLinksConfig} resolvedItems={resolvedSocialItems} theme={theme} />
                <div className="ml-auto flex items-center gap-4">
                  {footerConfig.bottomBar.left && (
                    <FooterBlock
                      block={footerConfig.bottomBar.left}
                      theme={theme}
                      pagesMap={pagesMap}
                      resolvedLogos={resolvedLogos}
                    />
                  )}
                  {footerConfig.bottomBar.right && (
                    <FooterBlock
                      block={footerConfig.bottomBar.right}
                      theme={theme}
                      pagesMap={pagesMap}
                      resolvedLogos={resolvedLogos}
                    />
                  )}
                </div>
              </div>
            ) : socialLinksConfig.align === "center" ? (
              <div className="flex w-full items-center justify-center gap-4">
                {footerConfig.bottomBar.left && (
                  <FooterBlock
                    block={footerConfig.bottomBar.left}
                    theme={theme}
                    pagesMap={pagesMap}
                    resolvedLogos={resolvedLogos}
                  />
                )}
                <SocialLinksRenderer socialLinks={socialLinksConfig} resolvedItems={resolvedSocialItems} theme={theme} />
                {footerConfig.bottomBar.right && (
                  <FooterBlock
                    block={footerConfig.bottomBar.right}
                    theme={theme}
                    pagesMap={pagesMap}
                    resolvedLogos={resolvedLogos}
                  />
                )}
              </div>
            ) : (
              <div className="flex w-full items-center gap-4">
                <div className="flex items-center gap-4">
                  {footerConfig.bottomBar.left && (
                    <FooterBlock
                      block={footerConfig.bottomBar.left}
                      theme={theme}
                      pagesMap={pagesMap}
                      resolvedLogos={resolvedLogos}
                    />
                  )}
                  {footerConfig.bottomBar.right && (
                    <FooterBlock
                      block={footerConfig.bottomBar.right}
                      theme={theme}
                      pagesMap={pagesMap}
                      resolvedLogos={resolvedLogos}
                    />
                  )}
                </div>
                <div className="ml-auto">
                  <SocialLinksRenderer socialLinks={socialLinksConfig} resolvedItems={resolvedSocialItems} theme={theme} />
                </div>
              </div>
            )
          ) : (
            <div className={cn("flex flex-wrap items-center gap-4", theme.bottomBar.align)}>
              {footerConfig.bottomBar.left && (
                <FooterBlock
                  block={footerConfig.bottomBar.left}
                  theme={theme}
                  pagesMap={pagesMap}
                  resolvedLogos={resolvedLogos}
                />
              )}
              {footerConfig.bottomBar.right && (
                <FooterBlock
                  block={footerConfig.bottomBar.right}
                  theme={theme}
                  pagesMap={pagesMap}
                  resolvedLogos={resolvedLogos}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Legal Links (if placement is "bottom-bar") - Separate container with independent alignment */}
      {footerConfig.legalLinks?.enabled &&
        footerConfig.legalLinks?.placement === "bottom-bar" && (
          <div className="mt-6 pt-6 border-t">
            <LegalLinksRenderer
              legalLinks={footerConfig.legalLinks}
              theme={theme}
              pagesMap={pagesMap}
            />
          </div>
        )}

      {showSocialBottom && socialLinksConfig && (
        <div className="pt-6">
          <SocialLinksRenderer socialLinks={socialLinksConfig} resolvedItems={resolvedSocialItems} theme={theme} />
        </div>
      )}
    </>
  )
}
