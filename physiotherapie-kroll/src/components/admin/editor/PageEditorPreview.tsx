"use client"

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowDown, ArrowUp, Copy, Monitor, Tablet, Smartphone, Trash2 } from "lucide-react"
import type { AdminPage } from "@/lib/cms/supabaseStore"
import { InlineFieldEditor } from "@/components/admin/InlineFieldEditor"
import {
  EDITOR_MESSAGE_TYPES,
  PREVIEW_MESSAGE_TYPES,
  createBridgeEnvelope,
  isBridgeMessage,
  type EditorScrollToPayload,
  type LegalRichPreviewGranularSelection,
} from "@/shared/previewBridge/contract"

export type PageEditorPreviewHandle = {
  scrollPreviewToBlock: (blockId: string, options?: { source?: "outline" | "editor" }) => void
}

interface PageEditorPreviewProps {
  current: AdminPage
  selectedBlockId: string | null
  selectedElementId: string | null
  legalRichInspectorTarget: LegalRichPreviewGranularSelection | null
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
  onSelectRepeaterItem: (
    blockId: string,
    fieldPath: string,
    itemId: string,
    legalRichListItemId?: string | null,
    legalRichRunId?: string | null,
  ) => void
}

export const PageEditorPreview = forwardRef<PageEditorPreviewHandle, PageEditorPreviewProps>(function PageEditorPreview(
  {
    current,
    selectedBlockId,
    selectedElementId,
    legalRichInspectorTarget,
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
  },
  ref
) {
  const liveScrollRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const sessionIdRef = useRef<string | null>(null)

  useImperativeHandle(
    ref,
    () => ({
      scrollPreviewToBlock: (blockId: string, options?: { source?: "outline" | "editor" }) => {
        const w = iframeRef.current?.contentWindow
        if (!w || !blockId) return
        const payload: EditorScrollToPayload = {
          blockId,
          behavior: "smooth",
          block: "center",
          inline: "nearest",
          source: options?.source ?? "outline",
        }
        w.postMessage(
          createBridgeEnvelope(
            EDITOR_MESSAGE_TYPES.EDITOR_SCROLL_TO,
            String(current.id),
            payload,
            { source: "editor", sessionId: sessionIdRef.current ?? undefined }
          ),
          "*"
        )
      },
    }),
    [current.id]
  )

  const overlayHoveringRef = useRef(false)
  const blockRectMapRef = useRef<Map<string, DOMRect>>(new Map())

  const [hoveredTarget, setHoveredTarget] = useState<{
    blockId: string | null
    rect: DOMRect | null
  }>({ blockId: null, rect: null })

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

  const legalRichGranularForHighlight = useMemo((): LegalRichPreviewGranularSelection | null => {
    if (!selectedBlockId || !legalRichInspectorTarget?.contentBlockId) return null
    const b = current.blocks?.find((x) => x.id === selectedBlockId)
    if (b?.type !== "legalRichText") return null
    return legalRichInspectorTarget
  }, [current.blocks, selectedBlockId, legalRichInspectorTarget])

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

      const payload = msg.payload as {
        blockId?: string
        elementId?: string | null
        rect?: { left: number; top: number; width: number; height: number } | null
      }
      const blockId = payload?.blockId
      if (!blockId) return

      // Persist last-known rect for this block (iframe-relative)
      if (payload.rect) {
        blockRectMapRef.current.set(
          blockId,
          new DOMRect(payload.rect.left, payload.rect.top, payload.rect.width, payload.rect.height)
        )
      }

      const repeater = (payload as { repeater?: { fieldPath: string; itemId: string } | null }).repeater
      const legalRichListItemId = (payload as { legalRichListItemId?: string | null }).legalRichListItemId ?? null
      const legalRichRunId = (payload as { legalRichRunId?: string | null }).legalRichRunId ?? null
      if (repeater?.fieldPath && repeater?.itemId) {
        onSelectRepeaterItem(blockId, repeater.fieldPath, repeater.itemId, legalRichListItemId, legalRichRunId)
        return
      }

      onBlockSelect(blockId)
      const elementId = payload?.elementId ?? null
      if (elementId) onElementClick(blockId, elementId)
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [current.id, onBlockSelect, onElementClick, onSelectRepeaterItem])

  // Preview -> Editor: hover (block rect) for overlay menu
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!isBridgeMessage(event.data)) return
      const msg = event.data
      if (msg.pageId !== String(current.id)) return
      if (msg.type !== PREVIEW_MESSAGE_TYPES.PREVIEW_HOVER) return

      const payload = msg.payload as {
        blockId?: string | null
        rect?:
          | { left: number; top: number; width: number; height: number }
          | { left: number; top: number; right: number; bottom: number; width: number; height: number }
          | null
      }

      const blockId = payload?.blockId ?? null
      const r = payload?.rect ?? null

      if (!blockId || !r) {
        // Don't clear overlay while user is interacting with the overlay itself
        if (overlayHoveringRef.current) return
        setHoveredTarget({ blockId: null, rect: null })
        return
      }

      // Persist last-known rect for this block (iframe-relative)
      const rect = new DOMRect(r.left, r.top, r.width, r.height)
      blockRectMapRef.current.set(blockId, rect)
      setHoveredTarget({ blockId, rect })
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [current.id])

  // No scroll/resize recompute needed: overlay is rendered inside iframe container.

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
          legalRichGranular: legalRichGranularForHighlight,
        },
        { source: "editor", sessionId: sessionIdRef.current ?? undefined }
      ),
      "*"
    )
  }, [current.id, selectedBlockId, selectedElementId, legalRichGranularForHighlight])

  // ---- Overlay Menü Architektur-Update: Overlay immer fest oben rechts ----

  // Bestimme den aktiven Block für das Overlay-Menü (Selection > Hover)
  const activeOverlayBlockId = selectedBlockId || hoveredTarget.blockId || null;
  const overlayIndex = useMemo(() => {
    if (!activeOverlayBlockId) return -1;
    return (current.blocks ?? []).findIndex(
      (b: any) => String(b?.id ?? "") === String(activeOverlayBlockId)
    );
  }, [current.blocks, activeOverlayBlockId]);

  return (
    <div
      ref={liveScrollRef}
      className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/30 p-8 min-h-0"
      onScroll={(e) => {
        e.stopPropagation();
      }}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        const link = target.closest("a");
        if (link) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-muted-foreground">
            Live Preview
          </div>
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

            {/* Overlay-Menü: Immer statisch oben rechts im Container */}
            {activeOverlayBlockId && overlayIndex >= 0 && (
              <div
                className="absolute z-50 top-4 right-4"
                style={{
                  pointerEvents: "none",
                }}
              >
                <div
                  className="pointer-events-auto flex items-center gap-1 rounded-lg border border-border bg-background/95 p-1 shadow-md backdrop-blur"
                  onPointerEnter={() => {
                    overlayHoveringRef.current = true;
                  }}
                  onPointerLeave={() => {
                    overlayHoveringRef.current = false;
                    if (!selectedBlockId) setHoveredTarget({ blockId: null, rect: null });
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Block nach oben"
                    disabled={overlayIndex <= 0}
                    onClick={() => onMoveBlock(overlayIndex, -1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Block nach unten"
                    disabled={overlayIndex >= (current.blocks?.length ?? 0) - 1}
                    onClick={() => onMoveBlock(overlayIndex, 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <div className="mx-1 h-6 w-px bg-border" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Block duplizieren"
                    onClick={() => onDuplicateBlock(overlayIndex)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    title="Block löschen"
                    onClick={() => onRemoveBlock(activeOverlayBlockId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
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
})
