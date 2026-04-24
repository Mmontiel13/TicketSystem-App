"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  CheckCheck,
  Ticket,
  Clock,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications, type Notification } from "@/lib/notifications-context";
import { ResponsiveIcon } from "@/components/responsive-icon";

import { getUserIcon } from "@/lib/user-icons";
import { getTeamIcon } from "@/lib/team-icons";
import type { IconUserId } from "@/lib/user-context";

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}

function notificationIcon(type: string) {
  switch (type) {
    case "ticket_created":
      return Ticket;
    case "ticket_status_changed":
      return Clock;
    case "member_added":
      return Users;
    default:
      return Bell;
  }
}

function notificationLabel(type: string) {
  switch (type) {
    case "ticket_created":
      return "Nuevo Ticket";
    case "ticket_status_changed":
      return "Estado Actualizado";
    case "member_added":
      return "Nuevo Miembro";
    default:
      return "Notificación";
  }
}

type TabFilter = "all" | "unread" | "read";

/* ─── Notification Card ──────────────────────────────────────────────── */

function NotificationCard({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: number) => void;
}) {
  const Icon = notificationIcon(notification.type);

  // ✅ iconos reales
  const UserIcon = getUserIcon((notification.user_avatar_icon ?? "Users") as IconUserId);
  const TeamIcon = getTeamIcon(notification.team_icon_id ?? undefined);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "rounded-xl border p-3 sm:p-4 flex gap-3 sm:gap-4 transition-colors",
        notification.is_read
          ? "border-border bg-card"
          : "border-primary/30 bg-primary/5 dark:bg-primary/10"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0",
          notification.is_read
            ? "bg-muted text-muted-foreground"
            : "bg-primary/10 text-primary dark:bg-primary/20"
        )}
      >
        <ResponsiveIcon icon={Icon} smSize={16} mdSize={18} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full",
                  notification.is_read
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                )}
              >
                {notificationLabel(notification.type)}
              </span>
              {!notification.is_read && (
                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              )}
            </div>

            <p className="text-foreground text-xs sm:text-sm mt-1.5 leading-relaxed line-clamp-2">
              {notification.message}
            </p>

            {/* ✅ Usuario + Área con iconos reales (solo en esta vista) */}
            <div className="flex items-center gap-3 mt-2 text-[10px] sm:text-xs text-muted-foreground">
              {notification.user_name && (
                <span className="flex items-center gap-1 min-w-0">
                  <ResponsiveIcon
                    icon={UserIcon}
                    smSize={11}
                    mdSize={12}
                    className="text-muted-foreground shrink-0"
                  />
                  <span className="truncate">{notification.user_name}</span>
                </span>
              )}

              {notification.team_name && (
                <span className="flex items-center gap-1 min-w-0">
                  <ResponsiveIcon
                    icon={TeamIcon}
                    smSize={11}
                    mdSize={12}
                    className="text-muted-foreground shrink-0"
                  />
                  <span className="truncate">{notification.team_name}</span>
                </span>
              )}

              <span className="flex items-center gap-1">
                <Clock size={11} />
                {timeAgo(notification.created_at)}
              </span>
            </div>
          </div>

          {/* Mark as read */}
          {!notification.is_read && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onMarkRead(notification.id)}
              className="text-muted-foreground hover:text-primary transition-colors p-1 shrink-0"
              aria-label="Marcar como leída"
              title="Marcar como leída"
            >
              <CheckCheck size={16} />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main View ──────────────────────────────────────────────────────── */

export function NotificationsView() {
  const {
    notifications,
    unreadCount,
    loading,
    soundEnabled,
    toggleSound,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const [tab, setTab] = useState<TabFilter>("all");

  const filtered = notifications.filter((n) => {
    if (tab === "unread") return !n.is_read;
    if (tab === "read") return n.is_read;
    return true;
  });

  const TABS: { id: TabFilter; label: string }[] = [
    { id: "all", label: "Todas" },
    { id: "unread", label: `No leídas (${unreadCount})` },
    { id: "read", label: "Leídas" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header - h-16 matches sidebar logo height */}
      <div className="h-16 relative flex items-center justify-center sm:justify-between px-4 md:px-8 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-foreground hidden sm:block" />
          <h1 className="text-foreground text-xl font-semibold text-center sm:text-left">
            Notificaciones
          </h1>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}

          {/* Botón de sonido */}
          <button
            onClick={toggleSound}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-lg border border-border transition-colors",
              soundEnabled
                ? "text-foreground hover:bg-accent"
                : "text-muted-foreground hover:bg-accent"
            )}
            aria-label={soundEnabled ? "Silenciar notificaciones" : "Activar sonido"}
            title={soundEnabled ? "Sonido activado" : "Sonido silenciado"}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>

        {unreadCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={markAllAsRead}
            className="absolute right-4 md:right-8 sm:relative sm:right-auto flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-medium"
            type="button"
          >
            <CheckCheck size={14} />
            <span className="hidden sm:inline">Marcar todas como leídas</span>
            <span className="sm:hidden">Leer todas</span>
          </motion.button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center px-4 md:px-8 py-3 gap-3 flex-wrap">
        <div className="flex gap-1 bg-card border border-border rounded-lg p-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium transition-colors",
                tab === t.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              type="button"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4">
        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <span className="text-muted-foreground text-sm">Cargando notificaciones...</span>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-60 gap-3"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <BellOff size={28} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm text-center">
              {tab === "unread"
                ? "No tienes notificaciones sin leer"
                : tab === "read"
                  ? "No hay notificaciones leídas"
                  : "No hay notificaciones aún"}
            </p>
            <p className="text-muted-foreground/60 text-xs text-center max-w-xs">
              Las notificaciones aparecerán aquí cuando se creen nuevos tickets en el sistema.
            </p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkRead={markAsRead}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}