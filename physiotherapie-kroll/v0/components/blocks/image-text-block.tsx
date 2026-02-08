"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { MediaValue } from "@/types/cms"

// ============================================================================
// Types
// ============================================================================

export interface ImageTextBlockProps {
  /** Unique block identifier for CMS editing */
  blockId?: string
  /** Enable inline-editing UI */
  editable?: boolean
  /** Callback when a field is edited inline */
  onEditField?: (blockId: string, field: string, value: string) => void

  /** Image position relative to text */
  layout?: "image-left" | "image-right"
  /** Visual variant */
  variant?: "default" | "soft"
  /** Vertical alignment of text relative to image */
  verticalAlign?: "top" | "center"
  /** Text alignment within the content column */
  textAlign?: "left" | "center"
  /** Max-width constraint for the block */
  maxWidth?: "md" | "lg" | "xl"

  /** Image data */
  image: MediaValue
  /** Small label above headline */
  eyebrow?: string
  /** Main headline */
  headline: string
  /** Body content (supports line breaks) */
  content: string
  /** Optional call-to-action */
  cta?: {
    label: string
    href: string
  }

  /** Optional color overrides (CMS inspector) */
  headlineColor?: string
  textColor?: string
  backgroundColor?: string

  className?: string
}

// ============================================================================
// Editable Wrapper
// ============================================================================

function Editable({
  enabled,
  blockId,
  field,
  onEdit,
  as: Tag = "span",
  className,
  children,
}: {
  enabled?: boolean
  blockId?: string
  field: string
  onEdit?: (blockId: string, field: string, value: string) => void
  as?: "span" | "p" | "h2" | "div"
  className?: string
  children: React.ReactNode
}) {
  if (!enabled || !blockId) {
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <Tag
      className={cn(
        className,
        "rounded-sm outline-none ring-primary/40 transition-shadow focus:ring-2",
        "hover:ring-1 hover:ring-primary/20"
      )}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const newValue = e.currentTarget.textContent ?? ""
        onEdit?.(blockId, field, newValue)
      }}
    >
      {children}
    </Tag>
  )
}

// ============================================================================
// Constants
// ============================================================================

const maxWidthClasses: Record<string, string> = {
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-7xl",
}

const verticalAlignClasses: Record<string, string> = {
  top: "items-start",
  center: "items-center",
}

const textAlignClasses: Record<string, string> = {
  left: "text-left",
  center: "text-center",
}

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
}

const imageVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
  },
}

// ============================================================================
// Component
// ============================================================================

export function ImageTextBlock({
  blockId,
  editable = false,
  onEditField,
  layout = "image-left",
  variant = "default",
  verticalAlign = "center",
  textAlign = "left",
  maxWidth = "lg",
  image,
  eyebrow,
  headline,
  content,
  cta,
  headlineColor,
  textColor,
  backgroundColor,
  className,
}: ImageTextBlockProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const isImageRight = layout === "image-right"
  const isSoft = variant === "soft"

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: "hidden",
        whileInView: "visible",
        viewport: { once: true, margin: "-60px" },
        variants: containerVariants,
      }

  return (
    <section
      className={cn(
        "w-full",
        isSoft ? "bg-muted" : "bg-background",
        className
      )}
      style={backgroundColor ? { backgroundColor } : undefined}
      aria-labelledby={blockId ? `${blockId}-headline` : undefined}
    >
      <motion.div
        {...motionProps}
        className={cn(
          "mx-auto px-4 py-16 md:py-24",
          maxWidthClasses[maxWidth]
        )}
      >
        <div
          className={cn(
            "grid gap-10 md:grid-cols-2 md:gap-12 lg:gap-20",
            verticalAlignClasses[verticalAlign]
          )}
        >
          {/* Image Column */}
          <motion.figure
            variants={prefersReducedMotion ? undefined : imageVariants}
            className={cn(
              "relative overflow-hidden rounded-2xl",
              isImageRight && "md:order-2"
            )}
          >
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={image.src || "/placeholder.svg"}
                alt={image.alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority={false}
              />
              {/* Subtle overlay for depth */}
              <div
                className={cn(
                  "absolute inset-0",
                  isSoft
                    ? "bg-gradient-to-t from-muted/20 to-transparent"
                    : "bg-gradient-to-t from-background/10 to-transparent"
                )}
                aria-hidden="true"
              />
            </div>
          </motion.figure>

          {/* Text Column */}
          <div
            className={cn(
              "flex flex-col justify-center gap-6",
              isImageRight && "md:order-1",
              textAlignClasses[textAlign]
            )}
          >
            {/* Eyebrow */}
            {eyebrow && (
              <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
                <Editable
                  enabled={editable}
                  blockId={blockId}
                  field="eyebrow"
                  onEdit={onEditField}
                  as="span"
                  className="inline-block text-xs font-medium uppercase tracking-wider text-primary"
                >
                  {eyebrow}
                </Editable>
              </motion.div>
            )}

            {/* Headline */}
            <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
              <Editable
                enabled={editable}
                blockId={blockId}
                field="headline"
                onEdit={onEditField}
                as="h2"
                className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl"
              >
                <span
                  id={blockId ? `${blockId}-headline` : undefined}
                  style={headlineColor ? { color: headlineColor } : undefined}
                >
                  {headline}
                </span>
              </Editable>
            </motion.div>

            {/* Content (supports rich text HTML) */}
            <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
              {editable && blockId ? (
                <Editable
                  enabled={editable}
                  blockId={blockId}
                  field="content"
                  onEdit={onEditField}
                  as="div"
                  className="prose prose-neutral dark:prose-invert max-w-none text-pretty text-base leading-relaxed text-muted-foreground md:text-lg md:leading-8"
                >
                  <span style={textColor ? { color: textColor } : undefined}>
                    {content}
                  </span>
                </Editable>
              ) : (
                <div
                  className="prose prose-neutral dark:prose-invert max-w-none text-pretty text-base leading-relaxed text-muted-foreground md:text-lg md:leading-8"
                  style={textColor ? { color: textColor } : undefined}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              )}
            </motion.div>

            {/* CTA */}
            {cta && (
              <motion.div
                variants={prefersReducedMotion ? undefined : itemVariants}
                className={cn(
                  "pt-2",
                  textAlign === "center" && "flex justify-center"
                )}
              >
                {editable ? (
                  <Button
                    size="lg"
                    className="group gap-2 rounded-xl text-base font-semibold transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <Editable
                      enabled={editable}
                      blockId={blockId}
                      field="cta.label"
                      onEdit={onEditField}
                      as="span"
                    >
                      {cta.label}
                    </Editable>
                    <ArrowRight
                      className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    asChild
                    className="group gap-2 rounded-xl text-base font-semibold transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <Link href={cta.href}>
                      {cta.label}
                      <ArrowRight
                        className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </Link>
                  </Button>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
