"use client";

import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  "flex items-center gap-2 rounded-md bg-primary text-primary-foreground text-sm px-4 py-2 transition-colors hover:opacity-90";

const sidebarSurfaceClass =
  "fixed right-0 top-0 z-50 h-full w-[300px] border-l border-border p-6 flex flex-col gap-5 overflow-y-auto " +
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
                  onEdit!(task);
                }}
                className="w-full text-left px-2 py-1.5 hover:bg-accent/70 text-foreground"
              >
                Editar
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDelete!(task.id);
                }}
                className="w-full text-left px-2 py-1.5 hover:bg-accent/70 text-red-500"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-foreground font-medium text-xs">{task.title}</p>
        <p className="text-foreground/70 text-[11px] leading-relaxed">{descSnippet}</p>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-foreground/50 text-[10px]">Inicio</span>
        <span className="text-foreground/70 text-[11px] tabular-nums">
          {new Date(task.start_date).toLocaleDateString()}
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-foreground/50 text-[10px]">Vencimiento</span>
        <span className="text-foreground/70 text-[11px] tabular-nums">
          {new Date(task.end_date).toLocaleDateString()}
        </span>
      </div>

      {assignedMembers.length > 0 && (
        <div className="flex items-center gap-2 mt-1 pt-2 border-t border-border">
          <span className="text-foreground/50 text-[10px]">Asignado:</span>
          <div className="flex -space-x-2">
            {assignedMembers.slice(0, 4).map((m) => {
              const Icon = ICON_MAP[m.avatar_icon] || UserCircle;
              return (
                <div
                  key={m.id}
                  title={m.full_name}
                  className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0"
                >
                  <Icon size={14} className="text-foreground/70" />
                </div>
              );
            })}
            {assignedMembers.length > 4 && (
              <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] text-foreground/70">
                +{assignedMembers.length - 4}
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
      whileHover={{ scale: 1.015 }}
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
        "flex flex-col gap-3 min-w-[220px] flex-1 rounded-lg p-2 transition-colors",
        isOver ? "bg-accent/50 ring-1 ring-ring/20" : "bg-transparent"
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Icon size={15} className={config.iconClass} />
          <span className="text-foreground text-sm font-medium">{config.id}</span>
          <span className="text-foreground text-xs tabular-nums ml-1">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="min-h-[500px] flex flex-col gap-3">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3 overflow-y-auto">
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
          <div className="flex-1 rounded-lg border-2 border-dashed border-foreground/30 bg-muted/5 flex items-center justify-center">
            <span className="text-foreground/50 text-sm">Arrastra una tarea aquí</span>
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
        aria-label={task ? "Editar tarea" : "Agregar tarea"}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-foreground font-semibold text-base">
              {task ? "Editando tarea" : "Agregando tarea"}
            </h2>
            <p className="text-foreground text-xs mt-1 leading-relaxed">
              Completa los detalles y asigna miembros del equipo
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-foreground hover:text-foreground transition-colors mt-0.5 shrink-0"
            aria-label="Cerrar"
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-foreground text-xs font-medium">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nombre de la tarea..."
            className={cn(inputClass, errors.title && "border-destructive focus:ring-destructive focus:border-destructive")}
          />
          {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-foreground text-xs font-medium">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Detalles de la tarea..."
            className={cn(inputClass, "resize-none leading-relaxed", errors.description && "border-destructive focus:ring-destructive focus:border-destructive")}
          />
          {errors.description && <p className="text-destructive text-xs">{errors.description}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-foreground text-xs font-medium">Estado</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as KanbanColumn)}
            className={inputClass}
          >
            {COLUMNS.map((col) => (
              <option key={col.id} value={col.id}>
                {col.id}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-foreground text-xs font-medium">Fecha de vencimiento</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={cn(inputClass, errors.endDate && "border-destructive focus:ring-destructive focus:border-destructive")}
          />
          {errors.endDate && <p className="text-destructive text-xs">{errors.endDate}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-foreground text-xs font-medium">Asignar a:</span>

          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
            {members.length === 0 ? (
              <p className="text-foreground text-xs">No hay miembros en el área.</p>
            ) : (
              members.map((m) => {
                const Icon = ICON_MAP[m.avatar_icon] || UserCircle;
                return (
                  <div key={m.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={18} className="text-foreground" />
                      <span className="text-foreground text-xs">{m.full_name}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(m.id)}
                      onChange={() => toggleMember(m.id)}
                      className={checkboxClass}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
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
  const { user } = useUser();
  const supabase = createClient();
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
      // CORREGIDO: Usa tabla 'tasks' en lugar de 'tickets'
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
    // CORREGIDO: Obtiene tareas de tabla 'tasks' en lugar de 'tickets'
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

  // MODIFICADO: Actualiza el estado en la UI inmediatamente
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

    // Actualizar UI inmediatamente
    setTasks((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, status: targetColumn } : t))
    );
  }

  // MODIFICADO: Guarda el cambio de estado en la BD cuando termina el drag
  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    setOverColumn(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const task = tasks.find((t) => t.id === activeId);
    if (!task) return;

    // NUEVO: Actualizar el estado en la BD
    try {
      const { error } = await supabase
        .from("tasks") // CORREGIDO: Usa tabla 'tasks'
        .update({ status: task.status })
        .eq("id", task.dbId);

      if (error) {
        console.error("Error updating task status:", error);
        toast({
          title: "Error al actualizar",
          description: "No se pudo cambiar el estado de la tarea.",
          variant: "destructive",
        });
        // Recargar tareas si falla
        await fetchTasks(myTeamId!);
        return;
      }

      toast({
        title: "Estado actualizado",
        description: `Tarea movida a ${task.status}`,
      });

      // Reordenar si se mueve a otra tarea
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
      .from("tasks") // CORREGIDO: Usa tabla 'tasks'
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
      .from("tasks") // CORREGIDO: Usa tabla 'tasks'
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

      <div className="flex flex-col flex-1 overflow-hidden px-4 md:px-6 pt-5 pb-4 gap-4">
        <h2 className="text-foreground font-semibold text-base shrink-0">
          {teamName || "Área del Equipo"}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <span className="text-foreground">Cargando tareas...</span>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
          >
            <div className="flex gap-3 flex-1 overflow-x-auto overflow-y-hidden pb-2">
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
                <div className="rotate-1 shadow-2xl opacity-90 w-[220px]">
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