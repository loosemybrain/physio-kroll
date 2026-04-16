'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { PopupConfig } from '@/types/popup'

interface PopupModalProps extends PopupConfig {
  isOpen: boolean
}

export function PopupModal({
  isOpen,
  variant,
  layoutVariant,
  size = 'md',
  headline,
  subheadline,
  body,
  image,
  primaryCTA,
  secondaryCTA,
  tertiaryText,
  onClose,
  closeOnOverlayClick = true,
  mobileBottomSheet = true,
  className,
  accentColor = 'primary',
}: PopupModalProps) {
  const [isMobile, setIsMobile] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.3,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: { duration: prefersReducedMotion ? 0 : 0.2 },
    },
  }

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: prefersReducedMotion ? 0 : 0.3 },
    },
    exit: {
      opacity: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.2 },
    },
  }

  const bottomSheetVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: prefersReducedMotion ? 0 : 0.4, ease: 'easeOut' },
    },
    exit: {
      y: '100%',
      opacity: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.3 },
    },
  }

  // Size classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  }

  // Accent color classes
  const accentClasses = {
    primary: 'bg-primary text-primary-foreground',
    accent: 'bg-accent text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
  }

  // Mobile bottom sheet variant
  if (isMobile && mobileBottomSheet) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => closeOnOverlayClick && onClose()}
              aria-hidden="true"
            />

            {/* Bottom Sheet */}
            <motion.div
              variants={bottomSheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                'fixed bottom-0 left-0 right-0 z-50 w-full rounded-t-3xl bg-card shadow-2xl',
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3">
                <div className="h-1 w-12 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Content */}
              <div className="space-y-4 p-6">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="ml-auto flex items-center justify-center rounded-lg hover:bg-muted"
                  aria-label="Close popup"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>

                {/* Headline */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{headline}</h2>
                  {subheadline && (
                    <p className="mt-1 text-sm text-muted-foreground">{subheadline}</p>
                  )}
                </div>

                {/* Body */}
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {body}
                </div>

                {/* CTAs */}
                <div className="space-y-3 pt-2">
                  <Button
                    onClick={primaryCTA.onClick}
                    disabled={primaryCTA.loading}
                    className={cn(
                      'w-full',
                      accentClasses[accentColor],
                    )}
                    size="lg"
                  >
                    {primaryCTA.loading ? '...' : primaryCTA.label}
                  </Button>

                  {secondaryCTA && (
                    <Button
                      onClick={secondaryCTA.onClick}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      {secondaryCTA.label}
                    </Button>
                  )}

                  {tertiaryText && (
                    <button
                      onClick={onClose}
                      className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {tertiaryText}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    )
  }

  // Desktop modal variants
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => closeOnOverlayClick && onClose()}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
              'w-[calc(100%-2rem)] md:w-auto',
              sizeClasses[size],
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {layoutVariant === 'no-image' && (
              <ModalContent
                headline={headline}
                subheadline={subheadline}
                body={body}
                primaryCTA={primaryCTA}
                secondaryCTA={secondaryCTA}
                tertiaryText={tertiaryText}
                onClose={onClose}
                accentColor={accentColor}
                variant={variant}
              />
            )}

            {layoutVariant === 'image-top' && image && (
              <ModalContentImageTop
                image={image}
                headline={headline}
                subheadline={subheadline}
                body={body}
                primaryCTA={primaryCTA}
                secondaryCTA={secondaryCTA}
                tertiaryText={tertiaryText}
                onClose={onClose}
                accentColor={accentColor}
                variant={variant}
              />
            )}

            {layoutVariant === 'image-left' && image && (
              <ModalContentImageLeft
                image={image}
                headline={headline}
                subheadline={subheadline}
                body={body}
                primaryCTA={primaryCTA}
                secondaryCTA={secondaryCTA}
                tertiaryText={tertiaryText}
                onClose={onClose}
                accentColor={accentColor}
                variant={variant}
              />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─────────────────────────────────────────────────────
//  Modal Content Variants
// ─────────────────────────────────────────────────────

interface ContentProps {
  headline: string
  subheadline?: string
  body: React.ReactNode
  primaryCTA: PopupConfig['primaryCTA']
  secondaryCTA?: PopupConfig['secondaryCTA']
  tertiaryText?: string
  onClose: () => void
  accentColor: 'primary' | 'accent' | 'destructive'
  variant: PopupVariant
}

interface ImageProps extends ContentProps {
  image: { src: string; alt: string; parallax?: boolean }
}

const accentClasses = {
  primary: 'bg-primary text-primary-foreground',
  accent: 'bg-accent text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
}

function ModalContent({
  headline,
  subheadline,
  body,
  primaryCTA,
  secondaryCTA,
  tertiaryText,
  onClose,
  accentColor,
}: ContentProps) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-8 shadow-2xl">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="float-right rounded-lg p-1 hover:bg-muted transition-colors"
        aria-label="Close popup"
      >
        <X className="h-5 w-5 text-muted-foreground" />
      </button>

      {/* Content */}
      <div className="space-y-4">
        {/* Headline */}
        <div className="pr-8">
          <h2 className="text-2xl font-bold text-foreground">{headline}</h2>
          {subheadline && (
            <p className="mt-1 text-sm text-muted-foreground">{subheadline}</p>
          )}
        </div>

        {/* Body */}
        <div className="text-sm text-muted-foreground leading-relaxed">
          {body}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={primaryCTA.onClick}
            disabled={primaryCTA.loading}
            className={cn('w-full', accentClasses[accentColor])}
            size="lg"
          >
            {primaryCTA.loading ? '...' : primaryCTA.label}
          </Button>

          {secondaryCTA && (
            <Button
              onClick={secondaryCTA.onClick}
              variant="outline"
              className="w-full"
              size="lg"
            >
              {secondaryCTA.label}
            </Button>
          )}

          {tertiaryText && (
            <button
              onClick={onClose}
              className="py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {tertiaryText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ModalContentImageTop({
  image,
  headline,
  subheadline,
  body,
  primaryCTA,
  secondaryCTA,
  tertiaryText,
  onClose,
  accentColor,
}: ImageProps) {
  const [imageScale, setImageScale] = useState(1)

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-2xl">
      {/* Image Container */}
      <div
        className="relative h-64 w-full overflow-hidden bg-muted"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const y = (e.clientY - rect.top) / rect.height
          setImageScale(1 + (y - 0.5) * 0.1)
        }}
        onMouseLeave={() => setImageScale(1)}
      >
        <motion.img
          src={image.src}
          alt={image.alt}
          className="absolute inset-0 h-full w-full object-cover"
          animate={{ scale: imageScale }}
          transition={{ duration: 0.3 }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card/50" />
      </div>

      {/* Content */}
      <div className="relative space-y-4 p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="float-right rounded-lg p-1 hover:bg-muted transition-colors"
          aria-label="Close popup"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Headline */}
        <div className="pr-8">
          <h2 className="text-2xl font-bold text-foreground">{headline}</h2>
          {subheadline && (
            <p className="mt-1 text-sm text-muted-foreground">{subheadline}</p>
          )}
        </div>

        {/* Body */}
        <div className="text-sm text-muted-foreground leading-relaxed">
          {body}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={primaryCTA.onClick}
            disabled={primaryCTA.loading}
            className={cn('w-full', accentClasses[accentColor])}
            size="lg"
          >
            {primaryCTA.loading ? '...' : primaryCTA.label}
          </Button>

          {secondaryCTA && (
            <Button
              onClick={secondaryCTA.onClick}
              variant="outline"
              className="w-full"
              size="lg"
            >
              {secondaryCTA.label}
            </Button>
          )}

          {tertiaryText && (
            <button
              onClick={onClose}
              className="py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {tertiaryText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ModalContentImageLeft({
  image,
  headline,
  subheadline,
  body,
  primaryCTA,
  secondaryCTA,
  tertiaryText,
  onClose,
  accentColor,
}: ImageProps) {
  const [imageScale, setImageScale] = useState(1)

  return (
    <div className="flex rounded-2xl border border-border/50 bg-card overflow-hidden shadow-2xl max-h-96">
      {/* Image Container */}
      <div
        className="relative h-96 w-64 flex-shrink-0 overflow-hidden bg-muted"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const y = (e.clientY - rect.top) / rect.height
          setImageScale(1 + (y - 0.5) * 0.1)
        }}
        onMouseLeave={() => setImageScale(1)}
      >
        <motion.img
          src={image.src}
          alt={image.alt}
          className="absolute inset-0 h-full w-full object-cover"
          animate={{ scale: imageScale }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Content */}
      <div className="relative flex-1 space-y-4 p-8 flex flex-col justify-between">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="float-right rounded-lg p-1 hover:bg-muted transition-colors"
          aria-label="Close popup"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="space-y-4">
          {/* Headline */}
          <div>
            <h2 className="text-xl font-bold text-foreground">{headline}</h2>
            {subheadline && (
              <p className="mt-1 text-xs text-muted-foreground">{subheadline}</p>
            )}
          </div>

          {/* Body */}
          <div className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
            {body}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={primaryCTA.onClick}
            disabled={primaryCTA.loading}
            className={cn('w-full text-sm', accentClasses[accentColor])}
            size="sm"
          >
            {primaryCTA.loading ? '...' : primaryCTA.label}
          </Button>

          {secondaryCTA && (
            <Button
              onClick={secondaryCTA.onClick}
              variant="outline"
              className="w-full text-sm"
              size="sm"
            >
              {secondaryCTA.label}
            </Button>
          )}

          {tertiaryText && (
            <button
              onClick={onClose}
              className="py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {tertiaryText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
