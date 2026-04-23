import type { IconUserId } from "@/components/kanban/kanban.types";

export type Tab = "Todos" | "Pendientes" | "Completados";
export type SortKey = "default" | "prioridad" | "llegada";

export type TicketType =
  | "computo"
  | "impresora"
  | "red"
  | "crm"
  | "programas"
  | "otro";

export type TicketStatus = "Pendiente" | "En proceso" | "Terminada";
export type TicketPriority = "Alta" | "Media" | "Baja" | "Vencido";

export interface Ticket {
  id: string;
  dbId: number;
  description: string;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  arrival_time: string;
  max_wait_minutes: number;

  area: string;
  team_id: number;
  team_icon_id?: string | null;

  usuario: string;
  user_id: number;
  user_avatar_icon: IconUserId;
}

export interface DbTicketRow {
  id: number;
  description: string;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  arrival_time: string;
  max_wait_minutes: number;
  team_id: number;
  user_id: number;
  is_active?: boolean;
  users?: { full_name: string; avatar_icon: IconUserId };
  teams?: { name: string; icon_id?: string | null };
}

export const PRIORITY_ORDER: Record<string, number> = {
  Alta: 0,
  Media: 1,
  Baja: 2,
};

export function isExpiredAt(ticket: Ticket, nowMs: number): boolean {
  const elapsed = nowMs - new Date(ticket.arrival_time).getTime();
  return elapsed >= ticket.max_wait_minutes * 60 * 1000;
}