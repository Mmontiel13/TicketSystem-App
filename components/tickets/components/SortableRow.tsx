"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { RemainingBar, PriorityBadge, StatusBadge, TypeIcon } from "@/components/ticket-cells";
import { getTeamIcon } from "@/lib/team-icons";
import { getUserIcon } from "@/lib/user-icons";
import type { IconUserId } from "@/lib/user-context";

import type { Ticket } from "../tickets.types";
import { isExpiredAt } from "../tickets.types";
import { ClientTime } from "./ClientTime";
import { StatusDropdown } from "./StatusDropdown";

export function SortableRow({
  ticket,
  selected,
  onToggle,
  nowMs,
  isAdmin,
  isExpanded,
  onToggleExpand,
  onStatusChange,
  onDelete,
  myUserId,
}: {
  ticket: Ticket;
  selected: boolean;
  onToggle: () => void;
  nowMs: number;
  isAdmin: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStatusChange: (status: Ticket["status"]) => void;
  onDelete: (ticket: Ticket) => void;
  myUserId: number | null;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: ticket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 0.8,
  };

  const expired = isExpiredAt(ticket, nowMs);
  const truncated = ticket.description.length > 60;
  const description =
    isExpanded || !truncated ? ticket.description : `${ticket.description.slice(0, 60)}...`;

  const TeamIcon = getTeamIcon(ticket.team_icon_id ?? undefined);
  const UserIcon = getUserIcon(ticket.user_avatar_icon as IconUserId);

  return (
    <motion.tr
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: isDragging ? 0.4 : 1 }}
      className={cn(
        "border-b border-border/60 transition-colors",
        selected ? "bg-accent/40" : "hover:bg-accent/50",
      )}
      {...attributes}
    >
      <td className="px-3 py-3 cursor-grab" {...listeners}>
        <GripVertical size={14} className="text-muted-foreground" />
      </td>

      <td className="px-2 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="accent-[color:var(--color-primary)]"
          aria-label={`Seleccionar ${ticket.id}`}
        />
      </td>

      <td className="px-3 py-3 max-w-55 min-w-[200px]">
        <button
          onClick={onToggleExpand}
          className="text-left w-full"
          aria-label={`Expandir descripción ${ticket.id}`}
          type="button"
        >
          <span className="text-foreground text-xs block" title={ticket.description}>
            {description}
          </span>
          {truncated && (
            <span className="text-[10px] text-muted-foreground">
              {isExpanded ? "Mostrar menos" : "Mostrar más"}
            </span>
          )}
        </button>
      </td>

      <td className="px-3 py-3 min-w-[80px]">
        <TypeIcon type={ticket.type} />
      </td>

      <td className="px-3 py-3 min-w-[80px]">
        <PriorityBadge priority={ticket.priority} expired={expired} status={ticket.status} />
      </td>

      <td className="px-3 py-3 min-w-[100px]">
        <RemainingBar
          arrivalTime={ticket.arrival_time}
          maxWaitMinutes={ticket.max_wait_minutes}
          status={ticket.status}
        />
      </td>

      <td className="px-3 py-3 min-w-[120px]">
        {isAdmin ? (
          <StatusDropdown value={ticket.status} onChange={onStatusChange} disabled={expired} />
        ) : (
          <StatusBadge status={ticket.status} />
        )}
      </td>

      <td className="px-3 py-3 text-foreground text-xs tabular-nums whitespace-nowrap min-w-[80px]">
        <ClientTime iso={ticket.arrival_time} />
      </td>

      <td className="px-3 py-3 min-w-[100px]">
        <span className="flex items-center gap-1.5 text-xs text-foreground">
          <TeamIcon size={14} className="text-muted-foreground" />
          {ticket.area}
        </span>
      </td>

      <td className="px-3 py-3 min-w-[120px]">
        <span className="flex items-center gap-1.5 text-xs text-foreground">
          <UserIcon size={14} className="text-muted-foreground" />
          {ticket.usuario}
        </span>
      </td>

      <td className="px-3 py-3 min-w-[80px]">
        {(isAdmin || ticket.user_id === myUserId) && (
          <button
            type="button"
            onClick={() => onDelete(ticket)}
            className="text-xs text-destructive hover:text-destructive/80 transition-colors"
          >
            Eliminar
          </button>
        )}
      </td>
    </motion.tr>
  );
}