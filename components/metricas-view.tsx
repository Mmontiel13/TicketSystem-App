"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Ticket,
  Users,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/user-context";

type RangeKey = 90 | 30 | 7;
type DataTab = "Tickets" | "Usuarios";

type TicketRow = {
  id: string;
  status: string | null;
  arrival_time: string | null;
};

type UserRow = {
  id: string;
  created_at: string | null;
};

function formatChartLabel(dateString: string) {
  const date = new Date(dateString);
  const month = date.toLocaleString("es-MX", { month: "short" });
  return `${month.charAt(0).toUpperCase() + month.slice(1)} ${date.getDate()}`;
}

function buildTimeSeriesData(
  rows: Array<Record<string, string | null>>,
  dateKey: string,
  days: number,
) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));

  const dateIndex: Record<string, number> = {};
  for (let i = 0; i < days; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    dateIndex[day.toISOString().slice(0, 10)] = 0;
  }

  rows.forEach((row) => {
    const value = row[dateKey];
    if (!value) return;
    const normalized = new Date(value);
    normalized.setHours(0, 0, 0, 0);
    const key = normalized.toISOString().slice(0, 10);
    if (key in dateIndex) {
      dateIndex[key] += 1;
    }
  });

  const labelInterval = days === 7 ? 1 : days === 30 ? 7 : 14;

  return Object.keys(dateIndex).map((dateKeyValue, index) => ({
    label:
      index % labelInterval === 0 || index === Object.keys(dateIndex).length - 1
        ? formatChartLabel(dateKeyValue)
        : "",
    value: dateIndex[dateKeyValue],
  }));
}

function calculateTrend(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: number; // percent, positive = up
  trendLabel: string;
  subLabel: string;
}

function KpiCard({ title, value, icon, trend, trendLabel, subLabel }: KpiCardProps) {
  const isUp = trend >= 0;

  return (
    <div className="flex-1 rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 min-w-0">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{title}</span>
        <span
          className={cn(
            "flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full",
            isUp ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600",
            // In dark, those shades need to be brighter:
            isUp ? "dark:text-emerald-400" : "dark:text-red-400",
          )}
        >
          {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {isUp ? "+" : ""}
          {trend}%
        </span>
      </div>

      {/* Value */}
      <div className="flex items-center gap-2.5">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-foreground text-2xl font-bold tracking-tight">{value}</span>
      </div>

      {/* Sub-label */}
      <div className="flex items-center gap-2 border-t border-border pt-3">
        <Clock size={12} className="text-muted-foreground shrink-0" />
        <div>
          <p className="text-[11px] text-muted-foreground leading-none">{trendLabel}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{subLabel}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Custom tooltip ──────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const value = payload?.[0]?.value;
  if (value == null) return null;

  return (
    <div className="px-3 py-2 rounded-xl border border-border bg-popover/90 backdrop-blur-md text-xs text-popover-foreground shadow-lg">
      {label && <p className="text-muted-foreground mb-1">{label}</p>}
      <p className="font-semibold">{value} tickets</p>
    </div>
  );
}

// ─── Main view ───────────────────────────────────────────────────────────────
export function MetricasView() {
  const [range, setRange] = useState<RangeKey>(90);
  const [dataTab, setDataTab] = useState<DataTab>("Tickets");
  const [totalTickets, setTotalTickets] = useState(0);
  const [pendingTickets, setPendingTickets] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [ticketRows, setTicketRows] = useState<TicketRow[]>([]);
  const [userRows, setUserRows] = useState<UserRow[]>([]);
  const [ticketTrend, setTicketTrend] = useState(0);
  const [pendingTrend, setPendingTrend] = useState(0);
  const [usersTrend, setUsersTrend] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useUser();

  useEffect(() => {
    async function loadMetrics() {
      const supabase = createClient();
      setIsLoading(true);

      const now = new Date();
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89);
      ninetyDaysAgo.setHours(0, 0, 0, 0);

      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalTicketsResponse,
        pendingTicketsResponse,
        totalUsersResponse,
        recentTicketsResponse,
        recentUsersResponse,
      ] = await Promise.all([
        supabase.from("tickets").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase
          .from("tickets")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true)
          .eq("status", "Pendiente"),
        supabase.from("users").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase
          .from("tickets")
          .select("id,status,arrival_time")
          .eq("is_active", true)
          .gte("arrival_time", ninetyDaysAgo.toISOString())
          .order("arrival_time", { ascending: true }),
        supabase
          .from("users")
          .select("id,created_at")
          .eq("is_active", true)
          .gte("created_at", ninetyDaysAgo.toISOString())
          .order("created_at", { ascending: true }),
      ]);

      setTotalTickets(totalTicketsResponse.count ?? 0);
      setPendingTickets(pendingTicketsResponse.count ?? 0);
      setTotalUsers(totalUsersResponse.count ?? 0);

      const recentTickets = (recentTicketsResponse.data ?? []) as TicketRow[];
      const recentUsers = (recentUsersResponse.data ?? []) as UserRow[];
      setTicketRows(recentTickets);
      setUserRows(recentUsers);

      const currentTicketsMonth = recentTickets.filter((row) => {
        const date = row.arrival_time ? new Date(row.arrival_time) : null;
        return date ? date >= currentMonthStart && date < nextMonthStart : false;
      }).length;
      const previousTicketsMonth = recentTickets.filter((row) => {
        const date = row.arrival_time ? new Date(row.arrival_time) : null;
        return date ? date >= previousMonthStart && date < previousMonthEnd : false;
      }).length;
      const currentPendingMonth = recentTickets.filter((row) => {
        const date = row.arrival_time ? new Date(row.arrival_time) : null;
        return row.status === "Pendiente" && date ? date >= currentMonthStart && date < nextMonthStart : false;
      }).length;
      const previousPendingMonth = recentTickets.filter((row) => {
        const date = row.arrival_time ? new Date(row.arrival_time) : null;
        return row.status === "Pendiente" && date ? date >= previousMonthStart && date < previousMonthEnd : false;
      }).length;
      const currentUsersMonth = recentUsers.filter((row) => {
        const date = row.created_at ? new Date(row.created_at) : null;
        return date ? date >= currentMonthStart && date < nextMonthStart : false;
      }).length;
      const previousUsersMonth = recentUsers.filter((row) => {
        const date = row.created_at ? new Date(row.created_at) : null;
        return date ? date >= previousMonthStart && date < previousMonthEnd : false;
      }).length;

      setTicketTrend(calculateTrend(currentTicketsMonth, previousTicketsMonth));
      setPendingTrend(calculateTrend(currentPendingMonth, previousPendingMonth));
      setUsersTrend(calculateTrend(currentUsersMonth, previousUsersMonth));
      setIsLoading(false);
    }

    loadMetrics().catch(() => setIsLoading(false));
  }, []);

  if (user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <h2 className="text-xl font-semibold text-foreground">Acceso denegado</h2>
          <p className="text-muted-foreground">
            No tienes permisos suficientes para ver las métricas.
          </p>
        </div>
      </div>
    );
  }

  // Theme-aware chart colors (fix: chart was white-on-white in light mode)
  const { resolvedTheme } = useTheme();
  const isDark = (resolvedTheme ?? "dark") === "dark";

  const strokeColor = isDark ? "#ffffff" : "#111827";
  const tickColor = isDark ? "#a1a1aa" : "#4b5563";
  const cursorColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";
  const gridStroke = isDark ? "#18181b" : "#e5e7eb";

  const ticketChartData = useMemo(
    () => buildTimeSeriesData(ticketRows.filter((row) => row.status === "Pendiente"), "arrival_time", range),
    [ticketRows, range],
  );

  const userChartData = useMemo(
    () => buildTimeSeriesData(userRows, "created_at", range),
    [userRows, range],
  );

  const chartData = dataTab === "Tickets" ? ticketChartData : userChartData;
  const chartTitle = dataTab === "Tickets" ? "Total de Tickets Pendientes" : "Registro de usuarios";
  const chartSubtitle = dataTab === "Tickets" ? "Tendencia de tickets pendientes en el tiempo" : "Nuevos usuarios registrados";

  const RANGE_LABELS: Record<RangeKey, string> = {
    90: "Últimos 90 días",
    30: "Últimos 30 días",
    7: "Últimos 7 días",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center px-8 py-4 border-b border-border">
        <h1 className="text-foreground text-xl font-semibold">Métricas</h1>
      </div>

      {/* Content */}
      <div className="flex-1 px-8 py-6 flex flex-col gap-5 overflow-auto">
        {/* ── KPI cards row ── */}
        <div className="flex gap-4 flex-wrap">
          <KpiCard
            title="Total de Tickets"
            value={isLoading ? "Cargando..." : `${totalTickets} Tickets`}
            icon={<Ticket size={22} />}
            trend={ticketTrend}
            trendLabel="Comparado con el mes anterior"
            subLabel={isLoading ? "" : `${Math.abs(ticketTrend)}% ${ticketTrend >= 0 ? "más" : "menos"} tickets nuevos`}
          />
          <KpiCard
            title="Tickets pendientes"
            value={isLoading ? "Cargando..." : `${pendingTickets} Tickets`}
            icon={<Ticket size={22} />}
            trend={pendingTrend}
            trendLabel="Comparado con el mes anterior"
            subLabel={isLoading ? "" : `${Math.abs(pendingTrend)}% ${pendingTrend >= 0 ? "más" : "menos"} pendientes`}
          />
          <KpiCard
            title="Total de Usuarios"
            value={isLoading ? "Cargando..." : `${totalUsers} Usuarios`}
            icon={<Users size={22} />}
            trend={usersTrend}
            trendLabel="Comparado con el mes anterior"
            subLabel={isLoading ? "" : `${Math.abs(usersTrend)}% ${usersTrend >= 0 ? "más" : "menos"} registros`}
          />
        </div>

        {/* ── Chart card ── */}
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-4">
          {/* Chart header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-foreground font-semibold text-base">
                Total de Tickets Pendientes
              </h2>
              <p className="text-muted-foreground text-xs mt-0.5">
                Total de los últimos{" "}
                {range === 90 ? "3 meses" : range === 30 ? "30 días" : "7 días"}
              </p>
            </div>

            {/* Range toggle */}
            <div className="flex items-center gap-1 bg-muted border border-border rounded-xl p-0.5">
              {([90, 30, 7] as RangeKey[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                    range === r
                      ? "bg-background text-foreground border border-border"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {RANGE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {/* AreaChart */}
          <div className="h-[280px] w-full -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="ticketGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={strokeColor}
                      stopOpacity={isDark ? 0.18 : 0.12}
                    />
                    <stop
                      offset="55%"
                      stopColor={strokeColor}
                      stopOpacity={isDark ? 0.07 : 0.06}
                    />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>

                <XAxis
                  dataKey="label"
                  tick={{ fill: tickColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis hide />

                <Tooltip content={<ChartTooltip />} cursor={{ stroke: cursorColor, strokeWidth: 1 }} />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={strokeColor}
                  strokeWidth={1.5}
                  fill="url(#ticketGradient)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: strokeColor,
                    stroke: gridStroke,
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Bottom data tabs ── */}
        <div className="flex gap-1 bg-muted border border-border rounded-lg p-0.5 self-start">
          {(["Tickets", "Usuarios"] as DataTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setDataTab(t)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                dataTab === t
                  ? "bg-background text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}