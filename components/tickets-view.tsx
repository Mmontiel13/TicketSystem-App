"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/lib/user-context";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { MOCK_TICKETS, type Ticket } from "@/lib/mock-tickets";
import {
  RemainingBar,
  PriorityBadge,
  StatusBadge,
  TypeIcon,
} from "@/components/ticket-cells";
import { CreateTicketModal } from "@/components/create-ticket-modal";

/* ─── Client-only time ────────────────────────────────────────────────────────── */

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

const PRIORITY_ORDER: Record<string, number> = { Alta: 0, Media: 1, Baja: 2 };

function isExpiredAt(ticket: Ticket, nowMs: number): boolean {
  const elapsed = nowMs - new Date(ticket.arrival_time).getTime();
  return elapsed >= ticket.max_wait_minutes * 60 * 1000;
}

/* ─── Sortable table row ─────────────────────────────────────────────────────── */

function SortableRow({
  ticket,
  selected,
  onToggle,
  nowMs,
  isAdmin,
  isExpanded,
  onToggleExpand,
  onStatusChange,
}: {
  ticket: Ticket;
  selected: boolean;
  onToggle: () => void;
  nowMs: number;
  isAdmin: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStatusChange: (status: Ticket['status']) => void;
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
    opacity: isDragging ? 0.4 : 1,
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
        selected ? "bg-zinc-800/40" : "hover:bg-accent/50",
      )}
      {...attributes}
    >
      <td className="px-3 py-3 cursor-grab" {...listeners}>
        <GripVertical size={14} className="text-zinc-600" />
      </td>

      <td className="px-2 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="accent-white"
          aria-label={`Seleccionar ${ticket.id}`}
        />
      </td>

      <td className="px-3 py-3 max-w-[220px]">
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
            <span className="text-[10px] text-zinc-400">
              {isExpanded ? "Mostrar menos" : "Mostrar más"}
            </span>
          )}
        </button>
      </td>

      <td className="px-3 py-3">
        <TypeIcon type={ticket.type} />
      </td>

      <td className="px-3 py-3">
        <PriorityBadge
          priority={ticket.priority}
          expired={expired}
        />
      </td>

      <td className="px-3 py-3">
        <RemainingBar
          arrivalTime={ticket.arrival_time}
          maxWaitMinutes={ticket.max_wait_minutes}
          status={ticket.status}
        />
      </td>

      <td className="px-3 py-3">
        {isAdmin ? (
          <select
            aria-label={`Estado de ${ticket.id}`}
            value={ticket.status}
            onChange={(e) => onStatusChange(e.target.value as Ticket['status'])}
            className={cn(
              "appearance-none min-w-[120px] rounded-md border p-1 px-2 text-xs font-medium transition-colors",
              "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500",
              "focus-visible:border-primary focus-visible:ring-primary/40 focus-visible:outline-none focus-visible:ring-1",
              "dark:border-zinc-700 dark:bg-zinc-950/90 dark:text-white",
              "hover:border-zinc-500 dark:hover:border-zinc-400",
              expired ? "opacity-60 cursor-not-allowed" : ""
            )}
            disabled={expired}
          >
            <option value="Pendiente">Pendiente</option>
            <option value="En proceso">En proceso</option>
            <option value="Terminada">Terminada</option>
          </select>
        ) : (
          <StatusBadge status={ticket.status} />
        )}
      </td>

      <td className="px-3 py-3 text-foreground text-xs tabular-nums whitespace-nowrap">
        <ClientTime iso={ticket.arrival_time} />
      </td>

      <td className="px-3 py-3">
        <span className="flex items-center gap-1.5 text-xs text-foreground">
          <Users size={12} className="text-zinc-500" />
          {ticket.area}
        </span>
      </td>

      <td className="px-3 py-3">
        <span className="flex items-center gap-1.5 text-xs text-foreground">
          <UserCircle size={14} className="text-zinc-500" />
          {ticket.usuario}
        </span>
      </td>
    </motion.tr>
  );
}

/* ─── Mobile ticket card ─────────────────────────────────────────────────────── */

function MobileTicketCard({
  ticket,
  nowMs,
  isAdmin,
  isExpanded,
  onToggleExpand,
  onStatusChange,
}: {
  ticket: Ticket;
  nowMs: number;
  isAdmin: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStatusChange: (status: Ticket['status']) => void;
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
          <p className="text-zinc-200 text-sm leading-relaxed">
            {description}
          </p>
          {truncated && (
            <span className="text-[10px] text-zinc-400">
              {isExpanded ? "Mostrar menos" : "Mostrar más"}
            </span>
          )}
        </button>
        <PriorityBadge
          priority={ticket.priority}
          expired={expired}
        />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <TypeIcon type={ticket.type} />
        {isAdmin ? (
          <select
            aria-label={`Estado de ${ticket.id}`}
            value={ticket.status}
            onChange={(e) => onStatusChange(e.target.value as Ticket['status'])}
            className={cn(
              "appearance-none min-w-[120px] rounded-md border p-1 px-2 text-xs font-medium transition-colors",
              "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500",
              "focus-visible:border-primary focus-visible:ring-primary/40 focus-visible:outline-none focus-visible:ring-1",
              "dark:border-zinc-700 dark:bg-zinc-950/90 dark:text-white",
              "hover:border-zinc-500 dark:hover:border-zinc-400",
              expired ? "opacity-60 cursor-not-allowed" : ""
            )}
            disabled={expired}
          >
            <option value="Pendiente">Pendiente</option>
            <option value="En proceso">En proceso</option>
            <option value="Terminada">Terminada</option>
          </select>
        ) : (
          <StatusBadge status={ticket.status} />
        )}
        <span className="text-zinc-500 text-xs tabular-nums">
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
    </motion.div>
  );
}

/* ─── Main View ──────────────────────────────────────────────────────────────── */

export function TicketsView() {
  const { user } = useUser();
  const { toast } = useToast();
  const isAdmin = user.role === "admin";

  const [tab, setTab] = useState<Tab>("Todos");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [sortOpen, setSortOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [nowMs, setNowMs] = useState(0);

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

  const handleStatusChange = (ticketId: string, nextStatus: Ticket['status']) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;

        const expired = isExpiredAt(t, nowMs);
        if (expired && nextStatus === 'En proceso') {
          toast({
            title: 'No se puede avanzar',
            description: 'Este ticket ya ha vencido y no puede pasar a En proceso.',
          });
          return t;
        }

        return { ...t, status: nextStatus };
      }),
    );
  };

  const handleAddTicket = (data: {
    description: string;
    type: string;
    maxWaitMinutes: number;
  }) => {
    const newTicket: Ticket = {
      id: `TK-${String(tickets.length + 1).padStart(3, "0")}`,
      description: data.description,
      type: data.type as Ticket["type"],
      priority: "Media",
      status: "Pendiente",
      arrival_time: new Date().toISOString(),
      max_wait_minutes: data.maxWaitMinutes,
      area: "Progra",
      usuario: "Usuario",
    };
    setTickets((prev) => [newTicket, ...prev]);
  };

  const SORT_LABELS: Record<SortKey, string> = {
    default: "Default",
    prioridad: "Prioridad",
    llegada: "Llegada",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-border">
        <h1 className="text-foreground text-xl font-semibold">Tickets</h1>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-colors"
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
                tab === t ? "bg-zinc-700 text-white" : "text-muted-foreground hover:text-white",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            onClick={() => setSortOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-700 bg-card/80 text-foreground text-sm hover:border-zinc-600 transition-colors"
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
                className="absolute right-0 mt-1 w-44 rounded-xl border border-zinc-700/60 z-30 overflow-hidden"
                style={{
                  background: "rgba(24,24,27,0.90)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                }}
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
                      sortKey === k ? "text-white" : "text-muted-foreground hover:text-white",
                    )}
                  >
                    {SORT_LABELS[k]}
                    {sortKey === k && (
                      <span className="w-1 h-4 rounded-full bg-white inline-block" />
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
        <div className="rounded-xl border border-border overflow-hidden">
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
                        className="accent-white"
                        aria-label="Seleccionar todos"
                      />
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">
                      Check
                    </th>
                    <th className="px-3 py-3 text-left">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <LayoutGrid size={12} />
                        Tipo
                      </span>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">
                      Prioridad
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">
                      Restante
                    </th>
                    <th className="px-3 py-3 text-left">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <LayoutGrid size={12} />
                        Status
                      </span>
                    </th>
                    <th className="px-3 py-3 text-left">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Clock size={12} />
                        Llegada
                      </span>
                    </th>
                    <th className="px-3 py-3 text-left">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Users size={12} />
                        Área
                      </span>
                    </th>
                    <th className="px-3 py-3 text-left">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <UserCircle size={12} />
                        Usuario
                      </span>
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
                          colSpan={10}
                          className="px-4 py-10 text-center text-zinc-500 text-sm"
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
                        />
                      ))
                    )}
                  </tbody>
                </SortableContext>
              </table>
            </DndContext>
          ) : (
            <div className="p-6 text-sm text-zinc-500">Cargando…</div>
          )}
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden flex-1 px-4 overflow-auto">
        <div className="flex flex-col gap-3 py-2">
          <AnimatePresence mode="popLayout">
            {pageData.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-8">
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
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-700 text-foreground hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Página anterior"
        >
          <ChevronDown size={14} className="rotate-90" />
        </button>

        <span className="text-xs text-zinc-500 tabular-nums">
          {page + 1} / {Math.max(1, totalPages)}
        </span>

        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-700 text-foreground hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Página siguiente"
        >
          <ChevronDown size={14} className="-rotate-90" />
        </button>
      </div>

      <CreateTicketModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddTicket}
      />
    </div>
  );
}