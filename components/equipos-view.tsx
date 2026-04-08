"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  ShoppingCart,
  Plus,
  Pencil,
  Ghost,
  Rose,
  Rabbit,
  Fish,
  Cat,
  Car,
  BookUser,
  BadgeDollarSign,
  Computer,
  EthernetPort,
  Siren,
  Scale,
  ConciergeBell,
  Calculator,
  Trophy,
  PackageOpen,
  Clapperboard,
  SolarPanel,
  VenetianMask,
  Volleyball,
  Donut,
  Skull,
  HandMetal,
  Sticker,
  Biohazard,
  Trash2,
  X,
  ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/user-context";
import { ResponsiveIcon } from "@/components/responsive-icon";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";

/* ─── Icon picker config ─────────────────────────────────────────────────── */

const TEAM_ICONS = [
  { id: "BadgeDollarSign", icon: BadgeDollarSign },
  { id: "Computer", icon: Computer },
  { id: "ShoppingCart", icon: ShoppingCart },
  { id: "BookUser", icon: BookUser },
  { id: "Clapperboard", icon: Clapperboard },
  { id: "Car", icon: Car },
  { id: "EthernetPort", icon: EthernetPort },
  { id: "Siren", icon: Siren },
  { id: "Scale", icon: Scale },
  { id: "ConciergeBell", icon: ConciergeBell },
  { id: "Calculator", icon: Calculator },
  { id: "Trophy", icon: Trophy },
  { id: "PackageOpen", icon: PackageOpen },
  { id: "SolarPanel", icon: SolarPanel },
] as const;

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
  { id: "Hand-metal", icon: HandMetal },
  { id: "Sticker", icon: Sticker },
  { id: "Biohazard", icon: Biohazard },
] as const;

type IconId = (typeof TEAM_ICONS)[number]["id"];
type IconUserId = (typeof USER_ICONS)[number]["id"];

type EditingUser = {
  id: string | number;
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

/* ─── Types ─────────────────────────────────────────────────────────── */

type TeamMember = {
  id: string | number;
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

/* ─── Shared UI class helpers ──────────────────────────────────────────── */

const inputClass =
  "w-full rounded-md border border-input bg-background text-foreground text-sm px-3 py-2 outline-none " +
  "placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring focus:border-ring transition-colors";

const primaryButtonClass =
  "flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm px-4 py-2 " +
  "hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const modalSurfaceClass =
  "fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border p-4 md:p-6 shadow-2xl " +
  "bg-popover/90 backdrop-blur-xl text-popover-foreground max-h-[90vh] overflow-y-auto";

/* Botón circular de cerrar — reutilizable */
const closeButtonClass =
  "w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border border-border bg-accent text-foreground hover:bg-muted hover:text-muted-foreground transition-colors";

/* ─── Icon Grid Picker ──────────────────────────────────────────────────── */

function IconPicker({
  selected,
  onSelect,
}: {
  selected: IconId;
  onSelect: (id: IconId) => void;
}) {
  return (
    <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5">
      {TEAM_ICONS.map(({ id, icon: Icon }) => (
        <motion.button
          key={id}
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => onSelect(id)}
          className={cn(
            "w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center border transition-colors",
            selected === id
              ? "bg-primary text-primary-foreground border-border"
              : "bg-muted text-muted-foreground border-border hover:text-foreground hover:bg-accent"
          )}
          aria-label={id}
          aria-pressed={selected === id}
        >
          <Icon size={14} className={selected === id ? "text-primary-foreground" : ""} />
        </motion.button>
      ))}
    </div>
  );
}

/* ─── Team modal (create + edit) ─────────────────────────────────────────── */

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
  const [selectedIcon, setSelectedIcon] = useState<IconId>(initial?.iconId ?? "BadgeDollarSign");
  const [isSaving, setIsSaving] = useState(false);
  const supabase = useMemo(() => createClient(), []);
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
        className={cn(modalSurfaceClass, "w-[90vw] sm:w-[360px]")}
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Editar equipo" : "Agregar equipo nuevo"}
      >
        {/* ✅ Botón cerrar con contraste */}
        <button
          onClick={onClose}
          className={cn(closeButtonClass, "absolute top-2 right-2 sm:hidden")}
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>

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

/* ─── User Icon Picker ──────────────────────────────────────────────────── */

function UserIconPicker({ selected, onSelect }: { selected: IconUserId; onSelect: (id: IconUserId) => void }) {
  return (
    <div className="grid grid-cols-6 sm:grid-cols-6 gap-1.5">
      {USER_ICONS.map(({ id, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          className={cn(
            "w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center border transition-colors",
            selected === id
              ? "bg-primary text-primary-foreground border-border"
              : "bg-muted text-muted-foreground border-border hover:text-foreground hover:bg-accent"
          )}
          aria-label={id}
          aria-pressed={selected === id}
        >
          <Icon size={14} className={selected === id ? "text-primary-foreground" : ""} />
        </button>
      ))}
    </div>
  );
}

/* ─── Add Member Modal ──────────────────────────────────────────────────── */

function sendWelcomeEmail(userEmail: string, generatedPassword: string) {
  console.info("Enviando correo de bienvenida:", {
    to: userEmail,
    password: generatedPassword,
  });
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
  onUpdate: (userId: string | number, name: string, email: string, iconId: IconUserId) => Promise<{ success: boolean; message: string }>;
  initialUser?: EditingUser;
  members?: TeamMember[];
}) {
  const { toast } = useToast();
  const isEditMode = !!initialUser;
  const [memberName, setMemberName] = useState(initialUser?.full_name ?? "");
  const [memberEmail, setMemberEmail] = useState(initialUser?.email ?? "");
  const [selectedIcon, setSelectedIcon] = useState<IconUserId>(initialUser?.avatar_icon ?? "Ghost");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; icon?: string }>({});

  const isValid = memberName.trim() && memberEmail.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memberEmail.trim()) && selectedIcon;

  async function handleSubmit() {
    const newErrors: { name?: string; email?: string; icon?: string } = {};

    if (!memberName.trim()) {
      newErrors.name = "El nombre completo es requerido";
    }
    if (!memberEmail.trim()) {
      newErrors.email = "El correo electrónico es requerido";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(memberEmail.trim())) {
        newErrors.email = "Formato de correo electrónico inválido";
      }
    }
    if (!selectedIcon) {
      newErrors.icon = "Debes seleccionar un icono de avatar";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast({
        title: "Error de validación",
        description: "Por favor, completa todos los campos requeridos correctamente.",
        variant: "destructive",
      });
      return;
    }

    const trimmedEmail = memberEmail.trim().toLowerCase();

    const emailExists = members.some((m) => {
      const existingEmail = m.email.toLowerCase();
      if (isEditMode && initialUser && m.id === initialUser.id) {
        return false;
      }
      return existingEmail === trimmedEmail;
    });

    if (emailExists) {
      setFeedback("Este correo ya está registrado en otro usuario.");
      setIsSuccess(false);
      toast({
        title: "Correo duplicado",
        description: "Este correo ya está registrado en otro usuario.",
        variant: "destructive",
      });
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
          toast({
            title: "Error al actualizar",
            description: result.message || "No se pudo actualizar el miembro.",
            variant: "destructive",
          });
          return;
        }
        setFeedback(result.message);
        setIsSuccess(true);
        toast({
          title: "Miembro actualizado",
          description: result.message,
        });
      } else {
        const result = await onAdd(memberName.trim(), trimmedEmail, selectedIcon);
        if (!result.success) {
          setFeedback(result.message || "No se pudo agregar el miembro.");
          toast({
            title: "Error al agregar",
            description: result.message || "No se pudo agregar el miembro.",
            variant: "destructive",
          });
          return;
        }
        setFeedback(result.message);
        setCreatedPassword(result.password ?? null);
        setIsSuccess(true);
        toast({
          title: "Miembro agregado",
          description: result.message,
        });
      }
    } catch (error) {
      console.error(isEditMode ? "Error al actualizar integrante" : "Error al agregar integrante", error);
      setFeedback(isEditMode ? "Error desconocido al actualizar integrante." : "Error desconocido al agregar integrante.");
      toast({
        title: "Error inesperado",
        description: isEditMode ? "Error desconocido al actualizar integrante." : "Error desconocido al agregar integrante.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
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
        className={cn(modalSurfaceClass, "w-[90vw] sm:w-[360px]")}
        role="dialog"
        aria-modal="true"
        aria-label={isEditMode ? "Editar integrante" : "Agregar integrante"}
      >
        {/* ✅ Botón cerrar con contraste */}
        <button
          onClick={onClose}
          className={cn(closeButtonClass, "absolute top-2 right-2 sm:hidden")}
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>

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
            className={cn(inputClass, errors.name && "border-destructive focus:ring-destructive focus:border-destructive")}
            autoFocus
          />
          {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
        </div>

        <div className="flex flex-col gap-1 mb-3">
          <label className="text-muted-foreground text-xs">Email</label>
          <input
            type="email"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            className={cn(inputClass, errors.email && "border-destructive focus:ring-destructive focus:border-destructive")}
          />
          {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
        </div>

        <div className="flex flex-col gap-1 mb-4">
          <label className="text-muted-foreground text-xs">Icono de usuario</label>
          <UserIconPicker selected={selectedIcon} onSelect={setSelectedIcon} />
        </div>

        {/* ✅ Feedback con contraste dark/light */}
        {feedback && (
          <div
            className={cn(
              "mb-3 rounded-md px-3 py-2 text-sm border",
              isSuccess
                ? "bg-green-500/10 text-green-700 dark:text-green-300 border-green-600/30 dark:border-green-700/50"
                : "bg-destructive/10 text-destructive border-destructive/30"
            )}
          >
            {feedback}
          </div>
        )}

        {isSuccess && createdPassword && (
          <div className="mb-3 flex flex-col sm:flex-row items-center gap-2">
            <span className="text-xs text-muted-foreground">Contraseña temporal:</span>
            <code className="rounded bg-muted px-2 py-1 text-xs break-all">{createdPassword}</code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(createdPassword)}
              className="text-xs text-primary hover:underline whitespace-nowrap"
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
            disabled={isSaving || !isValid}
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

/* ─── Team card ──────────────────────────────────────────────────────── */

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
        "w-full flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 rounded-lg border text-left transition-colors gap-2",
        "border-border bg-card hover:bg-accent/60",
        active && "bg-accent"
      )}
      type="button"
    >
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-muted border border-border flex items-center justify-center shrink-0">
          <ResponsiveIcon icon={Icon} smSize={16} mdSize={20} className="text-foreground" />
        </div>
        <span className="text-foreground text-xs sm:text-sm font-medium truncate">{team.name}</span>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
        <Users size={12} className="sm:block hidden" />
        <span className="hidden sm:inline">Integrantes:</span>
        <span className="text-foreground font-semibold">{team.members.filter((m) => m.isActive).length}</span>
      </div>
    </motion.button>
  );
}

/* ─── Detail pane ───────────────────────────────────────────────────── */

function TeamDetailPane({
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
  onMemberAdded: (teamId: number, name: string, email: string, iconId: IconUserId) => Promise<{ success: boolean; password?: string; message: string }>;
  onMemberRemove: (teamId: number, memberId: string | number) => Promise<void>;
  onEditMember: (member: EditingUser) => void;
  deletingMemberId?: number | null;
  isSavingMember?: boolean;
  onClose?: () => void;
}) {
  const Icon = iconById(team.iconId);

  return (
    <div className="h-full rounded-lg border border-border p-3 sm:p-5 flex flex-col bg-card min-h-0">
      {/* ✅ Botón cerrar mobile drawer — con contraste */}
      {onClose && (
        <button
          onClick={onClose}
          className={cn(closeButtonClass, "absolute top-2 right-2 sm:hidden")}
          aria-label="Cerrar panel"
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

            {/* ✅ Botón eliminar equipo */}
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
              const IconUser = iconByUserId(m.iconId);
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
                      onClick={() => {
                        onEditMember({
                          id: m.id,
                          full_name: m.full_name ?? m.name,
                          email: m.email,
                          avatar_icon: m.iconId,
                        });
                      }}
                      className="rounded-md border border-border bg-transparent px-2 py-1 text-[10px] sm:text-xs font-medium text-foreground hover:bg-muted flex-1 sm:flex-none"
                    >
                      Editar
                    </button>
                    {/* ✅ Botón eliminar miembro con contraste dark/light */}
                    <button
                      type="button"
                      onClick={() => onMemberRemove(team.id, m.id)}
                      disabled={deletingMemberId === m.id}
                      className={cn(
                        "rounded-md border px-2 py-1 text-[10px] sm:text-xs font-medium flex-1 sm:flex-none transition-colors",
                        "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20",
                        deletingMemberId === m.id && "opacity-50 cursor-not-allowed"
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

/* ─── Main View ──────────────────────────────────────────────────────── */

export function EquiposView() {
  const { user, addUser, deactivateUser } = useUser();
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

  // ✅ Estados para el modal de confirmación de eliminación de miembro
  const [confirmDeleteMember, setConfirmDeleteMember] = useState<{ teamId: number; member: TeamMember } | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);

  // ✅ Estados para el modal de confirmación de eliminación de equipo
  const [confirmDeleteTeam, setConfirmDeleteTeam] = useState<Team | null>(null);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);

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
            iconId: (user.avatar_icon as IconUserId) || "Ghost",
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
          iconId: (team.icon_id as IconId) || "BadgeDollarSign",
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

  async function handleUpdateMember(userId: string | number, memberName: string, memberEmail: string, memberIcon: IconUserId): Promise<{ success: boolean; message: string }> {
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
        if (error.code === "23505") {
          return { success: false, message: "Este correo ya está registrado en otro usuario." };
        }
        return { success: false, message: "Error al actualizar miembro. Revisa la consola." };
      }

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

    try {
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: memberName,
          email: memberEmail,
          avatar_icon: memberIcon,
          team_id: teamId,
        }),
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
      sendWelcomeEmail(memberEmail, result.password);

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

  // ✅ Abre el modal de confirmación para eliminar miembro
  async function handleMemberRemove(teamId: number, memberId: string | number) {
    const team = teams.find((t) => t.id === teamId);
    const member = team?.members.find((m) => m.id === memberId);
    if (member) {
      setConfirmDeleteMember({ teamId, member });
    }
  }

  // ✅ Se ejecuta cuando el usuario confirma eliminar miembro
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
            ? {
                ...t,
                members: t.members.map((m) =>
                  m.id === memberId ? { ...m, isActive: false, deletedAt: new Date() } : m
                ),
              }
            : t
        )
      );

      if (typeof memberId === "number") {
        deactivateUser(memberId);
      } else {
        const parsed = Number(memberId);
        if (!Number.isNaN(parsed)) {
          deactivateUser(parsed);
        }
      }

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

  // ✅ Abre el modal de confirmación para eliminar equipo
  function handleTeamRemove() {
    if (activeTeam && activeTeam.id !== 0) {
      setConfirmDeleteTeam(activeTeam);
    }
  }

  // ✅ Se ejecuta cuando el usuario confirma eliminar equipo
  async function confirmRemoveTeam() {
    if (!confirmDeleteTeam) return;

    setIsDeletingTeam(true);

    try {
      // Desactivar el equipo
      const { error: teamError } = await supabase
        .from("teams")
        .update({ is_active: false })
        .eq("id", confirmDeleteTeam.id);

      if (teamError) {
        console.error("Error al desactivar equipo", teamError);
        toast({ title: "Error al eliminar equipo", description: "No se pudo eliminar el equipo.", variant: "destructive" });
        return;
      }

      // Desactivar todos los miembros activos del equipo
      const activeMembers = confirmDeleteTeam.members.filter((m) => m.isActive);
      if (activeMembers.length > 0) {
        const memberIds = activeMembers.map((m) => m.id);
        const { error: membersError } = await supabase
          .from("users")
          .update({ is_active: false })
          .in("id", memberIds);

        if (membersError) {
          console.error("Error al desactivar miembros del equipo", membersError);
        }

        // Desactivar cada miembro del contexto
        activeMembers.forEach((m) => {
          if (typeof m.id === "number") {
            deactivateUser(m.id);
          } else {
            const parsed = Number(m.id);
            if (!Number.isNaN(parsed)) {
              deactivateUser(parsed);
            }
          }
        });
      }

      // Actualizar estado local
      setTeams((prev) => prev.filter((t) => t.id !== confirmDeleteTeam.id));

      // Seleccionar otro equipo si el eliminado era el activo
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
      <header className="relative flex items-center justify-center sm:justify-between px-3 sm:px-4 md:px-8 py-3 sm:py-4 border-b border-border shrink-0 gap-2">
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

      {/* ✅ Status message con contraste dark/light */}
      {statusMessage && (
        <div className="px-3 sm:px-4 md:px-8 py-2 text-xs sm:text-sm text-green-700 dark:text-green-300 bg-green-500/10 border border-green-600/30 dark:border-green-700/50">
          {statusMessage}
        </div>
      )}

      {isLoadingTeams ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
          Cargando equipos...
        </div>
      ) : (
        <div className="flex flex-1 gap-2 sm:gap-4 p-2 sm:p-4 md:p-6 overflow-hidden">
          {/* Left: team list */}
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

          {/* Right: detail pane - Desktop only */}
          <div className="w-48 sm:w-64 lg:w-80 shrink-0 hidden lg:block">
            <TeamDetailPane
              team={activeTeam}
              isAdmin={isAdmin}
              onEdit={() => setEditingTeam(activeTeam)}
              onDeleteTeam={handleTeamRemove}
              onMemberAdded={handleMemberAdded}
              onMemberRemove={handleMemberRemove}
              onEditMember={(member) => {
                if (member.id === 0) {
                  setEditingMember(null);
                } else {
                  setEditingMember(member);
                }
                setShowMemberModal(true);
              }}
              deletingMemberId={deletingMemberId}
              isSavingMember={isSavingMember}
            />
          </div>

          {/* Mobile detail pane drawer */}
          <AnimatePresence>
            {showDetailPane && (
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                className="fixed inset-0 z-40 lg:hidden bg-black/40 flex flex-col"
              >
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
                        if (member.id === 0) {
                          setEditingMember(null);
                        } else {
                          setEditingMember(member);
                        }
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

      {/* ✅ Modal de confirmación para eliminar miembro */}
      <ConfirmDeleteModal
        open={!!confirmDeleteMember}
        title="¿Eliminar este integrante?"
        description={`Se eliminará a "${confirmDeleteMember?.member.full_name ?? confirmDeleteMember?.member.name ?? ""}". Perderá acceso al sistema. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar integrante"
        isLoading={isDeletingMember}
        onConfirm={confirmRemoveMember}
        onCancel={() => setConfirmDeleteMember(null)}
      />

      {/* ✅ Modal de confirmación para eliminar equipo */}
      <ConfirmDeleteModal
        open={!!confirmDeleteTeam}
        title="¿Eliminar este equipo?"
        description={`Se eliminará "${confirmDeleteTeam?.name ?? ""}" y todos sus integrantes (${confirmDeleteTeam?.members.filter((m) => m.isActive).length ?? 0}) perderán acceso al sistema. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar equipo"
        isLoading={isDeletingTeam}
        onConfirm={confirmRemoveTeam}
        onCancel={() => setConfirmDeleteTeam(null)}
      />
    </div>
  );
}