"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import {
  CheckSquare,
  BarChart2,
  Users,
  Sun,
  Moon,
  LayoutGrid,
  HelpCircle,
  Bell,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/lib/user-context";
import { useNotifications } from "@/lib/notifications-context";

const NAV_PRINCIPAL_ALL = [
  { label: "Métricas", icon: BarChart2, href: "/dashboard/metricas", adminOnly: true },
  { label: "Tickets", icon: CheckSquare, href: "/dashboard/tickets", adminOnly: false },
  { label: "Equipos", icon: Users, href: "/dashboard/equipos", adminOnly: true },
  { label: "Kanban", icon: LayoutGrid, href: "/dashboard/kanban", adminOnly: false },
  { label: "Notificaciones", icon: Bell, href: "/dashboard/notificaciones", adminOnly: true },
];

const NAV_GENERAL_LINKS = [
  { label: "Ayuda rápida", icon: HelpCircle, href: "/dashboard/ayuda", adminOnly: false },
  { label: "Configuración", icon: Settings, href: "/dashboard/configuracion", adminOnly: false },
];

function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
  onClick,
  badge,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: number;
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
      <Icon size={16} className={active ? "text-foreground" : "text-muted-foreground"} />
      <span className="flex-1">{label}</span>
      {typeof badge === "number" && badge > 0 && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

export function SidebarNav({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();
  const { user } = useUser();
  const { unreadCount } = useNotifications();
  const { resolvedTheme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = (resolvedTheme ?? "dark") === "dark";

  const NAV_PRINCIPAL = useMemo(
    () => NAV_PRINCIPAL_ALL.filter((item) => !item.adminOnly || user.role === "admin"),
    [user.role],
  );

  function handleToggleTheme() {
    if (!mounted) return;
    setTheme(isDark ? "light" : "dark");
  }

  function getBadge(href: string): number | undefined {
    if (href === "/dashboard/notificaciones") return unreadCount;
    return undefined;
  }

  return (
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
              badge={getBadge(item.href)}
            />
          ))}
        </div>
      </div>

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
  );
}