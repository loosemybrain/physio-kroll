import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin.server";
import { requireAdminGuard } from "@/lib/auth/adminGuard";
import { PAGE_TYPE_VALUES, PAGE_SUBTYPE_VALUES, type CMSBlock } from "@/types/cms";
import { sanitizeCmsBlocksForPersistence } from "@/lib/security/sanitizeCmsHtmlOnWrite";

type PageStatus = "draft" | "published";

const PAGE_TYPES_SET = new Set<string>(PAGE_TYPE_VALUES);
const PAGE_SUBTYPES_SET = new Set<string>(PAGE_SUBTYPE_VALUES);

type IncomingBlock = {
  id: string;
  type: string;
  props: unknown;
};

type IncomingPage = {
  id: string;
  title: string;
  slug: string;
  brand: string;
  status: PageStatus;
  pageType?: string;
  pageSubtype?: string | null;
  blocks: IncomingBlock[];
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isUuid(v: unknown): v is string {
  if (typeof v !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

/**
 * GET /api/admin/pages/:id
 * Returns page + blocks for admin editing.
 * Protected by middleware + server session check.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const guard = await requireAdminGuard(supabase)
    if (!guard.ok) {
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      )
    }

    const { id } = await ctx.params;
    if (!isUuid(id)) {
      return NextResponse.json({ error: "Invalid page id" }, { status: 400 });
    }

    const admin = await getSupabaseAdmin();

    const { data: page, error: pageErr } = await admin
      .from("pages")
      .select("id, title, slug, brand, status, page_type, page_subtype, updated_at")
      .eq("id", id)
      .single();

    if (pageErr || !page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const { data: blocks, error: blocksErr } = await admin
      .from("blocks")
      .select("id, type, sort, props")
      .eq("page_id", id)
      .order("sort", { ascending: true });

    if (blocksErr) {
      console.error("admin page blocks load error:", blocksErr)
      return NextResponse.json({ error: "Failed to load blocks" }, { status: 500 });
    }

    const mappedBlocks = ((blocks ?? []) as unknown as Array<{ id: string; type: string; props?: unknown | null }>).map(
      (b) => ({
        id: b.id,
        type: b.type,
        props: b.props ?? {},
      })
    );

    const pageType = page.page_type ?? "default";
    const pageSubtype = page.page_subtype ?? null;

    return NextResponse.json(
      {
        id: page.id,
        title: page.title,
        slug: page.slug,
        brand: page.brand,
        status: page.status,
        pageType,
        pageSubtype,
        updatedAt: page.updated_at,
        blocks: mappedBlocks,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("admin page GET failed:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/pages/:id
 * Saves page + blocks.
 * No implicit save: caller decides when to call this.
 */
export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const guard = await requireAdminGuard(supabase)
    if (!guard.ok) {
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      )
    }

    const { id } = await ctx.params;
    if (!isUuid(id)) {
      return NextResponse.json({ error: "Invalid page id" }, { status: 400 });
    }

    const body = (await req.json()) as Partial<IncomingPage>;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (body.id !== id) {
      return NextResponse.json({ error: "Payload id mismatch" }, { status: 400 });
    }

    if (!body.title || !body.slug || !body.brand || !body.status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const pageType = body.pageType ?? "default";
    if (!PAGE_TYPES_SET.has(pageType)) {
      return NextResponse.json({ error: "Invalid pageType" }, { status: 400 });
    }
    let pageSubtype: string | null = body.pageSubtype ?? null;
    if (pageSubtype !== null && pageSubtype !== "") {
      if (!PAGE_SUBTYPES_SET.has(pageSubtype)) {
        return NextResponse.json({ error: "Invalid pageSubtype" }, { status: 400 });
      }
    } else {
      pageSubtype = null;
    }

    const rawBlocks: unknown[] = Array.isArray(body.blocks) ? (body.blocks as unknown[]) : [];
    const blocks: IncomingBlock[] = [];

    // Validate blocks; normalize non-UUID block ids so DB (uuid column) accepts them
    for (const b of rawBlocks) {
      if (!isRecord(b)) {
        return NextResponse.json({ error: "Invalid block" }, { status: 400 });
      }

      let id = typeof b.id === "string" ? b.id : String(b.id ?? "");
      const type = b.type;
      const props = b.props;

      if (!id.trim()) {
        return NextResponse.json({ error: "Missing block id" }, { status: 400 });
      }
      if (!isUuid(id)) {
        id = crypto.randomUUID();
      }
      if (typeof type !== "string" || !type.trim()) {
        return NextResponse.json({ error: "Invalid block type" }, { status: 400 });
      }

      blocks.push({ id, type, props });
    }

    const blocksForDb = sanitizeCmsBlocksForPersistence(blocks as CMSBlock[]);

    const admin = await getSupabaseAdmin();

    // 1) upsert page
    const { data: savedPage, error: pageErr } = await admin
      .from("pages")
      .upsert(
        {
          id: body.id,
          title: body.title,
          slug: body.slug,
          brand: body.brand,
          status: body.status,
          page_type: pageType,
          page_subtype: pageSubtype,
        },
        { onConflict: "id" }
      )
      .select("id, title, slug, brand, status, page_type, page_subtype, updated_at")
      .single();

    if (pageErr || !savedPage) {
      console.error("admin page upsert error:", pageErr)
      return NextResponse.json({ error: "Failed to save page" }, { status: 500 });
    }

    // 2) replace blocks (simple + deterministic)
    const { error: delErr } = await admin.from("blocks").delete().eq("page_id", id);
    if (delErr) {
      console.error("admin blocks delete error:", delErr)
      return NextResponse.json({ error: "Failed to save blocks" }, { status: 500 });
    }

    if (blocksForDb.length > 0) {
      const rows = blocksForDb.map((b, index) => ({
        id: b.id,
        page_id: id,
        type: b.type,
        sort: index,
        props: b.props ?? {},
      }));

      const { error: insErr } = await admin.from("blocks").insert(rows);
      if (insErr) {
        console.error("admin blocks insert error:", insErr)
        return NextResponse.json({ error: "Failed to save blocks" }, { status: 500 });
      }
    }

    // 3) return fresh data
    const { data: freshBlocks, error: freshErr } = await admin
      .from("blocks")
      .select("id, type, sort, props")
      .eq("page_id", id)
      .order("sort", { ascending: true });

    if (freshErr) {
      console.error("admin fresh blocks load error:", freshErr)
      return NextResponse.json({ error: "Failed to load blocks" }, { status: 500 });
    }

    const mappedFreshBlocks = (
      (freshBlocks ?? []) as unknown as Array<{ id: string; type: string; props?: unknown | null }>
    ).map((b) => ({
      id: b.id,
      type: b.type,
      props: b.props ?? {},
    }));

    const resPageType = savedPage.page_type ?? "default";
    const resPageSubtype = savedPage.page_subtype ?? null;

    return NextResponse.json(
      {
        id: savedPage.id,
        title: savedPage.title,
        slug: savedPage.slug,
        brand: savedPage.brand,
        status: savedPage.status,
        pageType: resPageType,
        pageSubtype: resPageSubtype,
        updatedAt: savedPage.updated_at,
        blocks: mappedFreshBlocks,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("admin page PUT failed:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/pages/:id
 */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const guard = await requireAdminGuard(supabase)
    if (!guard.ok) {
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      )
    }

    const { id } = await ctx.params;
    if (!isUuid(id)) {
      return NextResponse.json({ error: "Invalid page id" }, { status: 400 });
    }

    const admin = await getSupabaseAdmin();

    // blocks first (FK safety)
    const { error: delBlocksErr } = await admin.from("blocks").delete().eq("page_id", id);
    if (delBlocksErr) {
      console.error("admin delete blocks error:", delBlocksErr)
      return NextResponse.json({ error: "Failed to delete page" }, { status: 500 });
    }

    const { error: delPageErr } = await admin.from("pages").delete().eq("id", id);
    if (delPageErr) {
      console.error("admin delete page error:", delPageErr)
      return NextResponse.json({ error: "Failed to delete page" }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("admin page DELETE failed:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
