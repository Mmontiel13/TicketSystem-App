"use client";

import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";
import { AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { ResponsiveIcon } from "@/components/responsive-icon";
import { Plus } from "lucide-react";

import { COLUMNS, headerButtonClass } from "@/components/kanban/kanban.config";
import { KanbanColumnPanel } from "@/components/kanban/KanbanColumnPanel";
import { CreateTaskSidebar } from "@/components/kanban/CreateTaskSidebar";
import { TaskCardContent } from "@/components/kanban/TaskCardContent";
import { useKanbanBoard } from "@/components/kanban/useKanbanBoard";

export function KanbanView() {
  const kb = useKanbanBoard();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <header className="relative flex items-center justify-center sm:justify-between px-3 sm:px-4 md:px-8 py-3 sm:py-4 border-b border-border shrink-0 gap-2">
        <h1 className="text-foreground font-semibold text-base sm:text-lg md:text-xl text-center sm:text-left">
          Kanban
        </h1>

        <button
          onClick={() => kb.setShowCreate(true)}
          className={cn(headerButtonClass, "absolute right-3 sm:right-4 md:right-8 sm:relative sm:right-auto")}
          type="button"
        >
          <ResponsiveIcon icon={Plus} smSize={12} mdSize={14} />
          <span className="hidden sm:inline">Crear tarea</span>
          <span className="sm:hidden text-xs">Nueva</span>
        </button>
      </header>

      <div className="flex flex-col flex-1 overflow-hidden px-2 sm:px-4 md:px-6 pt-3 sm:pt-5 pb-3 sm:pb-4 gap-2 sm:gap-4">
        <h2 className="text-foreground font-semibold text-sm sm:text-base shrink-0 truncate">
          {kb.teamName || "Área del Equipo"}
        </h2>

        {kb.loading ? (
          <div className="flex items-center justify-center flex-1">
            <span className="text-foreground text-sm">Cargando tareas...</span>
          </div>
        ) : (
          <DndContext
            sensors={kb.sensors}
            collisionDetection={closestCorners}
            onDragStart={kb.onDragStart}
            onDragOver={kb.onDragOver}
            onDragEnd={kb.onDragEnd}
          >
            <div className="flex gap-2 sm:gap-3 flex-1 overflow-x-auto overflow-y-hidden pb-2">
              {COLUMNS.map((col) => (
                <KanbanColumnPanel
                  key={col.id}
                  config={col}
                  tasks={kb.tasks.filter((t) => t.status === col.id)}
                  members={kb.members}
                  isOver={kb.overColumn === col.id}
                  onEditTask={(task) => kb.setEditTask(task)}
                  onDeleteTask={kb.handleDeleteTask}
                />
              ))}
            </div>

            <DragOverlay>
              {kb.activeTask ? (
                <div className="rotate-1 shadow-2xl opacity-90 w-[150px] sm:w-[220px]">
                  <TaskCardContent
                    task={kb.activeTask}
                    members={kb.members}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <AnimatePresence>
        {kb.showCreate && (
          <CreateTaskSidebar
            onClose={() => kb.setShowCreate(false)}
            onAdd={kb.handleAddTask}
            members={kb.members}
          />
        )}

        {kb.editTask && (
          <CreateTaskSidebar
            task={kb.editTask}
            onClose={() => kb.setEditTask(null)}
            onAdd={kb.handleAddTask}
            onUpdate={kb.handleUpdateTask}
            members={kb.members}
          />
        )}
      </AnimatePresence>

      <ConfirmDeleteModal
        open={!!kb.confirmDeleteTask}
        title="¿Eliminar esta tarea?"
        description={`Se eliminará la tarea "${
          kb.tasks.find((t) => t.id === kb.confirmDeleteTask)?.title ?? ""
        }". Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar tarea"
        isLoading={kb.isDeletingTask}
        onConfirm={kb.confirmDeleteTaskAction}
        onCancel={() => kb.setConfirmDeleteTask(null)}
      />
    </div>
  );
}