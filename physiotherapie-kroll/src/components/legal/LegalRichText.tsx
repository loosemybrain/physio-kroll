import { cn } from "@/lib/utils"

const spacingTopMap = { none: "pt-0", sm: "pt-4", md: "pt-8", lg: "pt-12" }
const spacingBottomMap = { none: "pb-0", sm: "pb-4", md: "pb-8", lg: "pb-12" }
const alignMap = { left: "text-left", center: "text-center", justify: "text-justify hyphens-auto" }
const headlineSizeMap = { h2: "text-2xl md:text-3xl", h3: "text-xl md:text-2xl", h4: "text-lg md:text-xl" }

export type LegalRichTextProps = {
  headline: string
  content: string
  alignment?: "left" | "center" | "justify"
  headlineSize?: "h2" | "h3" | "h4"
  variant?: "default" | "muted"
  spacingTop?: "none" | "sm" | "md" | "lg"
  spacingBottom?: "none" | "sm" | "md" | "lg"
}

const HeadingTagMap = { h2: "h2", h3: "h3", h4: "h4" } as const

export function LegalRichText({
  headline,
  content,
  alignment = "left",
  headlineSize = "h2",
  variant = "default",
  spacingTop = "md",
  spacingBottom = "md",
}: LegalRichTextProps) {
  const tag = HeadingTagMap[headlineSize ?? "h2"]

  return (
    <section
      className={cn(
        spacingTopMap[spacingTop ?? "md"],
        spacingBottomMap[spacingBottom ?? "md"],
      )}
    >
      {tag === "h2" && (
        <h2
          data-cms-field="headline"
          className={cn(
            "font-semibold tracking-tight text-foreground",
            headlineSizeMap[headlineSize ?? "h2"],
            alignMap[alignment ?? "left"],
          )}
        >
          {headline}
        </h2>
      )}
      {tag === "h3" && (
        <h3
          data-cms-field="headline"
          className={cn(
            "font-semibold tracking-tight text-foreground",
            headlineSizeMap[headlineSize ?? "h2"],
            alignMap[alignment ?? "left"],
          )}
        >
          {headline}
        </h3>
      )}
      {tag === "h4" && (
        <h4
          data-cms-field="headline"
          className={cn(
            "font-semibold tracking-tight text-foreground",
            headlineSizeMap[headlineSize ?? "h2"],
            alignMap[alignment ?? "left"],
          )}
        >
          {headline}
        </h4>
      )}
      <div
        data-cms-field="content"
        className={cn(
          "prose prose-neutral dark:prose-invert mt-4 max-w-none",
          "prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground",
          "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
          "prose-li:text-muted-foreground prose-li:marker:text-primary",
          alignMap[alignment ?? "left"],
          variant === "muted" && "prose-p:text-muted-foreground/90",
        )}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </section>
  )
}
