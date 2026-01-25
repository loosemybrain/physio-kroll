"use client"

import { useRef, useLayoutEffect } from "react"

interface UseInspectorAutoscrollOptions {
  inspectorScrollRef: React.RefObject<HTMLElement | null>
  selectedBlockId: string | null
  selectedElementId: string | null
  openAccordionValue?: (value: string) => void
  accordionValue?: string | string[]
}

/**
 * Hook to automatically scroll the Inspector sidebar to the selected element
 * Only scrolls within the Inspector container, never affects page scroll
 */
export function useInspectorAutoscroll({
  inspectorScrollRef,
  selectedBlockId,
  selectedElementId,
  openAccordionValue,
  accordionValue,
}: UseInspectorAutoscrollOptions) {
  const lastScrolledRef = useRef<string | null>(null)

  useLayoutEffect(() => {
    if (!selectedBlockId || !selectedElementId || !inspectorScrollRef.current) {
      return
    }

    // Create a unique key for this selection to avoid re-scrolling on every render
    const selectionKey = `${selectedBlockId}:${selectedElementId}`
    if (lastScrolledRef.current === selectionKey) {
      return
    }

    // Open the accordion for this element if needed
    if (openAccordionValue && selectedElementId) {
      // Check if accordion is already open
      const isOpen = Array.isArray(accordionValue)
        ? accordionValue.includes(selectedElementId)
        : accordionValue === selectedElementId

      if (!isOpen) {
        // Open accordion immediately (synchronously)
        openAccordionValue(selectedElementId)
      }
    }

    // Wait for DOM to update (accordion opening, etc.)
    // Use double requestAnimationFrame to ensure accordion is fully opened
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!inspectorScrollRef.current) return

        // Find the target element in the Inspector
        const targetKey = `element:${selectedElementId}`
        const targetElement = inspectorScrollRef.current.querySelector(
          `[data-inspector-target="${targetKey}"]`
        ) as HTMLElement | null

        if (!targetElement) {
          // Fallback: try to find by elementId in accordion
          const fallbackElement = inspectorScrollRef.current.querySelector(
            `[data-inspector-element="${selectedElementId}"]`
          ) as HTMLElement | null

          if (fallbackElement) {
            scrollToElement(inspectorScrollRef.current, fallbackElement)
            lastScrolledRef.current = selectionKey
          }
          return
        }

        // Scroll to the target element within the Inspector container
        scrollToElement(inspectorScrollRef.current, targetElement)

        // Optional: Focus the first input in the target section
        const firstInput = targetElement.querySelector<HTMLElement>(
          "input, textarea, select"
        )
        if (firstInput) {
          // Use setTimeout to ensure scroll completes before focus
          setTimeout(() => {
            firstInput.focus({ preventScroll: true })
          }, 150)
        }

        lastScrolledRef.current = selectionKey
      })
    })
  }, [selectedBlockId, selectedElementId, inspectorScrollRef, openAccordionValue, accordionValue])
}

/**
 * Scrolls to an element within a scroll container
 * Uses scrollIntoView if possible, otherwise calculates offset manually
 */
function scrollToElement(container: HTMLElement, element: HTMLElement) {
  // Get container and element positions
  const containerRect = container.getBoundingClientRect()
  const elementRect = element.getBoundingClientRect()

  // Calculate if element is visible in container
  const isVisible =
    elementRect.top >= containerRect.top &&
    elementRect.bottom <= containerRect.bottom

  if (isVisible) {
    // Element is already visible, no need to scroll
    return
  }

  // Calculate scroll position
  const containerScrollTop = container.scrollTop
  const elementOffsetTop = element.offsetTop
  const containerOffsetTop = container.offsetTop || 0

  // Calculate desired scroll position
  // Center the element in the container viewport
  const elementHeight = element.offsetHeight
  const containerHeight = container.clientHeight
  const desiredScrollTop =
    elementOffsetTop - containerOffsetTop - containerHeight / 2 + elementHeight / 2

  // Smooth scroll within the container
  container.scrollTo({
    top: Math.max(0, desiredScrollTop),
    behavior: "smooth",
  })
}
