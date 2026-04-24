"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { POPUP_TRIGGER_TYPES, type PublicPopup } from "@/types/popups"
import { fetchActivePopupsForPage, pickTopPopup } from "@/lib/popups/publicPopups"
import { warmupImage } from "@/lib/media/preloadImage"
import { PopupModal } from "./PopupModal"

type Props = {
  pageId: string
}

const STORAGE_PREFIX = "physio-kroll:popup-dismissed:v2:"
const IS_DEV = process.env.NODE_ENV !== "production"

function dismissKey(popup: PublicPopup) {
  const version = popup.updatedAt || "no-updated-at"
  return `${STORAGE_PREFIX}${popup.id}:${version}`
}

type DismissState = {
  dismissed: boolean
  storageKey: string
  via: "localStorage" | "sessionStorage" | "none" | "storage_error"
}

function getDismissState(popup: PublicPopup): DismissState {
  const key = dismissKey(popup)
  try {
    if (popup.showOncePerBrowser) {
      if (typeof localStorage !== "undefined" && localStorage.getItem(key) === "1") {
        return { dismissed: true, storageKey: key, via: "localStorage" }
      }
    }
    if (popup.showOncePerSession) {
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key) === "1") {
        return { dismissed: true, storageKey: key, via: "sessionStorage" }
      }
    }
  } catch {
    return { dismissed: false, storageKey: key, via: "storage_error" }
  }
  return { dismissed: false, storageKey: key, via: "none" }
}

function markDismissed(popup: PublicPopup) {
  const key = dismissKey(popup)
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
  const [popup, setPopup] = useState<PublicPopup | null>(null)
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const [candidateCount, setCandidateCount] = useState(0)

  const timerRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const scrollHandlerRef = useRef<((ev?: Event) => void) | null>(null)
  const openingRef = useRef(false)
  /** Nach manuellem Schließen: kein erneutes Auto-Öffnen auf derselben Route (sonst feuert der Trigger-Effect bei open=false erneut). */
  const userClosedPopupRef = useRef(false)
  const lastRouteKeyRef = useRef("")
  const requestIdRef = useRef(0)

  // Load + pick top popup on route/page changes.
  useEffect(() => {
    let cancelled = false
    const requestId = ++requestIdRef.current

    const routeKey = `${pageId}:${pathname}`
    if (lastRouteKeyRef.current !== routeKey) {
      lastRouteKeyRef.current = routeKey
      userClosedPopupRef.current = false
    }

    queueMicrotask(() => {
      if (cancelled) return
      if (requestId !== requestIdRef.current) return
      setReady(false)
      setOpen(false)
      setPopup(null)
      setCandidateCount(0)
    })

    const run = async () => {
      const candidates = await fetchActivePopupsForPage(pageId)
      if (cancelled) return
      if (requestId !== requestIdRef.current) return
      const top = pickTopPopup(candidates)
      setCandidateCount(candidates.length)
      setPopup(top)
      setReady(true)
      if (IS_DEV) {
        console.info("[PopupRuntime] fetch result", {
          pageId,
          pathname,
          candidatesCount: candidates.length,
          selectedPopupId: top?.id ?? null,
          selectedPopupTriggerType: top?.triggerType ?? null,
        })
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [pageId, pathname])

  const dismissState = useMemo(() => {
    if (!popup) return null
    return getDismissState(popup)
  }, [popup])

  const shouldShow = useMemo(() => {
    if (!popup) return false
    if (dismissState?.dismissed) return false
    return true
  }, [popup, dismissState])

  useEffect(() => {
    if (!IS_DEV) return
    const payload = {
      pageId,
      pathname,
      ready,
      open,
      candidatesCount: candidateCount,
      selectedPopupId: popup?.id ?? null,
      triggerType: popup?.triggerType ?? null,
      shouldShow,
      dismissed: dismissState?.dismissed ?? false,
      dismissedVia: dismissState?.via ?? "none",
      dismissStorageKey: dismissState?.storageKey ?? null,
    }
    console.info("[PopupRuntime] visibility", payload)
    if (dismissState?.dismissed) {
      console.warn("[PopupRuntime] popup hidden: dismissed in storage", {
        via: dismissState.via,
        dismissStorageKey: dismissState.storageKey,
      })
    }
  }, [pageId, pathname, ready, open, candidateCount, popup, shouldShow, dismissState])

  // Trigger engine (cleanup-safe).
  useEffect(() => {
    if (!ready) return
    if (!popup) return
    if (!shouldShow) return
    if (open) return
    if (userClosedPopupRef.current) return

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
      // Popup-Anzeige niemals blockieren: Preload läuft nur als Hintergrundoptimierung.
      if (imageUrl && imageUrl !== "null" && imageUrl !== "undefined") {
        warmupImage(imageUrl)
      }
      if (!disposed) setOpen(true)
      openingRef.current = false
    }

    const triggerOk = (POPUP_TRIGGER_TYPES as readonly string[]).includes(popup.triggerType)
    if (IS_DEV && !triggerOk) {
      console.warn("[PopupRuntime] unknown triggerType, falling back to delay", {
        triggerType: popup.triggerType,
        popupId: popup.id,
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

    if (popup.triggerType === "delay" || !triggerOk) {
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
        return () => {
          disposed = true
          openingRef.current = false
          clear()
        }
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
  }, [ready, popup, shouldShow, open])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      userClosedPopupRef.current = true
      if (popup) markDismissed(popup)
    }
  }

  if (!popup) return null
  if (!shouldShow && !open) return null

  return <PopupModal popup={popup} open={open} onOpenChange={handleOpenChange} />
}

