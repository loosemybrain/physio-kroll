'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type CarouselContextValue = {
  itemsCount: number
  index: number
  setIndex: (next: number) => void
  goTo: (next: number) => void
  next: () => void
  prev: () => void
  loop: boolean
  peek: boolean
  draggable: boolean
  reducedMotion: boolean
  isDragging: boolean
  canPrev: boolean
  canNext: boolean
  viewportRef: React.RefObject<HTMLDivElement | null>
  trackRef: React.RefObject<HTMLUListElement | null>
  stepPx: number
  dragPx: number
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null)

export function useCarousel() {
  const ctx = React.useContext(CarouselContext)
  if (!ctx) throw new Error('useCarousel must be used within <Carousel />')
  return ctx
}

function clampIndex(i: number, max: number) {
  return Math.min(Math.max(i, 0), max)
}

function wrapIndex(i: number, count: number) {
  if (count <= 0) return 0
  return ((i % count) + count) % count
}

function shouldIgnoreKeydown(target: EventTarget | null) {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if (el.isContentEditable) return true
  return false
}

function isFromInteractiveElement(target: EventTarget | null) {
  const el = target as HTMLElement | null
  if (!el) return false
  return Boolean(el.closest('a,button,input,textarea,select,[role="button"],[data-carousel-no-drag]'))
}

export type CarouselProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  itemsCount: number
  initialIndex?: number
  index?: number
  onIndexChange?: (nextIndex: number) => void
  loop?: boolean
  autoplay?: boolean
  autoplayDelayMs?: number
  pauseOnHover?: boolean
  draggable?: boolean
  ariaLabel?: string
  peek?: boolean
  children: React.ReactNode
}

export function Carousel({
  itemsCount,
  initialIndex = 0,
  index,
  onIndexChange,
  loop = true,
  autoplay = false,
  autoplayDelayMs = 5000,
  pauseOnHover = true,
  draggable = true,
  ariaLabel = 'Carousel',
  peek = false,
  className,
  children,
  ...props
}: CarouselProps) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const trackRef = React.useRef<HTMLUListElement | null>(null)

  const isControlled = typeof index === 'number'
  const [uncontrolledIndex, setUncontrolledIndex] = React.useState<number>(() => wrapIndex(initialIndex, itemsCount))
  const activeIndex = isControlled ? wrapIndex(index ?? 0, itemsCount) : wrapIndex(uncontrolledIndex, itemsCount)

  const [reducedMotion, setReducedMotion] = React.useState(false)
  const [hovered, setHovered] = React.useState(false)
  const [focusedWithin, setFocusedWithin] = React.useState(false)
  const [stepPx, setStepPx] = React.useState(0)
  const [dragPx, setDragPx] = React.useState(0)
  const [isDragging, setIsDragging] = React.useState(false)

  const setIndex = React.useCallback(
    (next: number) => {
      const normalized = loop ? wrapIndex(next, itemsCount) : clampIndex(next, Math.max(0, itemsCount - 1))
      onIndexChange?.(normalized)
      if (!isControlled) setUncontrolledIndex(normalized)
    },
    [isControlled, itemsCount, loop, onIndexChange],
  )

  const goTo = React.useCallback((next: number) => setIndex(next), [setIndex])

  const canPrev = loop ? itemsCount > 1 : activeIndex > 0
  const canNext = loop ? itemsCount > 1 : activeIndex < itemsCount - 1

  const prev = React.useCallback(() => {
    if (!canPrev) return
    setIndex(activeIndex - 1)
  }, [activeIndex, canPrev, setIndex])

  const next = React.useCallback(() => {
    if (!canNext) return
    setIndex(activeIndex + 1)
  }, [activeIndex, canNext, setIndex])

  // prefers-reduced-motion (SSR-safe)
  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(Boolean(mql.matches))
    update()
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', update)
      return () => mql.removeEventListener('change', update)
    }
    // eslint-disable-next-line deprecation/deprecation
    mql.addListener(update)
    // eslint-disable-next-line deprecation/deprecation
    return () => mql.removeListener(update)
  }, [])

  // Measure step size (supports peek via variable slide widths/gaps)
  React.useEffect(() => {
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!viewport || !track) return

    let raf = 0

    const measure = () => {
      const slides = Array.from(track.children) as HTMLElement[]
      if (!slides.length) {
        setStepPx(viewport.clientWidth || 0)
        return
      }

      if (slides.length >= 2) {
        const r0 = slides[0].getBoundingClientRect()
        const r1 = slides[1].getBoundingClientRect()
        const step = Math.abs(r1.left - r0.left)
        setStepPx(step || r0.width || viewport.clientWidth || 0)
        return
      }

      const r0 = slides[0].getBoundingClientRect()
      setStepPx(r0.width || viewport.clientWidth || 0)
    }

    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }

    schedule()

    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(schedule)
      ro.observe(viewport)
      ro.observe(track)
    }

    return () => {
      cancelAnimationFrame(raf)
      ro?.disconnect()
    }
  }, [itemsCount, peek])

  // Autoplay
  React.useEffect(() => {
    if (!autoplay || itemsCount <= 1) return
    if (pauseOnHover && (hovered || focusedWithin)) return
    if (isDragging) return
    if (!loop && activeIndex >= itemsCount - 1) return

    const id = window.setInterval(() => {
      // use functional approach against stale closures (index is in deps anyway)
      const nextIndex = activeIndex + 1
      setIndex(nextIndex)
    }, Math.max(250, autoplayDelayMs))

    return () => window.clearInterval(id)
  }, [activeIndex, autoplay, autoplayDelayMs, focusedWithin, hovered, isDragging, itemsCount, loop, pauseOnHover, setIndex])

  const transitionClass = reducedMotion || isDragging ? 'transition-none' : 'transition-transform duration-300 ease-out'

  const dragStateRef = React.useRef<{
    pointerId: number
    startX: number
    lastX: number
    startTime: number
    active: boolean
  } | null>(null)

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      if (!draggable || itemsCount <= 1) return
      if (e.button !== 0) return
      if (isFromInteractiveElement(e.target)) return
      const viewport = viewportRef.current
      if (!viewport) return

      dragStateRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        lastX: e.clientX,
        startTime: Date.now(),
        active: true,
      }
      setIsDragging(true)
      setDragPx(0)
      try {
        viewport.setPointerCapture(e.pointerId)
      } catch {
        // ignore
      }
    },
    [draggable, itemsCount],
  )

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      const st = dragStateRef.current
      if (!st?.active || st.pointerId !== e.pointerId) return
      const dx = e.clientX - st.startX
      st.lastX = e.clientX

      if (!loop) {
        const atStart = activeIndex === 0
        const atEnd = activeIndex === itemsCount - 1
        if ((atStart && dx > 0) || (atEnd && dx < 0)) {
          setDragPx(dx / 3)
          return
        }
      }

      setDragPx(dx)
    },
    [activeIndex, itemsCount, loop],
  )

  const endDrag = React.useCallback(
    (e: React.PointerEvent) => {
      const st = dragStateRef.current
      if (!st?.active || st.pointerId !== e.pointerId) return

      st.active = false
      dragStateRef.current = null

      const dx = dragPx
      const dt = Math.max(1, Date.now() - st.startTime)
      const vx = dx / dt // px/ms
      const threshold = Math.max(40, (stepPx || 0) * 0.15)

      setIsDragging(false)
      setDragPx(0)

      const shouldGoNext = dx < -threshold || vx < -0.7
      const shouldGoPrev = dx > threshold || vx > 0.7

      if (shouldGoNext) {
        next()
        return
      }
      if (shouldGoPrev) {
        prev()
      }
    },
    [dragPx, next, prev, stepPx],
  )

  const onPointerUp = React.useCallback((e: React.PointerEvent) => endDrag(e), [endDrag])
  const onPointerCancel = React.useCallback((e: React.PointerEvent) => endDrag(e), [endDrag])

  const onKeyDownCapture = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (shouldIgnoreKeydown(e.target)) return
      if (itemsCount <= 1) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        next()
      } else if (e.key === 'Home') {
        e.preventDefault()
        goTo(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        goTo(itemsCount - 1)
      }
    },
    [goTo, itemsCount, next, prev],
  )

  const ctx: CarouselContextValue = React.useMemo(
    () => ({
      itemsCount,
      index: activeIndex,
      setIndex,
      goTo,
      next,
      prev,
      loop,
      peek,
      draggable,
      reducedMotion,
      isDragging,
      canPrev,
      canNext,
      viewportRef,
      trackRef,
      stepPx,
      dragPx,
    }),
    [activeIndex, canNext, canPrev, dragPx, draggable, goTo, isDragging, itemsCount, loop, next, peek, prev, reducedMotion, setIndex, stepPx],
  )

  return (
    <CarouselContext.Provider value={ctx}>
      <div
        className={cn('relative', className)}
        role="region"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
        onKeyDownCapture={onKeyDownCapture}
        onMouseEnter={pauseOnHover ? () => setHovered(true) : undefined}
        onMouseLeave={pauseOnHover ? () => setHovered(false) : undefined}
        onFocusCapture={pauseOnHover ? () => setFocusedWithin(true) : undefined}
        onBlurCapture={pauseOnHover ? () => setFocusedWithin(false) : undefined}
        {...props}
      >
        {/* SR-only status (polite, but short) */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          Slide {Math.min(activeIndex + 1, Math.max(1, itemsCount))} von {Math.max(1, itemsCount)}
        </div>

        <div
          ref={viewportRef}
          className={cn('overflow-hidden', draggable && 'touch-pan-y select-none')}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          {children}
        </div>
      </div>
    </CarouselContext.Provider>
  )
}

export type CarouselTrackProps = React.ComponentProps<'ul'> & {
  className?: string
}

export function CarouselTrack({ className, ...props }: CarouselTrackProps) {
  const { trackRef, peek, index, stepPx, dragPx, reducedMotion, isDragging } = useCarousel()
  const translateX = -(index * (stepPx || 0)) + (isDragging ? dragPx : 0)
  const transitionClass = reducedMotion || isDragging ? 'transition-none' : 'transition-transform duration-300 ease-out'
  return (
    <ul
      ref={trackRef}
      role="list"
      className={cn('flex will-change-transform', transitionClass, peek ? 'gap-4 px-4' : '', className)}
      style={{ transform: `translate3d(${translateX}px,0,0)` }}
      {...props}
    />
  )
}

export type CarouselSlideProps = React.ComponentProps<'li'> & {
  index: number
  ariaLabel?: string
}

export function CarouselSlide({ index, ariaLabel, className, ...props }: CarouselSlideProps) {
  const { index: activeIndex, itemsCount, peek } = useCarousel()
  const isActive = index === activeIndex
  const label = ariaLabel ?? `Slide ${index + 1} von ${Math.max(1, itemsCount)}`

  return (
    <li
      role="listitem"
      aria-roledescription="slide"
      aria-current={isActive ? 'true' : undefined}
      aria-label={label}
      className={cn(peek ? 'min-w-0 shrink-0 grow-0 basis-[85%] sm:basis-[75%] lg:basis-[65%]' : 'min-w-0 shrink-0 grow-0 basis-full', className)}
      {...props}
    />
  )
}

type CarouselButtonBaseProps = Omit<React.ComponentProps<typeof Button>, 'onClick'> & {
  onClick?: React.ComponentProps<typeof Button>['onClick']
}

export function CarouselPrevButton({ className, variant = 'outline', size = 'icon', ...props }: CarouselButtonBaseProps) {
  const { prev, canPrev } = useCarousel()
  return (
    <Button
      type="button"
      aria-label="Vorheriges Element"
      variant={variant}
      size={size}
      disabled={!canPrev}
      onClick={(e) => {
        props.onClick?.(e)
        if (!e.defaultPrevented) prev()
      }}
      className={cn('rounded-full h-10 w-10 border border-border bg-background shadow-sm hover:bg-muted/50 transition', className)}
      {...props}
    />
  )
}

export function CarouselNextButton({ className, variant = 'outline', size = 'icon', ...props }: CarouselButtonBaseProps) {
  const { next, canNext } = useCarousel()
  return (
    <Button
      type="button"
      aria-label="Nächstes Element"
      variant={variant}
      size={size}
      disabled={!canNext}
      onClick={(e) => {
        props.onClick?.(e)
        if (!e.defaultPrevented) next()
      }}
      className={cn('rounded-full h-10 w-10 border border-border bg-background shadow-sm hover:bg-muted/50 transition', className)}
      {...props}
    />
  )
}

export type CarouselDotsProps = React.ComponentProps<'div'> & {
  className?: string
}

export function CarouselDots({ className, ...props }: CarouselDotsProps) {
  const { itemsCount, index, goTo } = useCarousel()
  if (itemsCount <= 1) return null

  return (
    <div className={cn('flex items-center justify-center gap-2', className)} {...props}>
      {Array.from({ length: itemsCount }).map((_, i) => {
        const isActive = i === index
        return (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Gehe zu Slide ${i + 1}`}
            aria-current={isActive ? 'true' : undefined}
            className={cn(
              'h-2.5 w-2.5 rounded-full transition-colors',
              isActive ? 'bg-primary' : 'bg-muted ring-1 ring-border/20 hover:opacity-70',
            )}
          />
        )
      })}
    </div>
  )
}

/**
 * Manuelle QA Checkliste:
 * - Maus: Prev/Next Buttons
 * - Touch: horizontal swipen (drag threshold)
 * - Keyboard: ArrowLeft/ArrowRight/Home/End (nicht in Inputs/Textareas abfangen)
 * - Reduced motion: prefers-reduced-motion → keine smooth transitions
 * - Loop an/aus: wrap-around + disabled states korrekt bei loop=false
 * - Fokus: Buttons/Dots bleiben fokussierbar, keine aria-hidden/focus warnings in der Console
 */
