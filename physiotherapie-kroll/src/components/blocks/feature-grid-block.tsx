"use client"

import { useCallback } from "react"
import { motion, type Variants } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardSurface } from "@/components/ui/card"
import { useElementShadowStyle } from "@/lib/shadow"
import { useMotionPreference, getAnimationInitial, getViewportTrigger } from "@/lib/motion/useMotionPreference"
import type { FeatureGridStyle, FeatureGridAnimation } from "@/types/cms"
import { sanitizeCmsHtml } from "@/lib/security/sanitizeCmsHtml"

interface Feature {
  id: string
  title: string
  description: string
  icon?: string
  titleColor?: string
  descriptionColor?: string
  iconColor?: string
  cardBgColor?: string
  cardBorderColor?: string
  style?: FeatureGridStyle
  animation?: FeatureGridAnimation
}

interface FeatureGridBlockProps {
  section?: unknown
  typography?: unknown
  features: Feature[]
  columns?: 2 | 3 | 4
  titleColor?: string
  descriptionColor?: string
  iconColor?: string
  cardBgColor?: string
  cardBorderColor?: string
  designPreset?: string
  style?: FeatureGridStyle
  animation?: FeatureGridAnimation
  editable?: boolean
  blockId?: string
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  elements?: Record<string, any>
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
}

const columnsMap = {
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
}

// ============================================================================
// Animation Variants (from CardBlock)
// ============================================================================

const entranceVariants: Record<string, Variants> = {
  none: {
    hidden: {},
    visible: {},
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  "slide-up": {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  },
  "slide-left": {
    hidden: { opacity: 0, x: 12 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { opacity: 1, scale: 1 },
  },
}

// ============================================================================
// Style Mappings (from CardBlock)
// ============================================================================

const variantClasses: Record<string, string> = {
  default: "bg-card",
  soft: "bg-muted/50",
  outline: "bg-transparent",
  elevated: "bg-card shadow-lg",
}

const radiusClasses: Record<string, string> = {
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
}

const borderClasses: Record<string, string> = {
  none: "border-0",
  subtle: "border border-border/50",
  strong: "border-2 border-border",
}

const shadowClasses: Record<string, string> = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
}

const accentClasses: Record<string, string> = {
  none: "",
  brand: "border-l-4 border-l-primary",
  muted: "border-l-4 border-l-muted-foreground/30",
}

// ============================================================================
// Design Presets
// ============================================================================

const designPresets: Record<string, { style: FeatureGridStyle; animation: FeatureGridAnimation }> = {
  standard: {
    style: {
      variant: "default",
      radius: "xl",
      border: "subtle",
      shadow: "sm",
      accent: "none",
    },
    animation: {
      entrance: "fade",
      hover: "none",
      durationMs: 400,
      delayMs: 0,
    },
  },
  softGlow: {
    style: {
      variant: "soft",
      radius: "lg",
      border: "none",
      shadow: "md",
      accent: "none",
    },
    animation: {
      entrance: "fade",
      hover: "glow",
      durationMs: 400,
      delayMs: 0,
    },
  },
  outlineStrong: {
    style: {
      variant: "outline",
      radius: "lg",
      border: "strong",
      shadow: "none",
      accent: "none",
    },
    animation: {
      entrance: "slide-up",
      hover: "lift",
      durationMs: 500,
      delayMs: 0,
    },
  },
  elevatedBrand: {
    style: {
      variant: "elevated",
      radius: "xl",
      border: "subtle",
      shadow: "lg",
      accent: "brand",
    },
    animation: {
      entrance: "scale",
      hover: "lift",
      durationMs: 400,
      delayMs: 0,
    },
  },
  mutedAccentMinimal: {
    style: {
      variant: "soft",
      radius: "md",
      border: "none",
      shadow: "sm",
      accent: "muted",
    },
    animation: {
      entrance: "slide-left",
      hover: "none",
      durationMs: 300,
      delayMs: 0,
    },
  },
}

// ============================================================================
// Helper: Check reduced motion preference
// ============================================================================

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function FeatureCardWithShadow({
  feature,
  index,
  elements,
  effectiveBlockStyle,
  effectiveBlockAnimation,
  prefersNoMotion,
  shouldDisableViewAnimations,
  cardBgColor,
  cardBorderColor,
  iconColor,
  titleColor,
  descriptionColor,
  editable,
  blockId,
  onEditField,
  onElementClick,
  handleInlineEdit,
}: {
  feature: Feature
  index: number
  elements?: Record<string, unknown>
  effectiveBlockStyle: FeatureGridStyle
  effectiveBlockAnimation: FeatureGridAnimation
  prefersNoMotion: boolean
  shouldDisableViewAnimations: boolean
  cardBgColor?: string
  cardBorderColor?: string
  iconColor?: string
  titleColor?: string
  descriptionColor?: string
  editable?: boolean
  blockId?: string
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  onElementClick?: (blockId: string, elementId: string) => void
  handleInlineEdit: (e: React.MouseEvent, fieldPath: string, elementId?: string) => void
}) {
  const cardShadow = useElementShadowStyle({
    elementId: `card-${feature.id}`,
    elementConfig: (elements ?? {})[`card-${feature.id}`] as import("@/types/cms").ElementConfig | undefined,
  })
  const featureStyle: FeatureGridStyle = feature.style || effectiveBlockStyle
  const featureAnimation: FeatureGridAnimation = feature.animation || effectiveBlockAnimation
  const variantClass = variantClasses[featureStyle.variant || "default"] || variantClasses.default
  const radiusClass = radiusClasses[featureStyle.radius || "xl"] || radiusClasses.xl
  const borderClass = borderClasses[featureStyle.border || "subtle"] || borderClasses.subtle
  const shadowClass = shadowClasses[featureStyle.shadow || "sm"] || shadowClasses.sm
  const accentClass = accentClasses[featureStyle.accent || "none"] || accentClasses.none
  const cardClassName = cn(
    "h-full",
    variantClass,
    radiusClass,
    borderClass,
    shadowClass,
    accentClass,
    featureStyle.variant === "soft" && "transition-all hover:shadow-md",
    featureStyle.variant === "elevated" && "transition-all hover:shadow-xl",
    (featureStyle.variant === "default" || featureStyle.variant === "outline") && "transition-all hover:shadow-md",
  )
  const entrance = featureAnimation.entrance || "fade"
  const shouldAnimate = !prefersNoMotion && entrance !== "none"

  const effectiveShouldDisable = shouldDisableViewAnimations || prefersNoMotion

  return (
    <motion.div
      variants={shouldAnimate && !effectiveShouldDisable ? entranceVariants[entrance] : entranceVariants.none}
      initial={getAnimationInitial(effectiveShouldDisable)}
      {...(effectiveShouldDisable ? {} : {
        whileInView: "visible",
        viewport: { once: true, margin: "0px 0px -50px 0px" },
      })}
      transition={{
        duration: (featureAnimation.durationMs || 400) / 1000,
        delay: (featureAnimation.delayMs || 0) / 1000,
      }}
    >
      <CardSurface
        className={cardClassName}
        data-repeater-field="features"
        data-repeater-item-id={feature.id}
        data-element-id={`card-${feature.id}`}
        style={{
          ...(cardShadow as React.CSSProperties),
          backgroundColor: feature.cardBgColor || cardBgColor || undefined,
          borderColor: feature.cardBorderColor || cardBorderColor || undefined,
        }}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("[data-element-id]") === e.currentTarget && onElementClick) {
            onElementClick(blockId || "", `card-${feature.id}`)
          }
        }}
      >
        <CardHeader>
          {feature.icon && (
            <div
              className="mb-4 text-4xl"
              style={{ color: feature.iconColor || iconColor || undefined }}
              dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(feature.icon, "inlineIcon") }}
            />
          )}
          <CardTitle
            onClick={(e) => handleInlineEdit(e, `features.${index}.title`)}
            className={cn(
              editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
            )}
            style={{ color: feature.titleColor || titleColor || undefined }}
          >
            {feature.title || "Titel eingeben..."}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription
            onClick={(e) => handleInlineEdit(e, `features.${index}.description`)}
            className={cn(
              "text-base",
              editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
            )}
            style={{ color: feature.descriptionColor || descriptionColor || undefined }}
          >
            {feature.description || "Beschreibung eingeben..."}
          </CardDescription>
        </CardContent>
      </CardSurface>
    </motion.div>
  )
}

export function FeatureGridBlock({
  features,
  columns = 3,
  titleColor,
  descriptionColor,
  iconColor,
  cardBgColor,
  cardBorderColor,
  designPreset,
  style: blockStyle,
  animation: blockAnimation,
  editable = false,
  blockId,
  onEditField,
  elements,
  onElementClick,
  selectedElementId,
}: FeatureGridBlockProps) {
  const handleInlineEdit = useCallback(
    (e: React.MouseEvent, fieldPath: string, elementId?: string) => {
      if (!editable || !blockId || !onEditField) return
      if (elementId && onElementClick) {
        onElementClick(blockId, elementId)
      }
      e.preventDefault()
      e.stopPropagation()
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      onEditField(blockId, fieldPath, rect)
    },
    [editable, blockId, onEditField, onElementClick],
  )

  // Resolve effective style and animation from preset or block-level
  const effectivePreset = (designPreset && designPresets[designPreset]) || designPresets.standard
  const effectiveBlockStyle: FeatureGridStyle = blockStyle || effectivePreset.style
  const effectiveBlockAnimation: FeatureGridAnimation = blockAnimation || effectivePreset.animation

  const prefersNoMotion = prefersReducedMotion()
  const { shouldDisableViewAnimations } = useMotionPreference()

  return (
    <section>
      <div className={cn("grid gap-6", columnsMap[columns])}>
        {features.map((feature, index) => (
          <FeatureCardWithShadow
            key={feature.id}
            feature={feature}
            index={index}
            elements={elements}
            effectiveBlockStyle={effectiveBlockStyle}
            effectiveBlockAnimation={effectiveBlockAnimation}
            shouldDisableViewAnimations={shouldDisableViewAnimations}
            prefersNoMotion={prefersNoMotion}
            cardBgColor={cardBgColor}
            cardBorderColor={cardBorderColor}
            iconColor={iconColor}
            titleColor={titleColor}
            descriptionColor={descriptionColor}
            editable={editable}
            blockId={blockId}
            onEditField={onEditField}
            onElementClick={onElementClick}
            handleInlineEdit={handleInlineEdit}
          />
        ))}
      </div>
    </section>
  )
}
