"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { usePathname, useSearchParams } from "next/navigation"

const MIN_VISIBLE_MS = 420
const FALLBACK_HIDE_MS = 7000

export function GlobalPageLoader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = React.useState(false)
  const [visible, setVisible] = React.useState(true)
  const startedAtRef = React.useRef<number>(Date.now())
  const hideTimerRef = React.useRef<number | null>(null)
  const fallbackTimerRef = React.useRef<number | null>(null)
  const bootstrappedRef = React.useRef(false)

  const clearTimers = React.useCallback(() => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }
  }, [])

  const hideWithMinDuration = React.useCallback(() => {
    const elapsed = Date.now() - startedAtRef.current
    const waitMs = Math.max(0, MIN_VISIBLE_MS - elapsed)
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
    hideTimerRef.current = window.setTimeout(() => {
      setVisible(false)
      document.documentElement.removeAttribute("data-page-switching")
    }, waitMs)
  }, [])

  const showLoader = React.useCallback(() => {
    startedAtRef.current = Date.now()
    setVisible(true)
    document.documentElement.setAttribute("data-page-switching", "1")

    if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current)
    fallbackTimerRef.current = window.setTimeout(() => {
      setVisible(false)
      document.documentElement.removeAttribute("data-page-switching")
    }, FALLBACK_HIDE_MS)
  }, [])

  React.useEffect(() => {
    setMounted(true)
    return () => clearTimers()
  }, [clearTimers])

  // Initial page load: show once briefly after hydration.
  React.useEffect(() => {
    if (!mounted) return
    if (bootstrappedRef.current) return
    bootstrappedRef.current = true
    showLoader()
    hideWithMinDuration()
  }, [mounted, showLoader, hideWithMinDuration])

  // Before internal navigation starts (link click / back-forward), show loader.
  React.useEffect(() => {
    if (!mounted) return

    const onClickCapture = (event: MouseEvent) => {
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target as Element | null
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null
      if (!anchor) return
      if (anchor.target && anchor.target !== "_self") return

      const href = anchor.getAttribute("href")?.trim()
      if (!href) return
      if (href.startsWith("#")) return

      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname && url.search === window.location.search) return

      showLoader()
    }

    const onPopState = () => {
      showLoader()
    }

    document.addEventListener("click", onClickCapture, { capture: true })
    window.addEventListener("popstate", onPopState)
    return () => {
      document.removeEventListener("click", onClickCapture, true)
      window.removeEventListener("popstate", onPopState)
    }
  }, [mounted, showLoader])

  // Route is ready -> hide loader with minimum duration.
  React.useEffect(() => {
    if (!mounted) return
    hideWithMinDuration()
  }, [mounted, pathname, searchParams, hideWithMinDuration])

  if (!mounted || !visible) return null

  return createPortal(
    <div className="fixed inset-0 z-1000001 flex items-center justify-center bg-background/78 backdrop-blur-sm" aria-hidden>
      <div className="h-12 w-12 rounded-full border-3 border-foreground/20 border-t-primary animate-spin" />
    </div>,
    document.body
  )
}

