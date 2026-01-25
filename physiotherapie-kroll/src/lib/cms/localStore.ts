"use client";

import type { CMSBlock, CMSPage } from "@/types/cms";
import type { BrandKey } from "@/components/brand/brandAssets";

export type PageStatus = "draft" | "published";

export type AdminPage = CMSPage & {
  brand: BrandKey;
  status: PageStatus;
  updatedAt: string; // ISO string
};

export type AdminPageSummary = Pick<AdminPage, "id" | "title" | "slug" | "brand" | "status" | "updatedAt">;

const STORAGE_KEY = "physio-cms:v1";

type StoreShape = {
  pages: Record<string, AdminPage>;
};

function nowIso() {
  return new Date().toISOString();
}

/**
 * Converts a title to a URL-friendly slug
 */
function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD") // Normalize to decomposed form for handling accents
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generates a unique slug from a title, ensuring it doesn't conflict with existing pages
 */
function generateUniqueSlug(title: string, excludePageId?: string): string {
  const baseSlug = titleToSlug(title) || "seite";
  const store = readStore();
  const existingSlugs = new Set(
    Object.values(store.pages)
      .filter((p) => p.id !== excludePageId)
      .map((p) => p.slug)
  );

  let slug = baseSlug;
  let counter = 1;
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function readStore(): StoreShape {
  if (typeof window === "undefined") return { pages: {} };
  const parsed = safeParse<StoreShape>(window.localStorage.getItem(STORAGE_KEY));
  if (!parsed || typeof parsed !== "object" || !("pages" in parsed)) return { pages: {} };
  return { pages: (parsed as StoreShape).pages ?? {} };
}

function writeStore(store: StoreShape) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function listPages(): AdminPageSummary[] {
  const store = readStore();
  return Object.values(store.pages)
    .map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      brand: p.brand,
      status: p.status,
      updatedAt: p.updatedAt,
    }))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getPage(id: string): AdminPage | null {
  const store = readStore();
  return store.pages[id] ?? null;
}

/**
 * Gets a published page by slug
 */
export function getPageBySlug(slug: string): AdminPage | null {
  const store = readStore();
  const page = Object.values(store.pages).find(
    (p) => p.slug === slug && p.status === "published"
  );
  return page ?? null;
}

export function upsertPage(page: AdminPage): AdminPage {
  const store = readStore();
  const updated: AdminPage = { ...page, updatedAt: nowIso() };
  store.pages[updated.id] = updated;
  writeStore(store);
  return updated;
}

export function deletePage(id: string) {
  const store = readStore();
  delete store.pages[id];
  writeStore(store);
}

export function createEmptyPage(input?: Partial<Pick<AdminPage, "brand" | "title" | "slug" | "status">>): AdminPage {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());

  const brand: BrandKey = input?.brand ?? "physiotherapy";
  const title = input?.title ?? "Neue Seite";
  const slug = input?.slug ?? "neu";
  const status: PageStatus = input?.status ?? "draft";

  const blocks: CMSBlock[] = [
    {
      id: id + "-hero",
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
      },
    },
    {
      id: id + "-text",
      type: "text",
      props: {
        content: "Erster Textblock…",
        alignment: "left",
        maxWidth: "lg",
        textSize: "base",
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
