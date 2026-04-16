"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import type { PublicPopup } from "@/types/popups"
import { fetchActivePopupsForPage, pickTopPopup } from "@/lib/popups/publicPopups"
import { preloadImage } from "@/lib/media/preloadImage"
import { PopupModal } from "./PopupModal"

type Props = {
  pageId: string
}

const STORAGE_PREFIX = "physio-kroll:popup-dismissed:v1:"

function dismissKey(popupId: string) {
  return `${STORAGE_PREFIX}${popupId}`
}

function isDismissed(popup: PublicPopup) {
  const key = dismissKey(popup.id)
  try {
    if (popup.showOncePerBrowser) {
      if (typeof localStorage !== "undefined" && localStorage.getItem(key) === "1") return true
    }
    if (popup.showOncePerSession) {
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key) === "1") return true
    }
  } catch {
    // ignore storage errors (private mode etc.)
  }
  return false
}

function markDismissed(popup: PublicPopup) {
  const key = dismissKey(popup.id)
  try {
    if (popup.showOncePerBrowser && typeof localStorage !== "undefined") localStorage.setItem(key, "1")
    if (popup.showOncePerSession && typeof sessionStorage !== "undefined") sessionStorage.setItem(key, "1")
  } catch {
    // ignore
  }
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

function getDocumentScrollPercent(): number {
  if (typeof document === "undefined") return 0

  const docEl = document.documentElement
  const body = document.body
  const scrollingEl = (document.scrollingElement as HTMLElement | null) ?? docEl

  const scrollTop = Math.max(
    window.scrollY ?? 0,
    scrollingEl.scrollTop ?? 0,
    docEl.scrollTop ?? 0,
    body?.scrollTop ?? 0
  )

  const scrollHeight = Math.max(
    scrollingEl.scrollHeight ?? 0,
    docEl.scrollHeight ?? 0,
    body?.scrollHeight ?? 0
  )

  const clientHeight = Math.max(
    window.innerHeight ?? 0,
    scrollingEl.clientHeight ?? 0,
    docEl.clientHeight ?? 0
  )

  const maxScrollable = scrollHeight - clientHeight
  if (maxScrollable <= 1) return 0
  return clampPercent((scrollTop / maxScrollable) * 100)
}

function getElementScrollPercent(el: Element | null): number {
  if (!(el instanceof HTMLElement)) return 0
  const maxScrollable = el.scrollHeight - el.clientHeight
  if (maxScrollable <= 1) return 0
  return clampPercent((el.scrollTop / maxScrollable) * 100)
}

function getBestScrollPercent(eventTarget?: EventTarget | null): number {
  const docPercent = getDocumentScrollPercent()
  const targetPercent = eventTarget instanceof Element ? getElementScrollPercent(eventTarget) : 0
  return Math.max(docPercent, targetPercent)
}

export function PopupRuntime({ pageId }: Props) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [popup, setPopup] = useState<PublicPopup | null>(null)
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)

  const timerRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const scrollHandlerRef = useRef<((ev?: Event) => void) | null>(null)
  const openingRef = useRef(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load + pick top popup on route/page changes.
  useEffect(() => {
    if (!mounted) return
    let cancelled = false

    setReady(false)
    setOpen(false)
    setPopup(null)

    const run = async () => {
      const candidates = await fetchActivePopupsForPage(pageId)
      if (cancelled) return
      const top = pickTopPopup(candidates)
      setPopup(top)
      setReady(true)
    }

    run()
    return () => {
      cancelled = true
    }
  }, [mounted, pageId, pathname])

  const shouldShow = useMemo(() => {
    if (!popup) return false
    if (isDismissed(popup)) return false
    return true
  }, [popup])

  useEffect(() => {
    if (!mounted) return
    if (!popup) return
    if (!shouldShow) return
    const imageUrl = popup.imageUrl?.trim()
    if (!imageUrl) return
    void preloadImage(imageUrl, 1200).catch(() => {
      // fallback: popup flow should continue even if preload fails
    })
  }, [mounted, popup, shouldShow])

  // Trigger engine (cleanup-safe).
  useEffect(() => {
    if (!mounted) return
    if (!ready) return
    if (!popup) return
    if (!shouldShow) return
    if (open) return

    const clear = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (scrollHandlerRef.current) {
        window.removeEventListener("scroll", scrollHandlerRef.current)
        document.removeEventListener("scroll", scrollHandlerRef.current, true)
        scrollHandlerRef.current = null
      }
    }

    let disposed = false

    const openNow = () => {
      if (openingRef.current) return
      openingRef.current = true
      clear()
      const imageUrl = popup.imageUrl?.trim()
      if (!imageUrl) {
        if (!disposed) setOpen(true)
        openingRef.current = false
        return
      }
      void preloadImage(imageUrl, 1200)
        .catch(() => {
          // fallback: never block opening on image errors/timeouts
        })
        .finally(() => {
          if (!disposed) setOpen(true)
          openingRef.current = false
        })
    }

    if (popup.triggerType === "immediate") {
      timerRef.current = window.setTimeout(openNow, 0)
      return () => {
        disposed = true
        openingRef.current = false
        clear()
      }
    }

    if (popup.triggerType === "delay") {
      const seconds = Math.max(0, popup.triggerDelaySeconds ?? 0)
      timerRef.current = window.setTimeout(openNow, seconds * 1000)
      return () => {
        disposed = true
        openingRef.current = false
        clear()
      }
    }

    if (popup.triggerType === "scroll") {
      const threshold = clampPercent(popup.triggerScrollPercent ?? 50)
      if (threshold <= 0) {
        openNow()
        return () => clear()
      }

      const check = (eventTarget?: EventTarget | null) => {
        rafRef.current = null
        const percent = getBestScrollPercent(eventTarget)
        if (percent >= threshold) {
          openNow()
        }
      }

      const onScroll = (ev?: Event) => {
        if (rafRef.current) return
        const target = ev?.target ?? null
        rafRef.current = window.requestAnimationFrame(() => check(target))
      }

      scrollHandlerRef.current = onScroll
      window.addEventListener("scroll", onScroll, { passive: true })
      // capture=true catches non-bubbling scroll events from nested scroll containers
      document.addEventListener("scroll", onScroll, { passive: true, capture: true })
      // initial check (covers already-scrolled restores)
      check()

      return () => {
        disposed = true
        openingRef.current = false
        clear()
      }
    }

    return () => {
      disposed = true
      openingRef.current = false
      clear()
    }
  }, [mounted, ready, popup, shouldShow, open])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next && popup) {
      markDismissed(popup)
    }
  }

  if (!mounted) return null
  if (!popup) return null
  if (!shouldShow && !open) return null

  return <PopupModal popup={popup} open={open} onOpenChange={handleOpenChange} />
}

