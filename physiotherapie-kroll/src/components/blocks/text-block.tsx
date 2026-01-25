import * as React from "react"
import { cn } from "@/lib/utils"

interface TextBlockProps {
  section?: unknown
  typography?: unknown
  content: string
  alignment?: "left" | "center" | "right"
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full"
  textSize?: "sm" | "base" | "lg" | "xl" | "2xl"
  contentColor?: string
  headingColor?: string
  linkColor?: string
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full",
}

const textSizeMap = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
}

const alignmentMap = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
}

export function TextBlock({
  content,
  alignment = "left",
  maxWidth = "xl",
  textSize = "base",
  contentColor,
  headingColor,
  linkColor,
}: TextBlockProps) {
  const proseStyle = {
    ...(contentColor ? ({ ["--tw-prose-body" as unknown as string]: contentColor, color: contentColor } as React.CSSProperties) : {}),
    ...(headingColor ? ({ ["--tw-prose-headings" as unknown as string]: headingColor } as React.CSSProperties) : {}),
    ...(linkColor ? ({ ["--tw-prose-links" as unknown as string]: linkColor } as React.CSSProperties) : {}),
  } as React.CSSProperties

  return (
    <section className="py-12">
      <div className={cn("mx-auto px-4", maxWidthMap[maxWidth])}>
        <div
          className={cn(
            alignmentMap[alignment],
            textSizeMap[textSize],
            // Keep typography styles, but don't force a max-width here.
            // Width is controlled by the outer wrapper via maxWidthMap.
            "prose prose-neutral dark:prose-invert max-w-none"
          )}
          style={proseStyle}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </section>
  )
}
