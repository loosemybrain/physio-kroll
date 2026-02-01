"use client"

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
import { TestimonialSliderBlock } from "@/components/blocks/testimonial-slider"
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
  brand?: string
}

/**
 * Central block renderer that switches on block type and renders the appropriate component
 * Inline-edit is handled via data-cms-field attributes on block elements
 */
export function BlockRenderer({
  block,
  editable,
  onEditField,
  onElementClick,
  selectedElementId,
  pageSlug,
  isFirst,
  brand,
}: BlockRendererProps) {
  const definition = blockRegistry[block.type]
  const allowInlineEdit = definition?.allowInlineEdit ?? false
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
        return (
          <ImageTextBlock
            {...props}
            editable={editable}
            blockId={block.id}
            onEditField={onEditField}
          />
        )
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
        return (
          <CtaBlock
            {...props}
            editable={editable}
            blockId={block.id}
            onEditField={onEditField}
          />
        )
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
            editable={editable}
            onEditField={onEditField}
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

      case "testimonialSlider": {
        const props = block.props
        return (
          <TestimonialSliderBlock
          data={block.props}
          brand={brand}
          editable={editable}
          blockId={block.id}
          onEditField={onEditField}
          onElementClick={onElementClick}
          selectedElementId={selectedElementId}
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

  // Wrap content with editable overlay that detects clicks on data-cms-field elements
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

        // Protect interactive elements (forms, buttons, links) unless they have data-cms-field
        const interactiveEl = (e.target as HTMLElement).closest("a,button,input,textarea,select,[role='button'],[role='link']")
        const fieldEl = (e.target as HTMLElement).closest("[data-cms-field]")
        
        // If clicking on interactive element without data-cms-field, allow default behavior
        if (interactiveEl && !fieldEl) {
          return
        }

        // Only trigger edit if element has data-cms-field attribute
        if (fieldEl) {
          const fieldPath = fieldEl.getAttribute("data-cms-field")
          if (fieldPath) {
            e.preventDefault()
            e.stopPropagation()
            const anchorRect = fieldEl.getBoundingClientRect()
            onEditField(block.id, fieldPath, anchorRect)
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


interface CMSRendererProps {
  blocks: CMSBlock[]
  editable?: boolean
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  pageSlug?: string
  brand?: string
}

/**
 * Renders multiple CMS blocks in sequence
 */
export function CMSRenderer({ blocks, editable, onEditField, pageSlug, brand }: CMSRendererProps) {
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
          brand={brand}
        />
      ))}
    </>
  )
}
