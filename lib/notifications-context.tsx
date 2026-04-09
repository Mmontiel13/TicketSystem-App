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
  user_name?: string;
  team_name?: string;
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
});

/* ─── Sonido de notificación (Web Audio API — sin archivo externo) ────── */

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    // Tono tipo "ding-dong"
    oscillator.frequency.setValueAtTime(830, ctx.currentTime);
    oscillator.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(830, ctx.currentTime + 0.2);

    // Volumen suave con fade-out
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    oscillator.type = "sine";
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);

    // Limpiar contexto de audio después
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

  // IDs conocidos para detectar notificaciones nuevas
  const knownIdsRef = useRef<Set<number>>(new Set());
  // Evitar que suene en la primera carga de la página
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

      // ─── Detectar nuevas notificaciones ──────────────────────
      if (isFirstLoadRef.current) {
        // Primera carga: solo guardar IDs, NO sonar
        knownIdsRef.current = new Set(mapped.map((n) => n.id));
        isFirstLoadRef.current = false;
      } else {
        // Cargas siguientes: buscar IDs que no existían antes
        const newNotifications = mapped.filter(
          (n) => !knownIdsRef.current.has(n.id) && !n.is_read
        );

        if (newNotifications.length > 0 && soundEnabled) {
          playNotificationSound();
        }

        // Actualizar IDs conocidos
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

  // Polling cada 30 segundos
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
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}