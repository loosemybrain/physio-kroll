"use client";

import type { CMSBlock, CMSPage, PageSubtype, PageType } from "@/types/cms";
import type { BrandKey } from "@/components/brand/brandAssets";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDefaultBlocksForPageType } from "@/cms/blocks/defaultPageBlocks";
import { migrateLegalBlocksForPageType } from "@/lib/cms/migrations/legalSections";
import { sanitizeAdminPageForPersistence } from "@/lib/security/sanitizeCmsHtmlOnWrite";

export type PageStatus = "draft" | "published";

export type AdminPage = CMSPage & {
  brand: BrandKey;
  status: PageStatus;
  updatedAt: string; // ISO string
};

export type AdminPageSummary = Pick<AdminPage, "id" | "title" | "slug" | "brand" | "status" | "pageType" | "pageSubtype" | "updatedAt">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function asBrandKey(value: unknown): BrandKey {
  return value === "physio-konzept" ? "physio-konzept" : "physiotherapy"
}

function asPageStatus(value: unknown): PageStatus {
  return value === "published" ? "published" : "draft"
}

function normalizePageSubtype(v: unknown): PageSubtype {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "string" && (v === "privacy" || v === "cookies" || v === "imprint")) return v;
  return null;
}

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
  const data = (await res.json()) as unknown;
  const rows = Array.isArray(data) ? data.filter(isRecord) : []
  return rows.map((p) => ({
    id: asString(p.id),
    title: asString(p.title),
    slug: asString(p.slug),
    brand: asBrandKey(p.brand),
    status: asPageStatus(p.status),
    pageType: (p.pageType ?? p.page_type ?? "default") as PageType,
    pageSubtype: normalizePageSubtype(p.pageSubtype ?? p.page_subtype),
    updatedAt: asString(p.updatedAt ?? p.updated_at, nowIso()),
  }));
}

export async function getPage(id: string): Promise<AdminPage | null> {
  const res = await fetch(`/api/admin/pages/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Failed to load page (${res.status})`);
  }
  const raw = (await res.json()) as unknown;
  const p = isRecord(raw) ? raw : {}
  const pageType = (p.pageType ?? p.page_type ?? "default") as PageType
  const blocks = (p.blocks ?? []) as CMSBlock[]
  const migratedBlocks = migrateLegalBlocksForPageType(blocks, pageType)

  return {
    id: asString(p.id),
    title: asString(p.title),
    slug: asString(p.slug),
    brand: asBrandKey(p.brand),
    status: asPageStatus(p.status),
    pageType,
    pageSubtype: normalizePageSubtype(p.pageSubtype ?? p.page_subtype),
    updatedAt: asString(p.updatedAt, nowIso()),
    blocks: migratedBlocks,
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

  const cmsBlocksRaw = (blocks ?? []).map((b: Record<string, unknown>) => ({
    id: asString(b.id),
    type: asString(b.type) as CMSBlock["type"],
    props: (isRecord(b.props) ? b.props : {}) as CMSBlock["props"],
  })) as CMSBlock[];
  const pageType = (page.page_type ?? "default") as PageType
  const cmsBlocks = migrateLegalBlocksForPageType(cmsBlocksRaw, pageType)

  return {
    id: page.id,
    title: page.title,
    slug: page.slug,
    brand: page.brand,
    status: page.status,
    pageType,
    pageSubtype: normalizePageSubtype(page.page_subtype),
    updatedAt: page.updated_at ?? nowIso(),
    blocks: cmsBlocks,
    meta: undefined,
  };
}

export async function upsertPage(next: AdminPage): Promise<AdminPage> {
  const toSave = sanitizeAdminPageForPersistence(next);
  // Server-owned session: save through API route (PUT replaces blocks deterministically).
  const res = await fetch(`/api/admin/pages/${toSave.id}`,
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: toSave.id,
        title: toSave.title,
        slug: toSave.slug,
        brand: toSave.brand,
        status: toSave.status,
        pageType: toSave.pageType ?? "default",
        pageSubtype: normalizePageSubtype(toSave.pageSubtype),
        blocks: toSave.blocks,
      }),
    }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Failed to save page (${res.status})`);
  }

  const savedRaw = (await res.json()) as unknown;
  const saved = isRecord(savedRaw) ? savedRaw : {}
  return {
    id: asString(saved.id),
    title: asString(saved.title),
    slug: asString(saved.slug),
    brand: asBrandKey(saved.brand),
    status: asPageStatus(saved.status),
    pageType: (saved.pageType ?? saved.page_type ?? "default") as PageType,
    pageSubtype: normalizePageSubtype(saved.pageSubtype ?? saved.page_subtype),
    updatedAt: asString(saved.updatedAt, nowIso()),
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

export function createEmptyPage(input?: Partial<Pick<AdminPage, "brand" | "title" | "slug" | "status" | "pageType" | "pageSubtype">>): AdminPage {
  const id = uuid();
  const brand: BrandKey = input?.brand ?? "physiotherapy";
  const title = input?.title ?? "Neue Seite";
  const slug = input?.slug ?? "neu";
  const status: PageStatus = input?.status ?? "draft";
  const pageType: PageType = input?.pageType ?? "default";
  const pageSubtype: PageSubtype = input?.pageSubtype ?? null;

  const legalBlocks = getDefaultBlocksForPageType(pageType, pageSubtype, brand);
  // For new (non-legal) pages we start with an empty block list.
  // The editor supplies blocks explicitly via the block picker.
  const blocks: CMSBlock[] = legalBlocks ?? [];

  return {
    id,
    brand,
    title,
    slug,
    status,
    pageType,
    pageSubtype,
    updatedAt: nowIso(),
    blocks,
  };
}
