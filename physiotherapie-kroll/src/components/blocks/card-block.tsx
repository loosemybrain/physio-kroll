"use client"

import * as React from "react"
import Link from "next/link"
import { motion, type Variants } from "framer-motion"
import { ArrowRight, ExternalLink, Download, MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useElementShadowStyle } from "@/lib/shadow"

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
  
  // CMS/Inline Edit Props
  editable?: boolean
  blockId?: string
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  
  // Shadow/Element Props
  elements?: Record<string, any>
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
}

// ============================================================================
// CardAction component for inline header actions
// ============================================================================

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

function CardButtonRenderer({
  button,
  editable,
  blockId,
  onEditField,
  buttonShadow,
  onElementClick,
}: {
  button: CardButton
  editable?: boolean
  blockId?: string
  onEditField?: CardBlockProps["onEditField"]
  buttonShadow?: React.CSSProperties
  onElementClick?: CardBlockProps["onElementClick"]
}) {
  const iconLeft = button.iconPosition !== "right" ? getIcon(button.icon, "left") : null
  const iconRight = button.iconPosition === "right" ? getIcon(button.icon, "right") : null

  const buttonContent = (
    <>
      {iconLeft}
      {button.label}
      {iconRight}
    </>
  )

  const canInlineEdit = Boolean(editable && blockId && onEditField)

  const handleEditClick = (e: React.MouseEvent) => {
    if (!canInlineEdit) return
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onEditField?.(blockId, `buttons.${button.id}.label`, rect)
  }

  const buttonElement = (
    <div
      data-element-id={`card.button.${button.id}`}
      style={buttonShadow}
      onClick={() => onEditField && blockId && onElementClick?.(blockId, `card.button.${button.id}`)}
    >
      <Button
        variant={button.variant ?? "default"}
        size={button.size ?? "default"}
        disabled={button.disabled}
        onClick={
          canInlineEdit
            ? handleEditClick
            : !button.href && button.onClickAction !== "none"
              ? () => handleButtonAction(button.onClickAction, button.targetId)
              : undefined
        }
        asChild={!!button.href && !editable}
      >
        {button.href && !editable ? (
          <Link href={button.href}>{buttonContent}</Link>
        ) : (
          buttonContent
        )}
      </Button>
    </div>
  )

  return buttonElement
}

function ActionSlotRenderer({
  actionSlot,
  actionLabel,
  editable,
  blockId,
  onEditField,
  actionShadow,
}: {
  actionSlot: CardBlockProps["actionSlot"]
  actionLabel?: string
  editable?: boolean
  blockId?: string
  onEditField?: CardBlockProps["onEditField"]
  actionShadow?: React.CSSProperties
}) {
  if (!actionSlot || actionSlot === "none") return null

  const canInlineEdit = Boolean(editable && blockId && onEditField)

  const handleEditClick = (e: React.MouseEvent) => {
    if (!canInlineEdit) return
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onEditField?.(blockId, "actionLabel", rect)
  }

  if (actionSlot === "badge") {
    return (
      <div
        data-element-id="card.action"
        style={actionShadow}
        onClick={handleEditClick}
      >
        <Badge variant="secondary" className="text-xs">
          {actionLabel ?? "New"}
        </Badge>
      </div>
    )
  }

  if (actionSlot === "icon-button") {
    return (
      <div
        data-element-id="card.action"
        style={actionShadow}
      >
        <Button variant="ghost" size="sm" aria-label={actionLabel ?? "More options"}>
          <MoreVertical className="size-4" />
        </Button>
      </div>
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
  editable = false,
  blockId,
  onEditField,
  elements,
  onElementClick,
  selectedElementId,
}: CardBlockProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [])

  // Element shadows
  const cardShadow = useElementShadowStyle({
    elementId: "card.surface",
    elementConfig: (elements ?? {})["card.surface"],
  })
  const eyebrowShadow = useElementShadowStyle({
    elementId: "card.eyebrow",
    elementConfig: (elements ?? {})["card.eyebrow"],
  })
  const titleShadow = useElementShadowStyle({
    elementId: "card.title",
    elementConfig: (elements ?? {})["card.title"],
  })
  const descriptionShadow = useElementShadowStyle({
    elementId: "card.description",
    elementConfig: (elements ?? {})["card.description"],
  })
  const contentShadow = useElementShadowStyle({
    elementId: "card.content",
    elementConfig: (elements ?? {})["card.content"],
  })
  const actionShadow = useElementShadowStyle({
    elementId: "card.action",
    elementConfig: (elements ?? {})["card.action"],
  })

  const canInlineEdit = Boolean(editable && blockId && onEditField)

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
    !prefersReducedMotion &&
      hover === "lift" &&
      "transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
    !prefersReducedMotion &&
      hover === "glow" &&
      "transition-all duration-200 hover:ring-2 hover:ring-primary/20 hover:shadow-primary/5",
    !prefersReducedMotion &&
      hover === "tilt" &&
      "transition-transform duration-200 hover:[transform:perspective(1000px)_rotateX(2deg)_rotateY(-2deg)]",
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
          ease: [0.25, 0.1, 0.25, 1] as const,
        },
      }

  const hasFooter = buttons.length > 0
  const hasContent = !!content || !!children
  const showInlineAction = headerLayout === "inline-action" && actionSlot !== "none"

  const handleInlineEdit = (e: React.MouseEvent, fieldPath: string) => {
    if (!canInlineEdit) return
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onEditField?.(blockId, fieldPath, rect)
  }

  return (
    <motion.div {...motionProps}>
      <Card
        className={cardClasses}
        data-element-id="card.surface"
        style={cardShadow}
        onClick={() => onElementClick?.(blockId || "", "card.surface")}
      >
        {/* Header */}
        <CardHeader className={cn(resolveTextAlign(align))}>
          {/* Eyebrow */}
          {eyebrow && (
            <p
              data-element-id="card.eyebrow"
              style={eyebrowShadow}
              onClick={canInlineEdit ? (e) => handleInlineEdit(e, "eyebrow") : undefined}
              className={cn(
                "text-xs font-medium uppercase tracking-wider text-muted-foreground",
                canInlineEdit && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
              )}
            >
              {eyebrow}
            </p>
          )}

          {/* Title */}
          <CardTitle
            data-element-id="card.title"
            style={titleShadow}
            onClick={canInlineEdit ? (e) => handleInlineEdit(e, "title") : undefined}
            className={cn(
              "text-lg font-semibold text-card-foreground",
              canInlineEdit && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
            )}
          >
            {title}
          </CardTitle>

          {/* Description */}
          {description && (
            <CardDescription
              data-element-id="card.description"
              style={descriptionShadow}
              onClick={canInlineEdit ? (e) => handleInlineEdit(e, "description") : undefined}
              className={cn(
                "text-sm text-muted-foreground",
                canInlineEdit && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
              )}
            >
              {description}
            </CardDescription>
          )}

          {/* Inline Action Slot */}
          {showInlineAction && (
            <CardAction>
              <ActionSlotRenderer
                actionSlot={actionSlot}
                actionLabel={actionLabel}
                editable={editable}
                blockId={blockId}
                onEditField={onEditField}
                actionShadow={actionShadow}
              />
            </CardAction>
          )}
        </CardHeader>

        {/* Content */}
        {hasContent && (
          <CardContent className={cn(resolveTextAlign(align))}>
            {content && (
              <p
                data-element-id="card.content"
                style={contentShadow}
                onClick={canInlineEdit ? (e) => handleInlineEdit(e, "content") : undefined}
                className={cn(
                  "text-sm leading-relaxed text-card-foreground/90",
                  canInlineEdit && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                )}
              >
                {content}
              </p>
            )}
            {children}
          </CardContent>
        )}

        {/* Footer with Buttons */}
        {hasFooter && (
          <CardFooter className={cn("flex flex-wrap gap-2", resolveJustify(footerAlign))}>
            {buttons.map((button) => {
              const buttonShadow = useElementShadowStyle({
                elementId: `card.button.${button.id}`,
                elementConfig: (elements ?? {})[`card.button.${button.id}`],
              })
              return (
                <CardButtonRenderer
                  key={button.id}
                  button={button}
                  editable={editable}
                  blockId={blockId}
                  onEditField={onEditField}
                  buttonShadow={buttonShadow}
                  onElementClick={onElementClick}
                />
              )
            })}
          </CardFooter>
        )}
      </Card>
    </motion.div>
  )
}
