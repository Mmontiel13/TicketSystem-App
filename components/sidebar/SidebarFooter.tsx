"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, MoreVertical, User } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/user-context";
import { getUserIcon } from "@/lib/user-icons";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { NotificationsBell } from "@/components/sidebar/NotificationsBell";
import { LogoutDialog } from "@/components/sidebar/dialogs/LogoutDialog";
import { EditProfileDialog } from "@/components/sidebar/dialogs/EditProfileDialog";

export function SidebarFooter() {
  const router = useRouter();
  const { user } = useUser();

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

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

  // ✅ Unificado: icono desde un solo lugar
  const ProfileIcon = getUserIcon(user.iconId);

  return (
    <>
      <div className="px-4 py-4 border-t border-border/50">
        <div className="flex items-center gap-3">
          {/* Profile icon + name */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <ProfileIcon size={32} className="text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground flex-1 truncate">
              {user.name || user.email}
            </span>
          </div>

          {/* ✅ Campana solo admins (tu cambio de notificaciones vive aquí dentro) */}
          {user.role === "admin" && <NotificationsBell />}

          {/* Three-dots dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-accent/50"
                aria-label="Opciones de perfil"
                type="button"
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

      {/* Dialogs */}
      <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} onConfirm={confirmLogout} />
      <EditProfileDialog open={editProfileOpen} onOpenChange={setEditProfileOpen} />
    </>
  );
}