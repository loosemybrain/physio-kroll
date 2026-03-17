"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PagesView } from "./PageView"
import { usePages } from "@/lib/cms/useLocalCms"
import { deletePage } from "@/lib/cms/supabaseStore"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function PagesViewClient() {
  const router = useRouter()
  const { pages, refresh } = usePages()
  const [pageToDelete, setPageToDelete] = useState<{ id: string; title: string } | null>(null)

  const handleEditPage = (pageId: string) => {
    router.push(`/admin/pages/${pageId}`)
  }

  const handleNewPage = (params?: { pageType: "legal"; pageSubtype: "privacy" | "cookies" | "imprint" }) => {
    if (params) {
      const q = new URLSearchParams({ pageType: params.pageType, pageSubtype: params.pageSubtype })
      router.push(`/admin/pages/new?${q.toString()}`)
    } else {
      router.push("/admin/pages/new")
    }
  }

  const handleRequestDelete = (pageId: string) => {
    const page = pages.find((p) => p.id === pageId)
    if (page) setPageToDelete({ id: page.id, title: page.title })
  }

  const handleConfirmDelete = async () => {
    if (!pageToDelete) return
    await deletePage(pageToDelete.id)
    setPageToDelete(null)
    await refresh()
  }

  const handlePreviewPage = (pageId: string) => {
    // Open a dedicated preview route (works for draft + published)
    // Use a new tab to keep admin state intact.
    window.open(`/preview/${pageId}`, "_blank", "noopener,noreferrer")
  }

  return (
    <>
      <PagesView
        pages={pages}
        onEditPage={handleEditPage}
        onNewPage={handleNewPage}
        onPreviewPage={handlePreviewPage}
        onDeletePage={handleRequestDelete}
      />
      <AlertDialog open={!!pageToDelete} onOpenChange={(open) => !open && setPageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Seite wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Die Seite &quot;{pageToDelete?.title ?? ""}&quot; wird unwiderruflich gelöscht. Alle zugehörigen Blöcke und Inhalte gehen verloren. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Seite löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
