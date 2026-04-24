"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { getTeamIcon, type TeamIconId } from "@/lib/team-icons";
import type { Team } from "./types";
import { IconPicker } from "./icon-picker";
import { closeButtonClass, inputClass, modalSurfaceClass, primaryButtonClass } from "./ui-classes";

export function TeamModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: Team;
  onClose: () => void;
  onSave: () => Promise<void>;
}) {
  const [teamName, setTeamName] = useState(initial?.area ?? "");
  const [selectedIcon, setSelectedIcon] = useState<TeamIconId>(initial?.iconId ?? "BadgeDollarSign");
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
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden="true" />

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
        <button
          onClick={onClose}
          className={cn(closeButtonClass, "absolute top-2 right-2 sm:hidden")}
          aria-label="Cerrar"
          type="button"
        >
          <X size={16} />
        </button>

        <h2 className="text-foreground font-semibold text-base mb-1">
          {isEdit ? "Editando equipo" : "Agregando un equipo nuevo"}
        </h2>
        <p className="text-muted-foreground text-xs mb-5">
          {isEdit ? "Modifica los datos del equipo" : "Configura el nombre y el icono del equipo"}
        </p>

        <div className="flex flex-col items-center mb-5 gap-2">
          <div className="w-16 h-16 rounded-xl border border-border bg-muted flex items-center justify-center">
            {(() => {
              const Icon = getTeamIcon(selectedIcon);
              return <Icon size={30} className="text-foreground" />;
            })()}
          </div>
          <span className="text-muted-foreground text-xs">Selecciona un icono</span>
          <IconPicker selected={selectedIcon} onSelect={setSelectedIcon} />
        </div>

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