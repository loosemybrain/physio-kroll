/**
 * API Route: Font Audit Scan
 * GET /admin/api/fonts/audit
 * 
 * Scans codebase for external Google Font requests
 * Returns findings with file paths and line snippets
 */

import { NextResponse } from "next/server"
import { readFileSync, readdirSync, statSync } from "fs"
import { join } from "path"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { requireAdminGuard } from "@/lib/auth/adminGuard"

/**
 * Patterns to search for external Google Font requests
 */
const BLOCKED_PATTERNS = [
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  'url("https://fonts.googleapis.com',
  'url("https://fonts.gstatic.com',
  "@import url(\"https://fonts.googleapis.com",
]

interface Finding {
  file: string
  snippet: string
  severity: "high"
}

function toRelativeProjectPath(filePath: string): string {
  return filePath.replace(process.cwd(), "").replace(/\\/g, "/")
}

function shouldSkipFile(filePath: string): boolean {
  const rel = toRelativeProjectPath(filePath)
  // Avoid self-scan false positives from the audit implementation itself.
  if (rel === "/src/app/admin/api/fonts/audit/route.ts") return true
  return false
}

function scanDirectory(dir: string, findings: Finding[] = [], depth = 0): Finding[] {
  if (depth > 5 || findings.length > 200) return findings

  const ignorePaths = ["node_modules", ".next", "dist", ".git", "public", ".supabase"]

  try {
    const files = readdirSync(dir)

    for (const file of files) {
      if (ignorePaths.includes(file)) continue

      const filePath = join(dir, file)
      const stat = statSync(filePath)

      if (stat.isDirectory()) {
        scanDirectory(filePath, findings, depth + 1)
      } else if (
        file.endsWith(".ts") ||
        file.endsWith(".tsx") ||
        file.endsWith(".js") ||
        file.endsWith(".jsx") ||
        file.endsWith(".css")
      ) {
        if (shouldSkipFile(filePath)) continue
        try {
          const content = readFileSync(filePath, "utf-8")
          const lines = content.split("\n")

          lines.forEach((line, idx) => {
            for (const pattern of BLOCKED_PATTERNS) {
              if (line.includes(pattern)) {
                findings.push({
                  file: toRelativeProjectPath(filePath),
                  snippet: `Line ${idx + 1}: ${line.trim().substring(0, 100)}...`,
                  severity: "high",
                })
                break
              }
            }
          })
        } catch {
          // Skip unreadable files
        }
      }
    }
  } catch {
    // Skip directories we can't read
  }

  return findings
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const guard = await requireAdminGuard(supabase)
    if (!guard.ok) {
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      )
    }

    const srcDir = join(process.cwd(), "src")
    const findings = scanDirectory(srcDir)

    return NextResponse.json({
      success: true,
      findings: findings.slice(0, 200), // Max 200 results
      total: findings.length,
      patterns: BLOCKED_PATTERNS,
      status: findings.length === 0 ? "✅ PASS" : "⚠️ VIOLATIONS FOUND",
    })
  } catch (error) {
    console.error("Error during font audit:", error)
    return NextResponse.json({ error: "Request failed" }, { status: 500 })
  }
}
