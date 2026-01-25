"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminPage, AdminPageSummary } from "@/lib/cms/supabaseStore";
import { createEmptyPage, deletePage, getPage, listPages, upsertPage } from "@/lib/cms/supabaseStore";

export function usePages() {
  const [pages, setPages] = useState<AdminPageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listPages();
      setPages(data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { pages, refresh, loading, error };
}

export function usePage(pageId: string | null) {
  const [page, setPage] = useState<AdminPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!pageId || pageId === "new") {
          if (!cancelled) setPage(createEmptyPage());
          return;
        }

        const p = await getPage(pageId);
        if (!cancelled) setPage(p ?? createEmptyPage());
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [pageId]);

  const save = async (next: AdminPage) => {
    const saved = await upsertPage(next);
    setPage(saved);
    return saved;
  };

  const remove = () => {
    if (!page) return;
    return deletePage(page.id).then(() => setPage(null));
  };

  return { page, setPage, save, remove, loading, error };
}
