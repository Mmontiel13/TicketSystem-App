import type React from "react";
import type { IconUserId } from "@/lib/user-context";

export type KanbanColumn = "Tareas" | "En proceso" | "Pendiente" | "Terminada";

export interface KanbanMember {
  id: number;
  full_name: string;
  avatar_icon: IconUserId;
}

export interface KanbanTask {
  id: string; // UI id: "TSK-0001"
  dbId: number; // real DB id
  title: string;
  description: string;
  status: KanbanColumn;
  start_date: string;
  end_date: string;
  assigned_to: number[];
  team_id: number;
}

export interface ColumnConfig {
  id: KanbanColumn;
  icon: React.ElementType;
  iconClass: string;
}