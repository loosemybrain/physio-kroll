"use client"

import * as React from "react"
import Link from "next/link"
import { motion, type Variants } from "framer-motion"
import { ArrowRight, ExternalLink, Download, Badge as BadgeIcon, MoreVertical } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

// CardAction component for inline header actions
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// ============================================================================
// Types
// ============================================================================

export type CardButton = {
  id: string
  label: string
  href?: string
  onClickAction?: "none" | "open-modal" | "scroll-to"
  targetId?: string
  variant?: "default" | "secondary" | "outline" | "ghost" | "link"
  size?: "sm" | "default" | "lg"
  icon?: "none" | "arrow-right" | "external" | "download"
  iconPosition?: "left" | "right"
  disabled?: boolean
}

export type CardAnimation = {
  entrance?: "none" | "fade" | "slide-up" | "slide-left" | "scale"
  hover?: "none" | "lift" | "glow" | "tilt"
  durationMs?: number
  delayMs?: number
}

export type CardBlockStyle = {
  variant?: "default" | "soft" | "outline" | "elevated"
  radius?: "md" | "lg" | "xl"
  border?: "none" | "subtle" | "strong"
  shadow?: "none" | "sm" | "md" | "lg"
  accent?: "none" | "brand" | "muted"
}

export type CardBlockProps = {
  eyebrow?: string
  title: string
  description?: string
  content?: string
  children?: React.ReactNode
  align?: "left" | "center" | "right"
  headerLayout?: "stacked" | "inline-action"
  actionSlot?: "none" | "badge" | "icon-button"
  actionLabel?: string
  footerAlign?: "left" | "center" | "right"
  buttons?: CardButton[]
  style?: CardBlockStyle
  animation?: CardAnimation
  className?: string
}

// ============================================================================
// Helpers
// ============================================================================

function resolveJustify(align: "left" | "center" | "right" | undefined): string {
  switch (align) {
    case "center":
      return "justify-center"
    case "right":
      return "justify-end"
    default:
      return "justify-start"
  }
}

function resolveTextAlign(align: "left" | "center" | "right" | undefined): string {
  switch (align) {
    case "center":
      return "text-center"
    case "right":
      return "text-right"
    default:
      return "text-left"
  }
}

function getIcon(icon: CardButton["icon"], position: "left" | "right") {
  if (!icon || icon === "none") return null

  const iconMap = {
    "arrow-right": ArrowRight,
    external: ExternalLink,
    download: Download,
  }

  const IconComponent = iconMap[icon]
  if (!IconComponent) return null

  return <IconComponent className="size-4" aria-hidden="true" />
}

function handleButtonAction(action: CardButton["onClickAction"], targetId?: string) {
  if (action === "scroll-to" && targetId) {
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }
  // "open-modal" would be handled by parent via event bubbling or context
  // "none" does nothing
}

// ============================================================================
// Animation Variants
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
// Style Mappings
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
// Sub-components
// ============================================================================

function CardButtonRenderer({ button }: { button: CardButton }) {
  const iconLeft = button.iconPosition !== "right" ? getIcon(button.icon, "left") : null
  const iconRight = button.iconPosition === "right" ? getIcon(button.icon, "right") : null

  const buttonContent = (
    <>
      {iconLeft}
      {button.label}
      {iconRight}
    </>
  )

  const buttonElement = (
    <Button
      variant={button.variant ?? "default"}
      size={button.size ?? "default"}
      disabled={button.disabled}
      onClick={
        !button.href && button.onClickAction !== "none"
          ? () => handleButtonAction(button.onClickAction, button.targetId)
          : undefined
      }
      asChild={!!button.href}
    >
      {button.href ? <Link href={button.href}>{buttonContent}</Link> : buttonContent}
    </Button>
  )

  return buttonElement
}

function ActionSlotRenderer({
  actionSlot,
  actionLabel,
}: {
  actionSlot: CardBlockProps["actionSlot"]
  actionLabel?: string
}) {
  if (!actionSlot || actionSlot === "none") return null

  if (actionSlot === "badge") {
    return (
      <Badge variant="secondary" className="text-xs">
        {actionLabel ?? "New"}
      </Badge>
    )
  }

  if (actionSlot === "icon-button") {
    return (
      <Button variant="ghost" size="icon-sm" aria-label={actionLabel ?? "More options"}>
        <MoreVertical className="size-4" />
      </Button>
    )
  }

  return null
}

// ============================================================================
// Main Component
// ============================================================================

export function CardBlock({
  eyebrow,
  title,
  description,
  content,
  children,
  align = "left",
  headerLayout = "stacked",
  actionSlot = "none",
  actionLabel,
  footerAlign = "left",
  buttons = [],
  style = {},
  animation = {},
  className,
}: CardBlockProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [])

  // Style resolution
  const {
    variant = "default",
    radius = "xl",
    border = "subtle",
    shadow = "sm",
    accent = "none",
  } = style

  const {
    entrance = "fade",
    hover = "none",
    durationMs = 400,
    delayMs = 0,
  } = animation

  // Determine if animations should be disabled
  const disableAnimations = prefersReducedMotion || entrance === "none"

  // Card classes
  const cardClasses = cn(
    variantClasses[variant],
    radiusClasses[radius],
    borderClasses[border],
    shadowClasses[shadow],
    accentClasses[accent],
    // Hover effects (CSS-based for better performance)
    !prefersReducedMotion && hover === "lift" && "transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
    !prefersReducedMotion && hover === "glow" && "transition-all duration-200 hover:ring-2 hover:ring-primary/20 hover:shadow-primary/5",
    !prefersReducedMotion && hover === "tilt" && "transition-transform duration-200 hover:[transform:perspective(1000px)_rotateX(2deg)_rotateY(-2deg)]",
    className
  )

  // Animation props
  const motionProps = disableAnimations
    ? {}
    : {
        initial: "hidden",
        animate: "visible",
        variants: entranceVariants[entrance] ?? entranceVariants.none,
        transition: {
          duration: durationMs / 1000,
          delay: delayMs / 1000,
          ease: [0.25, 0.1, 0.25, 1],
        },
      }

  const hasFooter = buttons.length > 0
  const hasContent = !!content || !!children
  const showInlineAction = headerLayout === "inline-action" && actionSlot !== "none"

  return (
    <motion.div {...motionProps}>
      <Card className={cardClasses}>
        {/* Header */}
        <CardHeader className={cn(resolveTextAlign(align))}>
          {/* Eyebrow */}
          {eyebrow && (
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {eyebrow}
            </p>
          )}

          {/* Title */}
          <CardTitle className="text-lg font-semibold text-card-foreground">
            {title}
          </CardTitle>

          {/* Description */}
          {description && (
            <CardDescription className="text-sm text-muted-foreground">
              {description}
            </CardDescription>
          )}

          {/* Inline Action Slot */}
          {showInlineAction && (
            <CardAction>
              <ActionSlotRenderer actionSlot={actionSlot} actionLabel={actionLabel} />
            </CardAction>
          )}
        </CardHeader>

        {/* Content */}
        {hasContent && (
          <CardContent className={cn(resolveTextAlign(align))}>
            {content && (
              <p className="text-sm leading-relaxed text-card-foreground/90">{content}</p>
            )}
            {children}
          </CardContent>
        )}

        {/* Footer with Buttons */}
        {hasFooter && (
          <CardFooter
            className={cn("flex flex-wrap gap-2", resolveJustify(footerAlign))}
          >
            {buttons.map((button) => (
              <CardButtonRenderer key={button.id} button={button} />
            ))}
          </CardFooter>
        )}
      </Card>
    </motion.div>
  )
}

// ============================================================================
// Example Usage (for reference)
// ============================================================================

export function CardBlockExample() {
  return (
    <div className="grid gap-6 p-8 md:grid-cols-2 lg:grid-cols-3">
      {/* Example 1: Default with animation */}
      <CardBlock
        eyebrow="Featured"
        title="Professional Physiotherapy"
        description="Expert care for your recovery journey"
        content="Our certified physiotherapists provide personalized treatment plans tailored to your specific needs and goals."
        buttons={[
          {
            id: "book",
            label: "Book Appointment",
            href: "/book",
            variant: "default",
            icon: "arrow-right",
            iconPosition: "right",
          },
          {
            id: "learn",
            label: "Learn More",
            variant: "outline",
          },
        ]}
        animation={{
          entrance: "slide-up",
          hover: "lift",
          durationMs: 500,
          delayMs: 0,
        }}
        style={{
          variant: "default",
          radius: "xl",
          border: "subtle",
          shadow: "md",
          accent: "brand",
        }}
      />

      {/* Example 2: Centered with badge action */}
      <CardBlock
        eyebrow="New"
        title="Sports Rehabilitation"
        description="Get back to peak performance"
        content="Specialized programs designed for athletes at all levels."
        align="center"
        headerLayout="inline-action"
        actionSlot="badge"
        actionLabel="Popular"
        footerAlign="center"
        buttons={[
          {
            id: "start",
            label: "Get Started",
            variant: "default",
          },
        ]}
        animation={{
          entrance: "fade",
          hover: "glow",
          durationMs: 400,
          delayMs: 100,
        }}
        style={{
          variant: "elevated",
          radius: "lg",
          border: "none",
          shadow: "lg",
        }}
      />

      {/* Example 3: Minimal outline style */}
      <CardBlock
        title="Manual Therapy"
        description="Hands-on treatment techniques"
        buttons={[
          {
            id: "details",
            label: "View Details",
            variant: "ghost",
            icon: "arrow-right",
            iconPosition: "right",
          },
          {
            id: "download",
            label: "Download Brochure",
            variant: "link",
            icon: "download",
            iconPosition: "left",
          },
        ]}
        animation={{
          entrance: "scale",
          hover: "none",
          durationMs: 300,
          delayMs: 200,
        }}
        style={{
          variant: "outline",
          radius: "md",
          border: "strong",
          shadow: "none",
          accent: "muted",
        }}
      />
    </div>
  )
}
