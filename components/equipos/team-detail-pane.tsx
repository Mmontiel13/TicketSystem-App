"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { IconUserId } from "@/lib/user-context";
import { getUserIcon } from "@/lib/user-icons";
import { getTeamIcon } from "@/lib/team-icons";
import { ResponsiveIcon } from "@/components/responsive-icon";
import type { EditingUser, Team } from "./types";
import { closeButtonClass, primaryButtonClass } from "./ui-classes";

export function TeamDetailPane({
  team,
  isAdmin,
  onEdit,
  onDeleteTeam,
  onMemberAdded,
  onMemberRemove,
  onEditMember,
  deletingMemberId,
  isSavingMember,
  onClose,
}: {
  team: Team;
  isAdmin: boolean;
  onEdit: () => void;
  onDeleteTeam: () => void;
  onMemberAdded: (
    teamId: number,
    name: string,
    email: string,
    iconId: IconUserId,
  ) => Promise<{ success: boolean; password?: string; message: string }>;
  onMemberRemove: (teamId: number, memberId: string | number) => Promise<void>;
  onEditMember: (member: EditingUser) => void;
  deletingMemberId?: number | null;
  isSavingMember?: boolean;
  onClose?: () => void;
}) {
  const Icon = getTeamIcon(team.iconId);

  return (
    <div className="h-full rounded-lg border border-border p-3 sm:p-5 flex flex-col bg-card min-h-0">
      {onClose && (
        <button
          onClick={onClose}
          className={cn(closeButtonClass, "absolute top-2 right-2 sm:hidden")}
          aria-label="Cerrar panel"
          type="button"
        >
          <X size={16} />
        </button>
      )}

      <div className="flex flex-col items-center mb-4 sm:mb-6">
        <p className="text-muted-foreground text-xs mb-2 self-start">Equipo:</p>
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-border bg-muted flex items-center justify-center mb-2">
          <ResponsiveIcon icon={Icon} smSize={28} mdSize={36} className="text-foreground" />
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3 mb-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onEdit}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-xs transition-colors"
              type="button"
            >
              <Pencil size={11} />
              Editar
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDeleteTeam}
              className="flex items-center gap-1 text-destructive hover:text-destructive/80 text-xs transition-colors"
              type="button"
            >
              <Trash2 size={11} />
              Eliminar
            </motion.button>
          </div>
        )}

        <p className="text-foreground font-semibold text-sm">{team.area}</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <p className="text-muted-foreground text-xs font-medium mb-3">Integrantes:</p>

        <div className="flex flex-col gap-2 sm:gap-4">
          {team.members
            .filter((m) => m.isActive)
            .map((m) => {
              const IconUser = getUserIcon(m.iconId);

              return (
                <div
                  key={m.id}
                  className="rounded-lg sm:rounded-xl border border-border bg-muted/50 backdrop-blur-sm p-2 sm:p-3 min-w-0"
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                      <ResponsiveIcon icon={IconUser} smSize={12} mdSize={18} className="text-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-foreground text-xs sm:text-sm font-semibold truncate">{m.full_name ?? m.name}</p>
                      <p className="text-muted-foreground text-[10px] sm:text-xs truncate">{m.email}</p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-1 sm:gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onEditMember({
                          id: m.id,
                          full_name: m.full_name ?? m.name,
                          email: m.email,
                          avatar_icon: m.iconId,
                        })
                      }
                      className="rounded-md border border-border bg-transparent px-2 py-1 text-[10px] sm:text-xs font-medium text-foreground hover:bg-muted flex-1 sm:flex-none"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => onMemberRemove(team.id, m.id)}
                      disabled={deletingMemberId === m.id}
                      className={cn(
                        "rounded-md border px-2 py-1 text-[10px] sm:text-xs font-medium flex-1 sm:flex-none transition-colors",
                        "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20",
                        deletingMemberId === m.id && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      {deletingMemberId === m.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {isAdmin && (
        <div className="mt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onEditMember({ id: 0, full_name: "", email: "", avatar_icon: "Ghost" })}
            className={cn(primaryButtonClass, "w-full text-xs sm:text-sm")}
            type="button"
            disabled={isSavingMember}
          >
            <Plus size={14} />
            {isSavingMember ? "Agregando..." : "Agregar"}
          </motion.button>
        </div>
      )}
    </div>
  );
}