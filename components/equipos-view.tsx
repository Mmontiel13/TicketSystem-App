"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  ShoppingCart,
  Code2,
  TrendingUp,
  Eye,
  EyeOff,
  Plus,
  UserCircle,
  Pencil,
  Server,
  Wifi,
  Monitor,
  Cpu,
  Database,
  HardDrive,
  Globe,
  Shield,
  Printer,
  Settings,
  Ghost,
  Rose,
  Rabbit,
  Fish,
  Cat,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/user-context";

/* ─── Icon picker config ────────────────────────────────────────────────────── */

const TEAM_ICONS = [
  { id: "TrendingUp", icon: TrendingUp },
  { id: "Code2", icon: Code2 },
  { id: "ShoppingCart", icon: ShoppingCart },
  { id: "Users", icon: Users },
  { id: "Server", icon: Server },
  { id: "Wifi", icon: Wifi },
  { id: "Monitor", icon: Monitor },
  { id: "Cpu", icon: Cpu },
  { id: "Database", icon: Database },
  { id: "HardDrive", icon: HardDrive },
  { id: "Globe", icon: Globe },
  { id: "Shield", icon: Shield },
  { id: "Printer", icon: Printer },
  { id: "Settings", icon: Settings },
] as const;

const USER_ICONS = [
  { id: "Ghost", icon: Ghost },
  { id: "Rose", icon: Rose },
  { id: "Rabbit", icon: Rabbit },
  { id: "Users", icon: Users },
  { id: "Fish", icon: Fish },
  { id: "Cat", icon: Cat },
] as const;

type IconId = (typeof TEAM_ICONS)[number]["id"];
type IconUserId = (typeof USER_ICONS)[number]["id"];

type EditingUser = {
  id: number;
  full_name: string;
  email: string;
  avatar_icon: IconUserId;
};

function iconById(id: IconId) {
  return TEAM_ICONS.find((i) => i.id === id)?.icon ?? Users;
}

function iconByUserId(id: IconUserId) {
  return USER_ICONS.find((i) => i.id === id)?.icon ?? Users;
}

/* ─── Types ─────────────────────────────────────────────────────────────────── */

type TeamMember = {
  id: number;
  name: string;
  full_name?: string;
  email: string;
  iconId: IconUserId;
  role: "user" | "admin";
  isActive: boolean;
  deletedAt: Date | null;
};

interface Team {
  id: number;
  name: string;
  area: string;
  iconId: IconId;
  members: TeamMember[];
}

/* ─── Mock data ─────────────────────────────────────────────────────────────── */

const INITIAL_TEAMS: Team[] = [
  {
    id: 1,
    name: "Equipo de Ventas",
    area: "Ventas",
    iconId: "TrendingUp",
    members: [
      {
        id: 1,
        name: "Andrea López",
        email: "andrea.ventas@asiatech.com",
        iconId: "Ghost",
        role: "user",
        isActive: true,
        deletedAt: null,
      },
      {
        id: 2,
        name: "Carlos Martín",
        email: "carlos.ventas@asiatech.com",
        iconId: "Fish",
        role: "user",
        isActive: true,
        deletedAt: null,
      },
    ],
  },
  {
    id: 2,
    name: "Equipo de Programación",
    area: "Programación",
    iconId: "Code2",
    members: [
      {
        id: 1,
        name: "Lucía Torres",
        email: "lucia.programacion@asiatech.com",
        iconId: "Rose",
        role: "user",
        isActive: true,
        deletedAt: null,
      },
      {
        id: 2,
        name: "Javier Pérez",
        email: "javier.programacion@asiatech.com",
        iconId: "Users",
        role: "user",
        isActive: true,
        deletedAt: null,
      },
      {
        id: 3,
        name: "María Gómez",
        email: "maria.programacion@asiatech.com",
        iconId: "Cat",
        role: "user",
        isActive: true,
        deletedAt: null,
      },
    ],
  },
  {
    id: 3,
    name: "Equipo de Compras",
    area: "Compras",
    iconId: "ShoppingCart",
    members: [
      {
        id: 1,
        name: "Fernanda Silva",
        email: "fernanda.compras@asiatech.com",
        iconId: "Fish",
        role: "user",
        isActive: true,
        deletedAt: null,
      },
      {
        id: 2,
        name: "Diego Ramírez",
        email: "diego.compras@asiatech.com",
        iconId: "Rabbit",
        role: "user",
        isActive: true,
        deletedAt: null,
      },
    ],
  },
  {
    id: 4,
    name: "Equipo de Infraestructura",
    area: "Infra",
    iconId: "Server",
    members: [
      {
        id: 1,
        name: "Pedro Soto",
        email: "pedro.infra@asiatech.com",
        iconId: "Ghost",
        role: "user",
        isActive: true,
        deletedAt: null,
      },
      {
        id: 2,
        name: "Alicia Bravo",
        email: "alicia.infra@asiatech.com",
        iconId: "Rose",
        role: "user",
        isActive: true,
        deletedAt: null,
      },
      {
        id: 3,
        name: "Luis Navarro",
        email: "luis.infra@asiatech.com",
        iconId: "Cat",
        role: "user",
        isActive: true,
        deletedAt: null,
      },
    ],
  },
];

/* ─── Shared UI class helpers ──────────────────────────────────────────────── */

const inputClass =
  "w-full rounded-md border border-input bg-background text-foreground text-sm px-3 py-2 outline-none " +
  "placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring focus:border-ring transition-colors";

const primaryButtonClass =
  "flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm px-4 py-2 " +
  "hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const modalSurfaceClass =
  "fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border p-6 shadow-2xl " +
  "bg-popover/90 backdrop-blur-xl text-popover-foreground";

/* ─── Icon Grid Picker ──────────────────────────────────────────────────────── */

function IconPicker({
  selected,
  onSelect,
}: {
  selected: IconId;
  onSelect: (id: IconId) => void;
}) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {TEAM_ICONS.map(({ id, icon: Icon }) => (
        <motion.button
          key={id}
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => onSelect(id)}
          className={cn(
            "w-9 h-9 rounded-md flex items-center justify-center border transition-colors",
            selected === id
              ? "bg-primary text-primary-foreground border-border"
              : "bg-muted text-muted-foreground border-border hover:text-foreground hover:bg-accent"
          )}
          aria-label={id}
          aria-pressed={selected === id}
        >
          <Icon size={16} className={selected === id ? "text-primary-foreground" : ""} />
        </motion.button>
      ))}
    </div>
  );
}

/* ─── Team modal (create + edit) ────────────────────────────────────────────── */

function TeamModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: Team;
  onClose: () => void;
  onSave: () => Promise<void>;
}) {
  const [teamName, setTeamName] = useState(initial?.area ?? "");
  const [selectedIcon, setSelectedIcon] = useState<IconId>(initial?.iconId ?? "Users");
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();
  const isEdit = !!initial;

  async function handleSubmit() {
    if (!teamName.trim()) return;

    setIsSaving(true);
    try {
      if (isEdit && initial?.id != null) {
        const { error } = await supabase
          .from("teams")
          .update({ name: `Equipo de ${teamName}`, icon_id: selectedIcon })
          .eq("id", initial.id)
          .eq("is_active", true);

        if (error) {
          console.error("Error al actualizar el equipo", error);
          return;
        }
      } else {
        const { error } = await supabase
          .from("teams")
          .insert([{ name: `Equipo de ${teamName}`, icon_id: selectedIcon, is_active: true }]);

        if (error) {
          console.error("Error al crear el equipo", error);
          return;
        }
      }

      await onSave();
      onClose();
    } catch (error) {
      console.error("Error en al guardar el equipo", error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        className={cn(modalSurfaceClass, "w-[360px]")}
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Editar equipo" : "Agregar equipo nuevo"}
      >
        <h2 className="text-foreground font-semibold text-base mb-1">
          {isEdit ? "Editando equipo" : "Agregando un equipo nuevo"}
        </h2>
        <p className="text-muted-foreground text-xs mb-5">
          {isEdit ? "Modifica los datos del equipo" : "Configura el nombre y el icono del equipo"}
        </p>

        {/* Icon picker */}
        <div className="flex flex-col items-center mb-5 gap-2">
          <div className="w-16 h-16 rounded-xl border border-border bg-muted flex items-center justify-center">
            {(() => {
              const Icon = iconById(selectedIcon);
              return <Icon size={30} className="text-foreground" />;
            })()}
          </div>
          <span className="text-muted-foreground text-xs">Selecciona un icono</span>
          <IconPicker selected={selectedIcon} onSelect={setSelectedIcon} />
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-muted-foreground text-xs">Nombre del Equipo/Area</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Equipo"
              className={inputClass}
            />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          className={cn(primaryButtonClass, "mt-5 w-full")}
          type="button"
          disabled={isSaving}
        >
          <Plus size={14} />
          {isSaving ? (isEdit ? "Guardando cambios..." : "Agregando...") : isEdit ? "Guardar cambios" : "Agregar"}
        </motion.button>
      </motion.div>
    </>
  );
}

/* ─── Add Member Modal ─────────────────────────────────────────────────────── */

function sendWelcomeEmail(userEmail: string, generatedPassword: string) {
  console.info("Enviando correo de bienvenida:", {
    to: userEmail,
    password: generatedPassword,
  });
  // Stub - integration point
}

function generateRandomPassword(length = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

function UserIconPicker({ selected, onSelect }: { selected: IconUserId; onSelect: (id: IconUserId) => void }) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {USER_ICONS.map(({ id, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          className={cn(
            "w-9 h-9 rounded-md flex items-center justify-center border transition-colors",
            selected === id
              ? "bg-primary text-primary-foreground border-border"
              : "bg-muted text-muted-foreground border-border hover:text-foreground hover:bg-accent"
          )}
          aria-label={id}
          aria-pressed={selected === id}
        >
          <Icon size={16} className={selected === id ? "text-primary-foreground" : ""} />
        </button>
      ))}
    </div>
  );
}

function AddMemberModal({
  onClose,
  onAdd,
  onUpdate,
  initialUser,
  members = [],
}: {
  onClose: () => void;
  onAdd: (name: string, email: string, iconId: IconUserId) => Promise<{ success: boolean; password?: string; message: string }>;
  onUpdate: (userId: number, name: string, email: string, iconId: IconUserId) => Promise<{ success: boolean; message: string }>;
  initialUser?: EditingUser;
  members?: TeamMember[];
}) {
  const isEditMode = !!initialUser;
  const [memberName, setMemberName] = useState(initialUser?.full_name ?? "");
  const [memberEmail, setMemberEmail] = useState(initialUser?.email ?? "");
  const [selectedIcon, setSelectedIcon] = useState<IconUserId>(initialUser?.avatar_icon ?? "Users");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit() {
    if (!memberName.trim() || !memberEmail.trim()) return;

    const trimmedEmail = memberEmail.trim().toLowerCase();

    // Frontend validation: check if email already exists
    const emailExists = members.some((m) => {
      const existingEmail = m.email.toLowerCase();
      // For edit mode, ignore the current user's email
      if (isEditMode && initialUser && m.id === initialUser.id) {
        return false;
      }
      return existingEmail === trimmedEmail;
    });

    if (emailExists) {
      setFeedback("Este correo ya está registrado en otro usuario.");
      setIsSuccess(false);
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    setIsSuccess(false);
    setCreatedPassword(null);

    try {
      if (isEditMode && initialUser) {
        const result = await onUpdate(initialUser.id, memberName.trim(), trimmedEmail, selectedIcon);
        if (!result.success) {
          setFeedback(result.message || "No se pudo actualizar el miembro.");
          return;
        }
        setFeedback(result.message);
        setIsSuccess(true);
      } else {
        const result = await onAdd(memberName.trim(), trimmedEmail, selectedIcon);
        if (!result.success) {
          setFeedback(result.message || "No se pudo agregar el miembro.");
          return;
        }
        setFeedback(result.message);
        setCreatedPassword(result.password ?? null);
        setIsSuccess(true);
      }
    } catch (error) {
      console.error(isEditMode ? "Error al actualizar integrante" : "Error al agregar integrante", error);
      setFeedback(isEditMode ? "Error desconocido al actualizar integrante." : "Error desconocido al agregar integrante.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        className={cn(modalSurfaceClass, "w-[360px]")}
        role="dialog"
        aria-modal="true"
        aria-label={isEditMode ? "Editar integrante" : "Agregar integrante"}
      >
        <h2 className="text-foreground font-semibold text-base mb-1">
          {isEditMode ? "Editando integrante" : "Agregando un integrante"}
        </h2>
        <p className="text-muted-foreground text-xs mb-5">
          {isEditMode ? "Actualiza los datos del integrante." : "Cada integrante tendrá credenciales individuales y acceso controlado."}
        </p>

        <div className="flex flex-col gap-1 mb-3">
          <label className="text-muted-foreground text-xs">Nombre completo</label>
          <input
            type="text"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            placeholder="Nombre completo"
            className={inputClass}
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1 mb-3">
          <label className="text-muted-foreground text-xs">Email</label>
          <input
            type="email"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1 mb-4">
          <label className="text-muted-foreground text-xs">Icono de usuario</label>
          <UserIconPicker selected={selectedIcon} onSelect={setSelectedIcon} />
        </div>

        {feedback && (
          <div
            className={cn(
              "mb-3 rounded-md px-3 py-2 text-sm",
              isSuccess ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            )}
          >
            {feedback}
          </div>
        )}

        {isSuccess && createdPassword && (
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Contraseña temporal:</span>
            <code className="rounded bg-muted px-2 py-1 text-xs">{createdPassword}</code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(createdPassword)}
              className="text-xs text-primary hover:underline"
            >
              Copiar
            </button>
          </div>
        )}

        {isSuccess ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className={cn(primaryButtonClass, "w-full")}
            type="button"
          >
            Cerrar
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            className={cn(primaryButtonClass, "w-full")}
            type="button"
            disabled={isSaving}
          >
            <Plus size={14} />
            {isSaving
              ? isEditMode
                ? "Actualizando..."
                : "Agregando..."
              : isEditMode
                ? "Guardar cambios"
                : "Agregar"}
          </motion.button>
        )}
      </motion.div>
    </>
  );
}

/* ─── Team card ─────────────────────────────────────────────────────────────── */

function TeamCard({
  team,
  active,
  onClick,
}: {
  team: Team;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = iconById(team.iconId);

  return (
    <motion.button
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-5 py-4 rounded-lg border text-left transition-colors",
        "border-border bg-card hover:bg-accent/60",
        active && "bg-accent"
      )}
      type="button"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-md bg-muted border border-border flex items-center justify-center shrink-0">
          <Icon size={20} className="text-foreground" />
        </div>
        <span className="text-foreground text-sm font-medium">{team.name}</span>
      </div>

      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Users size={14} />
        <span>Integrantes:</span>
        <span className="text-foreground font-semibold">{team.members.filter((m) => m.isActive).length}</span>
      </div>
    </motion.button>
  );
}

/* ─── Detail pane ───────────────────────────────────────────────────────────── */

function TeamDetailPane({
  team,
  isAdmin,
  onEdit,
  onMemberAdded,
  onMemberRemove,
  onEditMember,
  deletingMemberId,
  isSavingMember,
}: {
  team: Team;
  isAdmin: boolean;
  onEdit: () => void;
  onMemberAdded: (teamId: number, name: string, email: string, iconId: IconUserId) => Promise<{ success: boolean; password?: string; message: string }>;
  onMemberRemove: (teamId: number, memberId: number) => Promise<void>;
  onEditMember: (member: EditingUser) => void;
  deletingMemberId?: number | null;
  isSavingMember?: boolean;
}) {
  const Icon = iconById(team.iconId);

  return (
    <div className="h-full rounded-lg border border-border p-5 flex flex-col bg-card min-h-0">
      <div className="flex flex-col items-center mb-6">
        <p className="text-muted-foreground text-xs mb-2 self-start">Equipo:</p>
        <div className="w-20 h-20 rounded-xl border border-border bg-muted flex items-center justify-center mb-2">
          <Icon size={36} className="text-foreground" />
        </div>

        {isAdmin && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEdit}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-xs transition-colors mb-1"
            type="button"
          >
            <Pencil size={11} />
            Editar Equipo
          </motion.button>
        )}

        <p className="text-foreground font-semibold text-sm">{team.area}</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <p className="text-muted-foreground text-xs font-medium mb-3">Integrantes:</p>
        <div className="flex flex-col gap-4">
          {team.members
            .filter((m) => m.isActive)
            .map((m) => {
              const IconUser = iconByUserId(m.iconId);
              return (
                <div
                  key={m.id}
                  className="rounded-xl border border-border bg-white/10 backdrop-blur-sm p-3 min-w-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                      <IconUser size={18} className="text-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-foreground text-sm font-semibold truncate">{m.full_name ?? m.name}</p>
                      <p className="text-muted-foreground text-xs truncate max-w-[240px]">{m.email}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onEditMember({
                          id: m.id,
                          full_name: m.full_name ?? m.name,
                          email: m.email,
                          avatar_icon: m.iconId,
                        });
                      }}
                      className="rounded-md border border-border bg-transparent px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onMemberRemove(team.id, m.id)}
                      disabled={deletingMemberId === m.id}
                      className={cn(
                        "rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100",
                        deletingMemberId === m.id ? "opacity-50 cursor-not-allowed" : ""
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
            onClick={() => onEditMember({ id: 0, full_name: "", email: "", avatar_icon: "Users" })}
            className={cn(primaryButtonClass, "w-full")}
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

/* ─── Main View ──────────────────────────────────────────────────────────────── */

export function EquiposView() {
  const { user, addUser, deactivateUser } = useUser();
  const isAdmin = user.role === "admin";
  const supabase = createClient();

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

  const refreshTeams = async () => {
    setIsLoadingTeams(true);
    try {
      const [teamsResult, usersResult] = await Promise.all([
        supabase.from("teams").select("id, name, icon_id").eq("is_active", true),
        supabase
          .from("users")
          .select("id, full_name, email, role, avatar_icon, team_id")
          .eq("is_active", true),
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
      usersResult.data?.forEach((user) => {
        if (!user.team_id) return;
        const existing = membersByTeam.get(user.team_id) ?? [];
        membersByTeam.set(user.team_id, [
          ...existing,
          {
            id: user.id,
            name: user.full_name,
            full_name: user.full_name,
            email: user.email,
            iconId: (user.avatar_icon as IconUserId) || "Users",
            role: (user.role as "user" | "admin") || "user",
            isActive: true,
            deletedAt: null,
          },
        ]);
      });

      if (teamsResult.data) {
        const normalized = teamsResult.data.map((team) => ({
          id: team.id,
          name: team.name ?? "",
          area: team.name ?? "",
          iconId: (team.icon_id as IconId) || "Users",
          members: membersByTeam.get(team.id) ?? [],
        }));

        setTeams(normalized);
        if (!activeTeamId && normalized.length > 0) {
          setActiveTeamId(normalized[0].id);
        }
      }
    } catch (error) {
      console.error("Error al refrescar equipos", error);
    } finally {
      setIsLoadingTeams(false);
    }
  };

  useEffect(() => {
    refreshTeams();
  }, [supabase]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <h2 className="text-xl font-semibold text-foreground">Acceso denegado</h2>
          <p className="text-muted-foreground">
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
      iconId: "Users" as IconId,
      members: [],
    } as Team);

  async function deleteUser(userId: number) {
    const { error } = await supabase.from("users").update({ is_active: false }).eq("id", userId);
    if (error) {
      console.error("Error al desactivar usuario", error);
      throw error;
    }
  }

  async function handleUpdateMember(userId: number, memberName: string, memberEmail: string, memberIcon: IconUserId): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: memberName,
          email: memberEmail,
          avatar_icon: memberIcon,
        })
        .eq("id", userId)
        .select();

      if (error) {
        console.error("Error al actualizar miembro", error);
        // Handle unique constraint violation on email
        if (error.code === "23505") {
          return { success: false, message: "Este correo ya está registrado en otro usuario." };
        }
        return { success: false, message: "Error al actualizar miembro. Revisa la consola." };
      }

      // Refresh to get updated data
      await refreshTeams();

      return { success: true, message: "Miembro actualizado correctamente." };
    } catch (error) {
      console.error("Error al actualizar integrante", error);
      return { success: false, message: "Error desconocido al actualizar integrante." };
    }
  }

  async function handleMemberAdded(teamId: number, memberName: string, memberEmail: string, memberIcon: IconUserId): Promise<{ success: boolean; password?: string; message: string }> {
    setIsSavingMember(true);
    setStatusMessage(null);
    const generatedPassword = generateRandomPassword(8);

    try {
      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            full_name: memberName,
            email: memberEmail,
            password: generatedPassword, // TODO: hash this password before storing in production
            avatar_icon: memberIcon,
            team_id: teamId,
            role: "user",
            is_active: true,
          },
        ])
        .select();

      if (error) {
        console.error("Error al agregar miembro:", error);
        // Handle unique constraint violation on email
        if (error.code === "23505") {
          return { success: false, message: "Este correo ya está registrado en otro usuario." };
        }
        const message = "Error al agregar miembro. Revisa la consola.";
        setStatusMessage(message);
        return { success: false, message };
      }

      const inserted = data?.[0];
      if (!inserted) {
        const message = "No se pudo agregar el miembro.";
        setStatusMessage(message);
        return { success: false, message };
      }

      // Auto-refresh teams + members after successful insert
      // Do NOT manually update state - refreshTeams will fetch from DB
      await refreshTeams();

      sendWelcomeEmail(memberEmail, generatedPassword);
      const successMessage = `Miembro agregado. Contraseña temporal: ${generatedPassword}`;

      addUser({
        id: inserted.id,
        name: inserted.full_name,
        email: inserted.email,
        password: generatedPassword,
        role: (inserted.role as "user" | "admin") || "user",
        iconId: (inserted.avatar_icon as IconUserId) || "Users",
      });

      return { success: true, password: generatedPassword, message: successMessage };
    } finally {
      setIsSavingMember(false);
    }
  }

  async function handleMemberRemove(teamId: number, memberId: number) {
    setDeletingMemberId(memberId);
    setStatusMessage(null);

    try {
      await deleteUser(memberId);

      setTeams((prev) =>
        prev.map((t) =>
          t.id === teamId
            ? {
                ...t,
                members: t.members.map((m) =>
                  m.id === memberId ? { ...m, isActive: false, deletedAt: new Date() } : m
                ),
              }
            : t
        )
      );

      deactivateUser(memberId);
      setStatusMessage("Miembro eliminado (lógico) correctamente.");
    } catch {
      setStatusMessage("Error al eliminar miembro. Revisa la consola.");
    } finally {
      setDeletingMemberId(null);
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <header className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-border shrink-0">
        <h1 className="text-foreground font-semibold text-lg">Equipos</h1>
        {isAdmin && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAddTeam(true)}
            className={primaryButtonClass}
            type="button"
          >
            <Plus size={14} />
            Crear nuevo
          </motion.button>
        )}
      </header>

      {statusMessage && (
        <div className="px-4 md:px-8 py-2 text-sm text-green-700 bg-green-100 border border-green-200">
          {statusMessage}
        </div>
      )}
      {isLoadingTeams ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">Cargando equipos...</div>
      ) : (
        <div className="flex flex-1 gap-4 p-4 md:p-6 overflow-hidden">
          {/* Left: team list */}
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              active={team.id === activeTeamId}
              onClick={() => setActiveTeamId(team.id)}
            />
          ))}
        </div>

        {/* Right: detail pane */}
        <div className="w-[200px] shrink-0 hidden sm:block">
          <TeamDetailPane
            team={activeTeam}
            isAdmin={isAdmin}
            onEdit={() => setEditingTeam(activeTeam)}
            onMemberAdded={handleMemberAdded}
            onMemberRemove={handleMemberRemove}
            onEditMember={(member) => {
              if (member.id === 0) {
                // Create mode
                setEditingMember(null);
              } else {
                // Edit mode
                setEditingMember(member);
              }
              setShowMemberModal(true);
            }}
            deletingMemberId={deletingMemberId}
            isSavingMember={isSavingMember}
          />
        </div>
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
    </div>
  );
}
