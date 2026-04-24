"use client";

import { motion } from "framer-motion";
import { RemainingBar, PriorityBadge, StatusBadge, TypeIcon } from "@/components/ticket-cells";
import { getTeamIcon } from "@/lib/team-icons";
import { getUserIcon } from "@/lib/user-icons";
import type { IconUserId } from "@/lib/user-context";

import type { Ticket } from "../tickets.types";
import { isExpiredAt } from "../tickets.types";
import { ClientTime } from "./ClientTime";
import { StatusDropdown } from "./StatusDropdown";

export function MobileTicketCard({
  ticket,
  nowMs,
  isAdmin,
  isExpanded,
  onToggleExpand,
  onStatusChange,
  onDelete,
  myUserId,
}: {
  ticket: Ticket;
  nowMs: number;
  isAdmin: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStatusChange: (status: Ticket["status"]) => void;
  onDelete: (ticket: Ticket) => void;
  myUserId: number | null;
}) {
  const expired = isExpiredAt(ticket, nowMs);
  const truncated = ticket.description.length > 80;
  const description =
    isExpanded || !truncated ? ticket.description : `${ticket.description.slice(0, 80)}...`;

  const TeamIcon = getTeamIcon(ticket.team_icon_id ?? undefined);
  const UserIcon = getUserIcon(ticket.user_avatar_icon as IconUserId);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      whileHover={{ scale: 1.01 }}
      className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={onToggleExpand}
          className="text-left flex-1"
          aria-label={`Expandir descripción ${ticket.id}`}
          type="button"
        >
          <p className="text-foreground text-sm leading-relaxed">{description}</p>
          {truncated && (
            <span className="text-[10px] text-muted-foreground">
              {isExpanded ? "Mostrar menos" : "Mostrar más"}
            </span>
          )}
        </button>
        <PriorityBadge priority={ticket.priority} expired={expired} status={ticket.status} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <TypeIcon type={ticket.type} />

        {isAdmin ? (
          <StatusDropdown value={ticket.status} onChange={onStatusChange} disabled={expired} />
        ) : (
          <StatusBadge status={ticket.status} />
        )}

        <span className="text-foreground text-xs tabular-nums">
          <ClientTime iso={ticket.arrival_time} />
        </span>
      </div>

      <RemainingBar
        arrivalTime={ticket.arrival_time}
        maxWaitMinutes={ticket.max_wait_minutes}
        status={ticket.status}
      />

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <TeamIcon size={12} />
          {ticket.area}
        </span>

        <span className="flex items-center gap-1">
          <UserIcon size={11} />
          {ticket.usuario}
        </span>
      </div>

      {(isAdmin || ticket.user_id === myUserId) && (
        <button
          type="button"
          onClick={() => onDelete(ticket)}
          className="text-xs text-destructive hover:text-destructive/80 transition-colors"
        >
          Eliminar
        </button>
      )}
    </motion.div>
  );
}