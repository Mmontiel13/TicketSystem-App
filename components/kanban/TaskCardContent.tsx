"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MoreHorizontal, GripVertical, UserCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { ResponsiveIcon } from "@/components/responsive-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { KanbanMember, KanbanTask } from "./kanban.types";
import { ICON_MAP } from "./kanban.config";

export function TaskCardContent({
  task,
  members,
  isDragging,
  onEdit,
  onDelete,
}: {
  task: KanbanTask;
  members: KanbanMember[];
  isDragging?: boolean;
  onEdit?: (task: KanbanTask) => void;
  onDelete?: (taskId: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const assignedMembers = members.filter((m) => task.assigned_to.includes(m.id));
  const isLongDesc = task.description.length > 100;

  return (
    <>
      <div
        className={cn(
          "rounded-lg border border-border bg-card p-2 sm:p-3 flex flex-col gap-1.5 sm:gap-2 select-none",
          isDragging && "opacity-50 ring-1 ring-ring/20"
        )}
      >
        <div className="flex items-center justify-between gap-1">
          <ResponsiveIcon
            icon={GripVertical}
            smSize={12}
            mdSize={14}
            className="text-muted-foreground cursor-grab"
          />

          <div className="relative">
            <button
              className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-accent rounded"
              aria-label="Opciones"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((open) => !open);
              }}
              type="button"
            >
              <ResponsiveIcon icon={MoreHorizontal} smSize={12} mdSize={14} />
            </button>

            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 mt-1 w-24 sm:w-28 rounded-lg border border-border bg-card text-xs shadow-lg z-20"
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit?.(task);
                  }}
                  className="w-full text-left px-2 py-1.5 hover:bg-accent/70 text-foreground text-[10px] sm:text-xs"
                  type="button"
                >
                  Editar
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete?.(task.id);
                  }}
                  className="w-full text-left px-2 py-1.5 hover:bg-accent/70 text-red-500 text-[10px] sm:text-xs"
                  type="button"
                >
                  Eliminar
                </button>
              </motion.div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-foreground font-medium text-[10px] sm:text-xs line-clamp-2">
            {task.title}
          </p>

          <div className="flex flex-col gap-1">
            <p className="text-foreground/70 text-[9px] sm:text-[11px] leading-relaxed line-clamp-3">
              {task.description}
            </p>
            {isLongDesc && (
              <button
                onClick={() => setShowFullDesc(true)}
                className="text-[9px] sm:text-[10px] hover:text-cyan-600 transition-colors self-start"
                type="button"
              >
                Ver más
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 text-[8px] sm:text-[10px]">
          <div className="flex-1">
            <span className="text-foreground/50">Inicio</span>
            <p className="text-foreground/70 tabular-nums">
              {new Date(task.start_date).toLocaleDateString("es-MX", {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex-1">
            <span className="text-foreground/50">Vencimiento</span>
            <p className="text-foreground/70 tabular-nums">
              {new Date(task.end_date).toLocaleDateString("es-MX", {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {assignedMembers.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1 pt-1.5 border-t border-border">
            <span className="text-foreground/50 text-[8px]">Asignado:</span>
            <div className="flex -space-x-1.5">
              {assignedMembers.slice(0, 3).map((m) => {
                const Icon = ICON_MAP[m.avatar_icon] || UserCircle;
                return (
                  <div
                    key={m.id}
                    title={m.full_name}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0"
                  >
                    <ResponsiveIcon
                      icon={Icon}
                      smSize={10}
                      mdSize={14}
                      className="text-foreground/70"
                    />
                  </div>
                );
              })}
              {assignedMembers.length > 3 && (
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-muted border border-border flex items-center justify-center text-[7px] sm:text-[10px] text-foreground/70">
                  +{assignedMembers.length - 3}
                </div>
              )}
            </div>
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