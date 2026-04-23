"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { IconUserId } from "@/lib/user-context";
import type { EditingUser, TeamMember } from "./types";
import { UserIconPicker } from "./user-icon-picker";
import { closeButtonClass, inputClass, modalSurfaceClass, primaryButtonClass } from "./ui-classes";

function sendWelcomeEmail(userEmail: string, generatedPassword: string) {
  console.info("Enviando correo de bienvenida:", { to: userEmail, password: generatedPassword });
}

export function AddMemberModal({
  onClose,
  onAdd,
  onUpdate,
  initialUser,
  members = [],
}: {
  onClose: () => void;
  onAdd: (
    name: string,
    email: string,
    iconId: IconUserId,
  ) => Promise<{ success: boolean; password?: string; message: string }>;
  onUpdate: (
    userId: string | number,
    name: string,
    email: string,
    iconId: IconUserId,
  ) => Promise<{ success: boolean; message: string }>;
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

  const isValid =
    memberName.trim() &&
    memberEmail.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memberEmail.trim()) &&
    selectedIcon;

  async function handleSubmit() {
    const newErrors: { name?: string; email?: string; icon?: string } = {};

    if (!memberName.trim()) newErrors.name = "El nombre completo es requerido";
    if (!memberEmail.trim()) {
      newErrors.email = "El correo electrónico es requerido";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(memberEmail.trim())) newErrors.email = "Formato de correo electrónico inválido";
    }
    if (!selectedIcon) newErrors.icon = "Debes seleccionar un icono de avatar";

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
      if (isEditMode && initialUser && m.id === initialUser.id) return false;
      return existingEmail === trimmedEmail;
    });

    if (emailExists) {
      setFeedback("Este correo ya está registrado en otro usuario.");
      setIsSuccess(false);
      toast({ title: "Correo duplicado", description: "Este correo ya está registrado en otro usuario.", variant: "destructive" });
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
          toast({ title: "Error al actualizar", description: result.message || "No se pudo actualizar el miembro.", variant: "destructive" });
          return;
        }
        setFeedback(result.message);
        setIsSuccess(true);
        toast({ title: "Miembro actualizado", description: result.message });
      } else {
        const result = await onAdd(memberName.trim(), trimmedEmail, selectedIcon);
        if (!result.success) {
          setFeedback(result.message || "No se pudo agregar el miembro.");
          toast({ title: "Error al agregar", description: result.message || "No se pudo agregar el miembro.", variant: "destructive" });
          return;
        }
        setFeedback(result.message);
        setCreatedPassword(result.password ?? null);
        setIsSuccess(true);
        toast({ title: "Miembro agregado", description: result.message });

        if (result.password) sendWelcomeEmail(trimmedEmail, result.password);
      }
    } catch (error) {
      console.error(isEditMode ? "Error al actualizar integrante" : "Error al agregar integrante", error);
      const msg = isEditMode ? "Error desconocido al actualizar integrante." : "Error desconocido al agregar integrante.";
      setFeedback(msg);
      toast({ title: "Error inesperado", description: msg, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden="true" />

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
        <button
          onClick={onClose}
          className={cn(closeButtonClass, "absolute top-2 right-2 sm:hidden")}
          aria-label="Cerrar"
          type="button"
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

        {feedback && (
          <div
            className={cn(
              "mb-3 rounded-md px-3 py-2 text-sm border",
              isSuccess
                ? "bg-green-500/10 text-green-700 dark:text-green-300 border-green-600/30 dark:border-green-700/50"
                : "bg-destructive/10 text-destructive border-destructive/30",
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
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onClose} className={cn(primaryButtonClass, "w-full")} type="button">
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
            {isSaving ? (isEditMode ? "Actualizando..." : "Agregando...") : isEditMode ? "Guardar cambios" : "Agregar"}
          </motion.button>
        )}
      </motion.div>
    </>
  );
}