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
  Ghost,
  Rose,
  Rabbit,
  Fish,
  Cat,
  Bell,
  Skull,
  VenetianMask,
  Volleyball,
  Donut,
  HandMetal,
  Sticker,
  Biohazard,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useUser, type IconUserId } from "@/lib/user-context";
import { useNotifications } from "@/hooks/use-notifications";

/* ─── Nav config ─────────────────────────────────────────────────────────────── */

const NAV_PRINCIPAL_ALL = [
  { label: "Tickets", icon: CheckSquare, href: "/dashboard/tickets", adminOnly: false },
  {
    label: "Metricas",
    icon: BarChart2,
    href: "/dashboard/metricas",
    adminOnly: true,
  },
  {
    label: "Equipos",
    icon: Users,
    href: "/dashboard/equipos",
    adminOnly: true,
  },
];

const NAV_GENERAL_LINKS = [
  { label: "Kanban", icon: LayoutGrid, href: "/dashboard/kanban" },
  { label: "Ayuda rápida", icon: HelpCircle, href: "/dashboard/ayuda" },
];

/* ─── User icons ─────────────────────────────────────────────────────────────── */

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

/* ─── Logo SVG ───────────────────────────────────────────────────────────────── */

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

/* ─── Nav link ───────────────────────────────────────────────────────────────── */

function userIconById(id: IconUserId) {
  const iconMap = USER_ICONS.reduce((acc, { id: iconId, icon }) => {
    acc[iconId] = icon;
    return acc;
  }, {} as Record<IconUserId, React.ElementType>);
  return iconMap[id] ?? UserCircle;
}

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
      <span>{label}</span>
    </Link>
  );
}

/* ─── Sidebar inner content ──────────────────────────────────────────────────── */

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, updateUser } = useUser();
  const { resolvedTheme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<IconUserId | null>(null);
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const { notifications, loading, unreadCount, markAsRead, deleteNotification, clearAll } = useNotifications();
  useEffect(() => setMounted(true), []);

  // fallback coherente con defaultTheme="dark"
  const isDark = (resolvedTheme ?? "dark") === "dark";

  const NAV_PRINCIPAL = NAV_PRINCIPAL_ALL.filter(
    (item) => !item.adminOnly || user.role === "admin",
  );

  function handleLogout() {
    setLogoutOpen(true);
  }

  function handleIconSelect(iconId: IconUserId) {
    setSelectedIcon(iconId);
    setConfirmEditOpen(true);
  }

  async function confirmIconUpdate() {
    if (!selectedIcon) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('users')
        .update({ avatar_icon: selectedIcon })
        .eq('id', user.id);

      if (error) throw error;

      updateUser(user.id, { iconId: selectedIcon });
      setConfirmEditOpen(false);
      setEditProfileOpen(false);
      setSelectedIcon(null);
    } catch (error) {
      console.error('Error updating avatar:', error);
      // TODO: show toast
    }
  }

  async function confirmLogout() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setLogoutOpen(false);
      await router.push('/login');
    }
  }

  function handleToggleTheme() {
    if (!mounted) return;
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-center px-5 py-5 border-b border-sidebar-border text-foreground">
        <AsiatechMark isDark={isDark} />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-6">
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

        {/* General */}
        <div>
          <p className="px-3 mb-2 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            General
          </p>
          <div className="flex flex-col gap-1">
            {/* Mode toggle */}
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

      {/* User profile + logout */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="flex items-center gap-3 flex-1 cursor-pointer">
                {(() => {
                  const ProfileIcon = userIconById(user.iconId || "Users")
                  return (
                    <ProfileIcon size={32} className="text-muted-foreground shrink-0" />
                  )
                })()}
                <span className="text-sm text-muted-foreground flex-1">{user.name || user.email}</span>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-48 p-2">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setEditProfileOpen(true)}
                  className="text-left px-2 py-1 text-sm text-foreground hover:bg-accent rounded"
                >
                  Edit Profile
                </button>
                {user.team_id === 2 && (
                  <button
                    onClick={() => setNotificationsOpen(true)}
                    className="text-left px-2 py-1 text-sm text-foreground hover:bg-accent rounded"
                  >
                    Notifications
                  </button>
                )}
              </div>
            </HoverCardContent>
          </HoverCard>
          <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <PopoverTrigger asChild>
              <button
                className="relative text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Open notifications"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs bg-[#e63946] text-white"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3 max-h-80">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">Notificaciones</span>
                {notifications.length > 0 ? (
                  <button
                    onClick={() => void clearAll()}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear All
                  </button>
                ) : null}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No notifications yet.</p>
                ) : (
                  notifications.map((notification) => {
                    const isReadClass = notification.is_read ? "opacity-50 border-foreground/20" : "border-foreground/20"
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "rounded-xl border p-3 transition-colors bg-background text-foreground",
                          isReadClass,
                        )}
                        onClick={() => void markAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {notification.title ?? "Nueva notificación"}
                            </p>
                            <p className="text-xs leading-5 text-muted-foreground">
                              {notification.message ?? notification.body ?? "Sin detalles adicionales."}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              void deleteNotification(notification.id)
                            }}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </PopoverContent>
          </Popover>
          <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
            <AlertDialogTrigger asChild>
              <button
                className="text-zinc-500 hover:text-red-400 transition-colors"
                aria-label="Cerrar Sesión"
                title="Cerrar Sesión"
              >
                <LogOut size={16} />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-xl bg-popover/90 backdrop-blur-xl border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">Confirm Logout</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Are you sure you want to log out?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmLogout}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Logout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
            <DialogContent className="rounded-xl bg-popover/90 backdrop-blur-xl border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Edit Profile</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Change your avatar icon.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground mb-2">Select an icon:</p>
                <div className="grid grid-cols-4 gap-2">
                  {USER_ICONS.map(({ id, icon: IconComponent }) => (
                    <button
                      key={id}
                      className="p-3 border rounded hover:bg-accent flex items-center justify-center"
                      onClick={() => handleIconSelect(id)}
                    >
                      <IconComponent size={20} />
                    </button>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <button
                  onClick={() => setEditProfileOpen(false)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <AlertDialog open={confirmEditOpen} onOpenChange={setConfirmEditOpen}>
            <AlertDialogContent className="rounded-xl bg-popover/90 backdrop-blur-xl border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">Confirm Avatar Change</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Are you sure you want to change your avatar to this icon?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex justify-center py-4">
                {selectedIcon && (
                  <div className="p-4 border rounded">
                    {(() => {
                      const IconComponent = userIconById(selectedIcon);
                      return <IconComponent size={32} />;
                    })()}
                  </div>
                )}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmIconUpdate}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Sidebar (desktop fixed + mobile sheet) ───────────────────────────── */

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Desktop: fixed sidebar ── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-[230px] flex-col border-r border-sidebar-border bg-sidebar z-30">
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
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-in panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 left-0 w-[240px] z-50 flex flex-col border-r border-sidebar-border bg-sidebar md:hidden"
            >
              {/* Close button */}
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