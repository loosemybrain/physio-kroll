/**
 * Global Element Shadow System
 * 
 * This system allows applying box-shadow styles to any element in any CMS block,
 * managed globally through the Inspector without block-specific implementations.
 * 
 * #### How it Works:
 * 
 * 1. **Data Model** (`src/types/cms.ts`):
 *    - `ElementShadow`: Configuration for shadow (preset, custom values, opacity, inset)
 *    - `ElementConfig`: Per-element wrapper { style: { shadow?: ElementShadow } }
 *    - `CommonBlockProps.elements`: Global registry keyed by elementId
 *    - All blocks inherit this through their props
 * 
 * 2. **Inspector** (`src/components/admin/ShadowInspector.tsx`):
 *    - Appears when an element is selected (selectedElementId exists)
 *    - Toggle: Enable/Disable shadow
 *    - Preset Dropdown: xs, sm, md, lg, xl, glow, or custom
 *    - Custom Settings (only when preset === "custom"):
 *      - X Offset, Y Offset (px)
 *      - Blur Radius, Spread Radius (px)
 *      - Color (rgba, hex, or color name)
 *      - Opacity (0–1)
 *      - Inset Toggle
 * 
 * 3. **Registry Integration** (`src/cms/blocks/registry.ts`):
 *    - `withGlobalElementShadow()`: Marker function (all blocks support it implicitly)
 *    - No per-block configuration needed
 * 
 * 4. **Rendering** (in individual block components):
 *    - Import `useElementShadowStyle` from `@/lib/shadow`
 *    - For any element with data-element-id:
 *      ```tsx
 *      const shadowStyle = useElementShadowStyle({
 *        elementId: "my-element",
 *        elementConfig: block.props.elements?.["my-element"]
 *      })
 *      <div data-element-id="my-element" style={shadowStyle}>
 *        Content
 *      </div>
 *      ```
 * 
 * #### Shadow Presets:
 * 
 * - `none`: No shadow
 * - `xs`: 0 1px 2px 0 rgba(0,0,0,0.05)
 * - `sm`: 0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)
 * - `md`: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)
 * - `lg`: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)
 * - `xl`: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)
 * - `glow`: 0 0 20px rgba(59,130,246,0.5)
 * - `custom`: Manual configuration
 * 
 * #### Files Involved:
 * 
 * **Core Types:**
 * - `src/types/cms.ts`: ElementShadow, ElementConfig, CommonBlockProps
 * 
 * **Shadow Utilities:**
 * - `src/lib/shadow/shadowPresets.ts`: SHADOW_PRESETS map, getShadowPreset()
 * - `src/lib/shadow/resolveBoxShadow.ts`: Converts config → CSS box-shadow string
 * - `src/lib/shadow/useElementShadowStyle.ts`: React hook for components
 * - `src/lib/shadow/index.ts`: Central export
 * 
 * **Inspector:**
 * - `src/components/admin/ShadowInspector.tsx`: UI component for shadow config
 * 
 * **Integration:**
 * - `src/cms/blocks/registry.ts`: withGlobalElementShadow() marker
 * - `src/components/admin/PageEditor.tsx`: ShadowInspector integration in Inspector
 * - `src/components/cms/BlockRenderer.tsx`: No changes needed (blocks handle rendering)
 * 
 * **Usage in Blocks (example):**
 * - HeroSection, TextBlock, etc. can use `useElementShadowStyle` on their elements
 * 
 * #### Usage Example in a Block:
 * 
 * ```tsx
 * import { useElementShadowStyle } from "@/lib/shadow"
 * 
 * export function MyBlock(props: MyBlockProps) {
 *   // For an element with data-element-id="heading"
 *   const headingShadow = useElementShadowStyle({
 *     elementId: "heading",
 *     elementConfig: (props as Record<string, unknown>).elements?.["heading"]
 *   })
 * 
 *   return (
 *     <div>
 *       <h2 data-element-id="heading" style={headingShadow}>
 *         My Heading
 *       </h2>
 *     </div>
 *   )
 * }
 * ```
 * 
 * #### Admin Inspector Flow:
 * 
 * 1. User clicks an element in Live Preview
 * 2. `selectedElementId` is set in PageEditor state
 * 3. Inspector shows "Shadow" section
 * 4. User configures shadow settings
 * 5. `onChange` callback updates `block.props.elements[elementId].style.shadow`
 * 6. Live Preview re-renders, shadow applied via `useElementShadowStyle` hook
 * 7. Changes persist to the CMS
 * 
 * #### Backward Compatibility:
 * 
 * - `elements` prop is optional on all blocks (defaults to undefined)
 * - If not present, shadow system is inactive (no errors)
 * - Existing blocks without element styling continue to work unchanged
 * 
 * #### No Breaking Changes:
 * 
 * - All fields are optional
 * - No mandatory props added
 * - Block-specific implementations not required
 * - Global system applied uniformly across all block types
 */

export {}
