"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useUser, type IconUserId } from "@/lib/user-context";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";

import type { EditingUser, IconId, Team, TeamMember } from "./types";
import { primaryButtonClass } from "./ui-classes";
import { TeamCard } from "./team-card";
import { TeamDetailPane } from "./team-detail-pane";
import { TeamModal } from "./team-modal";
import { AddMemberModal } from "./add-member-modal";

export function EquiposView() {
  const { user, deactivateUser } = useUser();
  const { toast } = useToast();
  const isAdmin = user.role === "admin";
  const supabase = useMemo(() => createClient(), []);

  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [activeTeamId, setActiveTeamId] = useState<number | null>(null);

  const [showAddTeam, setShowAddTeam] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const [isSavingMember, setIsSavingMember] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [editingMember, setEditingMember] = useState<EditingUser | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showDetailPane, setShowDetailPane] = useState(false);

  const [confirmDeleteMember, setConfirmDeleteMember] = useState<{ teamId: number; member: TeamMember } | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);

  const [confirmDeleteTeam, setConfirmDeleteTeam] = useState<Team | null>(null);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);

  const refreshTeams = async () => {
    setIsLoadingTeams(true);
    try {
      const [teamsResult, usersResult] = await Promise.all([
        supabase.from("teams").select("id, name, icon_id").eq("is_active", true),
        supabase.from("users").select("id, full_name, email, role, avatar_icon, team_id").eq("is_active", true),
      ]);

      if (teamsResult.error) {
        console.error("Error al obtener equipos", teamsResult.error);
        return;
      }
      if (usersResult.error) {
        console.error("Error al obtener miembros", usersResult.error);
        return;
      }

      const membersByTeam = new Map<number, TeamMember[]>();
      usersResult.data?.forEach((userRow) => {
        if (!userRow.team_id) return;
        const existing = membersByTeam.get(userRow.team_id) ?? [];
        membersByTeam.set(userRow.team_id, [
          ...existing,
          {
            id: userRow.id,
            name: userRow.full_name,
            full_name: userRow.full_name,
            email: userRow.email,
            iconId: (userRow.avatar_icon as IconUserId) || "Ghost",
            role: (userRow.role as "user" | "admin") || "user",
            isActive: true,
            deletedAt: null,
          },
        ]);
      });

      if (teamsResult.data) {
        const normalized: Team[] = teamsResult.data.map((teamRow) => ({
          id: teamRow.id,
          name: teamRow.name ?? "",
          area: teamRow.name ?? "",
          iconId: (teamRow.icon_id as IconId) || ("BadgeDollarSign" as IconId),
          members: membersByTeam.get(teamRow.id) ?? [],
        }));

        setTeams(normalized);
        if (!activeTeamId && normalized.length > 0) setActiveTeamId(normalized[0].id);
      }
    } catch (error) {
      console.error("Error al refrescar equipos", error);
    } finally {
      setIsLoadingTeams(false);
    }
  };

  useEffect(() => {
    refreshTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen px-4">
        <div className="rounded-lg border border-border bg-card p-6 sm:p-8 text-center">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Acceso denegado</h2>
          <p className="text-muted-foreground text-sm mt-2">
            No tienes permisos suficientes para ver la sección de Equipos.
          </p>
        </div>
      </div>
    );
  }

  const activeTeam =
    teams.find((t) => t.id === activeTeamId) ??
    teams[0] ??
    ({
      id: 0,
      name: "Sin equipo",
      area: "",
      iconId: "BadgeDollarSign" as IconId,
      members: [],
    } as Team);

  async function deleteUser(userId: string | number) {
    const { error } = await supabase.from("users").update({ is_active: false }).eq("id", userId);
    if (error) {
      console.error("Error al desactivar usuario", error);
      throw error;
    }
  }

  async function handleUpdateMember(
    userId: string | number,
    memberName: string,
    memberEmail: string,
    memberIcon: IconUserId,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from("users")
        .update({ full_name: memberName, email: memberEmail, avatar_icon: memberIcon })
        .eq("id", userId)
        .select();

      if (error) {
        console.error("Error al actualizar miembro", error);
        if ((error as any).code === "23505") return { success: false, message: "Este correo ya está registrado en otro usuario." };
        return { success: false, message: "Error al actualizar miembro. Revisa la consola." };
      }

      await refreshTeams();
      return { success: true, message: "Miembro actualizado correctamente." };
    } catch (error) {
      console.error("Error al actualizar integrante", error);
      return { success: false, message: "Error desconocido al actualizar integrante." };
    }
  }

  async function handleMemberAdded(
    teamId: number,
    memberName: string,
    memberEmail: string,
    memberIcon: IconUserId,
  ): Promise<{ success: boolean; password?: string; message: string }> {
    setIsSavingMember(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: memberName, email: memberEmail, avatar_icon: memberIcon, team_id: teamId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const message = result.error || "Error al agregar miembro";
        setStatusMessage(message);
        return { success: false, message };
      }

      await refreshTeams();

      const successMessage = `Miembro agregado. Contraseña temporal: ${result.password}`;
      setStatusMessage(successMessage);
      return { success: true, password: result.password, message: successMessage };
    } catch (error) {
      console.error("Error al agregar miembro:", error);
      const message = "Error al agregar miembro";
      setStatusMessage(message);
      return { success: false, message };
    } finally {
      setIsSavingMember(false);
    }
  }

  async function handleMemberRemove(teamId: number, memberId: string | number) {
    const team = teams.find((t) => t.id === teamId);
    const member = team?.members.find((m) => m.id === memberId);
    if (member) setConfirmDeleteMember({ teamId, member });
  }

  async function confirmRemoveMember() {
    if (!confirmDeleteMember) return;

    const { teamId, member } = confirmDeleteMember;
    const memberId = member.id;

    setIsDeletingMember(true);
    setDeletingMemberId(typeof memberId === "number" ? memberId : Number(memberId));
    setStatusMessage(null);

    try {
      await deleteUser(memberId);

      setTeams((prev) =>
        prev.map((t) =>
          t.id === teamId
            ? { ...t, members: t.members.map((m) => (m.id === memberId ? { ...m, isActive: false, deletedAt: new Date() } : m)) }
            : t,
        ),
      );

      const parsed = typeof memberId === "number" ? memberId : Number(memberId);
      if (!Number.isNaN(parsed)) deactivateUser(parsed);

      setStatusMessage("Miembro eliminado correctamente.");
      toast({ title: "Miembro eliminado", description: "El integrante fue eliminado correctamente." });
    } catch {
      setStatusMessage("Error al eliminar miembro. Revisa la consola.");
      toast({ title: "Error al eliminar", description: "No se pudo eliminar el miembro.", variant: "destructive" });
    } finally {
      setDeletingMemberId(null);
      setIsDeletingMember(false);
      setConfirmDeleteMember(null);
    }
  }

  function handleTeamRemove() {
    if (activeTeam && activeTeam.id !== 0) setConfirmDeleteTeam(activeTeam);
  }

  async function confirmRemoveTeam() {
    if (!confirmDeleteTeam) return;
    setIsDeletingTeam(true);

    try {
      const { error: teamError } = await supabase.from("teams").update({ is_active: false }).eq("id", confirmDeleteTeam.id);
      if (teamError) {
        console.error("Error al desactivar equipo", teamError);
        toast({ title: "Error al eliminar equipo", description: "No se pudo eliminar el equipo.", variant: "destructive" });
        return;
      }

      const activeMembers = confirmDeleteTeam.members.filter((m) => m.isActive);
      if (activeMembers.length > 0) {
        const memberIds = activeMembers.map((m) => m.id);
        const { error: membersError } = await supabase.from("users").update({ is_active: false }).in("id", memberIds);
        if (membersError) console.error("Error al desactivar miembros del equipo", membersError);

        activeMembers.forEach((m) => {
          const parsed = typeof m.id === "number" ? m.id : Number(m.id);
          if (!Number.isNaN(parsed)) deactivateUser(parsed);
        });
      }

      setTeams((prev) => prev.filter((t) => t.id !== confirmDeleteTeam.id));

      if (activeTeamId === confirmDeleteTeam.id) {
        const remaining = teams.filter((t) => t.id !== confirmDeleteTeam.id);
        setActiveTeamId(remaining.length > 0 ? remaining[0].id : null);
      }

      setShowDetailPane(false);
      toast({ title: "Equipo eliminado", description: `"${confirmDeleteTeam.name}" fue eliminado correctamente.` });
    } catch (error) {
      console.error("Error al eliminar equipo", error);
      toast({ title: "Error al eliminar equipo", description: "Ocurrió un error inesperado.", variant: "destructive" });
    } finally {
      setIsDeletingTeam(false);
      setConfirmDeleteTeam(null);
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <header className="h-16 relative flex items-center justify-center sm:justify-between px-3 sm:px-4 md:px-8 border-b border-border/50 shrink-0 gap-2">
        <h1 className="text-foreground font-semibold text-base sm:text-lg text-center sm:text-left">Equipos</h1>

        {isAdmin && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAddTeam(true)}
            className={cn(primaryButtonClass, "absolute right-3 sm:right-4 md:right-8 sm:relative sm:right-auto text-xs sm:text-sm px-3 sm:px-4")}
            type="button"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Crear nuevo</span>
            <span className="sm:hidden">Nuevo</span>
          </motion.button>
        )}
      </header>

      {statusMessage && (
        <div className="px-3 sm:px-4 md:px-8 py-2 text-xs sm:text-sm text-green-700 dark:text-green-300 bg-green-500/10 border border-green-600/30 dark:border-green-700/50">
          {statusMessage}
        </div>
      )}

      {isLoadingTeams ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">Cargando equipos...</div>
      ) : (
        <div className="flex flex-1 gap-2 sm:gap-4 p-2 sm:p-4 md:p-6 overflow-hidden">
          <div className="flex-1 flex flex-col gap-2 sm:gap-3 overflow-y-auto pr-1">
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                active={team.id === activeTeamId}
                onClick={() => {
                  setActiveTeamId(team.id);
                  setShowDetailPane(true);
                }}
              />
            ))}
          </div>

          <div className="w-48 sm:w-64 lg:w-80 shrink-0 hidden lg:block">
            <TeamDetailPane
              team={activeTeam}
              isAdmin={isAdmin}
              onEdit={() => setEditingTeam(activeTeam)}
              onDeleteTeam={handleTeamRemove}
              onMemberAdded={handleMemberAdded}
              onMemberRemove={handleMemberRemove}
              onEditMember={(member) => {
                setEditingMember(member.id === 0 ? null : member);
                setShowMemberModal(true);
              }}
              deletingMemberId={deletingMemberId}
              isSavingMember={isSavingMember}
            />
          </div>

          <AnimatePresence>
            {showDetailPane && (
              <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed inset-0 z-40 lg:hidden bg-black/40 flex flex-col">
                <div className="flex-1 overflow-auto bg-background">
                  <div className="p-4 relative">
                    <TeamDetailPane
                      team={activeTeam}
                      isAdmin={isAdmin}
                      onEdit={() => setEditingTeam(activeTeam)}
                      onDeleteTeam={handleTeamRemove}
                      onMemberAdded={handleMemberAdded}
                      onMemberRemove={handleMemberRemove}
                      onEditMember={(member) => {
                        setEditingMember(member.id === 0 ? null : member);
                        setShowMemberModal(true);
                      }}
                      deletingMemberId={deletingMemberId}
                      isSavingMember={isSavingMember}
                      onClose={() => setShowDetailPane(false)}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {(showAddTeam || editingTeam) && (
          <TeamModal
            initial={editingTeam ?? undefined}
            onClose={() => {
              setShowAddTeam(false);
              setEditingTeam(null);
            }}
            onSave={refreshTeams}
          />
        )}

        {showMemberModal && (
          <AddMemberModal
            onClose={() => {
              setShowMemberModal(false);
              setEditingMember(null);
            }}
            onAdd={(name, email, iconId) => handleMemberAdded(activeTeam.id, name, email, iconId)}
            onUpdate={handleUpdateMember}
            initialUser={editingMember ?? undefined}
            members={activeTeam.members}
          />
        )}
      </AnimatePresence>

      <ConfirmDeleteModal
        open={!!confirmDeleteMember}
        title="¿Eliminar este integrante?"
        description={`Se eliminará a "${confirmDeleteMember?.member.full_name ?? confirmDeleteMember?.member.name ?? ""}". Perderá acceso al sistema. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar integrante"
        isLoading={isDeletingMember}
        onConfirm={confirmRemoveMember}
        onCancel={() => setConfirmDeleteMember(null)}
      />

      <ConfirmDeleteModal
        open={!!confirmDeleteTeam}
        title="¿Eliminar este equipo?"
        // NOTA: aquí vuelve a poner tu description completa (en tu archivo original está cortada en el output)
        description={`Se eliminará "${confirmDeleteTeam?.name ?? ""}" y todos sus integrantes (${confirmDeleteTeam?.members.filter((m) => m.isActive).length ?? 0}) perderán acceso al sistema.`}
        confirmLabel="Eliminar equipo"
        isLoading={isDeletingTeam}
        onConfirm={confirmRemoveTeam}
        onCancel={() => setConfirmDeleteTeam(null)}
      />
    </div>
  );
}