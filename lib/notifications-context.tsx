"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/user-context";

/* ─── ID fijo del equipo de Sistemas ─────────────────────────────────── */
const SISTEMAS_TEAM_ID = 2;

export interface Notification {
  id: number;
  ticket_id: number | null;
  team_id: number | null;
  user_id: number | null;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  user_name?: string;
  team_name?: string;
}

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  refresh: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
});

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const isAdmin = user.role === "admin";
  const supabase = useMemo(() => createClient(), []);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const refresh = useCallback(async () => {
    if (!isAdmin) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*, users(full_name), teams(name)")
        .eq("team_id", SISTEMAS_TEAM_ID)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching notifications", error);
        return;
      }

      const mapped: Notification[] = (data ?? []).map((row: any) => ({
        id: row.id,
        ticket_id: row.ticket_id,
        team_id: row.team_id,
        user_id: row.user_id,
        type: row.type,
        message: row.message,
        is_read: row.is_read,
        created_at: row.created_at,
        user_name: row.users?.full_name ?? "Usuario desconocido",
        team_name: row.teams?.name ?? "",
      }));

      setNotifications(mapped);
    } catch (err) {
      console.error("Exception fetching notifications", err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, supabase]);

  const markAsRead = useCallback(
    async (id: number) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) {
        console.error("Error marking notification as read", error);
        return;
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    },
    [supabase]
  );

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (error) {
      console.error("Error marking all as read", error);
      return;
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, [notifications, supabase]);

  useEffect(() => {
    if (!isAdmin) return;

    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [isAdmin, refresh]);

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, loading, refresh, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}