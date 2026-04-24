import type { IconUserId } from "@/lib/user-context";

export type Tab = "Todos" | "Pendientes" | "Completados";
export type SortKey = "default" | "prioridad" | "llegada";

export type TicketType = "computo" | "impresora" | "red" | "crm" | "programas" | "otro";
export type TicketStatus = "Pendiente" | "En proceso" | "Terminada";
export type TicketPriority = "Alta" | "Media" | "Baja" | "Vencido";

export interface Ticket {
  id: string; // UI id: "TK-001"
  dbId: number;
  description: string;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  arrival_time: string;
  max_wait_minutes: number;

  area: string;
  team_id: number;
  team_icon_id: string | null;

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

export const PRIORITY_ORDER: Record<TicketPriority, number> = {
  Alta: 0,
  Media: 1,
  Baja: 2,
  Vencido: 3,
};

export function isExpiredAt(ticket: Pick<Ticket, "arrival_time" | "max_wait_minutes" | "status">, nowMs: number) {
  if (ticket.status === "Terminada") return false;
  const start = new Date(ticket.arrival_time).getTime();
  const max = ticket.max_wait_minutes * 60_000;
  return nowMs > start + max;
}