/**
 * Horizontal content width for CMS blocks — single source of truth.
 * - SectionWrapper (fullBleedChildren false) wraps block output in the outer shell.
 * - BlockRenderer wrapWithGlobalWidth wraps with the inner shell (when not full-bleed section).
 *
 * Legal pages (`[slug]/page.tsx`, `konzept/[slug]/page.tsx`): the article grid is
 * `max-w-7xl px-4` and sits **around** `data-article`. Blocks inside the article column are
 * then wrapped again by SectionWrapper with this same class. The legal hero is rendered **above**
 * that grid with `edgeToEdgeShell`; it must apply **two** consecutive `CMS_SECTION_CONTENT_OUTER_CLASS`
 * shells (grid gutter + section shell) before `CMS_BLOCK_GLOBAL_WIDTH_WRAP_CLASS` to match body blocks.
 * Preview / unsplit render passes `edgeToEdgeShell={false}` so the hero only uses one outer shell
 * (SectionWrapper does not add padding for fullBleedChildren).
 */
export const CMS_SECTION_CONTENT_OUTER_CLASS = "mx-auto w-full max-w-7xl px-4"

export const CMS_BLOCK_GLOBAL_WIDTH_WRAP_CLASS = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"
