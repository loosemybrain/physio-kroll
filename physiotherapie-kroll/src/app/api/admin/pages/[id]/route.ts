import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageStatus = "draft" | "published";

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
  blocks: IncomingBlock[];
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isUuid(v: unknown): v is string {
  if (typeof v !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

async function requireSession() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  return data.session.user;
}

async function getDbClient() {
  // Prefer service role (bypasses RLS) if configured,
  // otherwise fall back to user-scoped server client (anon key + cookies + RLS).
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (supabaseUrl && serviceKey) {
    return createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return await createSupabaseServerClient();
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
    const user = await requireSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    if (!isUuid(id)) {
      return NextResponse.json({ error: "Invalid page id" }, { status: 400 });
    }

    const admin = await getDbClient();

    const { data: page, error: pageErr } = await admin
      .from("pages")
      .select("id, title, slug, brand, status, updated_at")
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
      return NextResponse.json({ error: blocksErr.message }, { status: 500 });
    }

    const mappedBlocks = ((blocks ?? []) as unknown as Array<{ id: string; type: string; props?: unknown | null }>).map(
      (b) => ({
        id: b.id,
        type: b.type,
        props: b.props ?? {},
      })
    );

    return NextResponse.json(
      {
        id: page.id,
        title: page.title,
        slug: page.slug,
        brand: page.brand,
        status: page.status,
        updatedAt: page.updated_at,
        blocks: mappedBlocks,
      },
      { status: 200 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
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
    const user = await requireSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const rawBlocks: unknown[] = Array.isArray(body.blocks) ? (body.blocks as unknown[]) : [];
    const blocks: IncomingBlock[] = [];

    // Validate blocks early (fail fast)
    for (const b of rawBlocks) {
      if (!isRecord(b)) {
        return NextResponse.json({ error: "Invalid block" }, { status: 400 });
      }

      const id = b.id;
      const type = b.type;
      const props = b.props;

      if (!isUuid(id)) {
        return NextResponse.json({ error: `Invalid block id: ${String(id)}` }, { status: 400 });
      }
      if (typeof type !== "string" || !type.trim()) {
        return NextResponse.json({ error: "Invalid block type" }, { status: 400 });
      }

      blocks.push({ id, type, props });
    }

    const admin = await getDbClient();

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
        },
        { onConflict: "id" }
      )
      .select("id, title, slug, brand, status, updated_at")
      .single();

    if (pageErr || !savedPage) {
      return NextResponse.json({ error: pageErr?.message ?? "Failed to save page" }, { status: 500 });
    }

    // 2) replace blocks (simple + deterministic)
    const { error: delErr } = await admin.from("blocks").delete().eq("page_id", id);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    if (blocks.length > 0) {
      const rows = blocks.map((b, index) => ({
        id: b.id,
        page_id: id,
        type: b.type,
        sort: index,
        props: b.props ?? {},
      }));

      const { error: insErr } = await admin.from("blocks").insert(rows);
      if (insErr) {
        return NextResponse.json({ error: insErr.message }, { status: 500 });
      }
    }

    // 3) return fresh data
    const { data: freshBlocks, error: freshErr } = await admin
      .from("blocks")
      .select("id, type, sort, props")
      .eq("page_id", id)
      .order("sort", { ascending: true });

    if (freshErr) {
      return NextResponse.json({ error: freshErr.message }, { status: 500 });
    }

    const mappedFreshBlocks = (
      (freshBlocks ?? []) as unknown as Array<{ id: string; type: string; props?: unknown | null }>
    ).map((b) => ({
      id: b.id,
      type: b.type,
      props: b.props ?? {},
    }));

    return NextResponse.json(
      {
        id: savedPage.id,
        title: savedPage.title,
        slug: savedPage.slug,
        brand: savedPage.brand,
        status: savedPage.status,
        updatedAt: savedPage.updated_at,
        blocks: mappedFreshBlocks,
      },
      { status: 200 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
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
    const user = await requireSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    if (!isUuid(id)) {
      return NextResponse.json({ error: "Invalid page id" }, { status: 400 });
    }

    const admin = await getDbClient();

    // blocks first (FK safety)
    const { error: delBlocksErr } = await admin.from("blocks").delete().eq("page_id", id);
    if (delBlocksErr) {
      return NextResponse.json({ error: delBlocksErr.message }, { status: 500 });
    }

    const { error: delPageErr } = await admin.from("pages").delete().eq("id", id);
    if (delPageErr) {
      return NextResponse.json({ error: delPageErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
