"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
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

  // UI
  user_name?: string;
  team_name?: string;

  // ✅ para pintar iconos reales (solo los usamos en la pestaña de notificaciones)
  user_avatar_icon?: string; // viene de users.avatar_icon
  team_icon_id?: string | null; // viene de teams.icon_id
}

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  soundEnabled: boolean;
  toggleSound: () => void;
  refresh: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  soundEnabled: true,
  toggleSound: () => {},
  refresh: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
  clearAll: async () => {},
});

/* ─── Sonido de notificación (Web Audio API — sin archivo externo) ────── */

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(830, ctx.currentTime);
    oscillator.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(830, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    oscillator.type = "sine";
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);

    oscillator.onended = () => ctx.close();
  } catch (err) {
    console.warn("Could not play notification sound", err);
  }
}

/* ─── Provider ───────────────────────────────────────────────────────── */

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const isAdmin = user.role === "admin";
  const supabase = useMemo(() => createClient(), []);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const knownIdsRef = useRef<Set<number>>(new Set());
  const isFirstLoadRef = useRef(true);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const refresh = useCallback(async () => {
    if (!isAdmin) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        // ✅ aquí está el cambio importante
        .select("*, users(full_name, avatar_icon), teams(name, icon_id)")
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

        // ✅ nuevos
        user_avatar_icon: row.users?.avatar_icon ?? "Users",
        team_icon_id: row.teams?.icon_id ?? null,
      }));

      if (isFirstLoadRef.current) {
        knownIdsRef.current = new Set(mapped.map((n) => n.id));
        isFirstLoadRef.current = false;
      } else {
        const newNotifications = mapped.filter(
          (n) => !knownIdsRef.current.has(n.id) && !n.is_read
        );

        if (newNotifications.length > 0 && soundEnabled) {
          playNotificationSound();
        }

        knownIdsRef.current = new Set(mapped.map((n) => n.id));
      }

      setNotifications(mapped);
    } catch (err) {
      console.error("Exception fetching notifications", err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, supabase, soundEnabled]);

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

  const deleteNotification = useCallback(
    async (id: number) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);

      if (error) {
        console.error("Error deleting notification", error);
        return;
      }

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      knownIdsRef.current.delete(id);
    },
    [supabase]
  );

  const clearAll = useCallback(async () => {
    const ids = notifications.map((n) => n.id);
    if (ids.length === 0) return;

    const { error } = await supabase.from("notifications").delete().in("id", ids);

    if (error) {
      console.error("Error clearing all notifications", error);
      return;
    }

    setNotifications([]);
    knownIdsRef.current.clear();
  }, [notifications, supabase]);

  useEffect(() => {
    if (!isAdmin) return;

    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [isAdmin, refresh]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        soundEnabled,
        toggleSound,
        refresh,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}