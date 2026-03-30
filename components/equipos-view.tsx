"use client";

import { useState } from "react";
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
  onSave: (name: string, iconId: IconId) => void;
}) {
  const [teamName, setTeamName] = useState(initial?.area ?? "");
  const [selectedIcon, setSelectedIcon] = useState<IconId>(initial?.iconId ?? "Users");
  const isEdit = !!initial;

  function handleSubmit() {
    if (!teamName.trim()) return;
    onSave(teamName.trim(), selectedIcon);
    onClose();
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
        >
          <Plus size={14} />
          {isEdit ? "Guardar cambios" : "Agregar"}
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
}: {
  onClose: () => void;
  onAdd: (name: string, email: string, iconId: IconUserId) => void;
}) {
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<IconUserId>("Users");

  function handleSubmit() {
    if (!memberName.trim() || !memberEmail.trim()) return;
    onAdd(memberName.trim(), memberEmail.trim(), selectedIcon);
    onClose();
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
        aria-label="Agregar integrante"
      >
        <h2 className="text-foreground font-semibold text-base mb-1">Agregando un integrante</h2>
        <p className="text-muted-foreground text-xs mb-5">
          Cada integrante tendrá credenciales individuales y acceso controlado.
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

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          className={cn(primaryButtonClass, "w-full")}
          type="button"
        >
          <Plus size={14} />
          Agregar
        </motion.button>
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
      whileHover={{ scale: 1.01 }}
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
}: {
  team: Team;
  isAdmin: boolean;
  onEdit: () => void;
  onMemberAdded: (teamId: number, name: string, email: string, iconId: IconUserId) => void;
  onMemberRemove: (teamId: number, memberId: number) => void;
}) {
  const [showAddMember, setShowAddMember] = useState(false);
  const Icon = iconById(team.iconId);

  return (
    <div className="h-full rounded-lg border border-border p-5 flex flex-col bg-card">
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

      <div className="flex-1">
        <p className="text-muted-foreground text-xs font-medium mb-3">Integrantes:</p>
        <div className="flex flex-col gap-1">
          {team.members
            .filter((m) => m.isActive)
            .map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 py-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center">
                    {(() => {
                      const IconUser = iconByUserId(m.iconId);
                      return <IconUser size={16} className="text-foreground" />;
                    })()}
                  </div>
                  <div>
                    <p className="text-foreground text-sm">{m.name}</p>
                    <p className="text-muted-foreground text-xs">{m.email}</p>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => onMemberRemove(team.id, m.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}
        </div>
      </div>

      {isAdmin && (
        <div className="mt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAddMember(true)}
            className={cn(primaryButtonClass, "w-full")}
            type="button"
          >
            <Plus size={14} />
            Agregar
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {showAddMember && (
          <AddMemberModal
            onClose={() => setShowAddMember(false)}
            onAdd={(name, email, iconId) => {
              onMemberAdded(team.id, name, email, iconId);
              setShowAddMember(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main View ──────────────────────────────────────────────────────────────── */

export function EquiposView() {
  const { user, addUser, deactivateUser } = useUser();
  const isAdmin = user.role === "admin";

  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);

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
  const [activeTeamId, setActiveTeamId] = useState<number>(2);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const activeTeam = teams.find((t) => t.id === activeTeamId) ?? teams[0];

  function handleSaveTeam(name: string, iconId: IconId) {
    if (editingTeam) {
      setTeams((prev) =>
        prev.map((t) =>
          t.id === editingTeam.id ? { ...t, area: name, name: `Equipo de ${name}`, iconId } : t
        )
      );
      setEditingTeam(null);
    } else {
      const newTeam: Team = {
        id: Date.now(),
        name: `Equipo de ${name}`,
        area: name,
        iconId,
        members: [],
      };
      setTeams((prev) => [...prev, newTeam]);
      setActiveTeamId(newTeam.id);
    }
  }

  function handleMemberAdded(teamId: number, memberName: string, memberEmail: string, memberIcon: IconUserId) {
    const generatedPassword = generateRandomPassword();
    sendWelcomeEmail(memberEmail, generatedPassword);

    const newMemberId = Date.now();

    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? {
              ...t,
              members: [
                ...t.members,
                {
                  id: newMemberId,
                  name: memberName,
                  email: memberEmail,
                  iconId: memberIcon,
                  role: "user",
                  isActive: true,
                  deletedAt: null,
                },
              ],
            }
          : t
      )
    );

    addUser({
      id: newMemberId,
      name: memberName,
      email: memberEmail,
      password: generatedPassword,
      role: "user",
      iconId: memberIcon,
    });
  }

  function handleMemberRemove(teamId: number, memberId: number) {
    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? {
              ...t,
              members: t.members.map((m) =>
                m.id === memberId
                  ? { ...m, isActive: false, deletedAt: new Date() }
                  : m
              ),
            }
          : t
      )
    );

    const member = teams.find((t) => t.id === teamId)?.members.find((m) => m.id === memberId);
    if (member) {
      deactivateUser(member.id);
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
          />
        </div>
      </div>

      <AnimatePresence>
        {(showAddTeam || editingTeam) && (
          <TeamModal
            initial={editingTeam ?? undefined}
            onClose={() => {
              setShowAddTeam(false);
              setEditingTeam(null);
            }}
            onSave={handleSaveTeam}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
