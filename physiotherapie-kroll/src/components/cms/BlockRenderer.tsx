"use client"

import { useCallback, type ElementType } from "react"
import { cn } from "@/lib/utils"
import type { CMSBlock } from "@/types/cms"
import { SectionWrapper } from "@/components/cms/SectionWrapper"
import { HeroSection } from "@/components/blocks/hero-section"
import { TextBlock } from "@/components/blocks/text-block"
import { ImageTextBlock } from "@/components/blocks/image-text-block"
import { FeatureGridBlock } from "@/components/blocks/feature-grid-block"
import { CtaBlock } from "@/components/blocks/cta-block"
import { SectionBlock } from "@/components/blocks/section-block"
import { ServicesGridBlock } from "@/components/blocks/services-grid-block"
import { FaqAccordion } from "@/components/blocks/faq-accordion"
import { TeamGridBlock } from "@/components/blocks/team-grid"
import { ContactFormBlock } from "@/components/blocks/contact-form-block"
import { TestimonialsBlock } from "@/components/blocks/testimonials-block"
import { GalleryBlock } from "@/components/blocks/gallery-block"
import { OpeningHoursBlock } from "@/components/blocks/opening-hours-block"
import { ImageSliderBlock } from "@/components/blocks/image-slider-block"
import type { BlockSectionProps, HeroBlock } from "@/types/cms"
import { blockRegistry } from "@/cms/blocks/registry"
import { getTypographyClassName, type TypographySettings } from "@/lib/typography"

interface BlockRendererProps {
  block: CMSBlock
  editable?: boolean
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
  pageSlug?: string
  isFirst?: boolean
}

/**
 * Wrapper component that adds click handlers for editable text fields
 */
function EditableText({
  children,
  blockId,
  fieldPath,
  editable,
  onEditField,
  className,
  as: Component = "span",
}: {
  children: React.ReactNode
  blockId: string
  fieldPath: string
  editable?: boolean
  onEditField?: (blockId: string, fieldPath: string) => void
  className?: string
  as?: ElementType
}) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (editable && onEditField) {
        e.preventDefault()
        e.stopPropagation()
        onEditField(blockId, fieldPath)
      }
    },
    [editable, onEditField, blockId, fieldPath]
  )

  if (!editable) {
    return <Component className={className}>{children}</Component>
  }

  return (
    <Component
      onClick={handleClick}
      className={cn(
        "cursor-pointer rounded px-1 transition-colors",
        "hover:bg-primary/10 hover:outline-2 hover:outline-primary/50",
        className
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick(e as unknown as React.MouseEvent)
        }
      }}
    >
      {children}
    </Component>
  )
}

/**
 * Central block renderer that switches on block type and renders the appropriate component
 */
export function BlockRenderer({
  block,
  editable,
  onEditField,
  onElementClick,
  selectedElementId,
  pageSlug,
  isFirst,
}: BlockRendererProps) {
  const definition = blockRegistry[block.type]
  const allowInlineEdit = definition.allowInlineEdit ?? false
  const canEdit = editable && allowInlineEdit && onEditField

  const blockProps = (block.props ?? {}) as Record<string, unknown>
  const sectionValue = blockProps.section
  const section =
    sectionValue && typeof sectionValue === "object"
      ? (sectionValue as BlockSectionProps)
      : undefined

  const typographyValue = blockProps.typography
  const typography =
    typographyValue && typeof typographyValue === "object"
      ? (typographyValue as TypographySettings)
      : null

  const renderContent = () => {
    switch (block.type) {
      case "hero": {
        const heroProps = block.props as HeroBlock["props"]
        const extras = (block.props ?? {}) as Record<string, unknown>
        const heroTypographyValue = extras.typography
        const heroTypography =
          heroTypographyValue && typeof heroTypographyValue === "object"
            ? (heroTypographyValue as Record<string, TypographySettings>)
            : undefined
        return (
          <HeroSection
            {...heroProps}
            props={heroProps}
            editable={editable}
            blockId={block.id}
            onEditField={onEditField}
            onElementClick={onElementClick}
            selectedElementId={selectedElementId}
            typography={heroTypography}
          />
        )
      }

      case "text": {
        const props = block.props
        // Text block uses dangerouslySetInnerHTML, so we wrap the container
        return <TextBlock {...props} />
      }

      case "imageText": {
        const props = block.props
        return <ImageTextBlock {...props} />
      }

      case "featureGrid": {
        const props = block.props
        return (
          <FeatureGridBlock
            {...props}
            editable={editable}
            blockId={block.id}
            onEditField={onEditField}
          />
        )
      }

      case "cta": {
        const props = block.props
        return <CtaBlock {...props} />
      }

      case "section": {
        const props = block.props
        return (
          <SectionBlock
            {...props}
            editable={editable}
            blockId={block.id}
            onEditField={onEditField}
          />
        )
      }

      case "servicesGrid": {
        const props = block.props
        return (
          <ServicesGridBlock
            {...props}
            editable={editable}
            blockId={block.id}
            onEditField={onEditField}
          />
        )
      }

      case "faq": {
        const props = block.props
        return (
          <FaqAccordion
            {...props}
            editable={editable}
            blockId={block.id}
            onEditField={onEditField}
          />
        )
      }

      case "team": {
        const props = block.props
        return (
          <TeamGridBlock
            {...props}
            editable={editable}
            blockId={block.id}
            onEditField={onEditField}
          />
        )
      }

      case "contactForm": {
        const props = block.props
        return (
          <ContactFormBlock
            {...props}
            blockId={block.id}
            pageSlug={pageSlug}
          />
        )
      }

      case "testimonials": {
        const props = block.props
        return (
          <TestimonialsBlock
            {...props}
            editable={editable}
            blockId={block.id}
            onEditField={onEditField}
          />
        )
      }

      case "gallery": {
        const props = block.props
        return (
          <GalleryBlock
            {...props}
            editable={editable}
            blockId={block.id}
            onEditField={onEditField}
          />
        )
      }

      case "openingHours": {
        const props = block.props
        return (
          <OpeningHoursBlock
            {...props}
            editable={editable}
            blockId={block.id}
            onEditField={onEditField}
          />
        )
      }

      case "imageSlider": {
        const props = block.props
        return <ImageSliderBlock {...props} />
      }

      default: {
        // TypeScript exhaustive check
        const _exhaustive: never = block
        console.warn(`Unknown block type: ${(_exhaustive as CMSBlock).type}`)
        return null
      }
    }
  }

  const content = renderContent()

  const typographyClassName = getTypographyClassName(typography)

  if (!editable) {
    // Apply typography classes to wrapper even in non-editable mode
    if (typographyClassName) {
      return (
        <div className={typographyClassName}>
          <SectionWrapper section={section} isFirst={isFirst}>
            {content}
          </SectionWrapper>
        </div>
      )
    }
    return (
      <SectionWrapper section={section} isFirst={isFirst}>
        {content}
      </SectionWrapper>
    )
  }

  // Wrap content with editable overlay that detects clicks on text elements
  return (
    <div
      className={cn(
        "relative group",
        "hover:outline-2 hover:outline-primary/30 hover:outline-offset-2",
        "transition-all rounded-lg",
        typographyClassName
      )}
      onClick={(e) => {
        if (!canEdit || !onEditField) return
        
        // Find the clicked text element and determine field path
        const target = e.target as HTMLElement
        const blockElement = e.currentTarget
        
        // Check if we clicked on a text element (headline, subheadline, content, etc.)
        // This is a simple heuristic - can be improved
        if (target.textContent && target !== blockElement) {
          const text = target.textContent.trim()
          if (text.length > 0) {
            // Try to determine field based on element classes or structure
            const fieldPath = determineFieldPath(target, block.type)
            if (fieldPath) {
              e.preventDefault()
              e.stopPropagation()
              // Get bounding rect of the clicked element
              const anchorRect = target.getBoundingClientRect()
              onEditField(block.id, fieldPath, anchorRect)
            }
          }
        }
      }}
    >
      <SectionWrapper section={section} editable isFirst={isFirst}>
        {content}
      </SectionWrapper>
    </div>
  )
}

/**
 * Determines the field path based on the clicked element and block type
 */
function determineFieldPath(element: HTMLElement, blockType: CMSBlock["type"]): string | null {
  // Check element classes and structure to determine field
  const classList = element.classList
  const tagName = element.tagName.toLowerCase()
  
  switch (blockType) {
    case "hero": {
      // Hero section structure: h1 for headline, p for subheadline
      if (tagName === "h1" || classList.contains("hero-headline")) {
        return "headline"
      }
      if (tagName === "p" || classList.contains("hero-subheadline")) {
        return "subheadline"
      }
      break
    }
    case "text": {
      return "content"
    }
    case "imageText": {
      if (tagName === "h2" || classList.contains("headline")) {
        return "headline"
      }
      if (tagName === "p" || classList.contains("content")) {
        return "content"
      }
      break
    }
    case "cta": {
      if (tagName === "h2" || classList.contains("headline")) {
        return "headline"
      }
      if (tagName === "p" || classList.contains("subheadline")) {
        return "subheadline"
      }
      break
    }
  }
  
  return null
}

interface CMSRendererProps {
  blocks: CMSBlock[]
  editable?: boolean
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  pageSlug?: string
}

/**
 * Renders multiple CMS blocks in sequence
 */
export function CMSRenderer({ blocks, editable, onEditField, pageSlug }: CMSRendererProps) {
  return (
    <>
      {blocks.map((block, index) => (
        <BlockRenderer
          key={`${block.id}-${index}`}
          block={block}
          isFirst={index === 0}
          editable={editable}
          onEditField={onEditField}
          pageSlug={pageSlug}
        />
      ))}
    </>
  )
}
