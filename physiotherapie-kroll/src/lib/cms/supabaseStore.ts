"use client";

import type { CMSBlock, CMSPage } from "@/types/cms";
import type { BrandKey } from "@/components/brand/brandAssets";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type PageStatus = "draft" | "published";

export type AdminPage = CMSPage & {
  brand: BrandKey;
  status: PageStatus;
  updatedAt: string; // ISO string
};

export type AdminPageSummary = Pick<AdminPage, "id" | "title" | "slug" | "brand" | "status" | "updatedAt">;

function nowIso() {
  return new Date().toISOString();
}

function uuid(): string {
  // Supabase requires UUID format. Use crypto.randomUUID() if available.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  
  // Fallback: Generate UUID v4 format manually
  // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const hex = (count: number) => {
    let result = ''
    for (let i = 0; i < count; i++) {
      result += Math.floor(Math.random() * 16).toString(16)
    }
    return result
  }
  
  const rnd = hex(12)
  const version = '4' // UUID version 4
  const variant = (Math.floor(Math.random() * 4) + 8).toString(16) // 8, 9, a, or b
  
  return `${hex(8)}-${hex(4)}-${version}${hex(3)}-${variant}${hex(3)}-${rnd}`
}

function isUuid(v: unknown): v is string {
  if (typeof v !== "string") return false;
  // UUID v4 (accepts any version 1-5 to be tolerant)
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

/**
 * Converts a title to a URL-friendly slug
 */
export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generates a unique slug in DB space (no LocalStorage, no guessing).
 * Uses a prefix query and picks the next free counter.
 * Filters pages by brand to ensure uniqueness within brand scope only.
 */
export async function generateUniqueSlug(title: string, excludePageId?: string, brand?: string) {
  const baseSlug = titleToSlug(title) || "seite";
  // Server-owned session (HttpOnly cookies): admin must go through API routes.
  // We reuse listPages() and compute the next free slug client-side.
  const pages = await listPages(brand);
  const taken = new Set(
    pages
      .filter((p) => !excludePageId || p.id !== excludePageId)
      .map((p) => String(p.slug))
  );

  if (!taken.has(baseSlug)) return baseSlug;

  let counter = 1;
  while (taken.has(`${baseSlug}-${counter}`)) counter++;
  return `${baseSlug}-${counter}`;
}

export async function listPages(brand?: string): Promise<AdminPageSummary[]> {
  const url = new URL("/api/admin/pages", typeof window !== "undefined" ? window.location.origin : "http://localhost");
  if (brand) {
    url.searchParams.set("brand", brand);
  }

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      const next = window.location.pathname + window.location.search;
      window.location.href = `/auth/login?next=${encodeURIComponent(next)}`;
      // Returning an empty array prevents UI crash after redirect attempt
      return [];
    }
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Failed to load pages (${res.status})`);
  }
  const data = (await res.json()) as any[];
  return (data ?? []).map((p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    brand: p.brand,
    status: p.status,
    updatedAt: p.updated_at,
  }));
}

export async function getPage(id: string): Promise<AdminPage | null> {
  const res = await fetch(`/api/admin/pages/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Failed to load page (${res.status})`);
  }
  const p = (await res.json()) as any;
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    brand: p.brand,
    status: p.status,
    updatedAt: p.updatedAt ?? nowIso(),
    blocks: (p.blocks ?? []) as CMSBlock[],
    meta: undefined,
  };
}

/** Public: gets a published page by slug */
export async function getPublishedPageBySlug(slug: string): Promise<AdminPage | null> {
  const supabase = getSupabaseBrowserClient()
  const { data: page, error: pageErr } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (pageErr) return null;
  if (!page) return null;

  const { data: blocks, error: blocksErr } = await supabase
    .from("blocks")
    .select("*")
    .eq("page_id", page.id)
    .order("sort", { ascending: true });

  if (blocksErr) throw blocksErr;

  const cmsBlocks: CMSBlock[] = (blocks ?? []).map((b: any) => ({
    id: b.id,
    type: b.type,
    props: (b.props ?? {}) as any,
  }));

  return {
    id: page.id,
    title: page.title,
    slug: page.slug,
    brand: page.brand,
    status: page.status,
    updatedAt: page.updated_at ?? nowIso(),
    blocks: cmsBlocks,
    meta: undefined,
  };
}

export async function upsertPage(next: AdminPage): Promise<AdminPage> {
  // Server-owned session: save through API route (PUT replaces blocks deterministically).
  const res = await fetch(`/api/admin/pages/${next.id}`,
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: next.id,
        title: next.title,
        slug: next.slug,
        brand: next.brand,
        status: next.status,
        blocks: next.blocks,
      }),
    }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Failed to save page (${res.status})`);
  }

  const saved = (await res.json()) as any;
  return {
    id: saved.id,
    title: saved.title,
    slug: saved.slug,
    brand: saved.brand,
    status: saved.status,
    updatedAt: saved.updatedAt ?? nowIso(),
    blocks: (saved.blocks ?? []) as CMSBlock[],
    meta: undefined,
  };
}

export async function deletePage(id: string) {
  const res = await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Failed to delete page (${res.status})`);
  }
}

export function createEmptyPage(input?: Partial<Pick<AdminPage, "brand" | "title" | "slug" | "status">>): AdminPage {
  const id = uuid();
  const brand: BrandKey = input?.brand ?? "physiotherapy";
  const title = input?.title ?? "Neue Seite";
  const slug = input?.slug ?? "neu";
  const status: PageStatus = input?.status ?? "draft";

  const blocks: CMSBlock[] = [
    {
      id: uuid(),
      type: "hero",
      props: {
        mood: brand,
        headline: title,
        subheadline: "Kurzbeschreibung hier…",
        ctaText: "Termin vereinbaren",
        ctaHref: "/kontakt",
        showMedia: true,
        mediaType: "image",
        mediaUrl: "/placeholder.svg",
        section: {
          layout: { width: "contained", paddingY: "lg" },
          background: { type: "none", parallax: false },
        },
      },
    },
    {
      id: uuid(),
      type: "text",
      props: {
        content: "Erster Textblock…",
        alignment: "left",
        maxWidth: "lg",
        textSize: "base",
        section: {
          layout: { width: "contained", paddingY: "lg" },
          background: { type: "none", parallax: false },
        },
      },
    },
  ];

  return {
    id,
    brand,
    title,
    slug,
    status,
    updatedAt: nowIso(),
    blocks,
  };
}
