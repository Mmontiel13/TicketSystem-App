"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  MoreHorizontal,
  GripVertical,
  UserCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ResponsiveIcon } from "@/components/responsive-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { KanbanColumn, KanbanMember, KanbanTask } from "./kanban.types";
import { ICON_MAP, COLUMNS } from "./kanban.config";

export function TaskCardContent({
  task,
  members,
  isDragging,
  onEdit,
  onDelete,
  onMoveStatus,
}: {
  task: KanbanTask;
  members: KanbanMember[];
  isDragging?: boolean;
  onEdit?: (task: KanbanTask) => void;
  onDelete?: (taskId: string) => void;
  onMoveStatus?: (taskId: string, nextStatus: KanbanColumn) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const assignedMembers = members.filter((m) =>
    task.assigned_to.includes(m.id)
  );
  const isLongDesc = task.description.length > 100;

  const columnIndex = COLUMNS.findIndex((c) => c.id === task.status);
  const prevStatus = columnIndex > 0 ? COLUMNS[columnIndex - 1]?.id : null;
  const nextStatus =
    columnIndex >= 0 && columnIndex < COLUMNS.length - 1
      ? COLUMNS[columnIndex + 1]?.id
      : null;

  return (
    <>
      <div
        className={cn(
          // ✅ Más grande en móvil
          "rounded-lg border border-border bg-card p-3 sm:p-3 flex flex-col gap-2 sm:gap-2 select-none",
          isDragging && "opacity-50 ring-1 ring-ring/20"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <ResponsiveIcon
            icon={GripVertical}
            smSize={14}
            mdSize={14}
            className="text-muted-foreground cursor-grab"
          />

          <div className="relative">
            <button
              className="text-muted-foreground hover:text-foreground transition-colors p-2 sm:p-1 hover:bg-accent rounded"
              aria-label="Opciones"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((open) => !open);
              }}
              type="button"
            >
              <ResponsiveIcon icon={MoreHorizontal} smSize={14} mdSize={14} />
            </button>

            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 mt-1 w-28 sm:w-28 rounded-lg border border-border bg-card text-xs shadow-lg z-20"
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit?.(task);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-accent/70 text-foreground text-xs"
                  type="button"
                >
                  Editar
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete?.(task.id);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-accent/70 text-red-500 text-xs"
                  type="button"
                >
                  Eliminar
                </button>
              </motion.div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-foreground font-semibold text-sm sm:text-xs line-clamp-2">
            {task.title}
          </p>

          <div className="flex flex-col gap-1">
            <p className="text-foreground/80 text-xs sm:text-[11px] leading-relaxed line-clamp-3">
              {task.description}
            </p>
            {isLongDesc && (
              <button
                onClick={() => setShowFullDesc(true)}
                className="text-xs sm:text-[10px] hover:text-cyan-600 transition-colors self-start"
                type="button"
              >
                Ver más
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3 text-[10px] sm:text-[10px]">
          <div className="flex-1">
            <span className="text-foreground/50">Inicio</span>
            <p className="text-foreground/80 tabular-nums">
              {new Date(task.start_date).toLocaleDateString("es-MX", {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex-1">
            <span className="text-foreground/50">Vencimiento</span>
            <p className="text-foreground/80 tabular-nums">
              {new Date(task.end_date).toLocaleDateString("es-MX", {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {assignedMembers.length > 0 && (
          <div className="flex items-center gap-2 mt-1 pt-2 border-t border-border">
            <span className="text-foreground/50 text-[10px]">Asignado:</span>
            <div className="flex -space-x-1.5">
              {assignedMembers.slice(0, 3).map((m) => {
                const Icon = ICON_MAP[m.avatar_icon] || UserCircle;
                return (
                  <div
                    key={m.id}
                    title={m.full_name}
                    className="w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0"
                  >
                    <ResponsiveIcon
                      icon={Icon}
                      smSize={14}
                      mdSize={14}
                      className="text-foreground/70"
                    />
                  </div>
                );
              })}
              {assignedMembers.length > 3 && (
                <div className="w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] text-foreground/70">
                  +{assignedMembers.length - 3}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botones SOLO móvil */}
        {onMoveStatus && (
          <div className="flex items-center justify-between gap-2 pt-2 sm:hidden">
            <button
              type="button"
              disabled={!prevStatus}
              onClick={() => prevStatus && onMoveStatus(task.id, prevStatus)}
              className={cn(
                "flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground flex items-center justify-center gap-2",
                !prevStatus && "opacity-40 cursor-not-allowed"
              )}
            >
              <ArrowLeft size={14} />
              Regresar
            </button>

            <button
              type="button"
              disabled={!nextStatus}
              onClick={() => nextStatus && onMoveStatus(task.id, nextStatus)}
              className={cn(
                "flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground flex items-center justify-center gap-2",
                !nextStatus && "opacity-40 cursor-not-allowed"
              )}
            >
              Avanzar
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      <Dialog open={showFullDesc} onOpenChange={setShowFullDesc}>
        <DialogContent
          className="max-w-md pointer-events-auto"
          onPointerDown={(e) => e.stopPropagation()}
          onDragStart={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{task.title}</DialogTitle>
            <DialogDescription>Descripción completa</DialogDescription>
          </DialogHeader>
          <div className="whitespace-pre-wrap text-sm text-foreground">
            {task.description}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}