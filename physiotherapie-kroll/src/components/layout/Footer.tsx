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

interface FooterProps {
  brand: BrandKey
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
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent"
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

  // Determine gap spacing
  const gapMap = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  } as const

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
  return (
    <>
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

      {/* Bottom Bar */}
      {footerConfig.bottomBar?.enabled && (
        <div className={cn("mt-12 pt-8 border-t", theme.bottomBar.class)}>
          <div className={cn("flex flex-col sm:flex-row items-center gap-4 justify-between", theme.bottomBar.align)}>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {footerConfig.bottomBar.left && (
                <div>
                  <FooterBlock
                    block={footerConfig.bottomBar.left}
                    theme={theme}
                    pagesMap={pagesMap}
                    resolvedLogos={resolvedLogos}
                  />
                </div>
              )}
            </div>
            {footerConfig.bottomBar.right && (
              <div>
                <FooterBlock
                  block={footerConfig.bottomBar.right}
                  theme={theme}
                  pagesMap={pagesMap}
                  resolvedLogos={resolvedLogos}
                />
              </div>
            )}
          </div>
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
    </>
  )
}
