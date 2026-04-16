import type React from "react";

export type KanbanColumn = "Tareas" | "En proceso" | "Pendiente" | "Terminada";

export type IconUserId =
  | "Ghost"
  | "Rose"
  | "Rabbit"
  | "skulls"
  | "Fish"
  | "Cat"
  | "Users"
  | "VenetianMask"
  | "Volleyball"
  | "Donut"
  | "Hand-metal"
  | "Sticker"
  | "Biohazard";

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