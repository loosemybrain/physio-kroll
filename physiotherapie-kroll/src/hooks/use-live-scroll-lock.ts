"use client"

import { useRef, useLayoutEffect, useCallback } from "react"

/**
 * Hook to prevent Live Preview from scrolling when Inspector values change
 * 
 * Usage:
 * const { liveScrollRef, withLiveScrollLock } = useLiveScrollLock()
 * 
 * In Live Preview container: <div ref={liveScrollRef} ...>
 * In Inspector onChange handlers: withLiveScrollLock(() => { updateValue(...) })
 */
export function useLiveScrollLock() {
  const liveScrollRef = useRef<HTMLDivElement>(null)
  const scrollTopRef = useRef<number>(0)
  const isLockedRef = useRef<boolean>(false)

  /**
   * Captures the current scroll position of the Live Preview
   */
  const captureLiveScroll = useCallback(() => {
    if (liveScrollRef.current) {
      scrollTopRef.current = liveScrollRef.current.scrollTop
    }
  }, [])

  /**
   * Restores the scroll position of the Live Preview
   */
  const restoreLiveScroll = useCallback(() => {
    if (liveScrollRef.current && isLockedRef.current && scrollTopRef.current !== liveScrollRef.current.scrollTop) {
      liveScrollRef.current.scrollTop = scrollTopRef.current
    }
  }, [])

  /**
   * Executes a function while preserving the Live Preview scroll position
   * Captures scroll before execution, restores after React updates
   */
  const withLiveScrollLock = useCallback(<T,>(fn: () => T): T => {
    isLockedRef.current = true
    captureLiveScroll()
    const result = fn()
    
    // Restore scroll after React has updated the DOM
    // Use requestAnimationFrame to ensure DOM updates are complete
    requestAnimationFrame(() => {
      restoreLiveScroll()
      isLockedRef.current = false
    })
    
    return result
  }, [captureLiveScroll, restoreLiveScroll])

  // Initialize scrollTopRef on mount (only once)
  useLayoutEffect(() => {
    if (liveScrollRef.current && scrollTopRef.current === 0) {
      scrollTopRef.current = liveScrollRef.current.scrollTop
    }
  }, [])

  return {
    liveScrollRef,
    captureLiveScroll,
    restoreLiveScroll,
    withLiveScrollLock,
  }
}
