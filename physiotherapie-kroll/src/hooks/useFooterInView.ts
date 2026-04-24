"use client"

import { useEffect, useState } from "react"

/**
 * Returns true as soon as the <footer> intersects the viewport.
 * Used to hide/disable floating buttons to avoid overlapping footer links.
 */
export function useFooterInView(options?: {
  rootMargin?: string
  threshold?: number | number[]
}) {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    let observer: IntersectionObserver | null = null
    let mo: MutationObserver | null = null
    let cancelled = false

    const setup = (footerEl: Element) => {
      if (observer) observer.disconnect()
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          setInView(!!entry?.isIntersecting)
        },
        {
          root: null,
          rootMargin: options?.rootMargin ?? "0px",
          threshold: options?.threshold ?? 0,
        }
      )
      observer.observe(footerEl)
    }

    const findFooter = () =>
      document.querySelector("footer") ??
      document.querySelector('[role="contentinfo"]') ??
      document.querySelector('[aria-label="Footer"]')

    const initial = findFooter()
    if (initial) {
      setup(initial)
    } else {
      // Footer is loaded async (FooterWrapper fetch). Wait until it appears.
      mo = new MutationObserver(() => {
        if (cancelled) return
        const el = findFooter()
        if (el) {
          mo?.disconnect()
          mo = null
          setup(el)
        }
      })
      mo.observe(document.body, { childList: true, subtree: true })
    }

    return () => {
      cancelled = true
      observer?.disconnect()
      mo?.disconnect()
    }
  }, [options?.rootMargin, options?.threshold])

  return inView
}

