"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, type IconUserId } from "@/lib/user-context";

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

/* ─── Logo SVG ───────────────────────────────────────────────────────────────── */

function AsiatechMark({ isDark }: { isDark: boolean }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <img
      src="/logodark.svg"
      alt="asiatech logo"
      width={100}
      className="object-contain mx-auto"
      style={{
        filter: isDark ? "brightness(0) invert(1)" : "none",
      }}
    />
  );
}

/* ─── Nav link ───────────────────────────────────────────────────────────────── */

function userIconById(id: IconUserId) {
  const map: Record<IconUserId, React.ElementType> = {
    Ghost,
    Rose,
    Rabbit,
    Users: UserCircle,
    Fish,
    Cat,
  }

  return map[id] ?? UserCircle
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
  const { user, logout } = useUser();
  const { resolvedTheme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // fallback coherente con defaultTheme="dark"
  const isDark = (resolvedTheme ?? "dark") === "dark";

  const NAV_PRINCIPAL = NAV_PRINCIPAL_ALL.filter(
    (item) => !item.adminOnly || user.role === "admin",
  );

  function handleLogout() {
    logout();
    router.push("/login");
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
      <div className="px-4 py-4 border-t border-sidebar-border flex items-center gap-3">
        {(() => {
          const ProfileIcon = userIconById(user.iconId || "Users")
          return (
            <ProfileIcon size={32} className="text-muted-foreground shrink-0" />
          )
        })()}
        <span className="text-sm text-zinc-300 flex-1">{user.name || user.email}</span>
        <button
          onClick={handleLogout}
          className="text-zinc-500 hover:text-red-400 transition-colors"
          aria-label="Cerrar Sesión"
          title="Cerrar Sesión"
        >
          <LogOut size={16} />
        </button>
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