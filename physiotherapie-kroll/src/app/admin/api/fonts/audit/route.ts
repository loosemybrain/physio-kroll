/**
 * API Route: Font Audit Scan
 * GET /admin/api/fonts/audit
 * 
 * Scans codebase for external Google Font requests
 * Returns findings with file paths and line snippets
 */

import { NextResponse } from "next/server"
import { readFileSync, readdirSync } from "fs"
import { join } from "path"

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

function scanDirectory(dir: string, findings: Finding[] = [], depth = 0): Finding[] {
  if (depth > 5 || findings.length > 200) return findings

  const ignorePaths = ["node_modules", ".next", "dist", ".git", "public", ".supabase"]

  try {
    const files = readdirSync(dir)

    for (const file of files) {
      if (ignorePaths.includes(file)) continue

      const filePath = join(dir, file)
      const stat = require("fs").statSync(filePath)

      if (stat.isDirectory()) {
        scanDirectory(filePath, findings, depth + 1)
      } else if (
        file.endsWith(".ts") ||
        file.endsWith(".tsx") ||
        file.endsWith(".js") ||
        file.endsWith(".jsx") ||
        file.endsWith(".css")
      ) {
        try {
          const content = readFileSync(filePath, "utf-8")
          const lines = content.split("\n")

          lines.forEach((line, idx) => {
            for (const pattern of BLOCKED_PATTERNS) {
              if (line.includes(pattern)) {
                findings.push({
                  file: filePath.replace(process.cwd(), ""),
                  snippet: `Line ${idx + 1}: ${line.trim().substring(0, 100)}...`,
                  severity: "high",
                })
                break
              }
            }
          })
        } catch (err) {
          // Skip unreadable files
        }
      }
    }
  } catch (err) {
    // Skip directories we can't read
  }

  return findings
}

export async function GET() {
  try {
    // TODO: Add auth check (admin only)

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
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
