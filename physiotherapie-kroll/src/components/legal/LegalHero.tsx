import { cn } from "@/lib/utils"
import {
  CMS_BLOCK_GLOBAL_WIDTH_WRAP_CLASS,
  CMS_SECTION_CONTENT_OUTER_CLASS,
} from "@/lib/cms/cmsContentWidthClasses"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getLegalIcon } from "@/lib/legal/legal-icon-registry"
import { LegalPlainTextBody } from "@/components/legal/LegalPlainTextBody"

export type LegalHeroProps = {
  eyebrow?: string
  title: string
  subtitle?: string
  introText?: string
  showUpdatedAt?: boolean
  updatedAtLabel?: string
  updatedAtValue?: string
  alignment?: "left" | "center"
  variant?: "default" | "minimal"
  headlineColor?: string
  subtitleColor?: string
  eyebrowColor?: string
  legalIcon?: string
  legalIconBgColor?: string
  legalBackLinkColor?: string
  legalUpdatedAtColor?: string
  legalBackLinkFontSize?: "xs" | "sm" | "base" | "lg"
  legalBackLinkFontWeight?: "normal" | "medium" | "semibold" | "bold"
  legalUpdatedAtFontSize?: "xs" | "sm" | "base" | "lg"
  legalUpdatedAtFontWeight?: "normal" | "medium" | "semibold" | "bold"
  headlineFontWeight?: "normal" | "medium" | "semibold" | "bold"
  subtitleFontWeight?: "normal" | "medium" | "semibold" | "bold"
  showBackLink?: boolean
  /**
   * True when the hero is rendered above the legal article grid (`CMSRenderer` `edgeToEdgeShell`).
   * Adds a second `CMS_SECTION_CONTENT_OUTER_CLASS` layer so insets match grid `px-4` + SectionWrapper.
   */
  edgeToEdgeShell?: boolean
}

/**
 * Vertical spacing and background live on SectionWrapper (block `section` in CMS).
 * This component is content-only: no outer <section>, no py-* that competes with section paddingY.
 */
export function LegalHero({
  eyebrow,
  title,
  subtitle,
  introText,
  showUpdatedAt,
  updatedAtLabel = "Zuletzt aktualisiert",
  updatedAtValue,
  alignment = "left",
  variant = "default",
  headlineColor,
  subtitleColor,
  eyebrowColor,
  legalIcon = "Scale",
  legalIconBgColor = "#e5e7eb",
  legalBackLinkColor = "#2563eb",
  legalUpdatedAtColor = "#6b7280",
  legalBackLinkFontSize = "sm",
  legalBackLinkFontWeight = "medium",
  legalUpdatedAtFontSize = "sm",
  legalUpdatedAtFontWeight = "normal",
  headlineFontWeight = "semibold",
  subtitleFontWeight = "normal",
  showBackLink = true,
  edgeToEdgeShell = false,
}: LegalHeroProps) {
  const align = alignment === "center" ? "text-center" : "text-left"
  const alignFlex = alignment === "center" ? "justify-center" : "justify-start"
  const IconComponent = getLegalIcon(legalIcon)

  // Typography Mapping für Tailwind
  const fontSizeMap: Record<"xs" | "sm" | "base" | "lg", string> = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
  }
  const fontWeightMap: Record<"normal" | "medium" | "semibold" | "bold", string> = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  }

  const heroBody = (
    <>
      {showBackLink && (
        <Link
          href="/"
          className={cn(
            "inline-flex items-center gap-2 font-medium hover:opacity-80 transition-colors mb-6",
            "hover:gap-3 duration-200",
            alignment === "center" && "justify-center",
            fontSizeMap[legalBackLinkFontSize],
            fontWeightMap[legalBackLinkFontWeight]
          )}
          style={legalBackLinkColor ? { color: legalBackLinkColor } : undefined}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Zurück zur Startseite</span>
        </Link>
      )}

      {legalIcon && (
        <div className={cn("mb-6", alignFlex === "justify-center" && "flex justify-center")}>
          <div
            className="inline-flex items-center justify-center p-3 rounded-lg"
            style={{ backgroundColor: legalIconBgColor }}
          >
            <IconComponent className="h-6 w-6 text-foreground" />
          </div>
        </div>
      )}

      {eyebrow != null && (
        <p
          data-cms-field="eyebrow"
          className={cn("mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground", align)}
          style={eyebrowColor ? { color: eyebrowColor } : undefined}
        >
          {eyebrow}
        </p>
      )}
      <h1
        data-cms-field="title"
        className={cn("text-3xl tracking-tight text-foreground md:text-4xl lg:text-5xl", align, fontWeightMap[headlineFontWeight])}
        style={headlineColor ? { color: headlineColor } : undefined}
      >
        {title}
      </h1>
      {subtitle !== undefined && (
        <p
          data-cms-field="subtitle"
          className={cn("mt-3 text-lg text-muted-foreground md:text-xl", align, fontWeightMap[subtitleFontWeight])}
          style={subtitleColor ? { color: subtitleColor } : undefined}
        >
          {subtitle}
        </p>
      )}
      {introText !== undefined && (
        <LegalPlainTextBody
          text={introText}
          dataCmsField="introText"
          className={cn("mt-6 max-w-2xl text-base text-muted-foreground", align)}
          classNameParagraph="leading-relaxed"
        />
      )}
      {showUpdatedAt && updatedAtValue && (
        <p
          className={cn("mt-6", align, fontSizeMap[legalUpdatedAtFontSize], fontWeightMap[legalUpdatedAtFontWeight])}
          style={legalUpdatedAtColor ? { color: legalUpdatedAtColor } : undefined}
        >
          {updatedAtLabel}:{" "}
          <time dateTime={updatedAtValue}>
            {new Date(updatedAtValue).toLocaleDateString("de-DE", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </p>
      )}
    </>
  )

  const widthWrappedBody = (
    <div className={cn("relative w-full", CMS_BLOCK_GLOBAL_WIDTH_WRAP_CLASS, align)}>{heroBody}</div>
  )

  return (
    <div
      className={cn(
        "relative w-full",
        variant === "minimal" && "border-b border-border"
      )}
    >
      {/* Horizontal shells: with edgeToEdgeShell, mirror legal page grid px-4 + SectionWrapper + block wrap */}
      <div className={CMS_SECTION_CONTENT_OUTER_CLASS}>
        {edgeToEdgeShell ? (
          <div className={cn("relative z-10", CMS_SECTION_CONTENT_OUTER_CLASS)}>{widthWrappedBody}</div>
        ) : (
          widthWrappedBody
        )}
      </div>
    </div>
  )
}
