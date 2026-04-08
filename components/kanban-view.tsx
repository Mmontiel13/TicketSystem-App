"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useUser } from "@/lib/user-context";
import { createClient } from "@/lib/supabase/client";
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
  useDroppable,
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
  Ghost,
  Rose,
  Rabbit,
  Fish,
  Cat,
  Menu,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveIcon } from "@/components/responsive-icon";

/* ─── Types ─────────────────────────────────────────────────────────────────── */

export type KanbanColumn = "Tareas" | "En proceso" | "Pendiente" | "Terminada";
export type IconUserId = "Ghost" | "Rose" | "Rabbit" | "Users" | "Fish" | "Cat";

export interface KanbanMember {
  id: number;
  full_name: string;
  avatar_icon: IconUserId;
}

export interface KanbanTask {
  id: string;
  dbId: number;
  title: string;
  description: string;
  status: KanbanColumn;
  start_date: string;
  end_date: string;
  assigned_to: number[];
  team_id: number;
}

export const ICON_MAP: Record<IconUserId, React.ElementType> = {
  Ghost,
  Rose,
  Rabbit,
  Users: UserCircle,
  Fish,
  Cat,
};

/* ─── Column config ──────────────────────────────────────────────────────────── */

interface ColumnConfig {
  id: KanbanColumn;
  icon: React.ElementType;
  iconClass: string;
}

const COLUMNS: ColumnConfig[] = [
  { id: "Tareas", icon: ListTodo, iconClass: "text-foreground" },
  { id: "En proceso", icon: Loader, iconClass: "text-foreground animate-spin" },
  { id: "Pendiente", icon: MinusCircle, iconClass: "text-foreground" },
  {
    id: "Terminada",
    icon: CheckCircle2,
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
];

/* ─── Shared classes ─────────────────────────────────────────────────────────── */

const headerButtonClass =
  "flex items-center gap-2 rounded-md bg-primary text-primary-foreground text-xs sm:text-sm px-3 sm:px-4 py-2 transition-colors hover:opacity-90";

const sidebarSurfaceClass =
  "fixed right-0 top-0 z-50 h-full w-full sm:w-80 border-l border-border p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 overflow-y-auto " +
  "bg-popover/90 backdrop-blur-xl text-popover-foreground";

const inputClass =
  "w-full rounded-md border border-input bg-background text-foreground text-xs px-3 py-2 outline-none " +
  "placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring focus:border-ring transition-colors";

const checkboxClass = "w-4 h-4 rounded border-border accent-primary cursor-pointer";

/* ─── TaskCard ───────────────────────────────────────────────────────────────── */

function TaskCardContent({
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

  const assignedMembers = members.filter((m) => task.assigned_to.includes(m.id));
  const descSnippet = task.description.length > 60 ? task.description.slice(0, 60) + "..." : task.description;

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-2 sm:p-3 flex flex-col gap-1.5 sm:gap-2 select-none",
        isDragging && "opacity-50 ring-1 ring-ring/20"
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <ResponsiveIcon icon={GripVertical} smSize={12} mdSize={14} className="text-muted-foreground cursor-grab" />
        
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
                  onEdit!(task);
                }}
                className="w-full text-left px-2 py-1.5 hover:bg-accent/70 text-foreground text-[10px] sm:text-xs"
              >
                Editar
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDelete!(task.id);
                }}
                className="w-full text-left px-2 py-1.5 hover:bg-accent/70 text-red-500 text-[10px] sm:text-xs"
              >
                Eliminar
              </button>
            </motion.div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-foreground font-medium text-[10px] sm:text-xs line-clamp-2">{task.title}</p>
        <p className="text-foreground/70 text-[9px] sm:text-[11px] leading-relaxed line-clamp-2">{descSnippet}</p>
      </div>

      <div className="flex gap-2 text-[8px] sm:text-[10px]">
        <div className="flex-1">
          <span className="text-foreground/50">Inicio</span>
          <p className="text-foreground/70 tabular-nums">
            {new Date(task.start_date).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}
          </p>
        </div>
        <div className="flex-1">
          <span className="text-foreground/50">Vencimiento</span>
          <p className="text-foreground/70 tabular-nums">
            {new Date(task.end_date).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}
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
                  <ResponsiveIcon icon={Icon} smSize={10} mdSize={14} className="text-foreground/70" />
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
  );
}

/* ─── Sortable Task Card ────────────────────────────────────────────────────── */

function SortableTaskCard({
  task,
  members,
  onEdit,
  onDelete,
}: {
  task: KanbanTask;
  members: KanbanMember[];
  onEdit: (task: KanbanTask) => void;
  onDelete: (taskId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { column: task.status } });

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
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      <TaskCardContent
        task={task}
        members={members}
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
      {/* Column header */}
      <div className="flex items-center justify-between px-0.5 sm:px-1">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <ResponsiveIcon icon={Icon} smSize={12} mdSize={15} className={config.iconClass} />
          <span className="text-foreground text-xs sm:text-sm font-medium truncate">{config.id}</span>
          <span className="text-foreground text-[10px] sm:text-xs tabular-nums ml-1 bg-muted px-1.5 rounded">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Cards */}
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
            <span className="text-foreground/50 text-[10px] sm:text-sm text-center">Arrastra una tarea aquí</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Create/Edit Task Sidebar ──────────────────────────────────────────────── */

function CreateTaskSidebar({
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
  const [selectedMembers, setSelectedMembers] = useState<number[]>(task?.assigned_to ?? []);
  const [endDate, setEndDate] = useState(
    task?.end_date ? task.end_date.split("T")[0] : ""
  );
  const [status, setStatus] = useState<KanbanColumn>(task?.status ?? "Tareas");
  const [errors, setErrors] = useState<{ title?: string; description?: string; endDate?: string }>({});

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
    const newErrors: { title?: string; description?: string; endDate?: string } = {};

    if (!title.trim()) {
      newErrors.title = "El título es requerido";
    }
    if (!description.trim()) {
      newErrors.description = "La descripción es requerida";
    }
    if (!endDate) {
      newErrors.endDate = "La fecha de vencimiento es requerida";
    }

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

    if (task && onUpdate) {
      onUpdate({ ...task, ...taskPayload });
    } else {
      onAdd(taskPayload);
    }

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
        {/* Close button */}
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
            className={cn(inputClass, "text-xs", errors.title && "border-destructive focus:ring-destructive focus:border-destructive")}
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
            className={cn(inputClass, "resize-none leading-relaxed text-xs", errors.description && "border-destructive focus:ring-destructive focus:border-destructive")}
          />
          {errors.description && <p className="text-destructive text-xs">{errors.description}</p>}
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
            className={cn(inputClass, "text-xs", errors.endDate && "border-destructive focus:ring-destructive focus:border-destructive")}
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
                const Icon = ICON_MAP[m.avatar_icon] || UserCircle;
                return (
                  <label key={m.id} className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ResponsiveIcon icon={Icon} smSize={14} mdSize={18} className="text-foreground shrink-0" />
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

/* ─── Main View ──────────────────────────────────────────────────────────────── */

export function KanbanView() {
  const { user } = useUser();
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();

  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [members, setMembers] = useState<KanbanMember[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState<KanbanTask | null>(null);
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [overColumn, setOverColumn] = useState<KanbanColumn | null>(null);
  const [loading, setLoading] = useState(false);
  const [myTeamId, setMyTeamId] = useState<number | null>(null);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [teamName, setTeamName] = useState<string>("");

  const onEdit = (task: KanbanTask) => {
    setEditTask(task);
    setShowCreate(true);
  };

  const onDelete = async (taskId: string) => {
    if (!confirm("¿Eliminar esta tarea?")) return;
    try {
      await supabase.from("tasks").delete().eq("id", taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast({ title: "Tarea eliminada" });
    } catch (error) {
      console.error("Error deleting task", error);
      toast({ title: "Error eliminando tarea", variant: "destructive" });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const taskById = useRef<Map<string, KanbanTask>>(new Map());
  tasks.forEach((t) => taskById.current.set(t.id, t));

  async function fetchTeamData() {
    setLoading(true);
    try {
      const email = user.email;
      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("id, team_id, role")
        .eq("email", email)
        .single();

      if (userError || !userRow) {
        console.warn("Could not resolve user", userError);
        return;
      }

      const userId = Number(userRow.id);
      const teamId = Number(userRow.team_id);
      setMyUserId(userId);
      setMyTeamId(teamId);

      const { data: teamRow } = await supabase
        .from("teams")
        .select("name")
        .eq("id", teamId)
        .single();

      if (teamRow) setTeamName(teamRow.name ?? "");

      await fetchMembers(teamId);
      await fetchTasks(teamId);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMembers(teamId: number) {
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, avatar_icon")
      .eq("team_id", teamId)
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching team members", error);
      return;
    }

    setMembers(
      (data ?? []).map((m) => ({
        id: Number(m.id),
        full_name: m.full_name ?? "",
        avatar_icon: (m.avatar_icon as IconUserId) || "Users",
      }))
    );
  }

  async function fetchTasks(teamId: number) {
    let query = supabase
      .from("tasks")
      .select("*")
      .eq("team_id", teamId)
      .order("start_date", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching tasks", error);
      return;
    }

    const mapped = (data ?? []).map((row) => ({
      id: `TSK-${String(row.id).padStart(4, "0")}`,
      dbId: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      start_date: row.start_date,
      end_date: row.end_date,
      assigned_to: row.assigned_to ?? [],
      team_id: row.team_id,
    }));

    setTasks(mapped);
  }

  useEffect(() => {
    fetchTeamData();
  }, [user.email]);

  function onDragStart(event: DragStartEvent) {
    const task = taskById.current.get(event.active.id as string);
    if (task) setActiveTask(task);
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id;

    const overTask = tasks.find((t) => t.id === overId);
    const targetColumn: KanbanColumn | null = overTask
      ? overTask.status
      : (COLUMNS.find((c) => c.id === overId)?.id ?? null);

    if (!targetColumn) return;
    setOverColumn(targetColumn);

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask || activeTask.status === targetColumn) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, status: targetColumn } : t))
    );
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    setOverColumn(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const task = tasks.find((t) => t.id === activeId);
    if (!task) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: task.status })
        .eq("id", task.dbId);

      if (error) {
        console.error("Error updating task status:", error);
        toast({
          title: "Error al actualizar",
          description: "No se pudo cambiar el estado de la tarea.",
          variant: "destructive",
        });
        await fetchTasks(myTeamId!);
        return;
      }

      toast({
        title: "Estado actualizado",
        description: `Tarea movida a ${task.status}`,
      });

      if (activeId !== overId) {
        setTasks((prev) => {
          const activeIndex = prev.findIndex((t) => t.id === activeId);
          const overIndex = prev.findIndex((t) => t.id === overId);
          if (activeIndex !== -1 && overIndex !== -1) {
            return arrayMove(prev, activeIndex, overIndex);
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Exception updating task:", err);
      toast({
        title: "Error",
        description: "No se pudo guardar el cambio.",
        variant: "destructive",
      });
    }
  }

  async function handleAddTask(task: Omit<KanbanTask, "id" | "dbId">) {
    if (!myTeamId) return;

    const { error } = await supabase.from("tasks").insert([
      {
        title: task.title,
        description: task.description,
        status: task.status,
        start_date: new Date().toISOString(),
        end_date: task.end_date,
        assigned_to: task.assigned_to,
        team_id: myTeamId,
      },
    ]);

    if (error) {
      toast({
        title: "Error al crear tarea",
        description: "No se pudo guardar",
      });
      console.error(error);
      return;
    }

    toast({ title: "Tarea creada", description: "Se agregó correctamente." });
    setShowCreate(false);
    await fetchTasks(myTeamId);
  }

  async function handleUpdateTask(task: KanbanTask) {
    const { error } = await supabase
      .from("tasks")
      .update({
        title: task.title,
        description: task.description,
        status: task.status,
        end_date: task.end_date,
        assigned_to: task.assigned_to,
      })
      .eq("id", task.dbId);

    if (error) {
      toast({
        title: "Error al actualizar",
        description: "No se pudo guardar.",
      });
      console.error(error);
      return;
    }

    setEditTask(null);
    toast({ title: "Tarea actualizada", description: "Cambios guardados." });
    await fetchTasks(myTeamId!);
  }

  async function handleDeleteTask(taskId: string) {
    const confirmed = window.confirm("¿Eliminar esta tarea?");
    if (!confirmed) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", task.dbId);

    if (error) {
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar.",
      });
      return;
    }

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    toast({ title: "Tarea eliminada" });
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-3 sm:px-4 md:px-8 py-3 sm:py-4 border-b border-border shrink-0 gap-2">
        <h1 className="text-foreground font-semibold text-base sm:text-lg md:text-xl">Kanban</h1>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowCreate(true)}
          className={headerButtonClass}
          type="button"
        >
          <ResponsiveIcon icon={Plus} smSize={12} mdSize={14} />
          <span className="hidden sm:inline">Crear tarea</span>
          <span className="sm:hidden text-xs">Nueva</span>
        </motion.button>
      </header>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden px-2 sm:px-4 md:px-6 pt-3 sm:pt-5 pb-3 sm:pb-4 gap-2 sm:gap-4">
        <h2 className="text-foreground font-semibold text-sm sm:text-base shrink-0 truncate">
          {teamName || "Área del Equipo"}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <span className="text-foreground text-sm">Cargando tareas...</span>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
          >
            <div className="flex gap-2 sm:gap-3 flex-1 overflow-x-auto overflow-y-hidden pb-2">
              {COLUMNS.map((col) => (
                <KanbanColumnPanel
                  key={col.id}
                  config={col}
                  tasks={tasks.filter((t) => t.status === col.id)}
                  members={members}
                  isOver={overColumn === col.id}
                  onEditTask={(task) => setEditTask(task)}
                  onDeleteTask={handleDeleteTask}
                />
              ))}
            </div>

            <DragOverlay>
              {activeTask ? (
                <div className="rotate-1 shadow-2xl opacity-90 w-[150px] sm:w-[220px]">
                  <TaskCardContent
                    task={activeTask}
                    members={members}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreate && (
          <CreateTaskSidebar
            onClose={() => setShowCreate(false)}
            onAdd={handleAddTask}
            members={members}
          />
        )}
        {editTask && (
          <CreateTaskSidebar
            task={editTask}
            onClose={() => setEditTask(null)}
            onAdd={handleAddTask}
            onUpdate={handleUpdateTask}
            members={members}
          />
        )}
      </AnimatePresence>
    </div>
  );
}