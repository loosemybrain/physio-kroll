import { NextResponse } from "next/server"
import { requireAdminWithServiceRole } from "@/lib/api/adminServiceRoute"

type PopupListRow = {
  id: string
  name: string
  slug: string | null
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  all_pages: boolean
  priority: number
  updated_at: string
}

export async function GET() {
  try {
    const gate = await requireAdminWithServiceRole()
    if (!gate.ok) return gate.response

    const { adminClient } = gate.ctx

    const { data: popups, error } = await adminClient
      .from("popups")
      .select("id, name, slug, is_active, starts_at, ends_at, all_pages, priority, updated_at")
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("admin popups list error:", error)
      return NextResponse.json({ error: "Failed to load popups" }, { status: 500 })
    }

    const popupIds = (popups ?? []).map((p) => p.id as string)
    const pagesByPopupId = new Map<string, Array<{ id: string; title: string; slug: string; brand: string | null }>>()

    if (popupIds.length > 0) {
      const { data: mappings, error: mapErr } = await adminClient
        .from("popup_pages")
        .select("popup_id, pages(id, title, slug, brand)")
        .in("popup_id", popupIds)

      if (mapErr) {
        console.error("admin popup_pages list error:", mapErr)
      } else {
        for (const m of mappings ?? []) {
          const row = m as Record<string, unknown>
          const popupId = typeof row.popup_id === "string" ? row.popup_id : ""
          const page = (row.pages ?? null) as { id: string; title: string; slug: string; brand: string | null } | null
          if (!popupId || !page) continue
          const list = pagesByPopupId.get(popupId) ?? []
          list.push(page)
          pagesByPopupId.set(popupId, list)
        }
      }
    }

    const out = ((popups ?? []) as unknown as PopupListRow[]).map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      isActive: p.is_active,
      startsAt: p.starts_at,
      endsAt: p.ends_at,
      allPages: p.all_pages,
      priority: p.priority,
      updatedAt: p.updated_at,
      assignedPages: pagesByPopupId.get(p.id) ?? [],
    }))

    return NextResponse.json(out, { status: 200 })
  } catch (e) {
    console.error("admin popups GET failed:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

