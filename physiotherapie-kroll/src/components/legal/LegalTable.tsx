import { cn } from "@/lib/utils"
import type { LegalTableColumn, LegalTableRow } from "@/types/cms"

const spacingTopMap = { none: "pt-0", sm: "pt-4", md: "pt-8", lg: "pt-12" }
const spacingBottomMap = { none: "pb-0", sm: "pb-4", md: "pb-8", lg: "pb-12" }
const cellPaddingMap = {
  compact: "px-3 py-2 text-sm",
  default: "px-4 py-3 text-sm md:text-base",
  spacious: "px-5 py-4 text-base",
}

export type LegalTableProps = {
  caption?: string
  columns: LegalTableColumn[]
  rows: LegalTableRow[]
  variant?: "default" | "compact" | "spacious"
  zebra?: boolean
  spacingTop?: "none" | "sm" | "md" | "lg"
  spacingBottom?: "none" | "sm" | "md" | "lg"
}

export function LegalTable({
  caption,
  columns = [],
  rows = [],
  variant = "default",
  zebra = true,
  spacingTop = "md",
  spacingBottom = "md",
}: LegalTableProps) {
  const cellPadding = cellPaddingMap[variant]
  const safeColumns = Array.isArray(columns) ? columns : []
  const safeRows = Array.isArray(rows) ? rows : []

  return (
    <div
      className={cn(
        spacingTopMap[spacingTop],
        spacingBottomMap[spacingBottom],
      )}
    >
      {caption && (
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          {caption}
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[600px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {safeColumns.map((col) => (
                <th
                  key={col.id}
                  className={cn(cellPadding, "font-semibold text-foreground whitespace-nowrap")}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {safeRows.map((row, rowIndex) => {
              const rowId = row?.id ?? `row-${rowIndex}`
              const cells = row?.cells && typeof row.cells === "object" ? row.cells : {}
              return (
                <tr
                  key={rowId}
                  className={cn(
                    "border-b border-border/50 last:border-b-0 transition-colors hover:bg-muted/50",
                    zebra && rowIndex % 2 === 1 && "bg-muted/30",
                  )}
                >
                  {safeColumns.map((col) => (
                    <td key={col.id} className={cn(cellPadding, "text-muted-foreground")}>
                      {cells[col.id] ?? "—"}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
