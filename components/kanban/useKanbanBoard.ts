"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSensor, useSensors, PointerSensor, type DragStartEvent, type DragOverEvent, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import { useUser } from "@/lib/user-context";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

import type { KanbanColumn, KanbanMember, KanbanTask, IconUserId } from "./kanban.types";
import { COLUMNS } from "./kanban.config";

export function useKanbanBoard() {
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

  const [confirmDeleteTask, setConfirmDeleteTask] = useState<string | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const taskById = useRef<Map<string, KanbanTask>>(new Map());
  tasks.forEach((t) => taskById.current.set(t.id, t));

  const onEdit = (task: KanbanTask) => {
    setEditTask(task);
    setShowCreate(true);
  };

  const onDelete = (taskId: string) => {
    setConfirmDeleteTask(taskId);
  };

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
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("team_id", teamId)
      .order("start_date", { ascending: false });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const activeTaskLocal = tasks.find((t) => t.id === activeId);
    if (!activeTaskLocal || activeTaskLocal.status === targetColumn) return;

    setTasks((prev) => prev.map((t) => (t.id === activeId ? { ...t, status: targetColumn } : t)));
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
        if (myTeamId) await fetchTasks(myTeamId);
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
          if (activeIndex !== -1 && overIndex !== -1) return arrayMove(prev, activeIndex, overIndex);
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
      toast({ title: "Error al crear tarea", description: "No se pudo guardar" });
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
      toast({ title: "Error al actualizar", description: "No se pudo guardar." });
      console.error(error);
      return;
    }

    setEditTask(null);
    toast({ title: "Tarea actualizada", description: "Cambios guardados." });
    if (myTeamId) await fetchTasks(myTeamId);
  }

  function handleDeleteTask(taskId: string) {
    setConfirmDeleteTask(taskId);
  }

  async function confirmDeleteTaskAction() {
    if (!confirmDeleteTask) return;

    const task = tasks.find((t) => t.id === confirmDeleteTask);
    if (!task) return;

    setIsDeletingTask(true);

    const { error } = await supabase.from("tasks").delete().eq("id", task.dbId);

    if (error) {
      toast({ title: "Error al eliminar", description: "No se pudo eliminar." });
      setIsDeletingTask(false);
      setConfirmDeleteTask(null);
      return;
    }

    setTasks((prev) => prev.filter((t) => t.id !== confirmDeleteTask));
    toast({ title: "Tarea eliminada" });
    setIsDeletingTask(false);
    setConfirmDeleteTask(null);
  }

  return {
    // data
    tasks,
    members,
    loading,
    teamName,

    // ui state
    showCreate,
    setShowCreate,
    editTask,
    setEditTask,
    activeTask,
    overColumn,

    // delete modal
    confirmDeleteTask,
    isDeletingTask,
    setConfirmDeleteTask,
    confirmDeleteTaskAction,

    // actions
    onEdit,
    onDelete,
    handleDeleteTask,
    handleAddTask,
    handleUpdateTask,

    // dnd
    sensors,
    onDragStart,
    onDragOver,
    onDragEnd,
  };
}