"use client"

import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"
import type { CMSBlock } from "@/types/cms"
import { SectionWrapper } from "@/components/cms/SectionWrapper"
import { HeroSection } from "@/components/blocks/hero-section"
import { TextBlock } from "@/components/blocks/text-block"
import { ImageTextBlock } from "@/components/blocks/image-text-block"
import { FeatureGridBlock } from "@/components/blocks/feature-grid-block"
import { CtaBlock } from "@/components/blocks/cta-block"
import { SectionBlock } from "@/components/blocks/section-block"
import { CardBlock } from "@/components/blocks/card-block"
import { ServicesGridBlock } from "@/components/blocks/services-grid-block"
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

const FaqAccordion = dynamic(() => import("@/components/blocks/faq-accordion").then(mod => ({ default: mod.FaqAccordion })), { ssr: false })

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
  const section: BlockSectionProps | undefined =
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
        const elementsValue = extras.elements
        const elements = elementsValue as Record<string, any> | undefined
        return (
          <HeroSection
            {...heroProps}
            elements={elements}
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
        const extras = (block.props ?? {}) as Record<string, unknown>
        const elementsValue = extras.elements
        const elements = elementsValue as Record<string, any> | undefined
        return (
          <ImageTextBlock
            {...props}
            elements={elements}
            editable={editable}
            blockId={block.id}
            onEditField={onEditField}
            onElementClick={onElementClick}
            selectedElementId={selectedElementId}
          />
        )
      }

      case "featureGrid": {
        const props = block.props
        const extras = (block.props ?? {}) as Record<string, unknown>
        const elementsValue = extras.elements
        const elements = elementsValue as Record<string, any> | undefined
        return (
          <FeatureGridBlock
            {...props}
            elements={elements}
            editable={editable}
            blockId={block.id}
            onEditField={onEditField}
            onElementClick={onElementClick}
            selectedElementId={selectedElementId}
          />
        )
      }

      case "cta": {
        const props = block.props
        const extras = (block.props ?? {}) as Record<string, unknown>
        const elementsValue = extras.elements
        const elements = elementsValue as Record<string, any> | undefined
        return (
          <CtaBlock
            {...props}
            elements={elements}
            editable={editable}
            blockId={block.id}
            onEditField={onEditField}
            onElementClick={onElementClick}
            selectedElementId={selectedElementId}
          />
        )
      }

      case "section": {
        const props = block.props
        const extras = (block.props ?? {}) as Record<string, unknown>
        const elementsValue = extras.elements
        const elements = elementsValue as Record<string, any> | undefined
        return (
          <SectionBlock
            {...props}
            elements={elements}
            editable={editable}
            blockId={block.id}
            onEditField={onEditField}
            onElementClick={onElementClick}
            selectedElementId={selectedElementId}
          />
        )
      }

      case "card": {
        const props = block.props
        const extras = (block.props ?? {}) as Record<string, unknown>
        const elementsValue = extras.elements
        const elements = elementsValue as Record<string, any> | undefined
        return (
          <CardBlock
            {...props}
            elements={elements}
            editable={editable}
            blockId={block.id}
            onEditField={onEditField}
            onElementClick={onElementClick}
            selectedElementId={selectedElementId}
          />
        )
      }

      case "servicesGrid": {
        const props = block.props
        const extras = (block.props ?? {}) as Record<string, unknown>
        const elementsValue = extras.elements
        const elements = elementsValue as Record<string, any> | undefined
        return (
          <ServicesGridBlock
            {...props}
            elements={elements}
            editable={editable}
            blockId={block.id}
            onEditField={onEditField}
            onElementClick={onElementClick}
            selectedElementId={selectedElementId}
          />
        )
      }

      case "faq": {
        const props = block.props
        const extras = (block.props ?? {}) as Record<string, unknown>
        const elementsValue = extras.elements
        const elements = elementsValue as Record<string, any> | undefined
        return (
          <FaqAccordion
            {...props}
            elements={elements}
            editable={editable}
            blockId={block.id}
            onEditField={onEditField}
            onElementClick={onElementClick}
            selectedElementId={selectedElementId}
          />
        )
      }

      case "team": {
        const props = block.props
        const extras = (block.props ?? {}) as Record<string, unknown>
        const elementsValue = extras.elements
        const elements = elementsValue as Record<string, any> | undefined
        return (
          <TeamGridBlock
            {...props}
            elements={elements}
            editable={editable}
            blockId={block.id}
            onEditField={onEditField}
            onElementClick={onElementClick}
            selectedElementId={selectedElementId}
          />
        )
      }

      case "contactForm": {
        const props = block.props
        const elementsValue = (props as Record<string, unknown>).elements
        const elements = elementsValue as Record<string, any> | undefined
        return (
          <ContactFormBlock
            {...props}
            elements={elements}
            blockId={block.id}
            pageSlug={pageSlug}
            editable={editable}
            onEditField={onEditField}
            onElementClick={onElementClick}
            selectedElementId={selectedElementId}
          />
        )
      }

      case "testimonials": {
        const props = block.props
        const extras = (block.props ?? {}) as Record<string, unknown>
        const elementsValue = extras.elements
        const elements = elementsValue as Record<string, any> | undefined
        return (
          <TestimonialsBlock
            {...props}
            elements={elements}
            editable={editable}
            blockId={block.id}
            onEditField={onEditField}
            onElementClick={onElementClick}
            selectedElementId={selectedElementId}
          />
        )
      }

      case "testimonialSlider": {
        const props = block.props
        const extras = (block.props ?? {}) as Record<string, unknown>
        const elementsValue = extras.elements
        const elements = elementsValue as Record<string, any> | undefined
        return (
          <TestimonialSliderBlock
            data={block.props}
            brand={brand}
            elements={elements}
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
        const extras = (block.props ?? {}) as Record<string, unknown>
        const elementsValue = extras.elements
        const elements = elementsValue as Record<string, any> | undefined
        return (
          <GalleryBlock
            {...props}
            elements={elements}
            editable={editable}
            blockId={block.id}
            onEditField={onEditField}
            onElementClick={onElementClick}
            selectedElementId={selectedElementId}
          />
        )
      }

      case "openingHours": {
        const props = block.props
        const extras = (block.props ?? {}) as Record<string, unknown>
        const elementsValue = extras.elements
        const elements = elementsValue as Record<string, any> | undefined
        return (
          <OpeningHoursBlock
            {...props}
            elements={elements}
            editable={editable}
            blockId={block.id}
            onEditField={onEditField}
            onElementClick={onElementClick}
            selectedElementId={selectedElementId}
          />
        )
      }

      case "imageSlider": {
        const props = block.props
        const extras = (block.props ?? {}) as Record<string, unknown>
        const elementsValue = extras.elements
        const elements = elementsValue as Record<string, any> | undefined
        return (
          <ImageSliderBlock
            {...props}
            elements={elements}
            editable={editable}
            blockId={block.id}
            onEditField={onEditField}
            onElementClick={onElementClick}
            selectedElementId={selectedElementId}
          />
        )
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

  // Check if block should be full bleed (no width constraint)
  const isFullBleed = section?.fullBleed === true

  // Wrapper function for unified global width
  const wrapWithGlobalWidth = (blockContent: React.ReactNode) => {
    if (isFullBleed) {
      // Full bleed: no max-width, no horizontal padding
      return blockContent
    }
    // Standard: apply consistent width and padding
    return (
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {blockContent}
      </div>
    )
  }

  if (!editable) {
    // Apply typography classes to wrapper even in non-editable mode
    if (typographyClassName) {
      return (
        <div className={typographyClassName}>
          <SectionWrapper section={section} isFirst={isFirst}>
            {wrapWithGlobalWidth(content)}
          </SectionWrapper>
        </div>
      )
    }
    return (
      <SectionWrapper section={section} isFirst={isFirst}>
        {wrapWithGlobalWidth(content)}
      </SectionWrapper>
    )
  }

  // Wrap content with editable overlay that detects clicks on data-cms-field and data-element-id elements
  return (
    <div
      className={cn(
        "relative group",
        "hover:outline-2 hover:outline-primary/30 hover:outline-offset-2",
        "transition-all rounded-lg",
        typographyClassName
      )}
      onClick={(e) => {
        // Protect interactive elements (forms, buttons, links) unless they have data-cms-field or data-element-id
        const interactiveEl = (e.target as HTMLElement).closest("a,button,input,textarea,select,[role='button'],[role='link']")
        const fieldEl = (e.target as HTMLElement).closest("[data-cms-field]")
        const elementEl = (e.target as HTMLElement).closest("[data-element-id]")
        
        // If clicking on interactive element without special attributes, allow default behavior
        if (interactiveEl && !fieldEl && !elementEl) {
          return
        }

        // Handle data-element-id clicks (for shadow/styling inspector)
        // Only if not already handled by Editable component (check if it's a direct element click, not nested in Editable)
        if (elementEl && onElementClick && !elementEl.closest("[role='region']")) {
          const elementId = elementEl.getAttribute("data-element-id")
          if (elementId) {
            e.preventDefault()
            e.stopPropagation()
            onElementClick(block.id, elementId)
            return
          }
        }

        // Handle data-cms-field clicks (for inline text editing)
        if (canEdit && onEditField && fieldEl) {
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
        {wrapWithGlobalWidth(content)}
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
          key={block.id}
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
