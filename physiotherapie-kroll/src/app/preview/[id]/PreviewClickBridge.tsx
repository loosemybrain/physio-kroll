"use client"

import { useEffect, useRef } from "react"
import {
  PREVIEW_BRIDGE_NS,
  PREVIEW_BRIDGE_V,
  PREVIEW_MESSAGE_TYPES,
  EDITOR_MESSAGE_TYPES,
  isBridgeMessage,
  createBridgeEnvelope,
} from "@/shared/previewBridge/contract"
import type { PreviewHoverPayload, PreviewSelectPayload, PreviewReadyPayload } from "@/shared/previewBridge/contract"

export function PreviewClickBridge({ pageId }: { pageId?: string }) {
  const lastSelectionRef = useRef<{
    blockId?: string
    elementId?: string
    repeaterItemId?: string
    legalRichListItemId?: string | null
    legalRichRunId?: string | null
  }>({})
  const lastHoverRef = useRef<{
    blockId?: string
    left?: number
    top?: number
    right?: number
    bottom?: number
  }>({})
  const hoverRafRef = useRef<number | null>(null)
  const hoveredBlockElRef = useRef<HTMLElement | null>(null)
  const hoveredBlockIdRef = useRef<string | null>(null)
  const sessionIdRef = useRef<string | null>(null)

  const getBlockRoot = (el: HTMLElement): HTMLElement | null => {
    const first = el.closest<HTMLElement>("[data-block-id]")
    if (!first) return null
    const blockId = first.getAttribute("data-block-id")
    if (!blockId) return null

    // data-block-id is also present on nested editable elements.
    // We want the outermost wrapper for the same blockId (BlockRenderer wrapper).
    let cur: HTMLElement = first
    while (cur.parentElement) {
      const p = cur.parentElement
      if (p instanceof HTMLElement && p.getAttribute("data-block-id") === blockId) {
        cur = p
        continue
      }
      break
    }
    return cur
  }

  // Send PREVIEW_READY on mount + receive EDITOR_ACK with sessionId
  useEffect(() => {
    if (!pageId) return

    // Send PREVIEW_READY
    const readyPayload: PreviewReadyPayload = {
      capabilities: ["select", "startEdit", "hover", "highlight"],
    }
    const readyMsg = createBridgeEnvelope(
      PREVIEW_MESSAGE_TYPES.PREVIEW_READY,
      pageId,
      readyPayload,
      { source: "preview" }
    )
    window.parent?.postMessage(readyMsg, "*")

    if (process.env.NODE_ENV !== "production") {
      console.debug("[Preview Bridge] PREVIEW_READY sent", readyMsg)
    }

    // Listen for EDITOR_ACK to cache sessionId
    const handleAck = (event: MessageEvent) => {
      // Allow parent origin for now (would be refined with origin validation in production)
      if (!isBridgeMessage(event.data)) return

      const msg = event.data
      if (msg.type === EDITOR_MESSAGE_TYPES.EDITOR_ACK && msg.pageId === pageId) {
        sessionIdRef.current = msg.sessionId ?? null

        if (process.env.NODE_ENV !== "production") {
          console.debug("[Preview Bridge] EDITOR_ACK received, sessionId cached", sessionIdRef.current)
        }
      }
    }

    window.addEventListener("message", handleAck)
    return () => window.removeEventListener("message", handleAck)
  }, [pageId])

  // Click delegation with pointerdown CAPTURE
  useEffect(() => {
    if (!pageId) return

    const onPointerDownCapture = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return

      // Ignoriere Klicks auf SVG / Icons → wir wollen das semantische Element
      const effectiveTarget =
        target.closest<HTMLElement>(
          [
            "[data-run-id]",
            "[data-list-item-id]",
            "[data-legal-rich-list-item-id]",
            "[data-repeater-item-id]",
            "[data-element-id]",
            "[data-block-id]",
          ].join(","),
        ) ?? null
      if (!effectiveTarget) return

      const blockEl = getBlockRoot(effectiveTarget) ?? null
      if (!blockEl) return

      const blockId = blockEl.getAttribute("data-block-id") ?? undefined
      if (!blockId) return

      const elementEl = effectiveTarget.closest<HTMLElement>("[data-element-id]")
      const elementId = elementEl?.getAttribute("data-element-id") ?? undefined

      const repeaterEl = effectiveTarget.closest<HTMLElement>("[data-repeater-item-id]")
      const repeaterItemId = repeaterEl?.getAttribute("data-repeater-item-id") ?? undefined
      const repeaterFieldPath = repeaterEl?.getAttribute("data-repeater-field") ?? undefined

      const runEl = effectiveTarget.closest<HTMLElement>("[data-run-id]")
      const legalRichRunId = runEl?.getAttribute("data-run-id") ?? null

      const listItemEl =
        effectiveTarget.closest<HTMLElement>("[data-list-item-id]") ??
        effectiveTarget.closest<HTMLElement>("[data-legal-rich-list-item-id]") ??
        runEl?.closest<HTMLElement>("[data-list-item-id]") ??
        runEl?.closest<HTMLElement>("[data-legal-rich-list-item-id]")
      const legalRichListItemId =
        listItemEl?.getAttribute("data-list-item-id") ??
        listItemEl?.getAttribute("data-legal-rich-list-item-id") ??
        null

      // Deduplication: nur gleicher Block+Element+Repeater-Item als Duplikat ignorieren
      const last = lastSelectionRef.current
      if (
        last.blockId === blockId &&
        last.elementId === elementId &&
        last.repeaterItemId === repeaterItemId &&
        last.legalRichListItemId === legalRichListItemId &&
        last.legalRichRunId === legalRichRunId
      ) {
        return
      }

      lastSelectionRef.current = { blockId, elementId, repeaterItemId, legalRichListItemId, legalRichRunId }

      // Navigation im Preview verhindern (Links, Buttons)
      const link = effectiveTarget.closest("a")
      if (link) {
        e.preventDefault()
        e.stopPropagation()
      }

      // Send PREVIEW_SELECT via contract
      const rect = blockEl.getBoundingClientRect()
      const selectPayload: PreviewSelectPayload = {
        blockId,
        elementId: elementId ?? null,
        mode: elementId ? "element" : "block",
        repeater:
          repeaterItemId && repeaterFieldPath
            ? { fieldPath: repeaterFieldPath, itemId: repeaterItemId }
            : null,
        legalRichListItemId,
        legalRichRunId,
        rect: {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        },
      }
      const selectMsg = createBridgeEnvelope(
        PREVIEW_MESSAGE_TYPES.PREVIEW_SELECT,
        pageId,
        selectPayload,
        {
          sessionId: sessionIdRef.current ?? undefined,
          source: "preview",
        }
      )

      if (process.env.NODE_ENV !== "production") {
        console.debug(
          "[Preview Bridge] PREVIEW_SELECT sending:",
          JSON.stringify({
            blockId,
            elementId: elementId ?? null,
            mode: elementId ? "element" : "block",
            hasBlockId: !!blockId,
            hasElementId: !!elementId,
          })
        )
      }

      window.parent?.postMessage(selectMsg, "*")
    }

    document.addEventListener("pointerdown", onPointerDownCapture, true)
    return () => {
      document.removeEventListener("pointerdown", onPointerDownCapture, true)
    }
  }, [pageId])

  // Hover tracking (throttled via rAF) for block overlay menu in editor
  useEffect(() => {
    if (!pageId) return

    const scheduleHoverSend = (payload: PreviewHoverPayload) => {
      if (hoverRafRef.current != null) return
      hoverRafRef.current = window.requestAnimationFrame(() => {
        hoverRafRef.current = null

        const hoverMsg = createBridgeEnvelope(PREVIEW_MESSAGE_TYPES.PREVIEW_HOVER, pageId, payload, {
          sessionId: sessionIdRef.current ?? undefined,
          source: "preview",
        })
        window.parent?.postMessage(hoverMsg, "*")
      })
    }

    const sendHoveredRect = (blockId: string, blockEl: HTMLElement) => {
      const rect = blockEl.getBoundingClientRect()
      lastHoverRef.current = {
        blockId,
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
      }
      scheduleHoverSend({
        blockId,
        elementId: null,
        rect: {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        },
      })
    }

    const onPointerMoveCapture = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return

      const effectiveTarget =
        target.closest<HTMLElement>(
          [
            "[data-run-id]",
            "[data-list-item-id]",
            "[data-legal-rich-list-item-id]",
            "[data-repeater-item-id]",
            "[data-element-id]",
            "[data-block-id]",
          ].join(","),
        ) ?? null

      const blockEl = effectiveTarget ? getBlockRoot(effectiveTarget) : null
      const blockId = blockEl?.getAttribute("data-block-id") ?? undefined

      if (!blockEl || !blockId) {
        const last = lastHoverRef.current
        if (last.blockId) {
          lastHoverRef.current = {}
          hoveredBlockElRef.current = null
          hoveredBlockIdRef.current = null
          scheduleHoverSend({ blockId: null, elementId: null, rect: null })
        }
        return
      }

      // Stabil: Rect nur senden, wenn der Block wechselt.
      const prevBlockId = hoveredBlockIdRef.current
      hoveredBlockIdRef.current = blockId
      hoveredBlockElRef.current = blockEl
      if (prevBlockId !== blockId) {
        sendHoveredRect(blockId, blockEl)
      }
    }

    const onScrollOrResize = () => {
      const blockEl = hoveredBlockElRef.current
      const blockId = hoveredBlockIdRef.current
      if (!blockEl || !blockId) return
      sendHoveredRect(blockId, blockEl)
    }

    const onPointerLeave = () => {
      const last = lastHoverRef.current
      if (last.blockId) {
        lastHoverRef.current = {}
        hoveredBlockElRef.current = null
        hoveredBlockIdRef.current = null
        scheduleHoverSend({ blockId: null, elementId: null, rect: null })
      }
    }

    document.addEventListener("pointermove", onPointerMoveCapture, true)
    window.addEventListener("blur", onPointerLeave)
    document.addEventListener("pointerleave", onPointerLeave)
    window.addEventListener("scroll", onScrollOrResize, true)
    window.addEventListener("resize", onScrollOrResize)

    return () => {
      document.removeEventListener("pointermove", onPointerMoveCapture, true)
      window.removeEventListener("blur", onPointerLeave)
      document.removeEventListener("pointerleave", onPointerLeave)
      window.removeEventListener("scroll", onScrollOrResize, true)
      window.removeEventListener("resize", onScrollOrResize)
      if (hoverRafRef.current != null) {
        window.cancelAnimationFrame(hoverRafRef.current)
        hoverRafRef.current = null
      }
    }
  }, [pageId])

  return null
}
