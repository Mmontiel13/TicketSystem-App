"use client";

import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { KanbanColumn, KanbanMember, KanbanTask } from "./kanban.types";
import { TaskCardContent } from "./TaskCardContent";

export function SortableTaskCard({
  task,
  members,
  onEdit,
  onDelete,
  onMoveStatus,
}: {
  task: KanbanTask;
  members: KanbanMember[];
  onEdit: (task: KanbanTask) => void;
  onDelete: (taskId: string) => void;
  onMoveStatus?: (taskId: string, nextStatus: KanbanColumn) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { column: task.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
    >
      <TaskCardContent
        task={task}
        members={members}
        isDragging={isDragging}
        onEdit={onEdit}
        onDelete={onDelete}
        onMoveStatus={onMoveStatus}
      />
    </motion.div>
  );
}