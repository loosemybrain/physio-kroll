/**
 * INTEGRATION GUIDE: Animation System in CMS-Blöcke
 * 
 * Schritt 1: BlockSectionProps hat nun `animation?: BlockAnimationConfig`
 * ✅ cms.ts aktualisiert
 * 
 * Schritt 2: Bei jedem Block, der über SectionWrapper läuft:
 * 
 * VORHER:
 * <SectionWrapper section={block.props.section}>
 *   <YourContent />
 * </SectionWrapper>
 * 
 * NACHHER:
 * import { AnimatedBlock } from "@/components/blocks/AnimatedBlock"
 * 
 * <AnimatedBlock config={block.props.section?.animation}>
 *   <SectionWrapper section={block.props.section}>
 *     <YourContent />
 *   </SectionWrapper>
 * </AnimatedBlock>
 * 
 * ============================================================
 * 
 * Schritt 3: Im Inspector für Block-Bearbeitung:
 * 
 * VORHER (gar keine Animation):
 * // null
 * 
 * NACHHER:
 * import { AnimationInspector } from "@/components/admin/AnimationInspector"
 * 
 * // Im PageEditor Block-Inspektor:
 * <AnimationInspector
 *   config={currentBlock.props.section?.animation || {}}
 *   onChange={(animConfig) => {
 *     setCurrentBlock({
 *       ...currentBlock,
 *       props: {
 *         ...currentBlock.props,
 *         section: {
 *           ...currentBlock.props.section,
 *           animation: animConfig
 *         }
 *       }
 *     })
 *   }}
 * />
 * 
 * ============================================================
 * 
 * BEISPIEL: HeroSection mit Animationen
 * 
 * src/components/blocks/hero-section.tsx
 * 
 * import { AnimatedBlock } from "@/components/blocks/AnimatedBlock"
 * 
 * export function HeroSection({ props, ... }: HeroSectionProps) {
 *   return (
 *     <AnimatedBlock config={props.section?.animation}>
 *       <section className="...">
 *         {/* Hero Content */}
 *       </section>
 *     </AnimatedBlock>
 *   )
 * }
 * 
 * ============================================================
 * 
 * VERFÜGBARE EXPORTS:
 * 
 * Types:
 * - AnimationType
 * - BlockAnimationConfig
 * - SingleAnimationConfig
 * 
 * Components:
 * - AnimatedBlock (Wrapper)
 * - AnimationInspector (UI für Inspector)
 * - withAnimation (HOC)
 * 
 * Hooks:
 * - useBlockAnimation (low-level control)
 * - usePrefersReducedMotion (check reduced motion)
 * - useStaggerAnimation (calculate stagger delays)
 * 
 * Utils:
 * - normalizeAnimationConfig (validate & set defaults)
 * - getCSSAnimationString (generate CSS)
 * - createIntersectionObserver (scroll triggers)
 * 
 * Constants:
 * - ANIMATION_TYPES
 * - EASING_TYPES
 * - ANIMATION_TRIGGERS
 * - ANIMATION_LABELS
 * - EASING_LABELS
 * - TRIGGER_LABELS
 * 
 * ============================================================
 * 
 * TESTPLAN:
 * 
 * 1. Animation Types testen:
 *    - Fade Variants (fade-up, fade-left, etc.)
 *    - Scale, Rotate, Blur
 *    - Keine Animation
 * 
 * 2. Trigger testen:
 *    - onLoad (sofort)
 *    - onScroll (mit IntersectionObserver)
 *    - onHover (mit Event Listener)
 *    - onClick (vorbereitet)
 * 
 * 3. Reduced Motion:
 *    - System-Einstellung aktivieren
 *    - Animationen sollten nicht sichtbar sein (duration=0)
 * 
 * 4. Navigation:
 *    - Von / nach /konzept → Animation sollte neu laufen
 *    - Back Navigation → keine doppelte Animation
 * 
 * 5. Performance:
 *    - DevTools: Performance Tab
 *    - Keine Layout Shifts
 *    - Keine unnötigen Reflows
 * 
 * 6. Admin Inspector:
 *    - Animationen konfigurieren
 *    - Einstellungen speichern
 *    - Preview laden
 * 
 * ============================================================
 */

// Dieses File ist nur Dokumentation!
// Die eigentliche Implementierung ist in:
// - src/lib/animations/types.ts
// - src/lib/animations/utils.ts
// - src/lib/animations/keyframes.ts
// - src/lib/animations/useBlockAnimation.ts
// - src/components/blocks/AnimatedBlock.tsx
// - src/components/admin/AnimationInspector.tsx
// - src/types/cms.ts (BlockSectionProps erweitert)
