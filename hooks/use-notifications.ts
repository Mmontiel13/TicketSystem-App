"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type NotificationRecord = {
  id: number
  title?: string
  message?: string
  body?: string
  team_id: number
  is_read: boolean
  created_at?: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  useEffect(() => {
    let mounted = true

    const loadNotifications = async () => {
      const { data, error } = await supabase
        .from<NotificationRecord>("notifications")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && mounted && data) {
        setNotifications(data.filter((item) => item.team_id === 2))
      }
      if (mounted) {
        setLoading(false)
      }
    }

    loadNotifications()

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const newRecord = payload.new as NotificationRecord
          if (newRecord.team_id === 2) {
            setNotifications((prev) => [newRecord, ...prev])
            new Audio("/notify.mp3").play().catch((e) => console.error("Audio block:", e))
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        (payload) => {
          const newRecord = payload.new as NotificationRecord
          const oldRecord = payload.old as NotificationRecord
          if (newRecord.team_id === 2) {
            setNotifications((prev) =>
              prev.map((item) =>
                item.id === newRecord.id ? { ...item, ...newRecord } : item,
              ),
            )
          } else if (oldRecord.team_id === 2) {
            setNotifications((prev) => prev.filter((item) => item.id !== oldRecord.id))
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications" },
        (payload) => {
          const oldRecord = payload.old as NotificationRecord
          if (oldRecord.team_id === 2) {
            setNotifications((prev) => prev.filter((item) => item.id !== oldRecord.id))
          }
        },
      )
      .subscribe()

    return () => {
      mounted = false
      void supabase.removeChannel(channel)
    }
  }, [supabase])

  const markAsRead = async (id: number) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)

    if (!error) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)),
      )
    }
  }

  const deleteNotification = async (id: number) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id)
    if (!error) {
      setNotifications((prev) => prev.filter((item) => item.id !== id))
    }
  }

  const clearAll = async () => {
    const ids = notifications.map((item) => item.id)
    if (ids.length === 0) return

    const { error } = await supabase.from("notifications").delete().in("id", ids)
    if (!error) {
      setNotifications([])
    }
  }

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    deleteNotification,
    clearAll,
  }
}
