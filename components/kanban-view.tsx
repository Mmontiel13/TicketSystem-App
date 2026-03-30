"use client";

import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import {
  ListTodo,
  Loader,
  MinusCircle,
  CheckCircle2,
  MoreHorizontal,
  GripVertical,
  UserCircle,
  Plus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────────────────────── */

export type KanbanColumn = "Tareas" | "En proceso" | "Pendiente" | "Terminada";

export interface KanbanMember {
  id: number;
  name: string;
}

export interface KanbanTask {
  id: number;
  description: string;
  assignedDate: string;
  deadline: string;
  assignees: KanbanMember[];
  column: KanbanColumn;
}

/* ─── Mock data ──────���──────────────────────────────────────────────────────── */

const MEMBERS: KanbanMember[] = [
  { id: 1, name: "Integrante 1" },
  { id: 2, name: "Integrante 2" },
  { id: 3, name: "Integrante 3" },
  { id: 4, name: "Integrante 4" },
];

const MOCK_KANBAN_TASKS: KanbanTask[] = [
  {
    id: 1,
    description:
      "Actualizar el servidor de correos corporativos y verificar conectividad con clientes.",
    assignedDate: "2025-04-01 09:00:00",
    deadline: "2025-04-05 18:00:00",
    assignees: [MEMBERS[0], MEMBERS[1], MEMBERS[2]],
    column: "Tareas",
  },
  {
    id: 2,
    description:
      "Revisar los permisos de acceso en el directorio activo para el área de ventas.",
    assignedDate: "2025-04-02 10:30:00",
    deadline: "2025-04-06 17:00:00",
    assignees: [MEMBERS[1], MEMBERS[3]],
    column: "Tareas",
  },
  {
    id: 3,
    description:
      "Configurar VPN para los usuarios que trabajan de forma remota en la región norte.",
    assignedDate: "2025-04-01 08:00:00",
    deadline: "2025-04-04 15:00:00",
    assignees: [MEMBERS[0], MEMBERS[2], MEMBERS[3]],
    column: "En proceso",
  },
  {
    id: 4,
    description:
      "Instalar parches de seguridad en las estaciones de trabajo del piso 3.",
    assignedDate: "2025-04-03 11:00:00",
    deadline: "2025-04-07 16:00:00",
    assignees: [MEMBERS[2]],
    column: "En proceso",
  },
  {
    id: 5,
    description:
      "Migrar base de datos de clientes al nuevo servidor de alta disponibilidad.",
    assignedDate: "2025-03-28 09:00:00",
    deadline: "2025-04-10 18:00:00",
    assignees: [MEMBERS[0], MEMBERS[1]],
    column: "Pendiente",
  },
  {
    id: 6,
    description:
      "Documentar el inventario de equipos de cómputo de todas las sucursales.",
    assignedDate: "2025-03-30 10:00:00",
    deadline: "2025-04-08 17:00:00",
    assignees: [MEMBERS[3]],
    column: "Pendiente",
  },
  {
    id: 7,
    description:
      "Reemplazar 5 equipos obsoletos del área de contabilidad con nuevas workstations.",
    assignedDate: "2025-03-25 09:00:00",
    deadline: "2025-04-01 18:00:00",
    assignees: [MEMBERS[0], MEMBERS[1], MEMBERS[2]],
    column: "Terminada",
  },
  {
    id: 8,
    description:
      "Configurar respaldos automáticos nocturnos para los servidores de producción.",
    assignedDate: "2025-03-20 08:00:00",
    deadline: "2025-03-27 17:00:00",
    assignees: [MEMBERS[1], MEMBERS[2]],
    column: "Terminada",
  },
  {
    id: 9,
    description:
      "Capacitar al personal de RRHH en el uso del nuevo software de nómina.",
    assignedDate: "2025-04-04 09:30:00",
    deadline: "2025-04-09 16:00:00",
    assignees: [MEMBERS[0]],
    column: "Tareas",
  },
  {
    id: 10,
    description:
      "Revisar y renovar licencias de software de productividad para todo el equipo.",
    assignedDate: "2025-04-02 14:00:00",
    deadline: "2025-04-11 18:00:00",
    assignees: [MEMBERS[2], MEMBERS[3]],
    column: "En proceso",
  },
];

/* ─── Column config ──────────────────────────────────────────────────────────── */

interface ColumnConfig {
  id: KanbanColumn;
  icon: React.ElementType;
  iconClass: string;
}

const COLUMNS: ColumnConfig[] = [
  { id: "Tareas", icon: ListTodo, iconClass: "text-muted-foreground" },
  { id: "En proceso", icon: Loader, iconClass: "text-muted-foreground animate-spin" },
  { id: "Pendiente", icon: MinusCircle, iconClass: "text-muted-foreground" },
  {
    id: "Terminada",
    icon: CheckCircle2,
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
];

/* ─── Shared classes ─────────────────────────────────────────────────────────── */

const headerButtonClass =
  "flex items-center gap-2 rounded-md bg-primary text-primary-foreground text-sm px-4 py-2 transition-colors hover:opacity-90";

const sidebarSurfaceClass =
  "fixed right-0 top-0 z-50 h-full w-[300px] border-l border-border p-6 flex flex-col gap-5 overflow-y-auto " +
  "bg-popover/90 backdrop-blur-xl text-popover-foreground";

const inputClass =
  "w-full rounded-md border border-input bg-background text-foreground text-xs px-3 py-2 outline-none " +
  "placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring focus:border-ring transition-colors";

const checkboxClass = "w-4 h-4 rounded border-border accent-primary cursor-pointer";

/* ─── TaskCard (plain, used in overlay and column) ──────────────────────────── */

function TaskCardContent({
  task,
  isDragging,
  onEdit,
  onDelete,
}: {
  task: KanbanTask;
  isDragging?: boolean;
  onEdit: (task: KanbanTask) => void;
  onDelete: (taskId: number) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-3 flex flex-col gap-2 select-none",
        isDragging && "opacity-50 ring-1 ring-ring/20"
      )}
    >
      <div className="flex items-center justify-between">
        <GripVertical size={14} className="text-muted-foreground cursor-grab" />
        <div className="relative">
          <button
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Opciones"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((open) => !open);
            }}
            type="button"
          >
            <MoreHorizontal size={14} />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-1 w-28 rounded-lg border border-border bg-card text-xs shadow-lg z-20">
              <button
                onClick={() => {
                  setShowMenu(false);
                  onEdit(task);
                }}
                className="w-full text-left px-2 py-1.5 hover:bg-accent/70"
              >
                Editar
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDelete(task.id);
                }}
                className="w-full text-left px-2 py-1.5 hover:bg-accent/70 text-red-500"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-foreground text-xs leading-relaxed border border-border rounded-md p-2 bg-muted min-h-[56px]">
        {task.description}
      </p>

      <div className="flex flex-col gap-0.5">
        <span className="text-muted-foreground text-[10px]">Fecha de asignación</span>
        <span className="text-muted-foreground text-[11px] tabular-nums">
          {task.assignedDate}
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-muted-foreground text-[10px]">Fecha Límite</span>
        <span className="text-muted-foreground text-[11px] tabular-nums">
          {task.deadline}
        </span>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <span className="text-muted-foreground text-[10px]">Asignado a:</span>
        <div className="flex -space-x-1">
          {task.assignees.slice(0, 4).map((m) => (
            <div
              key={m.id}
              title={m.name}
              className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center"
            >
              <UserCircle size={16} className="text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Sortable Task Card (dnd-kit) ───────────────────────────────────────────── */

function SortableTaskCard({
  task,
  onEdit,
  onDelete,
}: {
  task: KanbanTask;
  onEdit: (task: KanbanTask) => void;
  onDelete: (taskId: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { column: task.column } });

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
      animate={{ opacity: isDragging ? 0.4 : 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
    >
      <TaskCardContent
        task={task}
        isDragging={isDragging}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </motion.div>
  );
}

/* ─── Droppable Column ───────────────────────────────────────────────────────── */

function KanbanColumnPanel({
  config,
  tasks,
  isOver,
  onEditTask,
  onDeleteTask,
}: {
  config: ColumnConfig;
  tasks: KanbanTask[];
  isOver: boolean;
  onEditTask: (task: KanbanTask) => void;
  onDeleteTask: (id: number) => void;
}) {
  const Icon = config.icon;
  const taskIds = tasks.map((t) => t.id);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 min-w-[220px] flex-1 rounded-lg p-2 transition-colors",
        isOver ? "bg-accent/50 ring-1 ring-ring/20" : "bg-transparent"
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Icon size={15} className={config.iconClass} />
          <span className="text-foreground text-sm font-medium">{config.id}</span>
          <span className="text-muted-foreground text-xs tabular-nums ml-1">
            {tasks.length}
          </span>
        </div>
        <button
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Opciones de columna"
          type="button"
        >
          <MoreHorizontal size={15} />
        </button>
      </div>

      {/* Cards */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3 overflow-y-auto min-h-[60px]">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
          </AnimatePresence>

          {tasks.length === 0 && (
            <div className="rounded-lg border border-dashed border-border py-6 flex items-center justify-center">
              <span className="text-muted-foreground text-xs">Sin tareas</span>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

/* ─── Create Task Sidebar ────────────────────────────────────────────────────── */

function CreateTaskSidebar({
  onClose,
  onAdd,
  onUpdate,
  task,
}: {
  onClose: () => void;
  onAdd: (task: Omit<KanbanTask, "id">) => void;
  onUpdate?: (task: KanbanTask) => void;
  task?: KanbanTask | null;
}) {
  const [description, setDescription] = useState(task?.description ?? "");
  const [assignAll, setAssignAll] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<number[]>(
    task?.assignees.map((m) => m.id) ?? []
  );
  const [hasDeadline, setHasDeadline] = useState(Boolean(task?.deadline && task.deadline !== "—"));
  const [deadline, setDeadline] = useState(task?.deadline && task.deadline !== "—" ? task.deadline : "");
  const [column, setColumn] = useState<KanbanColumn>(task?.column ?? "Tareas");

  useEffect(() => {
    if (!task) return;
    setDescription(task.description);
    setSelectedMembers(task.assignees.map((m) => m.id));
    setHasDeadline(Boolean(task.deadline && task.deadline !== "—"));
    setDeadline(task.deadline && task.deadline !== "—" ? task.deadline : "");
    setColumn(task.column);
  }, [task]);

  function toggleMember(id: number) {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  function handleAdd() {
    if (!description.trim()) return;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const assignees = assignAll
      ? MEMBERS
      : MEMBERS.filter((m) => selectedMembers.includes(m.id));

    const taskPayload = {
      description: description.trim(),
      assignedDate: task?.assignedDate ?? now,
      deadline: hasDeadline && deadline ? deadline : "—",
      assignees,
      column,
    };

    if (task && onUpdate) {
      onUpdate({ ...task, ...taskPayload });
    } else {
      onAdd(taskPayload);
    }

    onClose();
  }

  return (
    <>
      <div
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
        aria-label="Agregar tarea"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-foreground font-semibold text-base">
              {task ? "Editando tarea" : "Agregando tarea"}
            </h2>
            <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
              Se puede definir una tarea para un miembro del equipo o el equipo completo
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors mt-0.5 shrink-0"
            aria-label="Cerrar"
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-muted-foreground text-xs font-medium">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Lorem ipsum dolor sit amet consectetur..."
            className={cn(inputClass, "resize-none leading-relaxed")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-muted-foreground text-xs font-medium">Columna</label>
          <select
            value={column}
            onChange={(e) => setColumn(e.target.value as KanbanColumn)}
            className={inputClass}
          >
            {COLUMNS.map((col) => (
              <option key={col.id} value={col.id}>
                {col.id}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-foreground text-xs">Asignar a todo el equipo</span>
          <input
            type="checkbox"
            checked={assignAll}
            onChange={(e) => setAssignAll(e.target.checked)}
            className={checkboxClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-foreground text-xs font-medium">Integrantes:</span>

          {MEMBERS.map((m) => (
            <div key={m.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCircle size={24} className="text-muted-foreground" />
                <span className="text-foreground text-xs">{m.name}</span>
              </div>
              <input
                type="checkbox"
                checked={assignAll || selectedMembers.includes(m.id)}
                disabled={assignAll}
                onChange={() => toggleMember(m.id)}
                className={cn(checkboxClass, "disabled:opacity-40")}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-foreground text-xs">Fecha límite</span>
          <input
            type="checkbox"
            checked={hasDeadline}
            onChange={(e) => setHasDeadline(e.target.checked)}
            className={checkboxClass}
          />
        </div>

        {hasDeadline && (
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className={inputClass}
          />
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleAdd}
          className={cn(headerButtonClass, "mt-auto justify-center")}
          type="button"
        >
          <Plus size={14} />
          {task ? "Guardar" : "Agregar"}
        </motion.button>
      </motion.div>
    </>
  );
}

/* ─── Main View ──────────────────────────────────────────────────────────────── */

export function KanbanView() {
  const [tasks, setTasks] = useState<KanbanTask[]>(MOCK_KANBAN_TASKS);
  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState<KanbanTask | null>(null);
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [overColumn, setOverColumn] = useState<KanbanColumn | null>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Track which column each task belongs to for efficient lookup
  const taskById = useRef<Map<number, KanbanTask>>(new Map());
  tasks.forEach((t) => taskById.current.set(t.id, t));

  function onDragStart(event: DragStartEvent) {
    const task = taskById.current.get(event.active.id as number);
    if (task) setActiveTask(task);
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id;

    // Determine the column we're hovering over
    const overTask = tasks.find((t) => t.id === overId);
    const targetColumn: KanbanColumn | null = overTask
      ? overTask.column
      : (COLUMNS.find((c) => c.id === overId)?.id ?? null);

    if (!targetColumn) return;
    setOverColumn(targetColumn);

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask || activeTask.column === targetColumn) return;

    // Move card to new column immediately for visual feedback
    setTasks((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, column: targetColumn } : t))
    );
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    setOverColumn(null);

    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id as number;

    if (activeId === overId) return;

    // Reorder within the same column
    setTasks((prev) => {
      const activeIndex = prev.findIndex((t) => t.id === activeId);
      const overIndex = prev.findIndex((t) => t.id === overId);
      if (activeIndex !== -1 && overIndex !== -1) {
        return arrayMove(prev, activeIndex, overIndex);
      }
      return prev;
    });
  }

  function handleAddTask(task: Omit<KanbanTask, "id">) {
    setTasks((prev) => [...prev, { ...task, id: Date.now() }]);
  }

  function handleUpdateTask(updatedTask: KanbanTask) {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? { ...updatedTask } : t))
    );
    setEditTask(null);
    toast({ title: "Tarea actualizada", description: "Los cambios en la tarea se guardaron." });
  }

  function handleDeleteTask(taskId: number) {
    const confirmed = window.confirm("¿Estás seguro de que deseas eliminar esta tarea?");
    if (!confirmed) return;

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    toast({ title: "Tarea eliminada", description: "Se ha eliminado la tarea correctamente." });
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 md:px-8 py-4 border-b border-border shrink-0">
        <h1 className="text-foreground font-semibold text-lg">Kanban</h1>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowCreate(true)}
          className={headerButtonClass}
          type="button"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">Crear tarea</span>
          <span className="sm:hidden">Nueva</span>
        </motion.button>
      </header>

      {/* Board */}
      <div className="flex flex-col flex-1 overflow-hidden px-4 md:px-6 pt-5 pb-4 gap-4">
        <h2 className="text-foreground font-semibold text-base shrink-0">
          Equipo de Recursos Humanos
        </h2>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          {/* Columns */}
          <div className="flex gap-3 flex-1 overflow-x-auto overflow-y-hidden pb-2">
            {COLUMNS.map((col) => (
              <KanbanColumnPanel
                key={col.id}
                config={col}
                tasks={tasks.filter((t) => t.column === col.id)}
                isOver={overColumn === col.id}
                onEditTask={(task) => setEditTask(task)}
                onDeleteTask={handleDeleteTask}
              />
            ))}
          </div>

          {/* Drag overlay — ghost card following cursor */}
          <DragOverlay>
            {activeTask ? (
              <div className="rotate-1 shadow-2xl opacity-90 w-[220px]">
                <TaskCardContent task={activeTask} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Create task sidebar */}
      <AnimatePresence>
        {showCreate && (
          <CreateTaskSidebar
            onClose={() => setShowCreate(false)}
            onAdd={handleAddTask}
          />
        )}
        {editTask && (
          <CreateTaskSidebar
            task={editTask}
            onClose={() => setEditTask(null)}
            onAdd={handleAddTask}
            onUpdate={handleUpdateTask}
          />
        )}
      </AnimatePresence>
    </div>
  );
}