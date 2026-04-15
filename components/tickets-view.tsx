"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@/lib/user-context";
import { createClient } from "@/lib/supabase/client";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
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
  ChevronDown,
  GripVertical,
  Users,
  Clock,
  LayoutGrid,
  UserCircle,
  PlusCircle,
  BadgeDollarSign,
  Computer,
  ShoppingCart,
  BookUser,
  Clapperboard,
  Car,
  EthernetPort,
  Siren,
  Scale,
  ConciergeBell,
  Calculator,
  Trophy,
  PackageOpen,
  SolarPanel,
  HelpCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  RemainingBar,
  PriorityBadge,
  StatusBadge,
  TypeIcon,
} from "@/components/ticket-cells";
import { CreateTicketModal } from "@/components/create-ticket-modal";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { ICON_MAP, type IconUserId } from "@/components/kanban-view";

export const TEAM_ICONS = [
  { id: "BadgeDollarSign", icon: BadgeDollarSign },
  { id: "Computer", icon: Computer },
  { id: "ShoppingCart", icon: ShoppingCart },
  { id: "BookUser", icon: BookUser },
  { id: "Clapperboard", icon: Clapperboard },
  { id: "Car", icon: Car },
  { id: "EthernetPort", icon: EthernetPort },
  { id: "Siren", icon: Siren },
  { id: "Scale", icon: Scale },
  { id: "ConciergeBell", icon: ConciergeBell },
  { id: "Calculator", icon: Calculator },
  { id: "Trophy", icon: Trophy },
  { id: "PackageOpen", icon: PackageOpen },
  { id: "SolarPanel", icon: SolarPanel },
] as const;

export function getTeamIcon(iconId: string) {
  const iconObj = TEAM_ICONS.find(t => t.id === iconId);
  return iconObj ? iconObj.icon : HelpCircle;
}

/* ─── Client-only time ──────────────────────────────────────────────────── */

function ClientTime({ iso }: { iso: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return <>{`${h}:${m}${ampm}`}</>;
}

type Tab = "Todos" | "Pendientes" | "Completados";
type SortKey = "default" | "prioridad" | "llegada";

type TicketType = "computo" | "impresora" | "red" | "crm" | "programas" | "otro";
type TicketStatus = "Pendiente" | "En proceso" | "Terminada";
type TicketPriority = "Alta" | "Media" | "Baja" | "Vencido";

interface Ticket {
  id: string;
  dbId: number;
  description: string;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  arrival_time: string;
  max_wait_minutes: number;
  area: string;
  usuario: string;
  user_id: number;
  team_id: number;
  user_avatar_icon: IconUserId;
}

interface DbTicketRow {
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
  teams?: { name: string };
}

const PRIORITY_ORDER: Record<string, number> = { Alta: 0, Media: 1, Baja: 2 };

function isExpiredAt(ticket: Ticket, nowMs: number): boolean {
  const elapsed = nowMs - new Date(ticket.arrival_time).getTime();
  return elapsed >= ticket.max_wait_minutes * 60 * 1000;
}

/* ─── Status dropdown for mobile ────────────────────────────────────────── */

function StatusDropdown({
  value,
  onChange,
  disabled,
}: {
  value: Ticket["status"];
  onChange: (v: Ticket["status"]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const OPTIONS: Ticket["status"][] = [
    "Pendiente",
    "En proceso",
    "Terminada",
  ];

  return (
    <div className="relative">
      <button
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors min-w-[120px]",
          "border-input bg-background text-foreground",
          "hover:border-ring",
          disabled && "opacity-60 cursor-not-allowed"
        )}
      >
        {value}
        <ChevronDown size={12} />
      </button>

      <AnimatePresence>
        {open && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-1 w-full rounded-xl border border-border bg-popover z-50 overflow-hidden shadow-lg"
          >
            {OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors",
                  "hover:bg-accent/50",
                  value === opt
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt}
                {value === opt && (
                  <span className="w-1 h-4 rounded-full bg-foreground inline-block" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Sortable table row ──────────────────────────────────────────────────── */

function SortableRow({
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
  onStatusChange: (status: Ticket['status']) => void;
  onDelete: (ticket: Ticket) => void;
  myUserId: number | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 0.8,
  };

  const expired = isExpiredAt(ticket, nowMs);
  const truncated = ticket.description.length > 60;
  const description = isExpanded || !truncated
    ? ticket.description
    : `${ticket.description.slice(0, 60)}...`;

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
        >
          <span
            className="text-foreground text-xs block"
            title={ticket.description}
          >
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
        <PriorityBadge
          priority={ticket.priority}
          expired={expired}
          status={ticket.status}
        />
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
          <StatusDropdown
            value={ticket.status}
            onChange={onStatusChange}
            disabled={expired}
          />
        ) : (
          <StatusBadge status={ticket.status} />
        )}
      </td>

      <td className="px-3 py-3 text-foreground text-xs tabular-nums whitespace-nowrap min-w-[80px]">
        <ClientTime iso={ticket.arrival_time} />
      </td>

      <td className="px-3 py-3 min-w-[100px]">
        <span className="flex items-center gap-1.5 text-xs text-foreground">
          <Users size={12} className="text-muted-foreground" />
          {ticket.area}
        </span>
      </td>

      <td className="px-3 py-3 min-w-[120px]">
        <span className="flex items-center gap-1.5 text-xs text-foreground">
          {(() => {
            const UserIcon = ICON_MAP[ticket.user_avatar_icon] || UserCircle;
            return <UserIcon size={14} className="text-muted-foreground" />;
          })()}
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

/* ─── Mobile ticket card ──────────────────────────────────────────────────── */

function MobileTicketCard({
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
  onStatusChange: (status: Ticket['status']) => void;
  onDelete: (ticket: Ticket) => void;
  myUserId: number | null;
}) {
  const expired = isExpiredAt(ticket, nowMs);
  const truncated = ticket.description.length > 80;
  const description = isExpanded || !truncated
    ? ticket.description
    : `${ticket.description.slice(0, 80)}...`;

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
        >
          <p className="text-foreground text-sm leading-relaxed">
            {description}
          </p>
          {truncated && (
            <span className="text-[10px] text-muted-foreground">
              {isExpanded ? "Mostrar menos" : "Mostrar más"}
            </span>
          )}
        </button>
        <PriorityBadge
          priority={ticket.priority}
          expired={expired}
          status={ticket.status}
        />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <TypeIcon type={ticket.type} />

        {isAdmin ? (
          <StatusDropdown
            value={ticket.status}
            onChange={onStatusChange}
            disabled={expired}
          />
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
          <Users size={11} />
          {ticket.area}
        </span>
        <span className="flex items-center gap-1">
          <UserCircle size={11} />
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

/* ─── Main View ──────────────────────────────────────────────────────── */

export function TicketsView() {
  const { user } = useUser();
  const { toast } = useToast();
  const isAdmin = user.role === "admin";
  const supabase = useMemo(() => createClient(), []);

  const [tab, setTab] = useState<Tab>("Todos");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [sortOpen, setSortOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [nowMs, setNowMs] = useState(0);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [myTeamId, setMyTeamId] = useState<number | null>(null);
  const [areaMembers, setAreaMembers] = useState<{ id: number; full_name: string; avatar_icon?: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Estados para el modal de confirmación de eliminación
  const [confirmDelete, setConfirmDelete] = useState<Ticket | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // IMPORTANT: avoid dnd-kit SSR hydration mismatches (aria-describedby IDs)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Filter
  const filtered = tickets.filter((t) => {
    if (tab === "Pendientes")
      return t.status === "Pendiente" || t.status === "En proceso";
    if (tab === "Completados") return t.status === "Terminada";
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "prioridad")
      return (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3);
    if (sortKey === "llegada")
      return (
        new Date(a.arrival_time).getTime() - new Date(b.arrival_time).getTime()
      );
    return 0;
  });

  const PAGE_SIZE = 10;
  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const allSelected = pageData.length > 0 && pageData.every((t) => selected.has(t.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        pageData.forEach((t) => next.delete(t.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        pageData.forEach((t) => next.add(t.id));
        return next;
      });
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setTickets((prev) => {
      const oldIdx = prev.findIndex((t) => t.id === active.id);
      const newIdx = prev.findIndex((t) => t.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  async function fetchAreaMembers(teamId: number | null) {
    if (!teamId) {
      setAreaMembers([]);
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, avatar_icon")
      .eq("team_id", teamId)
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching team members", error);
      setAreaMembers([]);
      return;
    }

    setAreaMembers(data ?? []);
  }

  async function fetchTickets(teamId: number | null, isAdminUser: boolean) {
    setLoading(true);
    try {
      let query = supabase
        .from("tickets")
        .select("*, users(full_name, avatar_icon), teams(name)")
        .eq("is_active", true)
        .order("arrival_time", { ascending: false });

      if (!isAdminUser) {
        if (teamId) {
          query = query.eq("team_id", teamId);
        } else {
          query = query.eq("team_id", -1);
        }
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching tickets", error);
        setTickets([]);
        return;
      }

      const mapped = (data ?? []).map((row) => ({
        id: `TK-${String(row.id).padStart(3, "0")}`,
        dbId: row.id,
        description: row.description,
        type: row.type,
        priority: row.priority,
        status: row.status,
        arrival_time: row.arrival_time,
        max_wait_minutes: row.max_wait_minutes,
        area: row.teams?.name ?? "",
        usuario: row.users?.full_name ?? "",
        user_id: row.user_id,
        team_id: row.team_id,
        user_avatar_icon: row.users?.avatar_icon ?? "Users",
      } as Ticket));

      setTickets(mapped);
    } finally {
      setLoading(false);
    }
  }

  async function loadCurrentUserAndTickets() {
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      let resolvedUserId = user.id;
      let resolvedRole = user.role;
      let resolvedTeamId = myTeamId;

      if (authError) {
        console.warn("No auth session, using context user", authError);
      }

      const email = authData?.user?.email ?? user.email;
      if (email) {
        const { data: userRow, error: userError } = await supabase
          .from("users")
          .select("id, team_id, role")
          .eq("email", email)
          .single();

        if (userError) {
          console.warn("Could not resolve supabase user by email", userError);
        } else if (userRow) {
          resolvedUserId = Number(userRow.id);
          resolvedTeamId = Number(userRow.team_id);
          resolvedRole = (userRow.role as "admin" | "user") ?? resolvedRole;
        }
      }

      setMyUserId(resolvedUserId);
      setMyTeamId(resolvedTeamId);

      await fetchAreaMembers(resolvedTeamId);
      await fetchTickets(resolvedTeamId, resolvedRole === "admin");
    } catch (e) {
      console.error("Error loading tickets", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCurrentUserAndTickets();
  }, [user.role]);

  const handleStatusChange = async (ticketId: string, nextStatus: Ticket["status"]) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    const expired = isExpiredAt(ticket, nowMs);
    if (expired && nextStatus === "En proceso") {
      toast({
        title: "No se puede avanzar",
        description: "Este ticket ya ha vencido y no puede pasar a En proceso.",
      });
      return;
    }

    const { error } = await supabase
      .from("tickets")
      .update({ status: nextStatus })
      .eq("id", ticket.dbId);

    if (error) {
      toast({
        title: "Error actualizando estado",
        description: "No se pudo actualizar el estado del ticket.",
      });
      console.error(error);
      return;
    }

    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: nextStatus } : t)),
    );
  };

  const handleAddTicket = async (data: {
    description: string;
    type: TicketType;
    assignedMemberIds: number[];
    allArea: boolean;
    maxWaitMinutes: number;
  }) => {
    if (!myUserId || !myTeamId) {
      toast({
        title: "Usuario no identificado",
        description: "No se pudo determinar usuario/área para crear ticket.",
      });
      return;
    }

    setLoading(true);
    const arrivalTime = new Date().toISOString();

    try {
      const { data: inserted, error } = await supabase
        .from("tickets")
        .insert([
          {
            description: data.description,
            type: data.type,
            priority: "Media",
            status: "Pendiente",
            arrival_time: arrivalTime,
            max_wait_minutes: data.maxWaitMinutes,
            user_id: myUserId,
            team_id: myTeamId,
            is_active: true,
          },
        ])
        .select("*")
        .single();

      if (error || !inserted) {
        toast({
          title: "Error al crear ticket",
          description: "No se pudo guardar el ticket.",
        });
        console.error(error);
        return;
      }

      toast({
        title: "Ticket creado",
        description: "El ticket fue generado correctamente.",
      });

      await fetchTickets(myTeamId, isAdmin);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Ahora abre el modal de confirmación en lugar de eliminar directo
  const handleDeleteTicket = (ticket: Ticket) => {
    if (!isAdmin && ticket.user_id !== myUserId) {
      toast({
        title: "No autorizado",
        description: "No tienes permiso para eliminar este ticket.",
      });
      return;
    }
    setConfirmDelete(ticket);
  };

  // ✅ Se ejecuta cuando el usuario confirma en el modal
  const confirmDeleteTicket = async () => {
    if (!confirmDelete) return;

    setIsDeleting(true);

    const { error } = await supabase
      .from("tickets")
      .update({ is_active: false })
      .eq("id", confirmDelete.dbId);

    if (error) {
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el ticket.",
      });
      console.error(error);
      setIsDeleting(false);
      return;
    }

    setTickets((prev) => prev.filter((t) => t.dbId !== confirmDelete.dbId));
    toast({
      title: "Ticket eliminado",
      description: "Ticket eliminado correctamente.",
    });
    setConfirmDelete(null);
    setIsDeleting(false);
  };

  const SORT_LABELS: Record<SortKey, string> = {
    default: "Default",
    prioridad: "Prioridad",
    llegada: "Llegada",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="relative flex items-center justify-center sm:justify-between px-4 md:px-8 py-4 border-b border-border">
        <h1 className="text-foreground text-xl font-semibold text-center sm:text-left">Tickets</h1>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setModalOpen(true)}
          className="absolute right-4 md:right-8 sm:relative sm:right-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-colors"
        >
          <PlusCircle size={15} />
          <span className="hidden sm:inline">Crear nuevo</span>
          <span className="sm:hidden">Nuevo</span>
        </motion.button>
      </div>

      {/* Tabs + sort */}
      <div className="flex items-center justify-between px-4 md:px-8 py-3 gap-3 flex-wrap">
        <div className="flex gap-1 bg-card border border-border rounded-lg p-0.5">
          {(["Todos", "Pendientes", "Completados"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setPage(0);
              }}
              className={cn(
                "px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium transition-colors",
                tab === t ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            onClick={() => setSortOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card/80 text-foreground text-sm hover:border-ring transition-colors"
          >
            <ChevronDown size={13} />
            <span className="hidden sm:inline">Ordenar: {SORT_LABELS[sortKey]}</span>
            <span className="sm:hidden">Ordenar</span>
          </button>

          <AnimatePresence>
            {sortOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-1 w-44 rounded-xl border border-border bg-popover z-30 overflow-hidden shadow-lg"
              >
                <div className="px-3 py-2 flex items-center justify-between border-b border-border">
                  <ChevronDown size={12} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Ordenar: {SORT_LABELS[sortKey]}
                  </span>
                </div>
                {(["prioridad", "llegada"] as SortKey[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => {
                      setSortKey(k);
                      setSortOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors",
                      "hover:bg-accent/50",
                      sortKey === k ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {SORT_LABELS[k]}
                    {sortKey === k && (
                      <span className="w-1 h-4 rounded-full bg-foreground inline-block" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Desktop table (client-only to avoid dnd-kit hydration mismatches) */}
      <div className="hidden md:block flex-1 px-8 overflow-auto">
        <div className="rounded-xl border border-border overflow-visible relative">
          {mounted ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="w-8 px-3 py-3" />
                    <th className="w-10 px-2 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="accent-[color:var(--color-primary)]"
                        aria-label="Seleccionar todos"
                      />
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground min-w-[200px]">
                      Descripción
                    </th>
                    <th className="px-3 py-3 text-left min-w-[80px]">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <LayoutGrid size={12} />
                        Tipo
                      </span>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground min-w-[80px]">
                      Prioridad
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground min-w-[100px]">
                      Restante
                    </th>
                    <th className="px-3 py-3 text-left min-w-[120px]">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <LayoutGrid size={12} />
                        Status
                      </span>
                    </th>
                    <th className="px-3 py-3 text-left min-w-[80px]">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Clock size={12} />
                        Llegada
                      </span>
                    </th>
                    <th className="px-3 py-3 text-left min-w-[100px]">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Users size={12} />
                        Área
                      </span>
                    </th>
                    <th className="px-3 py-3 text-left min-w-[120px]">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <UserCircle size={12} />
                        Usuario
                      </span>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground min-w-[80px]">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <SortableContext
                  items={pageData.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <tbody>
                    {pageData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={11}
                          className="px-4 py-10 text-center text-muted-foreground text-sm"
                        >
                          No hay tickets en esta categoría.
                        </td>
                      </tr>
                    ) : (
                      pageData.map((ticket) => (
                        <SortableRow
                          key={ticket.id}
                          ticket={ticket}
                          selected={selected.has(ticket.id)}
                          onToggle={() => toggleOne(ticket.id)}
                          nowMs={nowMs}
                          isAdmin={isAdmin}
                          isExpanded={expandedRows.has(ticket.id)}
                          onToggleExpand={() =>
                            setExpandedRows((prev) => {
                              const next = new Set(prev);
                              next.has(ticket.id) ? next.delete(ticket.id) : next.add(ticket.id);
                              return next;
                            })
                          }
                          onStatusChange={(status) => handleStatusChange(ticket.id, status)}
                          onDelete={handleDeleteTicket}
                          myUserId={myUserId}
                        />
                      ))
                    )}
                  </tbody>
                </SortableContext>
              </table>
            </DndContext>
          ) : (
            <div className="p-6 text-sm text-muted-foreground">Cargando…</div>
          )}
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden flex-1 px-4 overflow-auto">
        <div className="flex flex-col gap-3 py-2">
          <AnimatePresence mode="popLayout">
            {pageData.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No hay tickets en esta categoría.
              </p>
            ) : (
              pageData.map((ticket) => (
                <MobileTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  nowMs={nowMs}
                  isAdmin={isAdmin}
                  isExpanded={expandedRows.has(ticket.id)}
                  onToggleExpand={() =>
                    setExpandedRows((prev) => {
                      const next = new Set(prev);
                      next.has(ticket.id) ? next.delete(ticket.id) : next.add(ticket.id);
                      return next;
                    })
                  }
                  onStatusChange={(status) => handleStatusChange(ticket.id, status)}
                  onDelete={handleDeleteTicket}
                  myUserId={myUserId}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-3 py-4">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Página anterior"
        >
          <ChevronDown size={14} className="rotate-90" />
        </button>

        <span className="text-xs text-muted-foreground tabular-nums">
          {page + 1} / {Math.max(1, totalPages)}
        </span>

        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Página siguiente"
        >
          <ChevronDown size={14} className="-rotate-90" />
        </button>
      </div>

      <CreateTicketModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddTicket}
        members={areaMembers}
      />

      {/* ✅ Modal de confirmación para eliminar ticket */}
      <ConfirmDeleteModal
        open={!!confirmDelete}
        title="¿Eliminar este ticket?"
        description={`Se eliminará el ticket "${confirmDelete?.description.slice(0, 50)}${(confirmDelete?.description.length ?? 0) > 50 ? "..." : ""}". Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar ticket"
        isLoading={isDeleting}
        onConfirm={confirmDeleteTicket}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}