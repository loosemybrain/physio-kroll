"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { usePathname, useSearchParams } from "next/navigation"
import { SpinnerIndicator } from "@/components/ui/SpinnerIndicator"
import {
  readSpinnerConfigForBrand,
  spinnerBrandFromPath,
  type SpinnerConfig,
} from "@/lib/ui/spinnerPresets"

const MIN_VISIBLE_MS = 420
const FALLBACK_HIDE_MS = 7000
const FIRST_VISIT_SESSION_KEY = "pk:first-visit-ready:v1"
const FIRST_VISIT_SETTLE_MS = 450
const FIRST_VISIT_MAX_WAIT_MS = 12000

export function GlobalPageLoader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = React.useState(false)
  const [visible, setVisible] = React.useState(true)
  const [spinnerConfig, setSpinnerConfig] = React.useState<SpinnerConfig>({
    preset: "modern",
    speed: "normal",
    overlayStrength: "medium",
  })
  const startedAtRef = React.useRef<number>(Date.now())
  const hideTimerRef = React.useRef<number | null>(null)
  const fallbackTimerRef = React.useRef<number | null>(null)
  const bootstrappedRef = React.useRef(false)
  const firstVisitPendingRef = React.useRef(false)
  const initialReadyRef = React.useRef(false)

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

  const waitForInitialPageReady = React.useCallback(async () => {
    if (typeof window === "undefined") return

    await new Promise<void>((resolve) => {
      let done = false
      const finish = () => {
        if (done) return
        done = true
        resolve()
      }

      const timeoutId = window.setTimeout(finish, FIRST_VISIT_MAX_WAIT_MS)

      const onLoaded = async () => {
        window.clearTimeout(timeoutId)
        // Let hydration/client fetches settle briefly to avoid visible header/nav popping.
        window.setTimeout(() => {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(finish)
          })
        }, FIRST_VISIT_SETTLE_MS)
      }

      if (document.readyState === "complete") {
        void onLoaded()
        return
      }

      window.addEventListener("load", onLoaded, { once: true })
    })
  }, [])

  React.useEffect(() => {
    setMounted(true)
    const brand = spinnerBrandFromPath(window.location.pathname)
    setSpinnerConfig(readSpinnerConfigForBrand(brand))
    firstVisitPendingRef.current = window.sessionStorage.getItem(FIRST_VISIT_SESSION_KEY) !== "1"
    return () => clearTimers()
  }, [clearTimers])

  React.useEffect(() => {
    if (!mounted) return
    const brand = spinnerBrandFromPath(pathname ?? "/")
    setSpinnerConfig(readSpinnerConfigForBrand(brand))
  }, [mounted, pathname])

  // Initial page load: show once briefly after hydration.
  React.useEffect(() => {
    if (!mounted) return
    if (bootstrappedRef.current) return
    bootstrappedRef.current = true
    showLoader()

    if (!firstVisitPendingRef.current) {
      initialReadyRef.current = true
      hideWithMinDuration()
      return
    }

    let cancelled = false
    void waitForInitialPageReady().then(() => {
      if (cancelled) return
      initialReadyRef.current = true
      firstVisitPendingRef.current = false
      window.sessionStorage.setItem(FIRST_VISIT_SESSION_KEY, "1")
      hideWithMinDuration()
    })

    return () => {
      cancelled = true
    }
  }, [mounted, showLoader, hideWithMinDuration, waitForInitialPageReady])

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
    if (!initialReadyRef.current) return
    hideWithMinDuration()
  }, [mounted, pathname, searchParams, hideWithMinDuration])

  if (!mounted || !visible) return null

  const overlayClass =
    spinnerConfig.overlayStrength === "light"
      ? "bg-background/55"
      : spinnerConfig.overlayStrength === "strong"
        ? "bg-background/88"
        : "bg-background/78"

  return createPortal(
    <div className={`fixed inset-0 z-1000001 flex items-center justify-center ${overlayClass} backdrop-blur-sm`} aria-hidden>
      <SpinnerIndicator preset={spinnerConfig.preset} speed={spinnerConfig.speed} size="lg" />
    </div>,
    document.body
  )
}

