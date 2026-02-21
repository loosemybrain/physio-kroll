"use client"

import { useMemo, useState, useRef, useEffect, useCallback, useLayoutEffect } from "react"
import { useLiveScrollLock } from "@/hooks/use-live-scroll-lock"
import { useInspectorAutoscroll } from "@/hooks/use-inspector-autoscroll"
import { ArrowLeft, Save, Send, Type, ImageIcon, Layout, Grid3X3, Megaphone, Trash2, Square, Grid, HelpCircle, Users, Plus, ChevronUp, ChevronDown, Copy, FileText, MessageSquareQuote, Images, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { BlockSectionProps, CMSBlock, HeroBlock } from "@/types/cms"
import { BlockRenderer } from "@/components/cms/BlockRenderer"
import { usePage } from "@/lib/cms/useLocalCms"
import { createEmptyPage, generateUniqueSlug, type AdminPage } from "@/lib/cms/supabaseStore"
import type { BrandKey } from "@/components/brand/brandAssets"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { blockRegistry, getBlockDefinition, createServiceCard, createFaqItem, createTeamMember, createFeatureItem, createContactFormField, createTestimonialItem, createGalleryImage, createImageSlide, createOpeningHour, createContactInfoCard, createHeroAction, sortInspectorFields, INSPECTOR_GROUP_LABELS, DEFAULT_GROUP_ORDER } from "@/cms/blocks/registry"
import { normalizeBlock } from "@/cms/blocks/normalize"
import type { InspectorField, InspectorFieldType } from "@/cms/blocks/registry"
import { getAvailableIconNames, getAvailableIconsWithLabels } from "@/components/icons/service-icons"
import { arrayRemove, arrayMove, arrayInsert } from "@/lib/cms/arrayOps"
import { duplicateBlock } from "@/cms/blocks/duplicateBlock"
import { InlineFieldEditor } from "./InlineFieldEditor"
import { ImageField } from "./ImageField"
import { TypographyInspectorSection } from "./TypographyInspectorSection"
import { SectionInspectorSection } from "./SectionInspectorSection"
import { AnimationInspector } from "./AnimationInspector"
import { ElementTypographySection } from "./ElementTypographySection"
import { ElementTypographyAccordion } from "../cms/inspector/ElementTypographyAccordion"
import { Accordion } from "@/components/ui/accordion"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { validatePageForPublish, type PublishIssue } from "@/cms/validation/publishValidator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, X } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import type { TypographySettings } from "@/lib/typography"
import { ColorField } from "./ColorField"
import { LivePreviewTheme } from "./LivePreviewTheme"
import { ShadowInspector } from "./ShadowInspector"
import { resolveBoxShadow } from "@/lib/shadow/resolveBoxShadow"
import type { ElementShadow, ElementConfig } from "@/types/cms"
import { resolveMediaClient } from "@/lib/cms/resolveMediaClient"
import { BUTTON_PRESET_OPTIONS } from "@/lib/buttonPresets"


interface PageEditorProps {
  pageId: string | null
  onBack: () => void
}

const blockTypes: Array<{ icon: React.ElementType; label: string; type: CMSBlock["type"] }> = [
  { icon: Layout, label: "Hero", type: "hero" },
  { icon: Type, label: "Text", type: "text" },
  { icon: ImageIcon, label: "Image+Text", type: "imageText" },
  { icon: Grid3X3, label: "Features", type: "featureGrid" },
  { icon: Megaphone, label: "CTA", type: "cta" },
  { icon: Square, label: "Section", type: "section" },
  { icon: Grid, label: "Services", type: "servicesGrid" },
  { icon: MessageSquareQuote, label: "Testimonials", type: "testimonials" },
  { icon: Images, label: "Galerie", type: "gallery" },
  { icon: Images, label: "Bild-Slider", type: "imageSlider" },
  { icon: Clock, label: "Öffnungszeiten", type: "openingHours" },
  { icon: HelpCircle, label: "FAQ", type: "faq" },
  { icon: Users, label: "Team", type: "team" },
  { icon: FileText, label: "Kontaktformular", type: "contactForm" },
/*   { icon: MessageSquareQuote, label: "Testimonial Slider", type: "testimonialSlider" }, */
]

function uuid() {
  // React keys/IDs must be unique even when multiple items are created within the same millisecond.
  // In some environments (SSR/older browsers) crypto.randomUUID() may be unavailable.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  // Fallback must still be a *valid UUID*, otherwise Supabase inserts/updates will fail
  // because blocks.id is a uuid column.
  const buf = new Uint8Array(16)
  const cryptoObj = (globalThis as unknown as { crypto?: Crypto }).crypto
  if (cryptoObj?.getRandomValues) {
    cryptoObj.getRandomValues(buf)
  }

  // RFC 4122 v4
  buf[6] = (buf[6] & 0x0f) | 0x40
  buf[8] = (buf[8] & 0x3f) | 0x80

  const hex = [...buf].map((b) => b.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function defaultBlock<T extends CMSBlock["type"]>(type: T, brand: BrandKey): Extract<CMSBlock, { type: T }> {
  const id = uuid()
  const definition = getBlockDefinition(type)
  const defaults = { ...definition.defaults }
  
  // Override brand-specific defaults
  if (type === "hero" && "mood" in defaults) {
    defaults.mood = brand
  }
  
      return {
        id,
        type,
    props: defaults,
  } as Extract<CMSBlock, { type: T }>
}

/**
 * Helper to get value from object by path (e.g. "headline" or "props.content")
 */
/**
 * Helper to get value from object by path (e.g. "headline" or "cards.0.title")
 * Supports nested paths including arrays with object items
 */
function getByPath(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".")
  let current: unknown = obj
  for (const key of keys) {
    if (current && typeof current === "object") {
      if (Array.isArray(current)) {
        // Handle array index access (e.g., "cards.0")
        const index = parseInt(key, 10)
        if (!isNaN(index) && index >= 0 && index < current.length) {
          current = current[index]
        } else {
          return undefined
        }
      } else if (key in current) {
        current = (current as Record<string, unknown>)[key]
      } else {
        return undefined
      }
    } else {
      return undefined
    }
  }
  return current
}

/**
 * Helper to set value in object by path (immutable)
 * Supports nested paths like "trustItems.0" for arrays
 * Supports nested object paths in arrays like "cards.0.title"
 */
function setByPath<T extends Record<string, unknown>>(obj: T, path: string, value: unknown): T {
  const keys = path.split(".")
  if (keys.length === 1) {
    return { ...obj, [keys[0]]: value } as T
  }
  
  const [first, ...rest] = keys
  const currentValue = obj[first]
  const maybeIndex = parseInt(rest[0] ?? "", 10)
  const isIndex = rest.length > 0 && !isNaN(maybeIndex) && maybeIndex >= 0
  
  // Handle arrays (e.g., "trustItems.0" or "cards.0.title")
  if (Array.isArray(currentValue) || isIndex) {
    const index = maybeIndex
    if (index >= 0) {
      // If currentValue is not an array yet (e.g. trustItems missing), create one.
      // Also: if it was accidentally stored as an object with numeric keys, convert it.
      let base: unknown[] = []
      if (Array.isArray(currentValue)) {
        base = [...currentValue]
      } else if (currentValue && typeof currentValue === "object") {
        const rec = currentValue as Record<string, unknown>
        const numericKeys = Object.keys(rec).filter((k) => /^\d+$/.test(k))
        if (numericKeys.length > 0) {
          const max = Math.max(...numericKeys.map((k) => parseInt(k, 10)))
          const arr = new Array(max + 1).fill("")
          for (const k of numericKeys) {
            arr[parseInt(k, 10)] = rec[k]
          }
          base = arr
        }
      }

      const newArray = [...base]
      
      // Extend array if needed BEFORE accessing
      while (newArray.length <= index) {
        newArray.push(rest.length > 1 ? {} : "")
      }
      
      // If there are more keys after the index, it's a nested object in the array (e.g., "cards.0.title")
      if (rest.length > 1) {
        // Get the object at this index, or create a new one
        const arrayItem = (newArray[index] && typeof newArray[index] === "object" && !Array.isArray(newArray[index]))
          ? { ...(newArray[index] as Record<string, unknown>) }
          : {}
        
        // Recursively set the nested path (e.g., "title" from "cards.0.title")
        const nestedPath = rest.slice(1).join(".")
        newArray[index] = setByPath(arrayItem as Record<string, unknown>, nestedPath, value)
      } else {
        // Direct array index assignment (e.g., "trustItems.0")
        newArray[index] = value
      }
      
      return { ...obj, [first]: newArray } as T
    }
  }
  
  // Handle nested objects
  const nested = (currentValue && typeof currentValue === "object" && !Array.isArray(currentValue))
    ? (currentValue as Record<string, unknown>)
    : {}
  return {
    ...obj,
    [first]: setByPath(nested, rest.join("."), value),
  } as T
}

function normalizeStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string") as string[]
  if (typeof v === "string") return [v]
  if (v && typeof v === "object") {
    const rec = v as Record<string, unknown>
    const numericKeys = Object.keys(rec).filter((k) => /^\d+$/.test(k)).sort((a, b) => Number(a) - Number(b))
    if (numericKeys.length > 0) {
      return numericKeys
        .map((k) => rec[k])
        .filter((x) => typeof x === "string") as string[]
    }
  }
  return []
}

function mapHeroFieldPathForActiveBrand(
  block: CMSBlock,
  fieldPath: string,
  activeBrandTab: Record<string, "physiotherapy" | "physio-konzept">
): string {
  if (block.type !== "hero") return fieldPath

  const heroProps = block.props as HeroBlock["props"]
  const brand = activeBrandTab[block.id] || heroProps.mood || "physiotherapy"

  const brandContentFieldMap: Record<string, string> = {
    headline: `brandContent.${brand}.headline`,
    subheadline: `brandContent.${brand}.subheadline`,
    ctaText: `brandContent.${brand}.ctaText`,
    ctaHref: `brandContent.${brand}.ctaHref`,
    secondaryCtaText: `brandContent.${brand}.secondaryCtaText`,
    secondaryCtaHref: `brandContent.${brand}.secondaryCtaHref`,
    badgeText: `brandContent.${brand}.badgeText`,
    playText: `brandContent.${brand}.playText`,
    floatingTitle: `brandContent.${brand}.floatingTitle`,
    floatingValue: `brandContent.${brand}.floatingValue`,
    floatingLabel: `brandContent.${brand}.floatingLabel`,
  }

  if (fieldPath.startsWith("trustItems.")) {
    return `brandContent.${brand}.${fieldPath}`
  }

  return brandContentFieldMap[fieldPath] || fieldPath
}

/**
 * Determines if a field should be multiline based on block type and field path
 */
function isMultilineField(blockType: CMSBlock["type"], fieldPath: string): boolean {
  if (fieldPath === "content") {
    return true // text.content, imageText.content are always multiline
  }
  
  // cards.*.text fields are multiline
  if (fieldPath.match(/^cards\.\d+\.text$/)) {
    return true
  }
  
  // faq items.*.answer fields are multiline
  if (fieldPath.match(/^items\.\d+\.answer$/)) {
    return true
  }
  
  // featureGrid features.*.description fields are multiline
  if (fieldPath.match(/^features\.\d+\.description$/)) {
    return true
  }
  
  // hero.subheadline and cta.subheadline are single-line (Input)
  if (fieldPath === "subheadline") {
    return false
  }
  
  // All other fields are single-line by default
  return false
}

export function PageEditor({ pageId, onBack }: PageEditorProps) {
  const { page, setPage, save } = usePage(pageId)
  const { toast } = useToast()
  const isNewPage = !pageId || pageId === "new"
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [activeFieldPath, setActiveFieldPath] = useState<string | null>(null)
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>>({})
  
  // Inspector scroll ref and accordion state (must be defined before hooks that use it)
  const inspectorScrollRef = useRef<HTMLDivElement>(null)
  const [accordionValue, setAccordionValue] = useState<string | undefined>(undefined)
  
  // Live scroll lock hook
  const { liveScrollRef, withLiveScrollLock } = useLiveScrollLock()
  
  // Inspector auto-scroll hook
  useInspectorAutoscroll({
    inspectorScrollRef,
    selectedBlockId,
    selectedElementId,
    openAccordionValue: (value) => setAccordionValue(value),
    accordionValue,
  })
  
  // Reset element selection and accordion when block selection changes
  useEffect(() => {
    setSelectedElementId(null)
    setAccordionValue(undefined)
  }, [selectedBlockId])
  
  // Inline editor state
  const [inlineOpen, setInlineOpen] = useState(false)
  const [inlineBlockId, setInlineBlockId] = useState<string | null>(null)
  const [inlineFieldPath, setInlineFieldPath] = useState<string | null>(null)
  const [inlineAnchorRect, setInlineAnchorRect] = useState<DOMRect | null>(null)

  // Publish validation state
  const [publishIssues, setPublishIssues] = useState<PublishIssue[]>([])

  // Array operation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ blockId: string; arrayPath: string; index: number } | null>(null)

  // Brand tab state for Hero blocks (per block ID)
  const [activeBrandTab, setActiveBrandTab] = useState<Record<string, "physiotherapy" | "physio-konzept">>({})
  
  // Track which Hero blocks have been migrated to avoid re-migration loops
  const migratedHeroBlocksRef = useRef<Set<string>>(new Set())

  // Ensure createEmptyPage is only called on client after mount to avoid hydration mismatch
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  // IMPORTANT:
  // Do NOT call createEmptyPage() during render as a fallback. It generates new UUIDs,
  // which makes "new page" interactions (e.g. brand toggle) flaky before `usePage()`
  // finishes initializing state.
  const current = page

  // Track block structure to only normalize when blocks are added/removed
  const prevBlockIdsRef = useRef<string>('')
  const isInitialMountRef = useRef(true)
  
  // Normalize blocks on load - but preserve user edits
  // Only normalize if blocks structure changed (length/ids), not on every prop update
  const normalizedBlocks = useMemo(() => {
    if (!current) return []
    // Check if blocks structure changed (new blocks added/removed)
    const blockIds = current.blocks.map(b => b.id).join(',')
    const structureChanged = blockIds !== prevBlockIdsRef.current
    
    // On initial mount or structure change, normalize
    if (isInitialMountRef.current || structureChanged) {
      isInitialMountRef.current = false
      prevBlockIdsRef.current = blockIds
      return current.blocks.map(normalizeBlock)
    }
    
    // Structure unchanged - preserve existing blocks as-is (don't re-normalize)
    // This prevents overwriting user edits with defaults
    return current.blocks
  }, [current?.blocks])

  const selectedBlock = useMemo(() => {
    if (!current) return null
    // Use current.blocks to avoid stale state
    const block = current.blocks.find((b) => b.id === selectedBlockId) ?? null
    // Don't normalize here - it would overwrite user edits with defaults
    return block
  }, [current?.blocks, selectedBlockId])
  
  // Initialize activeBrandTab when Hero block is selected (must be after selectedBlock definition)
  useEffect(() => {
    if (selectedBlock?.type === "hero" && !activeBrandTab[selectedBlock.id]) {
      const props = selectedBlock.props as HeroBlock["props"]
      // Use mood prop or default to physiotherapy
      const defaultBrand = props.mood || "physiotherapy"
      setActiveBrandTab((prev) => ({ ...prev, [selectedBlock.id]: defaultBrand }))
    }
  }, [selectedBlock, activeBrandTab])
  
  // Migrate Hero block brandContent structure (only once per block, in useEffect to avoid render loop)
  useEffect(() => {
    if (!selectedBlock || selectedBlock.type !== "hero") return
    const blockId = selectedBlock.id
    // Skip if already migrated
    if (migratedHeroBlocksRef.current.has(blockId)) return
    
    const heroProps = selectedBlock.props as HeroBlock["props"]
    let needsUpdate = false
    let updatedBrandContent = heroProps.brandContent || {
      physiotherapy: {
        headline: heroProps.headline || "",
        subheadline: heroProps.subheadline || "",
      },
      "physio-konzept": {
        headline: "",
        subheadline: "",
      },
    }
    
    // Check if migration is needed
    if (!heroProps.brandContent) {
      // Full migration from legacy props
      updatedBrandContent = {
        physiotherapy: {
          headline: heroProps.headline || "",
          subheadline: heroProps.subheadline || "",
          ctaText: heroProps.ctaText,
          ctaHref: heroProps.ctaHref,
          badgeText: heroProps.badgeText,
          playText: heroProps.playText,
          trustItems: heroProps.trustItems,
          floatingTitle: heroProps.floatingTitle,
          floatingValue: heroProps.floatingValue,
          floatingLabel: heroProps.floatingLabel,
          image: heroProps.mediaUrl ? { url: heroProps.mediaUrl } : undefined,
        },
        "physio-konzept": {
          headline: "",
          subheadline: "",
        },
      }
      needsUpdate = true
    } else {
      // Ensure both brands exist
      if (!updatedBrandContent.physiotherapy) {
        updatedBrandContent.physiotherapy = {
          headline: heroProps.headline || "",
          subheadline: heroProps.subheadline || "",
        }
        needsUpdate = true
      }
      if (!updatedBrandContent["physio-konzept"]) {
        updatedBrandContent["physio-konzept"] = {
          headline: "",
          subheadline: "",
        }
        needsUpdate = true
      }
      
      // Ensure headline and subheadline always exist
      if (typeof updatedBrandContent.physiotherapy.headline === "undefined") {
        updatedBrandContent.physiotherapy = {
          ...updatedBrandContent.physiotherapy,
          headline: heroProps.headline || "",
        }
        needsUpdate = true
      }
      if (typeof updatedBrandContent.physiotherapy.subheadline === "undefined") {
        updatedBrandContent.physiotherapy = {
          ...updatedBrandContent.physiotherapy,
          subheadline: heroProps.subheadline || "",
        }
        needsUpdate = true
      }
      if (typeof updatedBrandContent["physio-konzept"].headline === "undefined") {
        updatedBrandContent["physio-konzept"] = {
          ...updatedBrandContent["physio-konzept"],
          headline: "",
        }
        needsUpdate = true
      }
      if (typeof updatedBrandContent["physio-konzept"].subheadline === "undefined") {
        updatedBrandContent["physio-konzept"] = {
          ...updatedBrandContent["physio-konzept"],
          subheadline: "",
        }
        needsUpdate = true
      }
    }
    
    // Only update if we made changes
    if (needsUpdate) {
      const updatedProps = {
        ...heroProps,
        brandContent: updatedBrandContent,
      }
      // Mark as migrated before updating to prevent loop
      migratedHeroBlocksRef.current.add(blockId)
      updateSelectedProps(updatedProps as CMSBlock["props"])
    } else {
      // Mark as migrated even if no update needed
      migratedHeroBlocksRef.current.add(blockId)
    }
  }, [selectedBlock?.id]) // Only run when block ID changes
  
  // Focus active field when it changes (only when explicitly set via handleEditField, not on every render)
  const prevActiveFieldPathRef = useRef<string | null>(null)
  const prevSelectedBlockIdRef = useRef<string | null>(null)
  const isTypingRef = useRef(false)
  
  useEffect(() => {
    // Don't steal focus / scroll inside inspector while inline editor is open
    if (inlineOpen) {
      return
    }

    // Only focus if activeFieldPath or selectedBlock actually changed
    const fieldPathChanged = activeFieldPath !== prevActiveFieldPathRef.current
    const blockChanged = selectedBlock?.id !== prevSelectedBlockIdRef.current
    
    // Don't focus if user is currently typing
    if (isTypingRef.current) {
      return
    }
    
    if (activeFieldPath && (fieldPathChanged || blockChanged) && selectedBlock) {
      prevActiveFieldPathRef.current = activeFieldPath
      prevSelectedBlockIdRef.current = selectedBlock.id
      const fieldKey = `${selectedBlock.id}.${activeFieldPath}`
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const fieldRef = fieldRefs.current[fieldKey]
        // Only focus if the field exists and is not already focused
        if (fieldRef && document.activeElement !== fieldRef) {
          // Prevent scroll when focusing - use preventScroll option
          try {
            ;(fieldRef as HTMLElement).focus({ preventScroll: true })
          } catch {
            // Fallback for browsers that don't support preventScroll
            fieldRef.focus()
          }
          // Scroll only within Inspector sidebar, not the page
          fieldRef.scrollIntoView({ behavior: "smooth", block: "nearest" })
        }
      }, 0)
      return () => clearTimeout(timer)
    } else if (!activeFieldPath) {
      // Reset refs when activeFieldPath is cleared
      prevActiveFieldPathRef.current = null
      prevSelectedBlockIdRef.current = selectedBlock?.id || null
    }
  }, [activeFieldPath, selectedBlock, inlineOpen])

  // Get current value for inline editor - use current.blocks to avoid stale state
  const inlineValue = useMemo(() => {
    if (!inlineBlockId || !inlineFieldPath || !current) return ""
    const block = current.blocks.find((b) => b.id === inlineBlockId)
    if (!block) return ""
    const actualFieldPath = mapHeroFieldPathForActiveBrand(block, inlineFieldPath, activeBrandTab)
    const value = getByPath(block.props as Record<string, unknown>, actualFieldPath)
    return String(value ?? "")
  }, [inlineBlockId, inlineFieldPath, current?.blocks, activeBrandTab])
  
  // Determine if inline editor should be multiline - use current.blocks to avoid stale state
  const inlineMultiline = useMemo(() => {
    if (!inlineBlockId || !current) return false
    const block = current.blocks.find((b) => b.id === inlineBlockId)
    if (!block) return false
    return isMultilineField(block.type, inlineFieldPath || "")
  }, [inlineBlockId, inlineFieldPath, current?.blocks])
  
  // Get field label for inline editor - use current.blocks to avoid stale state
  const inlineLabel = useMemo(() => {
    if (!inlineBlockId || !inlineFieldPath || !current) return "Feld bearbeiten"
    const block = current.blocks.find((b) => b.id === inlineBlockId)
    if (!block) return "Feld bearbeiten"
    const definition = getBlockDefinition(block.type)
    const field = definition.inspectorFields.find((f) => f.key === inlineFieldPath)
    return field?.label || "Feld bearbeiten"
  }, [inlineBlockId, inlineFieldPath, current?.blocks])

  // Return early until mounted + page state is ready (prevents SSR/client mismatch)
  // This must come AFTER all hooks to follow Rules of Hooks
  if (!mounted || !page) {
    return <div className="flex h-full items-center justify-center">Laden...</div>
  }

  // TS narrow: after the guard above, `current` is always set for runtime,
  // but we keep this check to narrow the `current` variable type.
  if (!current) {
    return <div className="flex h-full items-center justify-center">Fehler beim Laden der Seite</div>
  }

  const updatePage = (patch: Partial<AdminPage>) => {
    setPage((prev) => {
      if (!prev) return prev
      return { ...prev, ...patch }
    })
  }

  const applyPageBrand = (brand: BrandKey) => {
    setPage((prev) => {
      // If user clicks the brand toggle before the new page state is initialized,
      // create the page with the selected brand (robust for slow devices / strict-mode double effects).
      if (!prev) return createEmptyPage({ brand })

      const heroIds: string[] = []
      const nextBlocks = prev.blocks.map((b) => {
        if (b.type !== "hero") return b
        heroIds.push(b.id)
        const prevProps = (b.props ?? {}) as Record<string, unknown>
        return {
          ...b,
          props: {
            ...prevProps,
            mood: brand,
          },
        }
      })

      if (heroIds.length > 0) {
        setActiveBrandTab((prevTabs) => {
          const nextTabs = { ...prevTabs }
          for (const id of heroIds) nextTabs[id] = brand
          return nextTabs
        })
      }

      return { ...prev, brand, blocks: nextBlocks }
    })
  }

  const handlePageBrandChange = (brand: BrandKey) => {
    // For new pages we also align Hero mood + default brand tab
    if (isNewPage) {
      applyPageBrand(brand)
      return
    }
    updatePage({ brand })
  }

  const addBlock = (type: CMSBlock["type"]) => {
    setPage((prev) => {
      if (!prev) return prev
      const b = defaultBlock(type, prev.brand)
    setSelectedBlockId(b.id)
      return {
        ...prev,
        blocks: [...prev.blocks, b],
      }
    })
  }

  const removeBlock = (id: string) => {
    setPage((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        blocks: prev.blocks.filter((b) => b.id !== id),
      }
    })
    if (selectedBlockId === id) {
      setSelectedBlockId(null)
      setActiveFieldPath(null)
    }
  }

  const moveBlock = (index: number, direction: -1 | 1) => {
    setPage((prev) => {
      if (!prev) return prev
      const to = index + direction
      if (to < 0 || to >= prev.blocks.length) return prev
      const nextBlocks = arrayMove(prev.blocks, index, to)
      
      // Keep selectedBlockId on the moved block (no scrollIntoView - Live Preview should not scroll)
      const movedBlockId = prev.blocks[index].id
      if (selectedBlockId === movedBlockId) {
        // Block stays selected, but don't scroll
      }
      
      return { ...prev, blocks: nextBlocks }
    })
  }

  const moveBlockById = (blockId: string, direction: -1 | 1) => {
    if (!current) return
    const index = current.blocks.findIndex((b) => b.id === blockId)
    if (index === -1) return
    moveBlock(index, direction)
  }

  const duplicateAt = (index: number) => {
    setPage((prev) => {
      if (!prev) return prev
      const original = prev.blocks[index]
      const copy = duplicateBlock(original)
      const nextBlocks = arrayInsert(prev.blocks, index + 1, copy)
      
      // Set selectedBlockId to the new copy (no scrollIntoView - Live Preview should not scroll)
      setTimeout(() => {
        setSelectedBlockId(copy.id)
      }, 0)
      
      return { ...prev, blocks: nextBlocks }
    })
  }

  const updateSelectedProps = (nextProps: CMSBlock["props"]) => {
    if (!selectedBlock) return
    
    // Lock Live Preview scroll during update
    withLiveScrollLock(() => {
      // Use functional update with prev.blocks to avoid stale state
      // Don't normalize here - it might overwrite changes with defaults
      // Only normalize on initial load
      setPage((prev) => {
        if (!prev || !selectedBlock) return prev
        return {
          ...prev,
          blocks: prev.blocks.map((b) =>
            b.id === selectedBlock.id ? ({ ...b, props: nextProps } as CMSBlock) : b
          ),
        }
      })
    })
  }

  /**
   * Updates props for a specific block based on the latest state (prevents stale-props issues).
   * This is important for nested updates like Hero.brandContent while typing.
   */
  const updateBlockPropsById = (
    blockId: string,
    updater: (prevProps: Record<string, unknown>) => CMSBlock["props"]
  ) => {
    withLiveScrollLock(() => {
      setPage((prev) => {
        if (!prev) return prev
        const idx = prev.blocks.findIndex((b) => b.id === blockId)
        if (idx === -1) return prev
        const block = prev.blocks[idx]
        const prevProps = (block.props ?? {}) as Record<string, unknown>
        const nextProps = updater(prevProps)
        const nextBlocks = [...prev.blocks]
        nextBlocks[idx] = { ...block, props: nextProps } as CMSBlock
        return { ...prev, blocks: nextBlocks }
      })
    })
  }

  const handleEditField = (blockId: string, fieldPath: string, anchorRect?: DOMRect) => {
    // Open inline editor
    setInlineBlockId(blockId)
    setInlineFieldPath(fieldPath)
    setInlineAnchorRect(anchorRect || null)
    setInlineOpen(true)
    
    // Also update inspector selection
    setSelectedBlockId(blockId)
    // Don't clear selectedElementId - let it persist for shadow inspector
    // This allows users to select an element for shadows, then click on it to edit the text
    setActiveFieldPath(fieldPath)

    // Ensure the Inspector scrolls to the corresponding field even if it was already active.
    const key = `${blockId}.${fieldPath}`
    const tryScroll = () => {
      const el = fieldRefs.current[key]
      if (!el) return false
      try {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
      } catch {
        el.scrollIntoView()
      }
      return true
    }
    // Use rAF retries to wait for inspector DOM (and tab panel) to mount.
    let tries = 0
    const tick = () => {
      if (tryScroll()) return
      tries += 1
      if (tries > 12) return
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }
  
  // Handle inline editor change
  const handleInlineChange = (next: string) => {
    if (!inlineBlockId || !inlineFieldPath) return

    setPage((prev) => {
      if (!prev) return prev
      const block = prev.blocks.find((b) => b.id === inlineBlockId)
      if (!block) return prev

      const actualFieldPath = mapHeroFieldPathForActiveBrand(block, inlineFieldPath, activeBrandTab)

      // --- SEED contactInfoCards on first edit (ContactForm only) ---
      let baseProps = block.props as Record<string, unknown>

      if (block.type === "contactForm" && actualFieldPath.startsWith("contactInfoCards.")) {
        const cur = (baseProps as any).contactInfoCards
        const isEmpty = !Array.isArray(cur) || cur.length === 0

        if (isEmpty) {
          baseProps = setByPath(baseProps, "contactInfoCards", [
            { id: "hours", icon: "clock", title: "Schnelle Antwort", value: "Innerhalb von 24 Stunden" },
            { id: "consultation", icon: "phone", title: "Kostenlose Beratung", value: "Unverbindliches Erstgespräch" },
            { id: "location", icon: "mapPin", title: "Lokale Betreuung", value: "Persönlich vor Ort für Sie da" },
          ]) as Record<string, unknown>
        }
      }
      // --- END seed ---

      const updatedProps = setByPath(
        baseProps,
        actualFieldPath,
        next
      ) as CMSBlock["props"]

      return {
        ...prev,
        blocks: prev.blocks.map((b) =>
          b.id === inlineBlockId ? ({ ...b, props: updatedProps } as CMSBlock) : b
        ),
      }
    })
  }

  
  // Handle inline editor close
  const handleInlineClose = () => {
    setInlineOpen(false)
    setInlineBlockId(null)
    setInlineFieldPath(null)
    setInlineAnchorRect(null)
  }

  const handleSaveDraft = async () => {
    try {
      const saved = await save({ ...current, status: "draft" })
      toast({
        title: "Gespeichert",
        description: `Seite "${saved.title}" wurde als Entwurf gespeichert.`,
      })
    } catch (e) {
      toast({
        title: "Fehler beim Speichern",
        description: "Die Seite konnte nicht gespeichert werden.",
      })
      console.error(e)
    }
  }

  const handlePublish = async () => {
    if (!current) {
      toast({
        title: "Fehler",
        description: "Keine Seite zum Veröffentlichen gefunden.",
      })
      return
    }

    // Validate page before publishing
    const validation = validatePageForPublish(current)
    
    if (!validation.ok) {
      // Set issues and show error
      setPublishIssues(validation.issues)
      
      // Auto-select first block with error
      if (validation.issues.length > 0) {
        const firstIssue = validation.issues[0]
        setSelectedBlockId(firstIssue.blockId)
        setActiveFieldPath(firstIssue.fieldPath)

        // If the first issue is in Hero, switch the Hero brand-tab to the page brand
        if (firstIssue.blockType === "hero") {
          setActiveBrandTab((prev) => ({ ...prev, [firstIssue.blockId]: current.brand }))
        }
        
        // Scroll to block in preview
        setTimeout(() => {
          const blockElement = document.querySelector(`[data-block-id="${firstIssue.blockId}"]`)
          if (blockElement) {
            blockElement.scrollIntoView({ behavior: "smooth", block: "center" })
          }
        }, 100)
      }
      
      toast({
        title: "Validierungsfehler",
        description: `${validation.issues.length} Fehler gefunden. Bitte beheben Sie die Fehler vor dem Veröffentlichen.`,
      })
      return
    }
    
    // Clear issues on successful validation
    setPublishIssues([])
    
    try {
      // Slug uniqueness in DB space, filtered by brand
      const slug = await generateUniqueSlug(current.title, current.id, current.brand)
      const saved = await save({ ...current, status: "published", slug })
      toast({
        title: "Veröffentlicht",
        description: `Seite "${saved.title}" wurde erfolgreich veröffentlicht. URL: /${saved.slug}`,
      })
    } catch (e) {
      toast({
        title: "Fehler beim Veröffentlichen",
        description: "Die Seite konnte nicht veröffentlicht werden.",
      })
      console.error(e)
    }
  }

  // Handle click on publish issue - navigate to block
  const handleIssueClick = (issue: PublishIssue) => {
    setSelectedBlockId(issue.blockId)
    setActiveFieldPath(issue.fieldPath)
    
    // Scroll to block in preview
    setTimeout(() => {
      const blockElement = document.querySelector(`[data-block-id="${issue.blockId}"]`)
      if (blockElement) {
        blockElement.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }, 100)
  }

  // Array operations handlers
  const handleAddArrayItem = (blockId: string, arrayPath: string, createFn: () => unknown) => {
    setPage((prev) => {
      if (!prev) return prev
      const block = prev.blocks.find((b) => b.id === blockId)
      if (!block) return prev

      const props = block.props as Record<string, unknown>
      const currentArray = (getByPath(props, arrayPath) as unknown[]) || []
      const newItem = createFn()
      const updatedArray = [...currentArray, newItem]
      const updatedProps = setByPath(props, arrayPath, updatedArray) as CMSBlock["props"]

      // Auto-select first field of new item
      const newIndex = updatedArray.length - 1
      let defaultFieldPath = ""
      if (arrayPath === "cards") defaultFieldPath = `cards.${newIndex}.title`
      else if (arrayPath === "items") {
        // FAQ vs Testimonials share "items"
        if (block.type === "testimonials") defaultFieldPath = `items.${newIndex}.quote`
        else defaultFieldPath = `items.${newIndex}.question`
      }
      else if (arrayPath === "members") defaultFieldPath = `members.${newIndex}.name`
      else if (arrayPath === "fields") defaultFieldPath = `fields.${newIndex}.label`
      else if (arrayPath === "images") defaultFieldPath = `images.${newIndex}.url`
      else if (arrayPath === "hours") defaultFieldPath = `hours.${newIndex}.label`
      else if (arrayPath === "slides") defaultFieldPath = `slides.${newIndex}.url`

      setActiveFieldPath(defaultFieldPath)

      return {
        ...prev,
        blocks: prev.blocks.map((b) =>
          b.id === blockId ? ({ ...b, props: updatedProps } as CMSBlock) : b
        ),
      }
    })
  }

  const handleRemoveArrayItem = (blockId: string, arrayPath: string, index: number) => {
    setPage((prev) => {
      if (!prev) return prev
      const block = prev.blocks.find((b) => b.id === blockId)
      if (!block) return prev

      const props = block.props as Record<string, unknown>
      const currentArray = (getByPath(props, arrayPath) as unknown[]) || []
      const updatedArray = arrayRemove(currentArray, index)
      const updatedProps = setByPath(props, arrayPath, updatedArray) as CMSBlock["props"]

      // Reset activeFieldPath if it points to deleted item
      if (activeFieldPath && activeFieldPath.startsWith(`${arrayPath}.${index}`)) {
        setActiveFieldPath(null)
      } else if (activeFieldPath && activeFieldPath.startsWith(`${arrayPath}.`)) {
        // Update fieldPath if item indices shifted
        const pathParts = activeFieldPath.split(".")
        const itemIndex = parseInt(pathParts[1], 10)
        if (!isNaN(itemIndex) && itemIndex > index) {
          pathParts[1] = String(itemIndex - 1)
          setActiveFieldPath(pathParts.join("."))
        }
      }

      return {
        ...prev,
        blocks: prev.blocks.map((b) =>
          b.id === blockId ? ({ ...b, props: updatedProps } as CMSBlock) : b
        ),
      }
    })
    setDeleteConfirmOpen(false)
    setDeleteTarget(null)
  }

  const handleMoveArrayItem = (blockId: string, arrayPath: string, fromIndex: number, toIndex: number) => {
    setPage((prev) => {
      if (!prev) return prev
      const block = prev.blocks.find((b) => b.id === blockId)
      if (!block) return prev

      const props = block.props as Record<string, unknown>
      const currentArray = (getByPath(props, arrayPath) as unknown[]) || []
      const updatedArray = arrayMove(currentArray, fromIndex, toIndex)
      const updatedProps = setByPath(props, arrayPath, updatedArray) as CMSBlock["props"]

      // Update activeFieldPath if it points to moved item
      if (activeFieldPath && activeFieldPath.startsWith(`${arrayPath}.${fromIndex}`)) {
        const pathParts = activeFieldPath.split(".")
        pathParts[1] = String(toIndex)
        setActiveFieldPath(pathParts.join("."))
      } else if (activeFieldPath && activeFieldPath.startsWith(`${arrayPath}.`)) {
        const pathParts = activeFieldPath.split(".")
        const itemIndex = parseInt(pathParts[1], 10)
        if (!isNaN(itemIndex)) {
          if (fromIndex < itemIndex && itemIndex <= toIndex) {
            pathParts[1] = String(itemIndex - 1)
            setActiveFieldPath(pathParts.join("."))
          } else if (toIndex <= itemIndex && itemIndex < fromIndex) {
            pathParts[1] = String(itemIndex + 1)
            setActiveFieldPath(pathParts.join("."))
          }
        }
      }

      return {
        ...prev,
        blocks: prev.blocks.map((b) =>
          b.id === blockId ? ({ ...b, props: updatedProps } as CMSBlock) : b
        ),
      }
    })
  }

  const confirmDeleteItem = (blockId: string, arrayPath: string, index: number) => {
    // Always confirm for team.members and servicesGrid.cards, optional for others
    const needsConfirmation = arrayPath === "members" || arrayPath === "cards"
    
    if (needsConfirmation) {
      setDeleteTarget({ blockId, arrayPath, index })
      setDeleteConfirmOpen(true)
    } else {
      // For other arrays, delete directly (trustItems, features, items)
      handleRemoveArrayItem(blockId, arrayPath, index)
    }
  }

  // Render string array items with controls (for hero.trustItems)
  const renderStringArrayControls = (
    block: CMSBlock,
    arrayPath: string,
    itemLabel: string,
    createItem: () => string
  ) => {
    const props = block.props as Record<string, unknown>
    const items = (getByPath(props, arrayPath) as string[]) || []

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="font-semibold">{itemLabel}s</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddArrayItem(block.id, arrayPath, createItem)}
            className="gap-1"
          >
            <Plus className="h-3 w-3" />
            {itemLabel} hinzufügen
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => {
            const itemFieldKey = `${arrayPath}.${index}`
            const itemFieldId = `${block.id}.${itemFieldKey}`
            const isActive = activeFieldPath === itemFieldKey

            const handleItemChange = (newValue: string) => {
              if (!selectedBlock) return
              isTypingRef.current = true
              const currentProps = selectedBlock.props as Record<string, unknown>
              const updatedProps = setByPath(currentProps, itemFieldKey, newValue) as CMSBlock["props"]
              updateSelectedProps(updatedProps)
              setTimeout(() => {
                isTypingRef.current = false
              }, 50)
            }

            return (
              <div
                key={index}
                className="rounded-lg border border-border bg-muted/30 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{itemLabel} {index + 1}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMoveArrayItem(block.id, arrayPath, index, index - 1)}
                      disabled={index === 0}
                      title="Nach oben"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMoveArrayItem(block.id, arrayPath, index, index + 1)}
                      disabled={index === items.length - 1}
                      title="Nach unten"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => confirmDeleteItem(block.id, arrayPath, index)}
                      title="Löschen"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Input
                  id={itemFieldId}
                  value={item}
                  onChange={(e) => handleItemChange(e.target.value)}
                  className={cn("h-8 text-sm", isActive && "ring-2 ring-primary")}
                  placeholder={itemLabel}
                />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Render array items with controls (Add/Remove/Move)
  const renderArrayItemsControls = <T extends object>(
    block: CMSBlock,
    arrayPath: string,
    itemLabel: string,
    getItemLabel: (item: T, index: number) => string,
    createItem: () => T,
    itemFields: Array<{ key: string; label: string; type: InspectorFieldType; placeholder?: string; required?: boolean; options?: Array<{ value: string; label: string }> }>,
    minItems?: number,
    maxItems?: number
  ) => {
    const props = block.props as Record<string, unknown>
    const items = (getByPath(props, arrayPath) as T[]) || []
    const canAdd = typeof maxItems === "number" ? items.length < maxItems : true
    const canRemove = typeof minItems === "number" ? items.length > minItems : true

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="font-semibold">{itemLabel}s</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddArrayItem(block.id, arrayPath, createItem)}
            className="gap-1"
            disabled={!canAdd}
          >
            <Plus className="h-3 w-3" />
            {itemLabel} hinzufügen
          </Button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={(item as { id?: string }).id || index}
              className="rounded-lg border border-border bg-muted/30 p-3 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{getItemLabel(item, index)}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleMoveArrayItem(block.id, arrayPath, index, index - 1)}
                    disabled={index === 0}
                    title="Nach oben"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleMoveArrayItem(block.id, arrayPath, index, index + 1)}
                    disabled={index === items.length - 1}
                    title="Nach unten"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => confirmDeleteItem(block.id, arrayPath, index)}
                    title="Löschen"
                    disabled={!canRemove}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-border">
                {itemFields.map((itemField) => {
                  const itemFieldKey = `${arrayPath}.${index}.${itemField.key}`
                  const itemFieldValue = getByPath(item as Record<string, unknown>, itemField.key) ?? ""
                  const itemFieldId = `${block.id}.${itemFieldKey}`
                  const isActive = activeFieldPath === itemFieldKey

                  const handleItemFieldChange = (newValue: unknown) => {
                    if (!selectedBlock) return
                    isTypingRef.current = true
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const updatedProps = setByPath(currentProps, itemFieldKey, newValue) as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                    setTimeout(() => {
                      isTypingRef.current = false
                    }, 50)
                  }

                  switch (itemField.type) {
                    case "text":
                      return (
                        <div key={itemField.key} className="space-y-1.5">
                          <Label htmlFor={itemFieldId} className="text-xs">
                            {itemField.label}
                          </Label>
                          <Input
                            id={itemFieldId}
                            value={String(itemFieldValue)}
                            onChange={(e) => handleItemFieldChange(e.target.value)}
                            className={cn("h-8 text-sm", isActive && "ring-2 ring-primary")}
                            placeholder={itemField.label}
                          />
                        </div>
                      )

                    case "textarea":
                      return (
                        <div key={itemField.key} className="space-y-1.5">
                          <Label htmlFor={itemFieldId} className="text-xs">
                            {itemField.label}
                          </Label>
                          <Textarea
                            id={itemFieldId}
                            value={String(itemFieldValue)}
                            onChange={(e) => handleItemFieldChange(e.target.value)}
                            className={cn("text-sm min-h-[60px]", isActive && "ring-2 ring-primary")}
                            placeholder={itemField.label}
                          />
                        </div>
                      )

                    case "color":
                      return (
                        <div key={itemField.key} className="space-y-1.5">
                          <Label htmlFor={itemFieldId} className="text-xs">
                            {itemField.label}
                          </Label>
                          <div className={cn(isActive && "ring-2 ring-primary rounded-md")}>
                            <ColorField
                              value={String(itemFieldValue)}
                              onChange={(v) => handleItemFieldChange(v)}
                              placeholder={itemField.placeholder || "#rrggbb"}
                              inputRef={(el) => {
                                fieldRefs.current[itemFieldId] = el
                              }}
                            />
                          </div>
                        </div>
                      )

                    case "select":
                      // Handle contact form field type select
                      if (itemField.key === "type" && block.type === "contactForm") {
                        const typeOptions = [
                          { value: "name", label: "Name" },
                          { value: "email", label: "E-Mail" },
                          { value: "phone", label: "Telefon" },
                          { value: "subject", label: "Betreff" },
                          { value: "message", label: "Nachricht" },
                        ]
                        return (
                          <div key={itemField.key} className="space-y-1.5">
                            <Label htmlFor={itemFieldId} className="text-xs">
                              {itemField.label}
                            </Label>
                            <Select value={String(itemFieldValue)} onValueChange={(v: string) => handleItemFieldChange(v)}>
                              <SelectTrigger
                                id={itemFieldId}
                                className={cn("h-8 text-sm", isActive && "ring-2 ring-primary")}
                              >
                                <SelectValue placeholder="Typ wählen" />
                              </SelectTrigger>
                              <SelectContent>
                                {typeOptions.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )
                      }
                      
                      const options = itemField.options ?? []

                      if (options.length > 0) {
                        return (
                          <div key={itemField.key} className="space-y-1.5">
                            <Label htmlFor={itemFieldId} className="text-xs">
                              {itemField.label}
                            </Label>

                            <Select
                              value={itemFieldValue == null || itemFieldValue === "" ? "none" : String(itemFieldValue)}
                              onValueChange={(v) => {
                                // Special handling for rating: convert to number or undefined
                                if (itemField.key === "rating") {
                                  if (v === "none") {
                                    handleItemFieldChange(undefined)
                                  } else {
                                    handleItemFieldChange(Number(v))
                                  }
                                } else {
                                  // For all other select fields (avatarGradient, etc.), keep as string
                                  handleItemFieldChange(v)
                                }
                              }}
                            >
                              <SelectTrigger
                                id={itemFieldId}
                                className={cn("h-8 text-sm", isActive && "ring-2 ring-primary")}
                              >
                                <SelectValue placeholder={itemField.placeholder || "Auswählen"} />
                              </SelectTrigger>

                              <SelectContent>
                                {options.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )
                      }

                      return null

                    case "boolean":
                      return (
                        <div key={itemField.key} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/40 px-3 py-2">
                          <div className="space-y-0.5">
                            <Label htmlFor={itemFieldId} className="text-xs">
                              {itemField.label}
                            </Label>
                            <p className="text-[11px] text-muted-foreground">Pflichtfeld im Formular</p>
                          </div>
                          <Checkbox
                            id={itemFieldId}
                            checked={Boolean(itemFieldValue)}
                            onCheckedChange={(v) => handleItemFieldChange(Boolean(v))}
                            className={cn(isActive && "ring-2 ring-primary")}
                          />
                        </div>
                      )

                    case "url":
                      return (
                        <div key={itemField.key} className="space-y-1.5">
                          <Label htmlFor={itemFieldId} className="text-xs">
                            {itemField.label}
                          </Label>
                          <Input
                            id={itemFieldId}
                            type="url"
                            value={String(itemFieldValue)}
                            onChange={(e) => handleItemFieldChange(e.target.value)}
                            className={cn("h-8 text-sm", isActive && "ring-2 ring-primary")}
                            placeholder="/path"
                          />
                        </div>
                      )

                    case "image":
                      return (
                        <ImageField
                          key={itemField.key}
                          id={itemFieldId}
                          label={itemField.label}
                          value={String(itemFieldValue)}
                          onChange={(v) => handleItemFieldChange(v)}
                          placeholder={itemField.placeholder}
                          required={itemField.required}
                          className="text-sm"
                          isActive={isActive}
                        />
                      )

                    default:
                      return null
                  }
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Heuristik: Erkennt Bildfelder automatisch anhand des Feldnamens
  const isImageField = (fieldKey: string, value: unknown): boolean => {
    const imagePattern = /(image|img|logo|avatar|thumbnail|background|bg|heroImage|cover|mediaUrl)/i
    return imagePattern.test(fieldKey) && (typeof value === "string" || value === null || value === "")
  }

  const renderInspectorField = (field: InspectorField, block: CMSBlock) => {
    const fieldKey = `${block.id}.${field.key}`
    const props = block.props as Record<string, unknown>
    // Support nested paths like "trustItems.0" or "cards.0.title"
    const value = getByPath(props, field.key) ?? ""

    const handleChange = (newValue: unknown) => {
      if (!selectedBlock) return
      // Mark as typing to prevent focus stealing
      isTypingRef.current = true
      // Always use latest block props from page state (avoids stale props e.g. gallery losing images on layout change)
      updateBlockPropsById(selectedBlock.id, (currentProps) =>
        setByPath(currentProps, field.key, newValue) as CMSBlock["props"]
      )
      setTimeout(() => {
        isTypingRef.current = false
      }, 50)
    }

    const handleClearField = () => {
      if (field.required || !selectedBlock) return
      handleChange(undefined)
    }

  const isActive = activeFieldPath === field.key

  // Automatische Erkennung: Wenn field.type === "image" ODER Heuristik true
  // ABER: Expliziter field.type hat IMMER Priorität. Heuristik greift nur bei fehlender Klassifizierung.
  const knownTypes = ["text", "textarea", "color", "select", "url", "image", "checkbox", "number", "date"]
  const shouldRenderAsImage = field.type === "image" || (knownTypes.indexOf(field.type as string) === -1 && isImageField(field.key, value))

  switch (shouldRenderAsImage ? "image" : field.type) {
    case "text":
      return (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={fieldKey}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="flex gap-2">
            <Input
              id={fieldKey}
              ref={(el) => {
                fieldRefs.current[fieldKey] = el
              }}
              value={String(value)}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.placeholder}
              className={cn("flex-1", isActive && "ring-2 ring-primary")}
            />
            {!field.required && (
              <button
                type="button"
                onClick={handleClearField}
                className="h-10 w-10 px-0 text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center"
                title="Löschen"
              >
                ✕
              </button>
            )}
          </div>
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      )

    case "textarea":
      return (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={fieldKey}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="flex gap-2">
            <Textarea
              id={fieldKey}
              ref={(el) => {
                fieldRefs.current[fieldKey] = el
              }}
              value={String(value)}
              onChange={(e) => {
                isTypingRef.current = true
                handleChange(e.target.value)
                setTimeout(() => {
                  isTypingRef.current = false
                }, 100)
              }}
              onFocus={() => {
                isTypingRef.current = true
              }}
              onBlur={() => {
                isTypingRef.current = false
              }}
              placeholder={field.placeholder}
              rows={field.key === "content" ? 8 : 4}
              className={cn("flex-1", isActive && "ring-2 ring-primary")}
            />
            {!field.required && (
              <button
                type="button"
                onClick={handleClearField}
                className="h-10 w-10 px-0 text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center self-start mt-10"
                title="Löschen"
              >
                ✕
              </button>
            )}
          </div>
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      )

    case "color":
      return (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={fieldKey}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="flex gap-2">
            <div className={cn("flex-1", isActive && "ring-2 ring-primary rounded-md")}>
              <ColorField
                value={String(value)}
                onChange={(v) => handleChange(v)}
                placeholder={field.placeholder || "#rrggbb"}
                inputRef={(el) => {
                  fieldRefs.current[fieldKey] = el
                }}
              />
            </div>
            {!field.required && (
              <button
                type="button"
                onClick={handleClearField}
                className="h-10 w-10 px-0 text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center"
                title="Löschen"
              >
                ✕
              </button>
            )}
          </div>
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      )

    case "select": {
      // Wichtig: Radix Select darf kein value="" in SelectItem haben.
      // Außerdem: Select.value sollte bei leerem Wert undefined sein (damit Placeholder greift)
      const safeValue = value == null || value === "" ? undefined : String(value)
      const options =
        field.options
          ?.filter((o) => o.value !== "" && o.value != null)
          .map((o) => ({ value: String(o.value), label: o.label })) ?? []

      return (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={fieldKey}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="flex gap-2">
            <Select value={safeValue} onValueChange={(v: string) => handleChange(v)}>
              <SelectTrigger
                id={fieldKey}
                ref={(el) => {
                  fieldRefs.current[fieldKey] = el as HTMLSelectElement | null
                }}
                className={cn("flex-1", isActive && "ring-2 ring-primary")}
              >
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!field.required && (
              <button
                type="button"
                onClick={handleClearField}
                className="h-10 w-10 px-0 text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center"
                title="Löschen"
              >
                ✕
              </button>
            )}
          </div>
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      )
    }

    case "url":
      return (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={fieldKey}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="flex gap-2">
            <Input
              id={fieldKey}
              ref={(el) => {
                fieldRefs.current[fieldKey] = el
              }}
              type="url"
              value={String(value)}
              onChange={(e) => {
                isTypingRef.current = true
                handleChange(e.target.value)
                setTimeout(() => {
                  isTypingRef.current = false
                }, 100)
              }}
              onFocus={() => {
                isTypingRef.current = true
              }}
              onBlur={() => {
                isTypingRef.current = false
              }}
              placeholder={field.placeholder}
              className={cn("flex-1", isActive && "ring-2 ring-primary")}
            />
            {!field.required && (
              <button
                type="button"
                onClick={handleClearField}
                className="h-10 w-10 px-0 text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center"
                title="Löschen"
              >
                ✕
              </button>
            )}
          </div>
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      )

    case "image":
      return (
        <div key={field.key} className="space-y-2">
          <div className="flex items-center justify-between">
            <div />
            {!field.required && (
              <button
                type="button"
                onClick={handleClearField}
                className="h-8 w-8 px-0 text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center"
                title="Löschen"
              >
                ✕
              </button>
            )}
          </div>
          <ImageField
            id={fieldKey}
            label={field.label}
            value={String(value)}
            onChange={(v) => {
              isTypingRef.current = true
              handleChange(v)
              setTimeout(() => {
                isTypingRef.current = false
              }, 100)
            }}
            placeholder={field.placeholder}
            required={field.required}
            helpText={field.helpText}
            isActive={isActive}
            inputRef={(el) => {
              fieldRefs.current[fieldKey] = el
            }}
          />
        </div>
      )

    case "boolean":
      return (
        <div key={field.key} className="flex items-center space-x-2">
          <Checkbox id={fieldKey} checked={Boolean(value)} onCheckedChange={(checked) => handleChange(checked)} />
          <Label htmlFor={fieldKey} className="cursor-pointer">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      )

    default:
      return null
  }
}


  return (
    <div className="flex h-full flex-col">
      {/* Publish Validation Errors */}
      {publishIssues.length > 0 && (
        <div className="border-b border-destructive/50 bg-destructive/5 px-4 py-3">
          <Alert variant="destructive" className="mb-0">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {publishIssues.length} Validierungsfehler gefunden
            </AlertTitle>
            <AlertDescription>
              <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                {publishIssues.slice(0, 8).map((issue, index) => (
                  <button
                    key={index}
                    onClick={() => handleIssueClick(issue)}
                    className="block w-full text-left rounded px-2 py-1 text-sm hover:bg-destructive/10 transition-colors"
                  >
                    <span className="font-medium">{issue.blockType}</span>
                    {issue.fieldPath && (
                      <span className="text-muted-foreground"> • {issue.fieldPath}</span>
                    )}
                    {": "}
                    <span>{issue.message}</span>
                  </button>
                ))}
                {publishIssues.length > 8 && (
                  <p className="text-xs text-muted-foreground pt-1">
                    ... und {publishIssues.length - 8} weitere Fehler
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Editor Header */}
      <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to pages">
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-3">
            <Input
              value={current.title}
              onChange={(e) => updatePage({ title: e.target.value })}
              className="h-8 w-64 border-none bg-transparent text-lg font-medium shadow-none focus-visible:ring-0"
            />
            <Input
              value={current.slug}
              onChange={(e) => updatePage({ slug: e.target.value })}
              className="h-8 w-48"
              placeholder="slug"
            />

            <Select value={current.brand} onValueChange={(v: string) => handlePageBrandChange(v as BrandKey)}>
              <SelectTrigger className="h-8 w-52">
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="physiotherapy">Physiotherapie</SelectItem>
                <SelectItem value="physio-konzept">Physio-Konzept</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 bg-transparent" onClick={handleSaveDraft}>
            <Save className="h-4 w-4" />
            Save draft
          </Button>
          <Button className="gap-2" onClick={handlePublish}>
            <Send className="h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex flex-1 overflow-hidden h-full min-h-0">
        {/* Live Preview */}
        <div 
          ref={liveScrollRef}
          className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/30 p-8 min-h-0"
          onScroll={(e) => {
            // Prevent any scroll events from bubbling to body
            e.stopPropagation()
          }}
          onClick={(e) => {
            // Prevent anchor link navigation in editor mode
            const target = e.target as HTMLElement
            const link = target.closest('a')
            if (link) {
              e.preventDefault()
              e.stopPropagation()
            }
          }}
        >
          <LivePreviewTheme brand={current.brand || "physiotherapy"} className="mx-auto max-w-5xl rounded-lg border border-border bg-background shadow-sm overflow-hidden">
            {current.blocks.map((block, index) => {
              const blockDefinition = getBlockDefinition(block.type)
              const blockLabel = blockDefinition.label || block.type
              const isFirst = index === 0
              const isLast = index === current.blocks.length - 1

              // Live Preview always renders hero after page brand (current.brand), not inspector tab
              const blockToRender = block.type === "hero"
                ? (() => {
                    const heroProps = block.props as HeroBlock["props"]
                    const renderBrand: BrandKey = (current.brand || "physiotherapy") as BrandKey
                    // Ensure brandContent exists and merge with legacy props if needed
                    const brandContent = heroProps.brandContent || {
                      physiotherapy: {},
                      "physio-konzept": {},
                    }
                    // If legacy props exist, migrate them to brandContent
                    if (!brandContent.physiotherapy?.headline && heroProps.headline) {
                      brandContent.physiotherapy = {
                        ...brandContent.physiotherapy,
                        headline: heroProps.headline,
                        subheadline: heroProps.subheadline,
                        ctaText: heroProps.ctaText,
                        ctaHref: heroProps.ctaHref,
                        badgeText: heroProps.badgeText,
                        playText: heroProps.playText,
                        trustItems: heroProps.trustItems,
                        floatingTitle: heroProps.floatingTitle,
                        floatingValue: heroProps.floatingValue,
                        floatingLabel: heroProps.floatingLabel,
                      }
                    }
                    return {
                      ...block,
                      props: {
                        ...heroProps,
                        mood: renderBrand,
                        brandContent,
                      } as HeroBlock["props"],
                    }
                  })()
                : block

              return (
                <div
                  // IDs come from persisted content; if legacy data contains duplicates,
                  // React keys must still be unique to avoid rendering bugs.
                  key={block.id}
                  data-block-id={block.id}
                  className={cn(
                    "relative cursor-pointer transition-colors",
                    selectedBlockId === block.id
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "hover:bg-muted/30",
                  )}
                  onClick={() => {
                    setSelectedBlockId(block.id)
                    setActiveFieldPath(null)
                  }}
                >
                  {/* Block Controls Overlay */}
                  <div
                    className="absolute top-2 right-2 z-50 flex items-center gap-1 rounded-md bg-[#0f0f10]/90 text-white border border-white/10 shadow-xl backdrop-blur-sm p-1"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        moveBlock(index, -1)
                      }}
                      disabled={isFirst}
                      title="Nach oben"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        moveBlock(index, 1)
                      }}
                      disabled={isLast}
                      title="Nach unten"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        duplicateAt(index)
                      }}
                      title="Block duplizieren"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        removeBlock(block.id)
                      }}
                      title="Block löschen"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <BlockRenderer
                    block={blockToRender}
                    editable
                    onEditField={handleEditField}
                    onElementClick={(blockId, elementId) => {
                      // Set selection state - auto-scroll will be handled by useInspectorAutoscroll
                      setSelectedBlockId(blockId)
                      setSelectedElementId(elementId)
                      
                      // For section.divider, focus inspector on dividerColor field
                      const block = current?.blocks.find((b: CMSBlock) => b.id === blockId)
                      if (block?.type === "section" && elementId === "section.divider") {
                        setActiveFieldPath("dividerColor")
                      } else {
                        setActiveFieldPath(null)
                      }
                    }}
                    selectedElementId={selectedBlockId === block.id ? selectedElementId : null}
                  />
                </div>
              )
            })}
            
            {/* Inline Field Editor */}
            <InlineFieldEditor
              open={inlineOpen}
              anchorRect={inlineAnchorRect}
              label={inlineLabel}
              value={inlineValue}
              multiline={inlineMultiline}
              onChange={handleInlineChange}
              onClose={handleInlineClose}
            />
          </LivePreviewTheme>
        </div>

        {/* Block Editor Panel */}
        <div 
          ref={inspectorScrollRef}
          className="relative w-96 border-l border-border bg-background overflow-y-auto overflow-x-hidden z-50 min-h-0" 
          style={{ height: "100%" }}
        >
          {/* New page: brand selection prompt (global, before blocks) */}
          {isNewPage && (
            <>
              <div className="p-4 border-b border-border bg-primary/5">
                <div className="mb-2">
                  <div className="text-sm font-semibold text-foreground">Brand für neue Seite</div>
                  <p className="text-xs text-muted-foreground">
                    Bitte auswählen – beeinflusst Block-Defaults (z.B. Hero-Mood) und die Seite wird entsprechend markiert.
                  </p>
                </div>
                <Tabs value={current.brand || "physiotherapy"} onValueChange={(v) => handlePageBrandChange(v as BrandKey)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="physiotherapy" onClick={() => handlePageBrandChange("physiotherapy")}>
                      Physiotherapie
                    </TabsTrigger>
                    <TabsTrigger value="physio-konzept" onClick={() => handlePageBrandChange("physio-konzept")}>
                      Physio-Konzept
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <Separator />
            </>
          )}

          <div className="p-4">
            <h3 className="mb-4 font-semibold text-foreground">Add Blocks</h3>
            <div className="grid grid-cols-2 gap-2">
              {blockTypes.map((blockType) => {
                const Icon = blockType.icon
                return (
                  <Button
                    key={blockType.type}
                    variant="outline"
                    className="h-auto flex-col gap-2 py-4 bg-transparent"
                    onClick={() => addBlock(blockType.type)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{blockType.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Block List */}
          {current.blocks.length > 0 && (
            <div className="p-4 border-b border-border">
              <h3 className="mb-3 font-semibold text-foreground text-sm">Block-Liste</h3>
              <div className="space-y-1">
                {current.blocks.map((block, index) => {
                  const blockDefinition = getBlockDefinition(block.type)
                  const blockLabel = blockDefinition.label || block.type
                  const isFirst = index === 0
                  const isLast = index === current.blocks.length - 1

                  return (
                    <div
                      key={block.id}
                      className={cn(
                        "flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors",
                        selectedBlockId === block.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted/50 cursor-pointer"
                      )}
                      onClick={() => {
                        setSelectedBlockId(block.id)
                        setActiveFieldPath(null)
                      }}
                    >
                      <span className="flex-1 truncate">{blockLabel}</span>
                      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            moveBlock(index, -1)
                          }}
                          disabled={isFirst}
                          title="Nach oben"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            moveBlock(index, 1)
                          }}
                          disabled={isLast}
                          title="Nach unten"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <Separator />

          {selectedBlock && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  {blockRegistry[selectedBlock.type]?.label || selectedBlock.type} · Block Settings
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeBlock(selectedBlock.id)}
                  aria-label="Remove block"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <SectionInspectorSection
                brand={current.brand || "physiotherapy"}
                section={((selectedBlock.props as Record<string, unknown>)?.section as unknown) as BlockSectionProps | undefined}
                onChange={(nextSection) => {
                  const nextProps = {
                    ...(selectedBlock.props as Record<string, unknown>),
                    section: nextSection,
                  } as CMSBlock["props"]
                  updateSelectedProps(nextProps)
                }}
                onApplyPreset={(nextSection) => {
                  if (!selectedBlock) return
                  const nextProps = {
                    ...(selectedBlock.props as Record<string, unknown>),
                    section: nextSection,
                  } as CMSBlock["props"]

                  const nextPage = {
                    ...current,
                    blocks: current.blocks.map((b) =>
                      b.id === selectedBlock.id ? ({ ...b, props: nextProps } as CMSBlock) : b
                    ),
                  }

                  // Update state + persist immediately (1-click requirement)
                  withLiveScrollLock(() => setPage(nextPage))
                  void save(nextPage)
                }}
                onApplyPresetBackgroundOnly={(nextSection) => {
                  if (!selectedBlock) return
                  const nextProps = {
                    ...(selectedBlock.props as Record<string, unknown>),
                    section: nextSection,
                  } as CMSBlock["props"]

                  const nextPage = {
                    ...current,
                    blocks: current.blocks.map((b) =>
                      b.id === selectedBlock.id ? ({ ...b, props: nextProps } as CMSBlock) : b
                    ),
                  }

                  withLiveScrollLock(() => setPage(nextPage))
                  void save(nextPage)
                }}
              />

              {/* Animation Inspector */}
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="text-sm font-semibold mb-4">Animationen</h3>
                <AnimationInspector
                  config={(((selectedBlock.props as Record<string, unknown>)?.section as unknown) as BlockSectionProps | undefined)?.animation || {
                    enabled: false,
                  }}
                  onChange={(nextAnimation) => {
                    const currentSection = ((selectedBlock.props as Record<string, unknown>)?.section as unknown) as BlockSectionProps | undefined
                    const nextSection: BlockSectionProps = {
                      layout: currentSection?.layout ?? { width: "contained", paddingY: "lg" },
                      background: currentSection?.background ?? { type: "none", parallax: false },
                      animation: nextAnimation,
                    }
                    const nextProps = {
                      ...(selectedBlock.props as Record<string, unknown>),
                      section: nextSection,
                    } as CMSBlock["props"]
                    updateSelectedProps(nextProps)
                  }}
                />
              </div>              <Separator />

              {/* Global Element Shadow Inspector */}
              {selectedElementId && (
                  <>
                    <div className="space-y-3">
                    <h3 className="text-sm font-semibold mb-4">Shadow</h3>
                      <ShadowInspector
                        config={
                          ((selectedBlock.props as Record<string, unknown>)?.elements as Record<string, ElementConfig> | undefined)?.[selectedElementId]?.style?.shadow
                        }
                        onChange={(shadowConfig) => {
                          const currentElements = ((selectedBlock.props as Record<string, unknown>)?.elements ?? {}) as Record<string, ElementConfig>
                          const currentElement = currentElements[selectedElementId] ?? { style: {} }
                          const nextElement: ElementConfig = {
                            ...currentElement,
                            style: {
                              ...currentElement.style,
                              shadow: shadowConfig,
                            },
                          }
                          const nextElements = {
                            ...currentElements,
                            [selectedElementId]: nextElement,
                          }
                          const updatedProps = setByPath(selectedBlock.props as Record<string, unknown>, "elements", nextElements) as CMSBlock["props"]
                          updateSelectedProps(updatedProps)
                        }}
                        onClose={() => setSelectedElementId(null)}
                      />
                    </div>
                    <Separator />
                  </>
                )}

              {/* Generic Inspector from Registry */}
              <div className="space-y-4">
                {/* Brand Tabs for Hero Block */}
                {selectedBlock.type === "hero" && (() => {
                  const props = selectedBlock.props as HeroBlock["props"]
                  const currentBrandTab = activeBrandTab[selectedBlock.id] || "physiotherapy"
                  const handleBrandTabChange = (brand: "physiotherapy" | "physio-konzept") => {
                    setActiveBrandTab((prev) => ({ ...prev, [selectedBlock.id]: brand }))
                  }
                  
                  // Get current brandContent for display (read-only during render)
                  // Migration happens in useEffect to avoid render loop
                  const brandContentForTab = props.brandContent?.[currentBrandTab] || {}
                  // Force headline and subheadline to always exist (even if empty string)
                  const brandContent = {
                    ...brandContentForTab,
                    headline: brandContentForTab.headline ?? "",
                    subheadline: brandContentForTab.subheadline ?? "",
                  }

                  const handleBrandFieldChange = (fieldPath: string, value: unknown) => {
                    if (!selectedBlock) return
                    isTypingRef.current = true
                    const blockId = selectedBlock.id
                    const brand = currentBrandTab
                    updateBlockPropsById(blockId, (prevProps) => {
                      const next = setByPath(
                        prevProps,
                        `brandContent.${brand}.${fieldPath}`,
                        value
                      ) as CMSBlock["props"]
                      return next
                    })
                    setTimeout(() => {
                      isTypingRef.current = false
                    }, 50)
                  }

                  const handleBrandImageChange = (url: string) => {
                    if (!selectedBlock) return
                    isTypingRef.current = true
                    const blockId = selectedBlock.id
                    const brand = currentBrandTab
                    updateBlockPropsById(blockId, (prevProps) => {
                      // Store as MediaValue-like shape (url)
                      const next = setByPath(
                        prevProps,
                        `brandContent.${brand}.image`,
                        url ? ({ url } as unknown) : undefined
                      ) as CMSBlock["props"]
                      return next
                    })
                    setTimeout(() => {
                      isTypingRef.current = false
                    }, 50)
                  }

                  const handleHeroRootFieldChange = (fieldPath: string, value: unknown) => {
                    if (!selectedBlock) return
                    isTypingRef.current = true
                    const blockId = selectedBlock.id
                    updateBlockPropsById(blockId, (prevProps) => {
                      return setByPath(prevProps, fieldPath, value) as unknown as CMSBlock["props"]
                    })
                    setTimeout(() => {
                      isTypingRef.current = false
                    }, 50)
                  }

                  return (
                    <div className="space-y-4">
                      {/* Global hero settings (not brand-specific) */}
                      <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2">
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold">Media anzeigen</div>
                          <div className="text-xs text-muted-foreground">
                            Floating-Elemente werden im Media-Bereich gerendert.
                          </div>
                        </div>
                        <Checkbox
                          checked={Boolean(props.showMedia ?? true)}
                          onCheckedChange={(checked) => handleHeroRootFieldChange("showMedia", Boolean(checked))}
                        />
                      </div>

                      {/* Viewport Height Dropdown */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Höhe (Viewport)</Label>
                        <Select
                          value={String(props.minHeightVh || "90")}
                          onValueChange={(v) => handleHeroRootFieldChange("minHeightVh", v)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="50">50vh</SelectItem>
                            <SelectItem value="60">60vh</SelectItem>
                            <SelectItem value="70">70vh</SelectItem>
                            <SelectItem value="80">80vh</SelectItem>
                            <SelectItem value="90">90vh</SelectItem>
                            <SelectItem value="100">100vh</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Minimale Höhe des Hero-Bereichs
                        </p>
                      </div>

                      <Tabs value={currentBrandTab} onValueChange={(v) => handleBrandTabChange(v as typeof currentBrandTab)}>
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="physiotherapy">Physiotherapie</TabsTrigger>
                          <TabsTrigger value="physio-konzept">Physio-Konzept</TabsTrigger>
                        </TabsList>
                        <TabsContent value="physiotherapy" className="space-y-4 mt-4">
                          {currentBrandTab !== "physiotherapy" ? null : (
                          <div className="space-y-3">
                            {/* FESTE TEXT-SECTION: Überschrift und Unterüberschrift - IMMER sichtbar */}
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold">Überschrift</Label>
                              <Input
                                id={`${selectedBlock.id}.headline`}
                                ref={(el) => {
                                  fieldRefs.current[`${selectedBlock.id}.headline`] = el
                                }}
                                value={String(brandContent.headline ?? "")}
                                onChange={(e) => handleBrandFieldChange("headline", e.target.value)}
                                placeholder="Ihre Gesundheit in besten Händen"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold">Unterüberschrift</Label>
                              <Textarea
                                id={`${selectedBlock.id}.subheadline`}
                                ref={(el) => {
                                  fieldRefs.current[`${selectedBlock.id}.subheadline`] = el
                                }}
                                value={String(brandContent.subheadline ?? "")}
                                onChange={(e) => handleBrandFieldChange("subheadline", e.target.value)}
                                placeholder="Professionelle Physiotherapie mit ganzheitlichem Ansatz. Wir begleiten Sie auf dem Weg zu mehr Wohlbefinden und Lebensqualität."
                                className="text-sm min-h-[60px]"
                                rows={3}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">CTA Text</Label>
                              <Input
                                id={`${selectedBlock.id}.ctaText`}
                                ref={(el) => {
                                  fieldRefs.current[`${selectedBlock.id}.ctaText`] = el
                                }}
                                value={String(brandContent.ctaText || "")}
                                onChange={(e) => handleBrandFieldChange("ctaText", e.target.value)}
                                placeholder="CTA Text"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">CTA Link</Label>
                              <Input
                                id={`${selectedBlock.id}.ctaHref`}
                                ref={(el) => {
                                  fieldRefs.current[`${selectedBlock.id}.ctaHref`] = el
                                }}
                                value={String(brandContent.ctaHref || "")}
                                onChange={(e) => handleBrandFieldChange("ctaHref", e.target.value)}
                                placeholder="/kontakt"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Badge Text</Label>
                              <Input
                                id={`${selectedBlock.id}.badgeText`}
                                ref={(el) => {
                                  fieldRefs.current[`${selectedBlock.id}.badgeText`] = el
                                }}
                                value={String(brandContent.badgeText || "")}
                                onChange={(e) => handleBrandFieldChange("badgeText", e.target.value)}
                                placeholder="Badge Text"
                                className="h-8 text-sm"
                              />
                            </div>

                            <div className="rounded-md border border-border bg-muted/20 p-3 space-y-3">
                              <div className="text-xs font-semibold">Farben</div>
                              <div className="grid grid-cols-1 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Hero Hintergrund</Label>
                                  <ColorField
                                    value={String(props.heroBgColor || "")}
                                    onChange={(v) => handleHeroRootFieldChange("heroBgColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.heroBgColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Headline Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).headlineColor || "")}
                                    onChange={(v) => handleBrandFieldChange("headlineColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.headlineColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Subheadline Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).subheadlineColor || "")}
                                    onChange={(v) => handleBrandFieldChange("subheadlineColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.subheadlineColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">CTA Text Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).ctaColor || "")}
                                    onChange={(v) => handleBrandFieldChange("ctaColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.ctaColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">CTA Hintergrund</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).ctaBgColor || "")}
                                    onChange={(v) => handleBrandFieldChange("ctaBgColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.ctaBgColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">CTA Hover Hintergrund</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).ctaHoverBgColor || "")}
                                    onChange={(v) => handleBrandFieldChange("ctaHoverBgColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.ctaHoverBgColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">CTA Border</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).ctaBorderColor || "")}
                                    onChange={(v) => handleBrandFieldChange("ctaBorderColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.ctaBorderColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Badge Text Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).badgeColor || "")}
                                    onChange={(v) => handleBrandFieldChange("badgeColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.badgeColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Badge Hintergrund</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).badgeBgColor || "")}
                                    onChange={(v) => handleBrandFieldChange("badgeBgColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.badgeBgColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Play Text Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).playTextColor || "")}
                                    onChange={(v) => handleBrandFieldChange("playTextColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.playTextColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Play Border</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).playBorderColor || "")}
                                    onChange={(v) => handleBrandFieldChange("playBorderColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.playBorderColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Play Hintergrund</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).playBgColor || "")}
                                    onChange={(v) => handleBrandFieldChange("playBgColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.playBgColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Play Hover Hintergrund</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).playHoverBgColor || "")}
                                    onChange={(v) => handleBrandFieldChange("playHoverBgColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.playHoverBgColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Trust Items Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).trustItemsColor || "")}
                                    onChange={(v) => handleBrandFieldChange("trustItemsColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.trustItemsColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Trust Dot Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).trustDotColor || "")}
                                    onChange={(v) => handleBrandFieldChange("trustDotColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.trustDotColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Floating Title Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).floatingTitleColor || "")}
                                    onChange={(v) => handleBrandFieldChange("floatingTitleColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.floatingTitleColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Floating Value Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).floatingValueColor || "")}
                                    onChange={(v) => handleBrandFieldChange("floatingValueColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.floatingValueColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Floating Label Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).floatingLabelColor || "")}
                                    onChange={(v) => handleBrandFieldChange("floatingLabelColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.floatingLabelColor`] = el
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Bild</Label>
                              <ImageField
                                id={`${selectedBlock.id}.brandContent.${currentBrandTab}.image`}
                                label=""
                                value={
                                  brandContent.image && "url" in brandContent.image
                                    ? String(brandContent.image.url)
                                    : ""
                                }
                                onChange={handleBrandImageChange}
                                placeholder="/placeholder.svg"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Bild Alt-Text</Label>
                              <Input
                                value={String(brandContent.imageAlt || "")}
                                onChange={(e) => handleBrandFieldChange("imageAlt", e.target.value)}
                                placeholder="Bildbeschreibung"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Bildformat</Label>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant={(brandContent.imageVariant || "landscape") === "landscape" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleBrandFieldChange("imageVariant", "landscape")}
                                  className="flex-1"
                                >
                                  Querformat
                                </Button>
                                <Button
                                  type="button"
                                  variant={(brandContent.imageVariant || "landscape") === "portrait" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleBrandFieldChange("imageVariant", "portrait")}
                                  className="flex-1"
                                >
                                  Hochformat
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Ändert das Seitenverhältnis des Bildcontainers
                              </p>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Bildanpassung</Label>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant={(brandContent.imageFit || "cover") === "cover" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleBrandFieldChange("imageFit", "cover")}
                                  className="flex-1"
                                >
                                  Füllen
                                </Button>
                                <Button
                                  type="button"
                                  variant={(brandContent.imageFit || "cover") === "contain" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleBrandFieldChange("imageFit", "contain")}
                                  className="flex-1"
                                >
                                  Vollständig
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Wie das Bild im Container angezeigt wird
                              </p>
                            </div>
                            {(brandContent.imageFit || "cover") === "cover" && (
                              <div className="space-y-1.5">
                                <Label className="text-xs">Fokus</Label>
                                <Select
                                  value={brandContent.imageFocus || "center"}
                                  onValueChange={(v) => handleBrandFieldChange("imageFocus", v)}
                                >
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="center">Mitte</SelectItem>
                                    <SelectItem value="top">Oben</SelectItem>
                                    <SelectItem value="bottom">Unten</SelectItem>
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                  Wichtiger Bereich des Bildes (z.B. Gesichter oben)
                                </p>
                              </div>
                            )}
                            {(brandContent.imageFit || "cover") === "contain" && (
                              <div className="space-y-1.5">
                                <Label className="text-xs">Hintergrund</Label>
                                <Select
                                  value={brandContent.containBackground || "blur"}
                                  onValueChange={(v) => handleBrandFieldChange("containBackground", v)}
                                >
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="blur">Blur</SelectItem>
                                    <SelectItem value="none">Keiner</SelectItem>
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                  Hintergrund bei vollständiger Anzeige
                                </p>
                              </div>
                            )}
                            
                            <Separator />
                            
                            {/* Floating Elements */}
                            <div className="space-y-3">
                              <Label className="text-xs font-semibold">Floating Element</Label>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Floating Title</Label>
                                <Input
                                  id={`${selectedBlock.id}.floatingTitle`}
                                  ref={(el) => {
                                    fieldRefs.current[`${selectedBlock.id}.floatingTitle`] = el
                                  }}
                                  value={String(brandContent.floatingTitle || "")}
                                  onChange={(e) => handleBrandFieldChange("floatingTitle", e.target.value)}
                                  placeholder="Patientenzufriedenheit"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Floating Value</Label>
                                <Input
                                  id={`${selectedBlock.id}.floatingValue`}
                                  ref={(el) => {
                                    fieldRefs.current[`${selectedBlock.id}.floatingValue`] = el
                                  }}
                                  value={String(brandContent.floatingValue || "")}
                                  onChange={(e) => handleBrandFieldChange("floatingValue", e.target.value)}
                                  placeholder="98%"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Floating Label</Label>
                                <Input
                                  id={`${selectedBlock.id}.floatingLabel`}
                                  ref={(el) => {
                                    fieldRefs.current[`${selectedBlock.id}.floatingLabel`] = el
                                  }}
                                  value={String(brandContent.floatingLabel || "")}
                                  onChange={(e) => handleBrandFieldChange("floatingLabel", e.target.value)}
                                  placeholder="Optionales Label"
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                            
                            <Separator />
                            
                            {/* Trust Items */}
                            <div className="space-y-3">
                              <Label className="text-xs font-semibold">Trust Items</Label>
                              {(() => {
                                const trustItems = normalizeStringArray(brandContent.trustItems)
                                return (
                                  <div className="space-y-2">
                                    {trustItems.map((item, index) => (
                                      <div key={index} className="flex gap-2">
                                        <Input
                                          id={`${selectedBlock.id}.trustItems.${index}`}
                                          ref={(el) => {
                                            fieldRefs.current[`${selectedBlock.id}.trustItems.${index}`] = el
                                          }}
                                          value={item}
                                          onChange={(e) => {
                                            const updated = [...trustItems]
                                            updated[index] = e.target.value
                                            handleBrandFieldChange("trustItems", updated)
                                          }}
                                          placeholder={`Trust Item ${index + 1}`}
                                          className="h-8 text-sm flex-1"
                                        />
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() => {
                                            const updated = trustItems.filter((_, i) => i !== index)
                                            handleBrandFieldChange("trustItems", updated)
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full"
                                      onClick={() => {
                                        const updated = [...trustItems, ""]
                                        handleBrandFieldChange("trustItems", updated)
                                      }}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Trust Item hinzufügen
                                    </Button>
                                  </div>
                                )
                              })()}
                            </div>
                          </div>
                          )}
                        </TabsContent>
                        <TabsContent value="physio-konzept" className="space-y-4 mt-4">
                          {currentBrandTab !== "physio-konzept" ? null : (
                          <div className="space-y-3">
                            {/* FESTE TEXT-SECTION: Überschrift und Unterüberschrift - IMMER sichtbar */}
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold">Überschrift</Label>
                              <Input
                                id={`${selectedBlock.id}.headline`}
                                ref={(el) => {
                                  fieldRefs.current[`${selectedBlock.id}.headline`] = el
                                }}
                                value={String(brandContent.headline ?? "")}
                                onChange={(e) => handleBrandFieldChange("headline", e.target.value)}
                                placeholder="Push Your Limits"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold">Unterüberschrift</Label>
                              <Textarea
                                id={`${selectedBlock.id}.subheadline`}
                                ref={(el) => {
                                  fieldRefs.current[`${selectedBlock.id}.subheadline`] = el
                                }}
                                value={String(brandContent.subheadline ?? "")}
                                onChange={(e) => handleBrandFieldChange("subheadline", e.target.value)}
                                placeholder="Erreiche dein volles Potenzial mit individueller Trainingsbetreuung und sportphysiotherapeutischer Expertise."
                                className="text-sm min-h-[60px]"
                                rows={3}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Badge Text</Label>
                              <Input
                                id={`${selectedBlock.id}.badgeText`}
                                ref={(el) => {
                                  fieldRefs.current[`${selectedBlock.id}.badgeText`] = el
                                }}
                                value={String(brandContent.badgeText || "")}
                                onChange={(e) => handleBrandFieldChange("badgeText", e.target.value)}
                                placeholder="Badge Text"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">CTA Text</Label>
                              <Input
                                id={`${selectedBlock.id}.ctaText`}
                                ref={(el) => {
                                  fieldRefs.current[`${selectedBlock.id}.ctaText`] = el
                                }}
                                value={String(brandContent.ctaText || "")}
                                onChange={(e) => handleBrandFieldChange("ctaText", e.target.value)}
                                placeholder="CTA Text"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">CTA Link</Label>
                              <Input
                                id={`${selectedBlock.id}.ctaHref`}
                                ref={(el) => {
                                  fieldRefs.current[`${selectedBlock.id}.ctaHref`] = el
                                }}
                                value={String(brandContent.ctaHref || "")}
                                onChange={(e) => handleBrandFieldChange("ctaHref", e.target.value)}
                                placeholder="/kontakt"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Sekundärer Button Text</Label>
                              <Input
                                id={`${selectedBlock.id}.playText`}
                                ref={(el) => {
                                  fieldRefs.current[`${selectedBlock.id}.playText`] = el
                                }}
                                value={String(brandContent.playText || "")}
                                onChange={(e) => handleBrandFieldChange("playText", e.target.value)}
                                placeholder="Video ansehen"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Sekundärer CTA Link</Label>
                              <Input
                                value={String(brandContent.secondaryCtaHref || "")}
                                onChange={(e) => handleBrandFieldChange("secondaryCtaHref", e.target.value)}
                                placeholder="/video"
                                className="h-8 text-sm"
                              />
                            </div>                            

                            <div className="rounded-md border border-border bg-muted/20 p-3 space-y-3">
                              <div className="text-xs font-semibold">Farben</div>
                              <div className="grid grid-cols-1 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Headline Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).headlineColor || "")}
                                    onChange={(v) => handleBrandFieldChange("headlineColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.headlineColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Subheadline Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).subheadlineColor || "")}
                                    onChange={(v) => handleBrandFieldChange("subheadlineColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.subheadlineColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">CTA Text Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).ctaColor || "")}
                                    onChange={(v) => handleBrandFieldChange("ctaColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.ctaColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">CTA Hintergrund</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).ctaBgColor || "")}
                                    onChange={(v) => handleBrandFieldChange("ctaBgColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.ctaBgColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">CTA Hover Hintergrund</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).ctaHoverBgColor || "")}
                                    onChange={(v) => handleBrandFieldChange("ctaHoverBgColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.ctaHoverBgColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">CTA Border</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).ctaBorderColor || "")}
                                    onChange={(v) => handleBrandFieldChange("ctaBorderColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.ctaBorderColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Badge Text Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).badgeColor || "")}
                                    onChange={(v) => handleBrandFieldChange("badgeColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.badgeColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Badge Hintergrund</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).badgeBgColor || "")}
                                    onChange={(v) => handleBrandFieldChange("badgeBgColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.badgeBgColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Play Text Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).playTextColor || "")}
                                    onChange={(v) => handleBrandFieldChange("playTextColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.playTextColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Play Border</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).playBorderColor || "")}
                                    onChange={(v) => handleBrandFieldChange("playBorderColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.playBorderColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Play Hintergrund</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).playBgColor || "")}
                                    onChange={(v) => handleBrandFieldChange("playBgColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.playBgColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Play Hover Hintergrund</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).playHoverBgColor || "")}
                                    onChange={(v) => handleBrandFieldChange("playHoverBgColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.playHoverBgColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Floating Title Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).floatingTitleColor || "")}
                                    onChange={(v) => handleBrandFieldChange("floatingTitleColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.floatingTitleColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Floating Value Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).floatingValueColor || "")}
                                    onChange={(v) => handleBrandFieldChange("floatingValueColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.floatingValueColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Floating Label Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).floatingLabelColor || "")}
                                    onChange={(v) => handleBrandFieldChange("floatingLabelColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.floatingLabelColor`] = el
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Bild</Label>
                              <ImageField
                                id={`${selectedBlock.id}.brandContent.${currentBrandTab}.image`}
                                label=""
                                value={
                                  brandContent.image && "url" in brandContent.image
                                    ? String(brandContent.image.url)
                                    : ""
                                }
                                onChange={handleBrandImageChange}
                                placeholder="/placeholder.svg"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Bild Alt-Text</Label>
                              <Input
                                value={String(brandContent.imageAlt || "")}
                                onChange={(e) => handleBrandFieldChange("imageAlt", e.target.value)}
                                placeholder="Bildbeschreibung"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Bildformat</Label>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant={(brandContent.imageVariant || "landscape") === "landscape" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleBrandFieldChange("imageVariant", "landscape")}
                                  className="flex-1"
                                >
                                  Querformat
                                </Button>
                                <Button
                                  type="button"
                                  variant={(brandContent.imageVariant || "landscape") === "portrait" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleBrandFieldChange("imageVariant", "portrait")}
                                  className="flex-1"
                                >
                                  Hochformat
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Ändert das Seitenverhältnis des Bildcontainers
                              </p>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Bildanpassung</Label>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant={(brandContent.imageFit || "cover") === "cover" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleBrandFieldChange("imageFit", "cover")}
                                  className="flex-1"
                                >
                                  Füllen
                                </Button>
                                <Button
                                  type="button"
                                  variant={(brandContent.imageFit || "cover") === "contain" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleBrandFieldChange("imageFit", "contain")}
                                  className="flex-1"
                                >
                                  Vollständig
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Wie das Bild im Container angezeigt wird
                              </p>
                            </div>
                            {(brandContent.imageFit || "cover") === "cover" && (
                              <div className="space-y-1.5">
                                <Label className="text-xs">Fokus</Label>
                                <Select
                                  value={brandContent.imageFocus || "center"}
                                  onValueChange={(v) => handleBrandFieldChange("imageFocus", v)}
                                >
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="center">Mitte</SelectItem>
                                    <SelectItem value="top">Oben</SelectItem>
                                    <SelectItem value="bottom">Unten</SelectItem>
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                  Wichtiger Bereich des Bildes (z.B. Gesichter oben)
                                </p>
                              </div>
                            )}
                            {(brandContent.imageFit || "cover") === "contain" && (
                              <div className="space-y-1.5">
                                <Label className="text-xs">Hintergrund</Label>
                                <Select
                                  value={brandContent.containBackground || "blur"}
                                  onValueChange={(v) => handleBrandFieldChange("containBackground", v)}
                                >
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="blur">Blur</SelectItem>
                                    <SelectItem value="none">Keiner</SelectItem>
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                  Hintergrund bei vollständiger Anzeige
                                </p>
                              </div>
                            )}
                            
                            <Separator />
                            
                            {/* Floating Elements */}
                            <div className="space-y-3">
                              <Label className="text-xs font-semibold">Floating Element</Label>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Floating Title</Label>
                                <Input
                                  id={`${selectedBlock.id}.floatingTitle`}
                                  ref={(el) => {
                                    fieldRefs.current[`${selectedBlock.id}.floatingTitle`] = el
                                  }}
                                  value={String(brandContent.floatingTitle || "")}
                                  onChange={(e) => handleBrandFieldChange("floatingTitle", e.target.value)}
                                  placeholder="Nächstes Training"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Floating Value</Label>
                                <Input
                                  id={`${selectedBlock.id}.floatingValue`}
                                  ref={(el) => {
                                    fieldRefs.current[`${selectedBlock.id}.floatingValue`] = el
                                  }}
                                  value={String(brandContent.floatingValue || "")}
                                  onChange={(e) => handleBrandFieldChange("floatingValue", e.target.value)}
                                  placeholder="Heute, 18:00"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Floating Label</Label>
                                <Input
                                  id={`${selectedBlock.id}.floatingLabel`}
                                  ref={(el) => {
                                    fieldRefs.current[`${selectedBlock.id}.floatingLabel`] = el
                                  }}
                                  value={String(brandContent.floatingLabel || "")}
                                  onChange={(e) => handleBrandFieldChange("floatingLabel", e.target.value)}
                                  placeholder="Optionales Label"
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                          </div>
                          )}
                        </TabsContent>
                      </Tabs>
                      <Separator />
                    </div>
                  )
                })()}

                {/* Dynamic Element Selector (e.g., for trust items, actions) */}
                {selectedBlock.type === "hero" && (() => {
                  const props = selectedBlock.props as HeroBlock["props"]
                  const trustItems = normalizeStringArray(props.trustItems ?? [])
                  const mood = (props as any)?.mood ?? "physiotherapy"
                  const actions = props.actions ?? (props.brandContent?.[mood as keyof typeof props.brandContent]?.actions) ?? []
                  
                  if (trustItems.length === 0 && actions.length === 0) return null
                  
                  return (
                    <>
                      {trustItems.length > 0 && (
                        <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
                          <Label className="text-xs font-semibold">Trust Items</Label>
                          <div className="flex flex-wrap gap-2">
                            {trustItems.map((_, index) => {
                              const itemId = `trustItems.${index}`
                              const isSelected = selectedElementId === itemId
                              return (
                                <Button
                                  key={index}
                                  variant={isSelected ? "default" : "outline"}
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => setSelectedElementId(itemId)}
                                >
                                  Item {index + 1}
                                </Button>
                              )
                            })}
                          </div>
                          {selectedElementId && selectedElementId.startsWith("trustItems.") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => setSelectedElementId(null)}
                            >
                              Deselect
                            </Button>
                          )}
                        </div>
                      )}

                      {actions.length > 0 && (
                        <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
                          <Label className="text-xs font-semibold">CTA Actions</Label>
                          <div className="flex flex-wrap gap-2">
                            {actions.map((action: any, index: number) => {
                              const itemId = `action-${action.id}`
                              const isSelected = selectedElementId === itemId
                              return (
                                <Button
                                  key={action.id}
                                  variant={isSelected ? "default" : "outline"}
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => setSelectedElementId(itemId)}
                                >
                                  {action.label || `Action ${index + 1}`}
                                </Button>
                              )
                            })}
                          </div>
                          {selectedElementId && selectedElementId.startsWith("action-") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => setSelectedElementId(null)}
                            >
                              Deselect
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  )
                })()}

                {/* Hero Actions Array Editor */}
                {selectedBlock.type === "hero" && (() => {
                  const def = getBlockDefinition("hero")
                  const hasActionsField = def.inspectorFields?.some(f => f.key === "actions")
                  if (!hasActionsField) return null

                  return (
                    <>
                      <Separator />
                      {renderArrayItemsControls(
                        selectedBlock,
                        "actions",
                        "Action",
                        (action: any, index: number) => `${index + 1}. ${action.label || "Action"}`,
                        createHeroAction,
                        [
                          {
                            key: "variant",
                            label: "Typ",
                            type: "select" as const,
                            options: [
                              { value: "primary", label: "Primary Button" },
                              { value: "secondary", label: "Secondary Button" },
                            ],
                          },
                          { key: "label", label: "Label", type: "text" as const, required: true },
                          { key: "href", label: "Link (optional)", type: "url" as const },
                          {
                            key: "action",
                            label: "Action Typ (optional)",
                            type: "select" as const,
                            options: [
                              { value: "video", label: "Video" },
                              { value: "scroll", label: "Scroll" },
                            ],
                          },
                        ]
                      )}
                    </>
                  )
                })()}


                {/* Render array items with controls for featureGrid, faq, team, contactForm */}
                
{(() => {
  const def = getBlockDefinition(selectedBlock.type)
  const fields = def.inspectorFields ?? []

  const primaryKeys = new Set(["headline", "subheadline", "title", "subtitle"])
  const lateKeys = new Set(["autoplay", "interval", "showArrows", "showDots"])

  const isArrayItemField = (key: string) => {
    if (selectedBlock.type === "hero" && key.startsWith("trustItems.")) return true
    if (selectedBlock.type === "hero" && key.startsWith("actions.")) return true
    if (selectedBlock.type === "featureGrid" && key.startsWith("features.")) return true
    if (selectedBlock.type === "servicesGrid" && key.startsWith("cards.")) return true
    if (selectedBlock.type === "faq" && key.startsWith("items.")) return true
    if (selectedBlock.type === "team" && key.startsWith("members.")) return true
    if (selectedBlock.type === "contactForm" && key.startsWith("fields.")) return true
    if (selectedBlock.type === "contactForm" && key.startsWith("contactInfoCards.")) return true
    if (selectedBlock.type === "testimonials" && key.startsWith("items.")) return true
    if (selectedBlock.type === "testimonialSlider" && key.startsWith("items.")) return true
    if (selectedBlock.type === "gallery" && key.startsWith("images.")) return true
    if (selectedBlock.type === "imageSlider" && key.startsWith("slides.")) return true
    if (selectedBlock.type === "openingHours" && key.startsWith("hours.")) return true
    return false
  }

  const isLegacyHeroField = (key: string) => {
    if (selectedBlock.type !== "hero") return false
    // Fields handled via Brand Tabs (content)
    const brandTabFields = [
      // Media fields
      "mediaUrl",
      "mediaType",
      "showMedia",
      "image",
      "imageFit",
      "containBackground",
      "imageAlt",
      "imageVariant",
      "imageFocus",
      // Text content
      "headline",
      "subheadline",
      "ctaText",
      "ctaHref",
      "badgeText",
      "playText",
      "floatingTitle",
      "floatingValue",
      "floatingLabel",
      // Brand/Mood
      "mood",
      // Brand-specific color fields
      "headlineColor",
      "subheadlineColor",
      "ctaColor",
      "ctaBgColor",
      "ctaHoverBgColor",
      "ctaBorderColor",
      "badgeColor",
      "badgeBgColor",
      "playTextColor",
      "playBgColor",
      "playBorderColor",
      "playHoverBgColor",
      "trustItemsColor",
      "trustDotColor",
      "floatingTitleColor",
      "floatingValueColor",
      "floatingLabelColor",
      // Secondary CTA fields
      "secondaryCtaText",
      "secondaryCtaHref",
      "secondaryCtaColor",
      "secondaryCtaBgColor",
      "secondaryCtaHoverBgColor",
      "secondaryCtaBorderColor",
    ]
    return brandTabFields.includes(key)
  }

  const normalFields = fields.filter((field) => {
    if (isArrayItemField(field.key)) return false
    if (isLegacyHeroField(field.key)) return false
    return true
  })

  // Sort fields by group (use custom group order if defined on block)
  const groupOrder = def.inspectorGroupOrder || undefined
  const sortedFields = sortInspectorFields(normalFields, groupOrder)

  const primaryFields = sortedFields.filter((f) => {
    if (primaryKeys.has(f.key)) return true
    // Slider: background soll direkt bei Head/Subline stehen
    if (selectedBlock.type === "testimonialSlider" && f.key === "background") return true
    return false
  })

  const restFields = sortedFields.filter((f) => !primaryFields.some((p) => p.key === f.key))
  const midFields = restFields.filter((f) => !lateKeys.has(f.key))
  const lateFields = restFields.filter((f) => lateKeys.has(f.key))

  // Helper to evaluate showWhen condition
  const shouldShowField = (field: InspectorField): boolean => {
    if (!field.showWhen) return true
    const currentProps = selectedBlock?.props as Record<string, unknown>
    const getByPath = (obj: any, path: string): any => {
      return path.split(".").reduce((acc, part) => acc?.[part], obj)
    }
    const currentValue = getByPath(currentProps, field.showWhen.key)
    return currentValue === field.showWhen.equals
  }

  return (
    <>
      {/* 1) Head/Subline (und ggf. Background) */}
      {primaryFields.filter(shouldShowField).map((field) => renderInspectorField(field, selectedBlock))}

      {/* Button Preset (one dropdown per block for card, section, imageText, cta, hero, team, contactForm) */}
      {(() => {
        const showButtonPreset = selectedBlock.type === "card" ||
          selectedBlock.type === "section" ||
          selectedBlock.type === "imageText" ||
          selectedBlock.type === "cta" ||
          selectedBlock.type === "hero" ||
          selectedBlock.type === "team" ||
          selectedBlock.type === "contactForm"
        
        if (!showButtonPreset) {
          return null
        }
        
        return (
          <>
            <Separator />
            <div className="space-y-1.5">
              <Label className="text-xs">Button Preset</Label>
              <Select
                value={String((selectedBlock.props as Record<string, unknown>)?.buttonPreset ?? "default")}
                onValueChange={(v) => {
                  if (!selectedBlock) return
                  const currentProps = selectedBlock.props as Record<string, unknown>
                  const updatedProps = {
                    ...currentProps,
                    buttonPreset: v === "default" ? undefined : v,
                  } as CMSBlock["props"]
                  updateSelectedProps(updatedProps)
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Default" />
                </SelectTrigger>
                <SelectContent side="bottom" align="start" sideOffset={5}>
                  {BUTTON_PRESET_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )
      })()}

      {/* 2) Items/Arrays */}
      {selectedBlock.type === "servicesGrid" && (
        <>
          <Separator />

          {/* Block-Level Controls: Variant, Background, Columns, Autoplay, Interval */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Variante</Label>
              <Select
                value={selectedBlock.props?.variant || "grid"}
                onValueChange={(v) => {
                  if (!selectedBlock) return
                  const currentProps = selectedBlock.props as Record<string, unknown>
                  const updatedProps = { ...currentProps, variant: v } as CMSBlock["props"]
                  updateSelectedProps(updatedProps)
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="slider">Slider</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Hintergrund</Label>
              <Select
                value={selectedBlock.props?.background || "none"}
                onValueChange={(v) => {
                  if (!selectedBlock) return
                  const currentProps = selectedBlock.props as Record<string, unknown>
                  const updatedProps = { ...currentProps, background: v } as CMSBlock["props"]
                  updateSelectedProps(updatedProps)
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine</SelectItem>
                  <SelectItem value="muted">Muted</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedBlock.props?.variant === "grid" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Spalten</Label>
                <Select
                  value={String(selectedBlock.props?.columns || 3)}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const updatedProps = { ...currentProps, columns: Number(v) } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedBlock.props?.variant === "slider" && (
              <>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Autoplay</Label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, autoplay: !currentProps.autoplay } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                    className={cn(
                      "h-6 w-11 rounded-full border border-border transition-colors",
                      selectedBlock.props?.autoplay ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "h-5 w-5 rounded-full bg-white transition-transform",
                        selectedBlock.props?.autoplay ? "translate-x-5" : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>

                {selectedBlock.props?.autoplay && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Interval (Sekunden)</Label>
                    <Select
                      value={String(selectedBlock.props?.interval || 6000)}
                      onValueChange={(v) => {
                        if (!selectedBlock) return
                        const currentProps = selectedBlock.props as Record<string, unknown>
                        const updatedProps = { ...currentProps, interval: Number(v) } as CMSBlock["props"]
                        updateSelectedProps(updatedProps)
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3000">3 Sekunden</SelectItem>
                        <SelectItem value="4500">4,5 Sekunden</SelectItem>
                        <SelectItem value="6000">6 Sekunden</SelectItem>
                        <SelectItem value="8000">8 Sekunden</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs">Slider Ausrichtung</Label>
                  <Select
                    value={selectedBlock.props?.sliderAlign || "center"}
                    onValueChange={(v) => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, sliderAlign: v } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="center">Zentriert</SelectItem>
                      <SelectItem value="left">Links</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Steuerelemente</Label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, showControls: !currentProps.showControls } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                    className={cn(
                      "h-6 w-11 rounded-full border border-border transition-colors",
                      selectedBlock.props?.showControls ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "h-5 w-5 rounded-full bg-white transition-transform",
                        selectedBlock.props?.showControls ? "translate-x-5" : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>
              </>
            )}
          </div>

          <Separator />

          {renderArrayItemsControls(
            selectedBlock,
            "cards",
            "Card",
            (card, index) => `Card ${index + 1}`,
            createServiceCard,
            [
              {
                key: "icon",
                label: "Icon",
                type: "select" as const,
                options: getAvailableIconsWithLabels(),
              },
              { key: "iconColor", label: "Icon Farbe (optional)", type: "color" as const, placeholder: "#111111" },
              { key: "iconBgColor", label: "Icon Hintergrund (optional)", type: "color" as const, placeholder: "#e5e7eb" },
              { key: "title", label: "Titel", type: "text" as const },
              { key: "titleColor", label: "Titel Farbe (optional)", type: "color" as const, placeholder: "#111111" },
              { key: "text", label: "Text", type: "textarea" as const },
              { key: "textColor", label: "Text Farbe (optional)", type: "color" as const, placeholder: "#666666" },
              { key: "ctaText", label: "CTA Text", type: "text" as const },
              { key: "ctaColor", label: "CTA Farbe (optional)", type: "color" as const, placeholder: "#111111" },
              { key: "ctaHref", label: "CTA Link", type: "url" as const },
              { key: "cardBgColor", label: "Card Hintergrund (optional)", type: "color" as const, placeholder: "#ffffff" },
              { key: "cardBorderColor", label: "Card Border (optional)", type: "color" as const, placeholder: "#e5e7eb" },
            ]
          )}
        </>
      )}

      {selectedBlock.type === "testimonials" && (
        <>
          <Separator />
          
          {/* Block-Level Controls: Autoplay & Interval (nur für Slider-Variante) */}
          {selectedBlock.props?.variant === "slider" && (
            <div className="space-y-3 border-b border-border pb-4 mb-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Autoplay</Label>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const updatedProps = { ...currentProps, autoplay: !currentProps.autoplay } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                  className={cn(
                    "h-6 w-11 rounded-full border border-border transition-colors",
                    selectedBlock.props?.autoplay ? "bg-primary" : "bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full bg-white transition-transform",
                      selectedBlock.props?.autoplay ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>

              {selectedBlock.props?.autoplay && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Interval (Sekunden)</Label>
                  <Select
                    value={String(selectedBlock.props?.interval || 6000)}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const updatedProps = { ...currentProps, interval: Number(v) } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3000">3 Sekunden</SelectItem>
                      <SelectItem value="4500">4,5 Sekunden</SelectItem>
                      <SelectItem value="6000">6 Sekunden</SelectItem>
                      <SelectItem value="8000">8 Sekunden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {renderArrayItemsControls(
            selectedBlock,
            "items",
            "Testimonial",
            (item, index) => {
              const it = item as unknown as Record<string, unknown>
              const name = String(it.name || "")
              return `${index + 1}. ${name || "Testimonial"}`
            },
            createTestimonialItem,
            [
              { key: "quote", label: "Zitat", type: "textarea" as const, required: true },
              { key: "quoteColor", label: "Zitat Farbe (optional)", type: "color" as const, placeholder: "#111111" },
              { key: "avatar", label: "Avatar (optional)", type: "image" as const, placeholder: "/avatar.jpg" },
              {
                key: "avatarGradient",
                label: "Avatar Gradient",
                type: "select" as const,
                options: [
                  { value: "auto", label: "Auto" },
                  { value: "g1", label: "Primary" },
                  { value: "g2", label: "Accent" },
                  { value: "g3", label: "Chart 1" },
                  { value: "g4", label: "Chart 2" },
                  { value: "g5", label: "Chart 3" },
                  { value: "g6", label: "Blue" },
                  { value: "g7", label: "Purple" },
                  { value: "g8", label: "Green" },
                  { value: "g9", label: "Rose" },
                  { value: "g10", label: "Amber" },
                ],
              },
              { key: "avatarColor", label: "Avatar Farbe (optional)", type: "color" as const, placeholder: "#111111" },
              { key: "name", label: "Name", type: "text" as const, required: true },
              { key: "nameColor", label: "Name Farbe (optional)", type: "color" as const, placeholder: "#111111" },
              { key: "role", label: "Rolle (optional)", type: "text" as const },
              { key: "roleColor", label: "Rolle Farbe (optional)", type: "color" as const, placeholder: "#666666" },
              {
                key: "rating",
                label: "Rating (optional)",
                type: "select" as const,
                options: [
                  { value: "none", label: "—" },
                  { value: "5", label: "★★★★★ (5)" },
                  { value: "4", label: "★★★★☆ (4)" },
                  { value: "3", label: "★★★☆☆ (3)" },
                  { value: "2", label: "★★☆☆☆ (2)" },
                  { value: "1", label: "★☆☆☆☆ (1)" },
                ],
              },
            ],
            1,
            12
          )}
        </>
      )}

      {selectedBlock.type === "testimonialSlider" && (
        <>
          <Separator />
          {renderArrayItemsControls(
            selectedBlock,
            "items",
            "Testimonial",
            (item, index) => {
              const it = item as unknown as Record<string, unknown>
              const name = String(it.name || "")
              return `${index + 1}. ${name || "Testimonial"}`
            },
            createTestimonialItem,
            [
              { key: "quote", label: "Zitat", type: "textarea" as const, required: true },
              { key: "name", label: "Name", type: "text" as const, required: true },
              { key: "role", label: "Rolle (optional)", type: "text" as const },
              {
                key: "rating",
                label: "Rating (optional)",
                type: "select" as const,
                options: [
                  { value: "none", label: "—" },
                  { value: "5", label: "★★★★★ (5)" },
                  { value: "4", label: "★★★★☆ (4)" },
                  { value: "3", label: "★★★☆☆ (3)" },
                  { value: "2", label: "★★☆☆☆ (2)" },
                  { value: "1", label: "★☆☆☆☆ (1)" },
                ],
              },
            ],
            1,
            12
          )}
        </>
      )}

      {selectedBlock.type === "gallery" && (
        <>
          <Separator />
          {renderArrayItemsControls(
            selectedBlock,
            "images",
            "Bild",
            (_img, index) => `Bild ${index + 1}`,
            createGalleryImage,
            [
              { key: "url", label: "Bild-URL", type: "image" as const, required: true, placeholder: "/placeholder.svg" },
              { key: "alt", label: "Alt-Text", type: "text" as const, required: true },
              { key: "caption", label: "Caption (optional)", type: "text" as const },
              { key: "captionColor", label: "Caption Farbe (optional)", type: "color" as const, placeholder: "#666666" },
              { key: "link", label: "Link (optional, wenn Lightbox aus)", type: "url" as const },
            ],
            3,
            18
          )}
        </>
      )}

      {selectedBlock.type === "imageSlider" && (
        <>
          <Separator />
          {renderArrayItemsControls(
            selectedBlock,
            "slides",
            "Slide",
            (slide, index) => {
              const s = slide as unknown as Record<string, unknown>
              const title = String(s.title || "")
              return `${index + 1}. ${title || "Slide"}`
            },
            createImageSlide,
            [
              { key: "url", label: "Bild URL", type: "url" as const, required: true },
              { key: "alt", label: "Alt-Text", type: "text" as const, required: true },
              { key: "title", label: "Titel (optional)", type: "text" as const },
              { key: "text", label: "Text (optional)", type: "textarea" as const },
              { key: "titleColor", label: "Titel Farbe", type: "color" as const, placeholder: "#111111" },
              { key: "textColor", label: "Text Farbe", type: "color" as const, placeholder: "#666666" },
            ],
            1,
            12
          )}
        </>
      )}

      {selectedBlock.type === "openingHours" && (
        <>
          <Separator />
          {renderArrayItemsControls(
            selectedBlock,
            "hours",
            "Zeile",
            (row, index) => {
              const r = row as unknown as Record<string, unknown>
              const label = String(r.label || "")
              return `${index + 1}. ${label || "Tag"}`
            },
            createOpeningHour,
            [
              { key: "label", label: "Label", type: "text" as const, required: true },
              { key: "labelColor", label: "Label Farbe (optional)", type: "color" as const, placeholder: "#111111" },
              { key: "value", label: "Wert", type: "text" as const, required: true },
              { key: "valueColor", label: "Wert Farbe (optional)", type: "color" as const, placeholder: "#666666" },
            ],
            1,
            10
          )}
        </>
      )}

      {selectedBlock.type === "featureGrid" && (
        <>
          <Separator />

          {/* Block-Level Design System Controls */}
          <div className="space-y-3">
            {/* Columns */}
            <div className="space-y-1.5">
              <Label className="text-xs">Spalten</Label>
              <Select
                value={((selectedBlock.props as any)?.columns || 3).toString()}
                onValueChange={(v) => {
                  if (!selectedBlock) return
                  const currentProps = selectedBlock.props as Record<string, unknown>
                  const updatedProps = { ...currentProps, columns: parseInt(v, 10) } as CMSBlock["props"]
                  updateSelectedProps(updatedProps)
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Design Preset */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-primary">Design Preset</Label>
              <Select
                value={(selectedBlock.props as any)?.designPreset || "standard"}
                onValueChange={(v) => {
                  if (!selectedBlock) return
                  const presets: Record<string, any> = {
                    standard: {
                      style: { variant: "default", radius: "xl", border: "subtle", shadow: "sm", accent: "none" },
                      animation: { entrance: "fade", hover: "none", durationMs: 400, delayMs: 0 },
                    },
                    softGlow: {
                      style: { variant: "soft", radius: "lg", border: "none", shadow: "md", accent: "none" },
                      animation: { entrance: "fade", hover: "glow", durationMs: 400, delayMs: 0 },
                    },
                    outlineStrong: {
                      style: { variant: "outline", radius: "lg", border: "strong", shadow: "none", accent: "none" },
                      animation: { entrance: "slide-up", hover: "lift", durationMs: 500, delayMs: 0 },
                    },
                    elevatedBrand: {
                      style: { variant: "elevated", radius: "xl", border: "subtle", shadow: "lg", accent: "brand" },
                      animation: { entrance: "scale", hover: "lift", durationMs: 400, delayMs: 0 },
                    },
                    mutedAccentMinimal: {
                      style: { variant: "soft", radius: "md", border: "none", shadow: "sm", accent: "muted" },
                      animation: { entrance: "slide-left", hover: "none", durationMs: 300, delayMs: 0 },
                    },
                  }
                  const preset = presets[v]
                  const currentProps = selectedBlock.props as Record<string, unknown>
                  const updatedProps = {
                    ...currentProps,
                    designPreset: v,
                    style: preset.style,
                    animation: preset.animation,
                  } as CMSBlock["props"]
                  updateSelectedProps(updatedProps)
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="softGlow">Soft Glow</SelectItem>
                  <SelectItem value="outlineStrong">Outline Strong</SelectItem>
                  <SelectItem value="elevatedBrand">Elevated Brand</SelectItem>
                  <SelectItem value="mutedAccentMinimal">Muted Accent Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Style Controls */}
            <div className="space-y-1.5 rounded-lg bg-muted/30 p-3">
              <Label className="text-xs font-semibold text-primary">STYLE (nach Preset anpassen)</Label>
              
              {/* Variant */}
              <div className="space-y-1.5">
                <Label className="text-xs">Variante</Label>
                <Select
                  value={(selectedBlock.props as any)?.style?.variant || "default"}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const style = (currentProps.style as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      style: { ...style, variant: v },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="soft">Soft</SelectItem>
                    <SelectItem value="outline">Outline</SelectItem>
                    <SelectItem value="elevated">Elevated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Radius */}
              <div className="space-y-1.5">
                <Label className="text-xs">Border Radius</Label>
                <Select
                  value={(selectedBlock.props as any)?.style?.radius || "xl"}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const style = (currentProps.style as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      style: { ...style, radius: v },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="md">Medium</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                    <SelectItem value="xl">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Border */}
              <div className="space-y-1.5">
                <Label className="text-xs">Border</Label>
                <Select
                  value={(selectedBlock.props as any)?.style?.border || "subtle"}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const style = (currentProps.style as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      style: { ...style, border: v },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="subtle">Subtle</SelectItem>
                    <SelectItem value="strong">Strong</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Shadow */}
              <div className="space-y-1.5">
                <Label className="text-xs">Schatten</Label>
                <Select
                  value={(selectedBlock.props as any)?.style?.shadow || "sm"}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const style = (currentProps.style as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      style: { ...style, shadow: v },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="sm">Small</SelectItem>
                    <SelectItem value="md">Medium</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Accent */}
              <div className="space-y-1.5">
                <Label className="text-xs">Akzentfarbe</Label>
                <Select
                  value={(selectedBlock.props as any)?.style?.accent || "none"}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const style = (currentProps.style as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      style: { ...style, accent: v },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="brand">Brand</SelectItem>
                    <SelectItem value="muted">Muted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Animation Controls */}
            <div className="space-y-1.5 rounded-lg bg-muted/30 p-3">
              <Label className="text-xs font-semibold text-primary">ANIMATION</Label>
              
              {/* Entrance */}
              <div className="space-y-1.5">
                <Label className="text-xs">Eintrittsanimation</Label>
                <Select
                  value={(selectedBlock.props as any)?.animation?.entrance || "fade"}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const animation = (currentProps.animation as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      animation: { ...animation, entrance: v },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="fade">Fade</SelectItem>
                    <SelectItem value="slide-up">Slide Up</SelectItem>
                    <SelectItem value="slide-left">Slide Left</SelectItem>
                    <SelectItem value="scale">Scale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Hover */}
              <div className="space-y-1.5">
                <Label className="text-xs">Hover-Animation</Label>
                <Select
                  value={(selectedBlock.props as any)?.animation?.hover || "none"}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const animation = (currentProps.animation as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      animation: { ...animation, hover: v },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="lift">Lift</SelectItem>
                    <SelectItem value="glow">Glow</SelectItem>
                    <SelectItem value="tilt">Tilt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <Label className="text-xs">Dauer (ms)</Label>
                <input
                  type="number"
                  min="100"
                  max="1000"
                  step="50"
                  value={(selectedBlock.props as any)?.animation?.durationMs || 400}
                  onChange={(e) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const animation = (currentProps.animation as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      animation: { ...animation, durationMs: parseInt(e.target.value, 10) },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                  className="h-8 w-full rounded border border-border bg-background px-2 text-sm"
                />
              </div>

              {/* Delay */}
              <div className="space-y-1.5">
                <Label className="text-xs">Verzögerung (ms)</Label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  step="50"
                  value={(selectedBlock.props as any)?.animation?.delayMs || 0}
                  onChange={(e) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const animation = (currentProps.animation as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      animation: { ...animation, delayMs: parseInt(e.target.value, 10) },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                  className="h-8 w-full rounded border border-border bg-background px-2 text-sm"
                />
              </div>
            </div>

            {/* Global Colors */}
            <div className="space-y-1.5 rounded-lg bg-muted/30 p-3">
              <Label className="text-xs font-semibold text-primary">FARBEN (global)</Label>
              
              <div className="space-y-1.5">
                <Label className="text-xs">Titel Farbe</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={(selectedBlock.props as any)?.titleColor || "#111111"}
                    onChange={(e) => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, titleColor: e.target.value } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                    className="h-8 w-12 rounded border border-border"
                  />
                  <input
                    type="text"
                    value={(selectedBlock.props as any)?.titleColor || "#111111"}
                    onChange={(e) => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, titleColor: e.target.value } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                    className="h-8 flex-1 rounded border border-border bg-background px-2 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Beschreibung Farbe</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={(selectedBlock.props as any)?.descriptionColor || "#666666"}
                    onChange={(e) => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, descriptionColor: e.target.value } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                    className="h-8 w-12 rounded border border-border"
                  />
                  <input
                    type="text"
                    value={(selectedBlock.props as any)?.descriptionColor || "#666666"}
                    onChange={(e) => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, descriptionColor: e.target.value } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                    className="h-8 flex-1 rounded border border-border bg-background px-2 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Icon Farbe</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={(selectedBlock.props as any)?.iconColor || "#111111"}
                    onChange={(e) => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, iconColor: e.target.value } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                    className="h-8 w-12 rounded border border-border"
                  />
                  <input
                    type="text"
                    value={(selectedBlock.props as any)?.iconColor || "#111111"}
                    onChange={(e) => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, iconColor: e.target.value } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                    className="h-8 flex-1 rounded border border-border bg-background px-2 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Card Hintergrund</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={(selectedBlock.props as any)?.cardBgColor || "#ffffff"}
                    onChange={(e) => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, cardBgColor: e.target.value } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                    className="h-8 w-12 rounded border border-border"
                  />
                  <input
                    type="text"
                    value={(selectedBlock.props as any)?.cardBgColor || "#ffffff"}
                    onChange={(e) => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, cardBgColor: e.target.value } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                    className="h-8 flex-1 rounded border border-border bg-background px-2 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Card Border</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={(selectedBlock.props as any)?.cardBorderColor || "#e5e7eb"}
                    onChange={(e) => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, cardBorderColor: e.target.value } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                    className="h-8 w-12 rounded border border-border"
                  />
                  <input
                    type="text"
                    value={(selectedBlock.props as any)?.cardBorderColor || "#e5e7eb"}
                    onChange={(e) => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, cardBorderColor: e.target.value } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                    className="h-8 flex-1 rounded border border-border bg-background px-2 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Array Items Controls */}
          {renderArrayItemsControls(
            selectedBlock,
            "features",
            "Feature",
            (feature, index) => `Feature ${index + 1}`,
            createFeatureItem,
            [
              { key: "title", label: "Titel", type: "text" as const },
              { key: "titleColor", label: "Titel Farbe (optional)", type: "color" as const, placeholder: "#111111" },
              { key: "description", label: "Beschreibung", type: "textarea" as const },
              { key: "descriptionColor", label: "Beschreibung Farbe (optional)", type: "color" as const, placeholder: "#666666" },
              { key: "icon", label: "Icon", type: "text" as const },
              { key: "iconColor", label: "Icon Farbe (optional)", type: "color" as const, placeholder: "#111111" },
              { key: "cardBgColor", label: "Card Hintergrund (optional)", type: "color" as const, placeholder: "#ffffff" },
              { key: "cardBorderColor", label: "Card Border (optional)", type: "color" as const, placeholder: "#e5e7eb" },
            ]
          )}
        </>
      )}

      {selectedBlock.type === "imageText" && (
        <>
          <Separator />
          
          {/* Block-Level Design System Controls */}
          <div className="space-y-3">
            {/* Layout Preset */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-primary">Layout Preset</Label>
              <Select
                value={(selectedBlock.props as any)?.designPreset || "standard"}
                onValueChange={(v) => {
                  if (!selectedBlock) return
                  const presets: Record<string, any> = {
                    standard: {
                      style: { variant: "default", verticalAlign: "center", textAlign: "left", maxWidth: "lg" },
                      background: "none",
                      imagePosition: "left",
                    },
                    soft: {
                      style: { variant: "soft", verticalAlign: "center", textAlign: "left", maxWidth: "lg" },
                      background: "muted",
                      imagePosition: "left",
                    },
                    softCentered: {
                      style: { variant: "soft", verticalAlign: "center", textAlign: "center", maxWidth: "lg" },
                      background: "muted",
                      imagePosition: "left",
                    },
                    imageRight: {
                      style: { variant: "default", verticalAlign: "center", textAlign: "left", maxWidth: "lg" },
                      background: "none",
                      imagePosition: "right",
                    },
                    imageRightCentered: {
                      style: { variant: "default", verticalAlign: "center", textAlign: "center", maxWidth: "lg" },
                      background: "none",
                      imagePosition: "right",
                    },
                    topAligned: {
                      style: { variant: "default", verticalAlign: "top", textAlign: "left", maxWidth: "lg" },
                      background: "none",
                      imagePosition: "left",
                    },
                  }
                  const preset = presets[v]
                  const currentProps = selectedBlock.props as Record<string, unknown>
                  const updatedProps = {
                    ...currentProps,
                    designPreset: v,
                    style: preset.style,
                    background: preset.background,
                    imagePosition: preset.imagePosition,
                  } as CMSBlock["props"]
                  updateSelectedProps(updatedProps)
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="soft">Soft</SelectItem>
                  <SelectItem value="softCentered">Soft Centered</SelectItem>
                  <SelectItem value="imageRight">Image Right</SelectItem>
                  <SelectItem value="imageRightCentered">Image Right Centered</SelectItem>
                  <SelectItem value="topAligned">Top Aligned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Style Controls */}
            <div className="space-y-1.5 rounded-lg bg-muted/30 p-3">
              <Label className="text-xs font-semibold text-primary">STYLE</Label>
              
              {/* Variant */}
              <div className="space-y-1.5">
                <Label className="text-xs">Variante</Label>
                <Select
                  value={(selectedBlock.props as any)?.style?.variant || "default"}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const style = (currentProps.style as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      style: { ...style, variant: v },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="soft">Soft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Vertical Align */}
              <div className="space-y-1.5">
                <Label className="text-xs">Vertikale Ausrichtung</Label>
                <Select
                  value={(selectedBlock.props as any)?.style?.verticalAlign || "center"}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const style = (currentProps.style as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      style: { ...style, verticalAlign: v },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Oben</SelectItem>
                    <SelectItem value="center">Zentriert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Text Align */}
              <div className="space-y-1.5">
                <Label className="text-xs">Text Ausrichtung</Label>
                <Select
                  value={(selectedBlock.props as any)?.style?.textAlign || "left"}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const style = (currentProps.style as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      style: { ...style, textAlign: v },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Links</SelectItem>
                    <SelectItem value="center">Zentriert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Max Width */}
              <div className="space-y-1.5">
                <Label className="text-xs">Maximale Breite</Label>
                <Select
                  value={(selectedBlock.props as any)?.style?.maxWidth || "lg"}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const style = (currentProps.style as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      style: { ...style, maxWidth: v },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="md">Medium</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                    <SelectItem value="xl">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Image Aspect Ratio */}
              <div className="space-y-1.5">
                <Label className="text-xs">Bild Seitenverhältnis</Label>
                <Select
                  value={(selectedBlock.props as any)?.style?.imageAspectRatio || "4/3"}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const style = (currentProps.style as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      style: { ...style, imageAspectRatio: v },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4/3">4:3 (Standard)</SelectItem>
                    <SelectItem value="16/9">16:9 (Breitbild)</SelectItem>
                    <SelectItem value="1/1">1:1 (Quadrat)</SelectItem>
                    <SelectItem value="3/2">3:2 (Klassisch)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </>
      )}

      {selectedBlock.type === "faq" && (
        <>
          <Separator />
          {renderArrayItemsControls(
            selectedBlock,
            "items",
            "FAQ",
            (item, index) => `FAQ ${index + 1}`,
            createFaqItem,
            [
              { key: "question", label: "Frage", type: "text" as const },
              { key: "questionColor", label: "Frage Farbe (optional)", type: "color" as const, placeholder: "#111111" },
              { key: "answer", label: "Antwort", type: "textarea" as const },
              { key: "answerColor", label: "Antwort Farbe (optional)", type: "color" as const, placeholder: "#666666" },
            ]
          )}
        </>
      )}

      {selectedBlock.type === "team" && (
        <>
          <Separator />
          
          {/* Block-Level Controls */}
          <div className="space-y-3">
            {/* Eyebrow */}
            <div className="space-y-1.5">
              <Label className="text-xs">Eyebrow (optional)</Label>
              <input
                type="text"
                value={(selectedBlock.props as any)?.eyebrow || ""}
                onChange={(e) => {
                  if (!selectedBlock) return
                  const currentProps = selectedBlock.props as Record<string, unknown>
                  const updatedProps = { ...currentProps, eyebrow: e.target.value } as CMSBlock["props"]
                  updateSelectedProps(updatedProps)
                }}
                className="h-8 w-full rounded border border-border bg-background px-2 text-sm"
                placeholder="z.B. UNSER TEAM"
              />
            </div>

            {/* Layout */}
            <div className="space-y-1.5">
              <Label className="text-xs">Layout</Label>
              <Select
                value={(selectedBlock.props as any)?.layout || "cards"}
                onValueChange={(v) => {
                  if (!selectedBlock) return
                  const currentProps = selectedBlock.props as Record<string, unknown>
                  const updatedProps = { ...currentProps, layout: v } as CMSBlock["props"]
                  updateSelectedProps(updatedProps)
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cards">Cards (vertikal)</SelectItem>
                  <SelectItem value="compact">Compact (horizontal)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Background */}
            <div className="space-y-1.5">
              <Label className="text-xs">Hintergrund</Label>
              <Select
                value={(selectedBlock.props as any)?.background || "none"}
                onValueChange={(v) => {
                  if (!selectedBlock) return
                  const currentProps = selectedBlock.props as Record<string, unknown>
                  const updatedProps = { ...currentProps, background: v } as CMSBlock["props"]
                  updateSelectedProps(updatedProps)
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine</SelectItem>
                  <SelectItem value="muted">Muted</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Container Background (Inner Panel - for block content) */}
            {(() => {
              const blockDef = getBlockDefinition(selectedBlock.type)
              return blockDef?.enableInnerPanel ? (
                <div className="space-y-1.5 rounded-lg bg-muted/30 p-3">
                  <Label className="text-xs font-semibold text-primary">CONTAINER-HINTERGRUND (inneres Panel)</Label>
                  <Select
                    value={(selectedBlock.props as any)?.containerBackgroundMode || "transparent"}
                    onValueChange={(v) => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = {
                        ...currentProps,
                        containerBackgroundMode: v,
                      } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transparent">Transparent</SelectItem>
                      <SelectItem value="color">Farbe</SelectItem>
                      <SelectItem value="gradient">Verlauf</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Conditional: Container Color */}
                  {(selectedBlock.props as any)?.containerBackgroundMode === "color" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Panel-Farbe</Label>
                      <input
                        type="color"
                        value={(selectedBlock.props as any)?.containerBackgroundColor || "#ffffff"}
                        onChange={(e) => {
                          if (!selectedBlock) return
                          const currentProps = selectedBlock.props as Record<string, unknown>
                          const updatedProps = {
                            ...currentProps,
                            containerBackgroundColor: e.target.value,
                          } as CMSBlock["props"]
                          updateSelectedProps(updatedProps)
                        }}
                        className="h-8 w-full rounded border border-border bg-background"
                      />
                    </div>
                  )}

                  {/* Conditional: Container Gradient Preset */}
                  {(selectedBlock.props as any)?.containerBackgroundMode === "gradient" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Verlauf-Preset</Label>
                      <Select
                        value={(selectedBlock.props as any)?.containerBackgroundGradientPreset || "soft"}
                        onValueChange={(v) => {
                          if (!selectedBlock) return
                          const currentProps = selectedBlock.props as Record<string, unknown>
                          const updatedProps = {
                            ...currentProps,
                            containerBackgroundGradientPreset: v,
                          } as CMSBlock["props"]
                          updateSelectedProps(updatedProps)
                        }}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="soft">Soft</SelectItem>
                          <SelectItem value="aurora">Aurora</SelectItem>
                          <SelectItem value="ocean">Ocean</SelectItem>
                          <SelectItem value="sunset">Sunset</SelectItem>
                          <SelectItem value="hero">Hero</SelectItem>
                          <SelectItem value="none">Keine</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Container Shadow Inspector */}
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <Label className="text-xs font-semibold">Shadow</Label>
                    <ShadowInspector
                      config={(selectedBlock.props as any)?.containerShadow}
                      onChange={(shadowConfig) => {
                        if (!selectedBlock) return
                        const currentProps = selectedBlock.props as Record<string, unknown>
                        const updatedProps = {
                          ...currentProps,
                          containerShadow: shadowConfig,
                        } as CMSBlock["props"]
                        updateSelectedProps(updatedProps)
                      }}
                      onClose={() => {}}
                    />
                  </div>
                </div>
              ) : null
            })()}

            {/* Columns */}
            <div className="space-y-1.5">
              <Label className="text-xs">Spalten</Label>
              <Select
                value={String((selectedBlock.props as any)?.columns || 3)}
                onValueChange={(v) => {
                  if (!selectedBlock) return
                  const currentProps = selectedBlock.props as Record<string, unknown>
                  const updatedProps = { ...currentProps, columns: Number(v) } as CMSBlock["props"]
                  updateSelectedProps(updatedProps)
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Members Array */}
          {renderArrayItemsControls(
            selectedBlock,
            "members",
            "Mitglied",
            (member, index) => {
              const m = member as unknown as Record<string, unknown>
              const name = String(m.name || "")
              return `${index + 1}. ${name || "Mitglied"}`
            },
            createTeamMember,
            [
              { key: "name", label: "Name", type: "text" as const, required: true },
              { key: "nameColor", label: "Name Farbe (optional)", type: "color" as const, placeholder: "#111111" },
              { key: "role", label: "Rolle", type: "text" as const },
              { key: "roleColor", label: "Rolle Farbe (optional)", type: "color" as const, placeholder: "#666666" },
              { key: "bio", label: "Bio", type: "textarea" as const },
              { key: "bioColor", label: "Bio Farbe (optional)", type: "color" as const, placeholder: "#666666" },
              { key: "imageUrl", label: "Avatar", type: "image" as const },
              { key: "imageAlt", label: "Avatar Alt-Text", type: "text" as const },
              {
                key: "avatarGradient",
                label: "Avatar Gradient",
                type: "select" as const,
                options: [
                  { value: "auto", label: "Auto" },
                  { value: "g1", label: "Emerald" },
                  { value: "g2", label: "Sky" },
                  { value: "g3", label: "Amber" },
                  { value: "g4", label: "Rose" },
                  { value: "g5", label: "Violet" },
                  { value: "g6", label: "Cyan" },
                  { value: "g7", label: "Lime" },
                  { value: "g8", label: "Fuchsia" },
                  { value: "g9", label: "Indigo" },
                  { value: "g10", label: "Red" },
                ],
              },
              {
                key: "avatarFit",
                label: "Bildanpassung",
                type: "select" as const,
                options: [
                  { value: "cover", label: "Füllen (Cover)" },
                  { value: "contain", label: "Vollständig (Contain)" },
                ],
              },
              {
                key: "avatarFocus",
                label: "Bildfokus",
                type: "select" as const,
                options: [
                  { value: "center", label: "Mitte" },
                  { value: "top", label: "Oben" },
                  { value: "bottom", label: "Unten" },
                  { value: "left", label: "Links" },
                  { value: "right", label: "Rechts" },
                ],
              },
              { key: "tags", label: "Tags (komma-getrennt)", type: "text" as const, placeholder: "Tag1, Tag2, Tag3" },
              { key: "ctaText", label: "CTA Text", type: "text" as const },
              { key: "ctaColor", label: "CTA Farbe (optional)", type: "color" as const, placeholder: "#111111" },
              { key: "ctaHref", label: "CTA Link", type: "url" as const },
              { key: "cardBgColor", label: "Card Hintergrund (optional)", type: "color" as const, placeholder: "#ffffff" },
              { key: "cardBorderColor", label: "Card Border (optional)", type: "color" as const, placeholder: "#e5e7eb" },
            ]
          )}

        </>
      )}

      {selectedBlock.type === "contactForm" && (
        <>
          <Separator />
          {renderArrayItemsControls(
            selectedBlock,
            "fields",
            "Feld",
            (field, index) => {
              const f = field as unknown as Record<string, unknown>
              const t = String(f.type || "")
              const label = String(f.label || "")
              return `${index + 1}. ${label || t || "Feld"}`
            },
            () => createContactFormField("subject"),
            [
              { key: "type", label: "Typ", type: "select" as const },
              { key: "label", label: "Label", type: "text" as const },
              { key: "placeholder", label: "Placeholder", type: "text" as const },
              { key: "required", label: "Required", type: "boolean" as const },
            ]
          )}
          
          {/* Contact Info Cards */}
          {renderArrayItemsControls(
            selectedBlock,
            "contactInfoCards",
            "Info-Card",
            (card, index) => {
              const c = card as unknown as Record<string, unknown>
              const title = String(c.title || "")
              return `${index + 1}. ${title || "Card"}`
            },
            createContactInfoCard,
            [
              { key: "title", label: "Titel", type: "text" as const, required: true },
              { key: "value", label: "Wert", type: "text" as const, required: true },
              {
                key: "icon",
                label: "Icon",
                type: "select" as const,
                options: [
                  { value: "clock", label: "Uhr (Schnelle Antwort)" },
                  { value: "phone", label: "Telefon (Kostenlose Beratung)" },
                  { value: "mapPin", label: "Map-Pin (Lokale Betreuung)" },
                  { value: "mail", label: "Mail (E-Mail)" },
                ],
              },
            ]
          )}
        </>
      )}

      {/* 3) Restliche Felder mit Gruppierung und Headern */}
      {(() => {
        const visibleMidFields = midFields.filter(shouldShowField)
        const visibleLateFields = lateFields.filter(shouldShowField)

        // Get group order for this block
        const blockDef = getBlockDefinition(selectedBlock.type)
        const effectiveGroupOrder = blockDef.inspectorGroupOrder || DEFAULT_GROUP_ORDER

        // Get typography elements if block has elements
        const elements = blockDef.elements || []
        const typographyElements = elements.filter((el) => el.supportsTypography)
        
        // Check if there are any fields or typography elements to render
        if (visibleMidFields.length === 0 && visibleLateFields.length === 0 && typographyElements.length === 0) {
          return null
        }

        // Group visible fields by their group property
        const groupedFields: Record<string, InspectorField[]> = {}
        for (const field of visibleMidFields) {
          const group = field.group ?? "design"
          if (!groupedFields[group]) groupedFields[group] = []
          groupedFields[group].push(field)
        }

        // Helper to render element typography section
        const renderElementTypography = () => {
          if (typographyElements.length === 0) return null

          const blockProps = selectedBlock.props as Record<string, unknown>
          const typographyRecord = (blockProps.typography as Record<string, TypographySettings> | undefined) || {}

          const handleElementTypographyChange = (elementId: string, typography: TypographySettings | null) => {
            if (!selectedBlock) return
            isTypingRef.current = true
            const currentProps = selectedBlock.props as Record<string, unknown>
            const currentTypography = (currentProps.typography as Record<string, TypographySettings> | undefined) || {}
            
            let updatedTypography: Record<string, TypographySettings> | undefined
            if (typography) {
              updatedTypography = { ...currentTypography, [elementId]: typography }
            } else {
              const { [elementId]: _, ...rest } = currentTypography
              updatedTypography = Object.keys(rest).length > 0 ? rest : undefined
            }

            const updatedProps = setByPath(currentProps, "typography", updatedTypography) as CMSBlock["props"]
            updateSelectedProps(updatedProps)
            setTimeout(() => {
              isTypingRef.current = false
            }, 50)
          }

          return (
            <ElementTypographyAccordion
              blockProps={blockProps}
              typographyElements={typographyElements}
              selectedElementId={selectedElementId}
              accordionValue={accordionValue}
              onAccordionValueChange={setAccordionValue}
              onElementTypographyChange={handleElementTypographyChange}
            />
          )
        }

        return (
          <>
            {/* Render grouped fields in order, with special handling for "elements" group */}
            {effectiveGroupOrder.map((group) => {
              const groupFields = groupedFields[group] || []
              const hasElementTypography = group === "elements" && typographyElements.length > 0

              if (groupFields.length === 0 && !hasElementTypography) {
                return null
              }

              return (
                <div key={group}>
                  <Separator />
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <Label className="text-xs font-semibold">{INSPECTOR_GROUP_LABELS[group] || group}</Label>
                    <div className="space-y-3 mt-2">
                      {groupFields.map((field) => renderInspectorField(field, selectedBlock))}
                      {hasElementTypography && renderElementTypography()}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Render late fields if any */}
            {visibleLateFields.length > 0 && (
              <div>
                <Separator />
                <div className="mt-3 pt-3">
                  {visibleLateFields.map((field) => renderInspectorField(field, selectedBlock))}
                </div>
              </div>
            )}
          </>
        )
      })()}

      {/* Panel Container Shadow Inspector (for blocks with enableInnerPanel) */}
      {getBlockDefinition(selectedBlock.type)?.enableInnerPanel && (
        <>
          <Separator />
          <div className="mt-3 pt-3 border-t border-border/50">
            <Label className="text-xs font-semibold">Panel Shadow</Label>
            <ShadowInspector
              config={(selectedBlock.props as any)?.containerShadow}
              onChange={(shadowConfig) => {
                if (!selectedBlock) return
                const currentProps = selectedBlock.props as Record<string, unknown>
                const updatedProps = {
                  ...currentProps,
                  containerShadow: shadowConfig,
                } as CMSBlock["props"]
                updateSelectedProps(updatedProps)
              }}
              onClose={() => {}}
            />
          </div>
        </>
      )}
    </>
  )
})()}</div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Das Element wird permanent gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  handleRemoveArrayItem(deleteTarget.blockId, deleteTarget.arrayPath, deleteTarget.index)
                }
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}