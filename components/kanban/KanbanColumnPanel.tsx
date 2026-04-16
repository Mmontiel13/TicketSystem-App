"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { ResponsiveIcon } from "@/components/responsive-icon";

import type { ColumnConfig, KanbanMember, KanbanTask } from "./kanban.types";
import { SortableTaskCard } from "./SortableTaskCard";

export function KanbanColumnPanel({
  config,
  tasks,
  members,
  isOver,
  onEditTask,
  onDeleteTask,
}: {
  config: ColumnConfig;
  tasks: KanbanTask[];
  members: KanbanMember[];
  isOver: boolean;
  onEditTask: (task: KanbanTask) => void;
  onDeleteTask: (id: string) => void;
}) {
  const Icon = config.icon;
  const taskIds = tasks.map((t) => t.id);
  const { setNodeRef } = useDroppable({ id: config.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-2 sm:gap-3 min-w-[150px] sm:min-w-[220px] flex-1 rounded-lg p-1.5 sm:p-2 transition-colors",
        isOver ? "bg-accent/50 ring-1 ring-ring/20" : "bg-transparent"
      )}
    >
      <div className="flex items-center justify-between px-0.5 sm:px-1">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <ResponsiveIcon
            icon={Icon}
            smSize={12}
            mdSize={15}
            className={config.iconClass}
          />
          <span className="text-foreground text-xs sm:text-sm font-medium truncate">
            {config.id}
          </span>
          <span className="text-foreground text-[10px] sm:text-xs tabular-nums ml-1 bg-muted px-1.5 rounded">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="min-h-[300px] sm:min-h-[500px] flex flex-col gap-2 sm:gap-3">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2 sm:gap-3 overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {tasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  members={members}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex-1 rounded-lg border-2 border-dashed border-foreground/30 bg-muted/5 flex items-center justify-center p-2">
            <span className="text-foreground/50 text-[10px] sm:text-sm text-center">
              Arrastra una tarea aquí
            </span>
          </div>
        )}
      </div>
    </div>
  );
}