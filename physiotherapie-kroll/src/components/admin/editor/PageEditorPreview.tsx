"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Monitor, Tablet, Smartphone } from "lucide-react"
import type { AdminPage } from "@/lib/cms/supabaseStore"
import { InlineFieldEditor } from "@/components/admin/InlineFieldEditor"
import {
  EDITOR_MESSAGE_TYPES,
  PREVIEW_MESSAGE_TYPES,
  createBridgeEnvelope,
  isBridgeMessage,
} from "@/shared/previewBridge/contract"

interface PageEditorPreviewProps {
  current: AdminPage
  selectedBlockId: string | null
  selectedElementId: string | null
  expandedRepeaterCards: Record<string, string | null>
  inlineOpen: boolean
  inlineAnchorRect: DOMRect | null
  inlineLabel: string
  inlineValue: string
  inlineMultiline: boolean
  onInlineChange: (value: string) => void
  onInlineClose: () => void
  onEditField: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  onBlockSelect: (blockId: string) => void
  onElementClick: (blockId: string, elementId: string) => void
  onMoveBlock: (index: number, direction: -1 | 1) => void
  onDuplicateBlock: (index: number) => void
  onRemoveBlock: (blockId: string) => void
  onSelectRepeaterItem: (blockId: string, fieldPath: string, itemId: string) => void
}

export function PageEditorPreview({
  current,
  selectedBlockId,
  selectedElementId,
  expandedRepeaterCards,
  inlineOpen,
  inlineAnchorRect,
  inlineLabel,
  inlineValue,
  inlineMultiline,
  onInlineChange,
  onInlineClose,
  onEditField,
  onBlockSelect,
  onElementClick,
  onMoveBlock,
  onDuplicateBlock,
  onRemoveBlock,
  onSelectRepeaterItem,
}: PageEditorPreviewProps) {
  const liveScrollRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const sessionIdRef = useRef<string | null>(null)

  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">(() => {
    if (typeof window === "undefined") return "desktop"
    const v = window.localStorage.getItem("admin.preview.viewport")
    if (v === "tablet" || v === "mobile" || v === "desktop") return v
    return "desktop"
  })

  useEffect(() => {
    window.localStorage.setItem("admin.preview.viewport", viewport)
  }, [viewport])

  const deviceWidth = useMemo(() => {
    if (viewport === "mobile") return 390
    if (viewport === "tablet") return 820
    return null
  }, [viewport])

  // Handshake: PREVIEW_READY -> EDITOR_ACK
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!isBridgeMessage(event.data)) return
      const msg = event.data
      if (msg.type !== PREVIEW_MESSAGE_TYPES.PREVIEW_READY) return
      if (msg.pageId !== String(current.id)) return

      const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      sessionIdRef.current = sessionId

      iframeRef.current?.contentWindow?.postMessage(
        createBridgeEnvelope(
          EDITOR_MESSAGE_TYPES.EDITOR_ACK,
          String(current.id),
          { sessionId },
          { source: "editor", sessionId }
        ),
        "*"
      )
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [current.id])

  // Preview -> Editor: selection
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!isBridgeMessage(event.data)) return
      const msg = event.data
      if (msg.pageId !== String(current.id)) return
      if (msg.type !== PREVIEW_MESSAGE_TYPES.PREVIEW_SELECT) return

      const payload = msg.payload as { blockId?: string; elementId?: string | null }
      const blockId = payload?.blockId
      if (!blockId) return

      const repeater = (payload as any)?.repeater as { fieldPath: string; itemId: string } | null | undefined
      if (repeater?.fieldPath && repeater?.itemId) {
        onSelectRepeaterItem(blockId, repeater.fieldPath, repeater.itemId)
        return
      }

      onBlockSelect(blockId)
      const elementId = payload?.elementId ?? null
      if (elementId) onElementClick(blockId, elementId)
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [current.id, onBlockSelect, onElementClick, onSelectRepeaterItem])

  // Preview -> Editor: start inline edit (data-cms-field click)
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!isBridgeMessage(event.data)) return
      const msg = event.data
      if (msg.pageId !== String(current.id)) return
      if (msg.type !== PREVIEW_MESSAGE_TYPES.PREVIEW_START_EDIT) return

      const payload = msg.payload as {
        blockId?: string
        fieldPath?: string | null
        rect?: { left: number; top: number; width: number; height: number } | null
      }
      const blockId = payload?.blockId
      const fieldPath = payload?.fieldPath ?? null
      if (!blockId || !fieldPath) return

      onBlockSelect(blockId)

      let anchorRect: DOMRect | undefined
      if (payload.rect && iframeRef.current) {
        const iframeRect = iframeRef.current.getBoundingClientRect()
        anchorRect = new DOMRect(
          iframeRect.left + payload.rect.left,
          iframeRect.top + payload.rect.top,
          payload.rect.width,
          payload.rect.height
        )
      }

      onEditField(blockId, fieldPath, anchorRect)
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [current.id, onBlockSelect, onEditField])

  // Push draft updates into iframe
  useEffect(() => {
    const w = iframeRef.current?.contentWindow
    if (!w) return
    w.postMessage(
      createBridgeEnvelope(
        EDITOR_MESSAGE_TYPES.EDITOR_SET_DRAFT,
        String(current.id),
        {
          brand: String(current.brand || "physiotherapy"),
          pageSlug: String(current.slug || ""),
          blocks: current.blocks,
        },
        { source: "editor", sessionId: sessionIdRef.current ?? undefined }
      ),
      "*"
    )
  }, [current.brand, current.slug, current.blocks, current.id])

  // Highlight selection inside iframe
  useEffect(() => {
    const w = iframeRef.current?.contentWindow
    if (!w) return
    w.postMessage(
      createBridgeEnvelope(
        EDITOR_MESSAGE_TYPES.EDITOR_HIGHLIGHT,
        String(current.id),
        {
          state: selectedBlockId || selectedElementId ? "on" : "off",
          blockId: selectedBlockId,
          elementId: selectedElementId,
        },
        { source: "editor", sessionId: sessionIdRef.current ?? undefined }
      ),
      "*"
    )
  }, [current.id, selectedBlockId, selectedElementId])

  return (
    <div
      ref={liveScrollRef}
      className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/30 p-8 min-h-0"
      onScroll={(e) => {
        e.stopPropagation()
      }}
      onClick={(e) => {
        const target = e.target as HTMLElement
        const link = target.closest("a")
        if (link) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-muted-foreground">Live Preview</div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1 shadow-sm">
            <Button
              type="button"
              variant={viewport === "desktop" ? "default" : "ghost"}
              size="sm"
              className="h-8 gap-2"
              onClick={() => setViewport("desktop")}
              title="Desktop"
            >
              <Monitor className="h-4 w-4" />
              Desktop
            </Button>
            <Button
              type="button"
              variant={viewport === "tablet" ? "default" : "ghost"}
              size="sm"
              className="h-8 gap-2"
              onClick={() => setViewport("tablet")}
              title="Tablet (~820px)"
            >
              <Tablet className="h-4 w-4" />
              Tablet
            </Button>
            <Button
              type="button"
              variant={viewport === "mobile" ? "default" : "ghost"}
              size="sm"
              className="h-8 gap-2"
              onClick={() => setViewport("mobile")}
              title="Mobile (~390px)"
            >
              <Smartphone className="h-4 w-4" />
              Mobile
            </Button>
          </div>
        </div>

        <div className="flex justify-center">
          <div
            className={cn(
              "relative overflow-hidden rounded-xl border border-border bg-background shadow-sm",
              "max-h-[calc(100dvh-220px)]"
            )}
            style={{
              width: deviceWidth ? `${deviceWidth}px` : "100%",
              maxWidth: "100%",
            }}
          >
            <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-black/5" />
            <iframe
              ref={iframeRef}
              title="Admin Live Preview"
              className="block h-[calc(100dvh-220px)] w-full bg-background"
              src={`/preview/${current.id}?brand=${encodeURIComponent(String(current.brand || "physiotherapy"))}`}
            />
          </div>
        </div>

        <div className="mt-3 text-xs text-muted-foreground">Breite: {deviceWidth ? `${deviceWidth}px` : "fluid"}</div>
      </div>

      {/* Inline Editor Popup (must be in parent, above iframe) */}
      <InlineFieldEditor
        open={inlineOpen}
        anchorRect={inlineAnchorRect}
        label={inlineLabel}
        value={inlineValue}
        multiline={inlineMultiline}
        onChange={onInlineChange}
        onClose={onInlineClose}
      />
    </div>
  )
}
