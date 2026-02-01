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
import type { PreviewSelectPayload, PreviewReadyPayload } from "@/shared/previewBridge/contract"

export function PreviewClickBridge({ pageId }: { pageId?: string }) {
  const lastSelectionRef = useRef<{
    blockId?: string
    elementId?: string
  }>({})
  const sessionIdRef = useRef<string | null>(null)

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
      const effectiveTarget = target.closest<HTMLElement>("[data-element-id],[data-block-id]") ?? null
      if (!effectiveTarget) return

      const blockEl = effectiveTarget.closest<HTMLElement>("[data-block-id]") ?? null
      if (!blockEl) return

      const blockId = blockEl.getAttribute("data-block-id") ?? undefined
      if (!blockId) return

      const elementEl = effectiveTarget.closest<HTMLElement>("[data-element-id]")
      const elementId = elementEl?.getAttribute("data-element-id") ?? undefined

      // Deduplication: kein Spam an Admin
      const last = lastSelectionRef.current
      if (last.blockId === blockId && last.elementId === elementId) {
        return
      }

      lastSelectionRef.current = { blockId, elementId }

      // Navigation im Preview verhindern (Links, Buttons)
      const link = effectiveTarget.closest("a")
      if (link) {
        e.preventDefault()
        e.stopPropagation()
      }

      // Send PREVIEW_SELECT via contract
      const selectPayload: PreviewSelectPayload = {
        blockId,
        elementId: elementId ?? null,
        mode: elementId ? "element" : "block",
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

  return null
}
