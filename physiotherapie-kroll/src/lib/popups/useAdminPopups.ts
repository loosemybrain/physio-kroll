"use client"

import { useEffect, useState } from "react"
import type { AdminPopup } from "@/types/popups"
import { createEmptyPopup, deletePopup, getPopup, listPopups, upsertPopup, type AdminPopupListItem } from "./adminPopupsStore"

export function usePopups() {
  const [popups, setPopups] = useState<AdminPopupListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  const refresh = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await listPopups()
      setPopups(data)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return { popups, refresh, loading, error }
}

export function usePopup(popupId: string | null) {
  const [popup, setPopup] = useState<AdminPopup | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!popupId || popupId === "new") {
          if (!cancelled) setPopup(createEmptyPopup())
          return
        }

        const p = await getPopup(popupId)
        if (!cancelled) setPopup(p ?? createEmptyPopup())
      } catch (e) {
        if (!cancelled) setError(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [popupId])

  const save = async (next: AdminPopup) => {
    const saved = await upsertPopup(next)
    setPopup(saved)
    return saved
  }

  const remove = async () => {
    if (!popup) return
    await deletePopup(popup.id)
    setPopup(null)
  }

  return { popup, setPopup, save, remove, loading, error }
}

