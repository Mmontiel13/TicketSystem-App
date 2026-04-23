"use client";

import { useState, useEffect } from "react";
import { Lock, Mail, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useUser } from "@/lib/user-context";
import { createClient } from "@/lib/supabase/client";
import { UserAvatarEditor } from "@/components/user-avatar-editor";
import { getUserIcon } from "@/lib/user-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function ConfiguracionView() {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchTeamName();
  }, []);

  async function fetchTeamName() {
    try {
      const supabase = createClient();
      if (!user.id) return;

      const { data: userData } = await supabase
        .from("users")
        .select("team_id")
        .eq("id", user.id)
        .single();

      if (userData?.team_id) {
        const { data: teamData } = await supabase
          .from("teams")
          .select("name")
          .eq("id", userData.team_id)
          .single();

        if (teamData) {
          setTeamName(teamData.name);
        }
      }
    } catch (error) {
      console.error("Error fetching team name:", error);
    }
  }

  async function handleChangePassword() {
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setPasswordLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setChangePasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
      setPasswordError("Error al cambiar la contraseña. Intenta de nuevo.");
    } finally {
      setPasswordLoading(false);
    }
  }

  // ✅ Unificado: usar el resolver central de iconos
  const UserIcon = getUserIcon(user.iconId);

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background h-16 flex items-center justify-center sm:justify-start px-3 sm:px-4 md:px-8 border-b border-border/50 shrink-0">
        <h1 className="text-foreground text-base sm:text-lg md:text-xl font-semibold text-center sm:text-left">
          Configuración
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 px-3 sm:px-4 md:px-8 py-4 sm:py-6 flex flex-col gap-4 sm:gap-6 overflow-y-auto">
        {/* User Profile & Account Information Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-border bg-card p-4 sm:p-6"
        >
          <h2 className="text-foreground font-semibold text-base sm:text-lg mb-6">
            Perfil de Usuario
          </h2>

          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 pb-6 border-b border-border/30">
            <div className="w-16 h-16 rounded-lg border border-border flex items-center justify-center bg-muted flex-shrink-0">
              <UserIcon size={32} className="text-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Avatar actual</p>
              <p className="text-foreground font-medium mt-1">
                {user.name || user.email}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setAvatarModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-colors whitespace-nowrap"
            >
              Cambiar Avatar
            </motion.button>
          </div>

          {/* User Information Fields */}
          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Nombre
              </label>
              <div className="mt-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                <p className="text-foreground text-sm">{user.name || user.email}</p>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Mail size={14} />
                Correo Electrónico
              </label>
              <div className="mt-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                <p className="text-foreground text-sm">{user.email}</p>
              </div>
            </div>

            {/* Team Field */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Users size={14} />
                Equipo
              </label>
              <div className="mt-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                <p className="text-foreground text-sm">
                  {teamName || "Sin equipo asignado"}
                </p>
              </div>
            </div>

            {/* Role Badge */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Rol
              </label>
              <div className="mt-2">
                <Badge
                  variant={user.role === "admin" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {user.role === "admin" ? "Administrador" : "Usuario"}
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security Section comentado temporalmente */}
        {/*
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-4 sm:p-6"
        >
          <h2 className="text-foreground font-semibold text-base sm:text-lg mb-4 flex items-center gap-2">
            <Lock size={18} />
            Seguridad
          </h2>
        </motion.div>
        */}
      </div>

      {/* Avatar Modal Dialog */}
      <Dialog open={avatarModalOpen} onOpenChange={setAvatarModalOpen}>
        <DialogContent className="rounded-xl bg-popover/90 backdrop-blur-xl border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Cambiar Avatar</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Selecciona un nuevo icono para tu avatar.
            </DialogDescription>
          </DialogHeader>

          <UserAvatarEditor showTitle={false} />

          <DialogFooter>
            <button
              onClick={() => setAvatarModalOpen(false)}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
            >
              Cerrar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="rounded-xl bg-popover/90 backdrop-blur-xl border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Cambiar Contraseña</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Ingresa una nueva contraseña segura para tu cuenta.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Password */}
            <div>
              <label
                htmlFor="current-password"
                className="text-sm font-medium text-foreground"
              >
                Contraseña Actual
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-2 w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="••••••••"
              />
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="new-password" className="text-sm font-medium text-foreground">
                Nueva Contraseña
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-2 w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="••••••••"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirm-password"
                className="text-sm font-medium text-foreground"
              >
                Confirmar Nueva Contraseña
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2 w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="••••••••"
              />
            </div>

            {/* Error Message */}
            {passwordError && (
              <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
                {passwordError}
              </div>
            )}
          </div>

          <DialogFooter>
            <button
              onClick={() => setChangePasswordOpen(false)}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleChangePassword}
              disabled={passwordLoading}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
            >
              {passwordLoading ? "Cambiando..." : "Cambiar Contraseña"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}