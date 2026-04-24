"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ResponsiveIcon } from "@/components/responsive-icon";
import { getUserIcon } from "@/lib/user-icons";

import type { KanbanColumn, KanbanMember, KanbanTask } from "./kanban.types";
import {
  COLUMNS,
  checkboxClass,
  headerButtonClass,
  inputClass,
  sidebarSurfaceClass,
} from "./kanban.config";

export function CreateTaskSidebar({
  onClose,
  onAdd,
  onUpdate,
  task,
  members,
}: {
  onClose: () => void;
  onAdd: (task: Omit<KanbanTask, "id" | "dbId">) => void;
  onUpdate?: (task: KanbanTask) => void;
  task?: KanbanTask | null;
  members: KanbanMember[];
}) {
  const { toast } = useToast();

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [selectedMembers, setSelectedMembers] = useState<number[]>(
    task?.assigned_to ?? []
  );
  const [endDate, setEndDate] = useState(
    task?.end_date ? task.end_date.split("T")[0] : ""
  );
  const [status, setStatus] = useState<KanbanColumn>(task?.status ?? "Tareas");
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    endDate?: string;
  }>({});

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description);
    setSelectedMembers(task.assigned_to);
    setEndDate(task.end_date.split("T")[0]);
    setStatus(task.status);
  }, [task]);

  function toggleMember(id: number) {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  function handleSave() {
    const newErrors: { title?: string; description?: string; endDate?: string } =
      {};

    if (!title.trim()) newErrors.title = "El título es requerido";
    if (!description.trim()) newErrors.description = "La descripción es requerida";
    if (!endDate) newErrors.endDate = "La fecha de vencimiento es requerida";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast({
        title: "Error de validación",
        description: "Por favor, completa todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    const startDate = new Date().toISOString();
    const endDateTime = new Date(endDate).toISOString();

    const taskPayload = {
      title: title.trim(),
      description: description.trim(),
      status,
      start_date: task?.start_date ?? startDate,
      end_date: endDateTime,
      assigned_to: selectedMembers,
      team_id: task?.team_id ?? 0,
    };

    if (task && onUpdate) onUpdate({ ...task, ...taskPayload });
    else onAdd(taskPayload);

    onClose();
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className={sidebarSurfaceClass}
        role="dialog"
        aria-modal="true"
        aria-label={task ? "Editar tarea" : "Agregar tarea"}
      >
        <button
          onClick={onClose}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-accent rounded-lg sm:hidden"
          aria-label="Cerrar"
          type="button"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
          aria-label="Cerrar"
          type="button"
        >
          <X size={16} />
        </button>

        <div className="flex items-start justify-between pr-6 sm:pr-0">
          <div>
            <h2 className="text-foreground font-semibold text-base sm:text-lg">
              {task ? "Editando tarea" : "Agregando tarea"}
            </h2>
            <p className="text-foreground text-[10px] sm:text-xs mt-1 leading-relaxed">
              Completa los detalles y asigna miembros del equipo
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-foreground text-xs font-medium">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nombre de la tarea..."
            className={cn(
              inputClass,
              "text-xs",
              errors.title &&
                "border-destructive focus:ring-destructive focus:border-destructive"
            )}
          />
          {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-foreground text-xs font-medium">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Detalles de la tarea..."
            className={cn(
              inputClass,
              "resize-none leading-relaxed text-xs",
              errors.description &&
                "border-destructive focus:ring-destructive focus:border-destructive"
            )}
          />
          {errors.description && (
            <p className="text-destructive text-xs">{errors.description}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-foreground text-xs font-medium">Estado</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as KanbanColumn)}
            className={cn(inputClass, "text-xs")}
          >
            {COLUMNS.map((col) => (
              <option key={col.id} value={col.id}>
                {col.id}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-foreground text-xs font-medium">Fecha de vencimiento</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={cn(
              inputClass,
              "text-xs",
              errors.endDate &&
                "border-destructive focus:ring-destructive focus:border-destructive"
            )}
          />
          {errors.endDate && <p className="text-destructive text-xs">{errors.endDate}</p>}
        </div>

        <div className="flex flex-col gap-1.5 max-h-48 overflow-hidden flex-1">
          <span className="text-foreground text-xs font-medium">Asignar a:</span>

          <div className="flex flex-col gap-1 overflow-y-auto pr-1">
            {members.length === 0 ? (
              <p className="text-foreground text-xs">No hay miembros en el área.</p>
            ) : (
              members.map((m) => {
                const Icon = getUserIcon(m.avatar_icon);

                return (
                  <label
                    key={m.id}
                    className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ResponsiveIcon
                        icon={Icon}
                        smSize={14}
                        mdSize={18}
                        className="text-foreground shrink-0"
                      />
                      <span className="text-foreground text-xs truncate">{m.full_name}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(m.id)}
                      onChange={() => toggleMember(m.id)}
                      className={cn(checkboxClass, "shrink-0")}
                    />
                  </label>
                );
              })
            )}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          className={cn(headerButtonClass, "mt-auto justify-center w-full")}
          type="button"
        >
          <ResponsiveIcon icon={Plus} smSize={14} mdSize={16} />
          {task ? "Guardar" : "Agregar"}
        </motion.button>
      </motion.div>
    </>
  );
}