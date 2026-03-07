"use client"

import { cn } from "@/lib/utils"
import type { LegalTableBlock as LegalTableBlockType } from "@/types/legal"

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface LegalTableBlockProps
  extends Omit<LegalTableBlockType, "type" | "id"> {
  className?: string
}

/* ------------------------------------------------------------------ */
/*  Class Maps                                                         */
/* ------------------------------------------------------------------ */

const variantCellPadding: Record<string, string> = {
  compact: "px-3 py-2 text-sm",
  default: "px-4 py-3 text-sm md:text-base",
  spacious: "px-5 py-4 text-base",
}

const spacingTopMap: Record<string, string> = {
  none: "pt-0",
  sm: "pt-4",
  md: "pt-8",
  lg: "pt-12",
}

const spacingBottomMap: Record<string, string> = {
  none: "pb-0",
  sm: "pb-4",
  md: "pb-8",
  lg: "pb-12",
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function LegalTableBlock({
  caption,
  columns,
  rows,
  variant = "default",
  zebra = true,
  headerBgColor,
  borderColor,
  spacingTop = "md",
  spacingBottom = "md",
  className,
}: LegalTableBlockProps) {
  const cellPadding = variantCellPadding[variant]

  return (
    <div
      className={cn(
        spacingTopMap[spacingTop],
        spacingBottomMap[spacingBottom],
        className,
      )}
    >
      {/* Caption */}
      {caption && (
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          {caption}
        </p>
      )}

      {/* Table wrapper for horizontal scroll on mobile */}
      <div
        className={cn(
          "overflow-x-auto rounded-xl border",
          borderColor ? "" : "border-border",
        )}
        style={borderColor ? { borderColor } : undefined}
      >
        <table className="w-full min-w-[600px] border-collapse text-left">
          {/* Header */}
          <thead>
            <tr
              className={cn(
                "border-b",
                headerBgColor ? "" : "bg-muted/50",
                borderColor ? "" : "border-border",
              )}
              style={{
                backgroundColor: headerBgColor || undefined,
                borderColor: borderColor || undefined,
              }}
            >
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    cellPadding,
                    "font-semibold text-foreground whitespace-nowrap",
                  )}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={row.id}
                className={cn(
                  "border-b last:border-b-0 transition-colors",
                  zebra && rowIndex % 2 === 1 && "bg-muted/30",
                  "hover:bg-muted/50",
                  borderColor ? "" : "border-border/50",
                )}
                style={borderColor ? { borderColor } : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={cn(cellPadding, "text-muted-foreground")}
                  >
                    {row.cells[col.id] || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
