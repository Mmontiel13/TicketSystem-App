"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  CheckSquare,
  BarChart2,
  Users,
  Sun,
  Moon,
  LayoutGrid,
  HelpCircle,
  UserCircle,
  Menu,
  X,
  LogOut,
  Bell,
  Ghost,
  Rose,
  Rabbit,
  Fish,
  Cat,
  Skull,
  VenetianMask,
  Volleyball,
  Donut,
  HandMetal,
  Sticker,
  Biohazard,
  MoreVertical,
  User,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useUser, type IconUserId } from "@/lib/user-context";
import { useNotifications } from "@/lib/notifications-context";
import { UserAvatarEditor } from "@/components/user-avatar-editor";

/* ─── Nav config ─────────────────────────────────────────────────────────── */

const NAV_PRINCIPAL_ALL = [
  {
    label: "Métricas",
    icon: BarChart2,
    href: "/dashboard/metricas",
    adminOnly: true,
  },
  { 
    label: "Tickets",
    icon: CheckSquare,
    href: "/dashboard/tickets",
    adminOnly: false 
  },
  {
    label: "Equipos",
    icon: Users,
    href: "/dashboard/equipos",
    adminOnly: true,
  },
  { label: "Kanban", icon: LayoutGrid, href: "/dashboard/kanban", adminOnly: false },
  { label: "Notificaciones", icon: Bell, href: "/dashboard/notificaciones", adminOnly: true },
];

const NAV_GENERAL_LINKS = [
  
  { label: "Ayuda rápida", icon: HelpCircle, href: "/dashboard/ayuda", adminOnly: false },
  { label: "Configuración", icon: Settings, href: "/dashboard/configuracion", adminOnly: false },
];

/* ─── User icons (expandidos de feat branch) ─────────────────────────────── */

const USER_ICONS = [
  { id: "Ghost", icon: Ghost },
  { id: "Rose", icon: Rose },
  { id: "Rabbit", icon: Rabbit },
  { id: "Skull", icon: Skull },
  { id: "Fish", icon: Fish },
  { id: "Cat", icon: Cat },
  { id: "VenetianMask", icon: VenetianMask },
  { id: "Volleyball", icon: Volleyball },
  { id: "Donut", icon: Donut },
  { id: "HandMetal", icon: HandMetal },
  { id: "Sticker", icon: Sticker },
  { id: "Biohazard", icon: Biohazard },
] as const;

/* ─── Logo SVG ───────────────────────────────────────────────────────────── */

function AsiatechMark({ isDark }: { isDark: boolean }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Image
      src="/logodark.svg"
      alt="asiatech logo"
      width={100}
      height={40}
      className="object-contain mx-auto"
      style={{
        filter: isDark ? "brightness(0) invert(1)" : "none",
      }}
    />
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function userIconById(id: IconUserId) {
  const iconMap = USER_ICONS.reduce((acc, { id: iconId, icon }) => {
    acc[iconId] = icon;
    return acc;
  }, {} as Record<string, React.ElementType>);
  return iconMap[id] ?? UserCircle;
}

/* ─── SidebarLink con badge ──────────────────────────────────────────────── */

function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
  onClick,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
      )}
    >
      <Icon
        size={16}
        className={active ? "text-foreground" : "text-muted-foreground"}
      />
      <span className="flex-1">{label}</span>
    </Link>
  );
}

/* ─── Sidebar inner content ──────────────────────────────────────────────── */

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { resolvedTheme, setTheme } = useTheme();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const [mounted, setMounted] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = (resolvedTheme ?? "dark") === "dark";

  const NAV_PRINCIPAL = NAV_PRINCIPAL_ALL.filter(
    (item) => !item.adminOnly || user.role === "admin",
  );

  function getBadge(href: string): number | undefined {
    if (href === "/dashboard/notificaciones") return unreadCount;
    return undefined;
  }

  /* ── Logout con confirmación ── */
  async function confirmLogout() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setLogoutOpen(false);
      await router.push("/login");
    }
  }

  function handleToggleTheme() {
    if (!mounted) return;
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo - h-16 matches main header height */}
      <div className="h-16 flex items-center justify-center px-5 border-b border-border/50 text-foreground">
        <AsiatechMark isDark={isDark} />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col">
        {/* Principal */}
        <div>
          <p className="px-3 mb-2 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            Principal
          </p>
          <div className="flex flex-col gap-1">
            {NAV_PRINCIPAL.map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={pathname === item.href}
                onClick={onNavClick}
              />
            ))}
          </div>
        </div>

        {/* Separator with consistent spacing */}
        <div className="py-5">
          <Separator className="bg-border/50 h-[1px]" />
        </div>

        {/* General */}
        <div>
          <p className="px-3 mb-2 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            General
          </p>
          <div className="flex flex-col gap-1">
            <button
              onClick={handleToggleTheme}
              disabled={!mounted}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-muted-foreground hover:text-foreground hover:bg-accent/60 w-full text-left disabled:opacity-60"
            >
              {mounted ? (
                isDark ? (
                  <Sun size={16} className="text-muted-foreground" />
                ) : (
                  <Moon size={16} className="text-muted-foreground" />
                )
              ) : (
                <span className="w-4 h-4 inline-block" />
              )}
              <span>Mode</span>
            </button>

            {NAV_GENERAL_LINKS.map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={pathname === item.href}
                onClick={onNavClick}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* ── User profile footer ────────────────────────────────────────── */}
      <div className="px-4 py-4 border-t border-border/50">
        <div className="flex items-center gap-3">
          {/* Profile with user icon and name */}
          <div className="flex items-center gap-3 flex-1">
            {(() => {
              const ProfileIcon = userIconById(user.iconId || "Users");
              return (
                <ProfileIcon size={32} className="text-muted-foreground shrink-0" />
              );
            })()}
            <span className="text-sm text-muted-foreground flex-1">
              {user.name || user.email}
            </span>
          </div>
            {/* ── Campana de notificaciones (Popover) ── */}
          {user.role === "admin" && (
            <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
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
                  {notifications.length > 0 && (
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
                  ) : notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin notificaciones.</p>
                  ) : (
                    notifications.map((notification) => {
                      const isReadClass = notification.is_read
                        ? "opacity-50 border-foreground/20"
                        : "border-foreground/20";
                      return (
                        <div
                          key={notification.id}
                          className={cn(
                            "rounded-xl border p-3 transition-colors bg-background text-foreground cursor-pointer",
                            isReadClass,
                          )}
                          onClick={() => void markAsRead(notification.id)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                Nueva notificación
                              </p>
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
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
          {/* ── Three-dots dropdown menu ── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-accent/50"
                aria-label="Opciones de perfil"
              >
                <MoreVertical size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 z-50">
              <DropdownMenuItem
                onClick={() => setEditProfileOpen(true)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <User size={14} />
                <span>Editar Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLogoutOpen(true)}
                className="flex items-center gap-2 cursor-pointer text-red-400 hover:text-red-400"
              >
                <LogOut size={14} />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Logout con confirmación (AlertDialog) ── */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="rounded-xl bg-popover/90 backdrop-blur-xl border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              ¿Cerrar sesión?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              ¿Estás seguro de que deseas cerrar sesión?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cerrar sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Dialog para cambiar icono ── */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="rounded-xl bg-popover/90 backdrop-blur-xl border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar Perfil</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Cambia tu icono de avatar.
            </DialogDescription>
          </DialogHeader>
          <UserAvatarEditor showTitle={false} />
          <DialogFooter>
            <button
              onClick={() => setEditProfileOpen(false)}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Cerrar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Main Sidebar (desktop fixed + mobile sheet) ───────────────────────── */

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Desktop: fixed sidebar ── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-[230px] flex-col border-r border-border/50 bg-sidebar z-30">
        <SidebarContent />
      </aside>

      {/* ── Mobile: hamburger button ── */}
      <div className="md:hidden fixed top-0 left-0 z-40 p-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-md bg-zinc-900 border border-zinc-800 text-white"
          aria-label="Abrir menú"
        >
          <Menu size={18} />
        </motion.button>
      </div>

      {/* ── Mobile: sheet overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 left-0 w-[240px] z-50 flex flex-col border-r border-sidebar-border bg-sidebar md:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10"
                aria-label="Cerrar menú"
              >
                <X size={18} />
              </button>
              <SidebarContent onNavClick={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}