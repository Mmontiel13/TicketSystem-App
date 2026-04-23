"use client";

import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/lib/notifications-context";
import { useMemo, useState } from "react";

export function NotificationsBell() {
  const { notifications, unreadCount, loading, markAsRead, deleteNotification, clearAll } =
    useNotifications();

  const [open, setOpen] = useState(false);

  // ✅ Solo 1 notificación: la NO leída más reciente.
  // (notifications llega ordenado por created_at desc desde el contexto)
  const latestUnread = useMemo(
    () => notifications.filter((n) => !n.is_read).slice(0, 1),
    [notifications],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Abrir notificaciones"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[9px] bg-[#e63946] text-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-3 max-h-80">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-foreground">Notificaciones</span>

          {/* Mantengo tu comportamiento actual: clearAll borra todo lo que esté en el contexto */}
          {unreadCount > 0 && (
            <button
              onClick={() => void clearAll()}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Limpiar todo
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : latestUnread.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin notificaciones.</p>
          ) : (
            latestUnread.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "rounded-xl border p-3 transition-colors bg-background text-foreground cursor-pointer",
                  "border-foreground/20",
                )}
                onClick={() => void markAsRead(notification.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Nueva notificación</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void deleteNotification(notification.id);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground shrink-0"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}