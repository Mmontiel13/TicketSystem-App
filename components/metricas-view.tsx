"use client";

import { useState, useEffect, useMemo } from "react";
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
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/user-context";
import { ResponsiveIcon } from "@/components/responsive-icon";
import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Fetch data from database ────────────────────────────────────────────────────
function applyAreaFilter(query: any, isAdmin: boolean, teamId?: number) {
  return isAdmin || teamId == null ? query : query.eq("team_id", teamId);
}

async function fetchTicketsMetrics(supabase: SupabaseClient, isAdmin: boolean, teamId?: number) {
  try {
    const query = applyAreaFilter(
      supabase.from("tickets").select("id, status"),
      isAdmin,
      teamId
    );

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching tickets:", error.message);
      return { total: 0, pending: 0 };
    }

    const total = data?.length || 0;
    const pending = data?.filter((t: { id: number; status: string }) => t.status === "Pendiente").length || 0;

    return { total, pending };
  } catch (err) {
    console.error("Exception fetching tickets:", err);
    return { total: 0, pending: 0 };
  }
}

async function fetchUsersMetrics(supabase: SupabaseClient, isAdmin: boolean, teamId?: number) {
  try {
    const query = applyAreaFilter(
      supabase.from("users").select("id, is_active"),
      isAdmin,
      teamId
    );

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching users:", error.message);
      return 0;
    }

    const count = data?.filter((u: { id: number; is_active: boolean }) => u.is_active === true).length || 0;
    return count;
  } catch (err) {
    console.error("Exception fetching users:", err);
    return 0;
  }
}

// ─── Generate chart data from database ───────────────────────────────────────
async function generateChartDataFromDB(
  supabase: SupabaseClient,
  isAdmin: boolean,
  teamId: number | undefined,
  days: number,
  dataTab: "Tickets" | "Usuarios"
) {
  const data: { label: string; value: number }[] = [];
  const now = new Date();

  const dateArray = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    dateArray.push(d);
  }

  try {
    if (dataTab === "Tickets") {
      const { data: tickets, error } = await applyAreaFilter(
        supabase.from("tickets").select("id, status, arrival_time"),
        isAdmin,
        teamId
      );

      if (error) {
        console.error("Error fetching tickets for chart:", error.message);
        return dateArray.map((date, index) => ({
          label: index % (days === 7 ? 1 : days === 30 ? 7 : 14) === 0 || index === days - 1
            ? `${date.toLocaleDateString("es-MX")}`
            : "",
          value: 0,
        }));
      }

      dateArray.forEach((date, index) => {
        const count = tickets?.filter((t: { id: number; status: string; arrival_time?: string }) => {
          if (!t.arrival_time) return false;
          const ticketDate = new Date(t.arrival_time);
          ticketDate.setHours(0, 0, 0, 0);
          return t.status === "Pendiente" && ticketDate <= date;
        }).length || 0;

        const day = date.getDate();
        const month = date.toLocaleString("es-MX", { month: "short" });
        const labelInterval = days === 7 ? 1 : days === 30 ? 7 : 14;
        const showLabel = index % labelInterval === 0 || index === days - 1;

        data.push({
          label: showLabel ? `${month} ${day}` : "",
          value: count,
        });
      });
    } else {
      const { data: users, error } = await applyAreaFilter(
        supabase.from("users").select("id, is_active, created_at"),
        isAdmin,
        teamId
      );

      if (error) {
        console.error("Error fetching users for chart:", error.message);
        return dateArray.map((date, index) => ({
          label: index % (days === 7 ? 1 : days === 30 ? 7 : 14) === 0 || index === days - 1
            ? `${date.toLocaleDateString("es-MX")}`
            : "",
          value: 0,
        }));
      }

      dateArray.forEach((date, index) => {
        const count = users?.filter((u: { id: number; is_active: boolean; created_at?: string }) => {
          if (!u.created_at) return false;
          const userDate = new Date(u.created_at);
          userDate.setHours(0, 0, 0, 0);
          return u.is_active && userDate <= date;
        }).length || 0;

        const day = date.getDate();
        const month = date.toLocaleString("es-MX", { month: "short" });
        const labelInterval = days === 7 ? 1 : days === 30 ? 7 : 14;
        const showLabel = index % labelInterval === 0 || index === days - 1;

        data.push({
          label: showLabel ? `${month} ${day}` : "",
          value: count,
        });
      });
    }
  } catch (err) {
    console.error("Exception in generateChartDataFromDB:", err);
  }

  return data;
}

type RangeKey = 90 | 30 | 7;
type DataTab = "Tickets" | "Usuarios";

// ─── KPI Card ──────────────────────────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: number;
  trendLabel: string;
  subLabel: string;
}

function KpiCard({ title, value, icon, trend, trendLabel, subLabel }: KpiCardProps) {
  const isUp = trend >= 0;

  return (
    <div className="flex-1 min-w-0 rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-5 flex flex-col gap-2 sm:gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] sm:text-xs text-foreground font-medium truncate">{title}</span>
        <span
          className={cn(
            "flex items-center gap-1 text-[9px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0",
            isUp ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600",
            isUp ? "dark:text-emerald-400" : "dark:text-red-400",
          )}
        >
          <ResponsiveIcon icon={isUp ? TrendingUp : TrendingDown} smSize={9} mdSize={11} />
          {isUp ? "+" : ""}
          {trend}%
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm sm:text-base shrink-0">{icon}</span>
        <span className="text-foreground text-lg sm:text-2xl font-bold tracking-tight truncate">{value}</span>
      </div>

      <div className="flex items-center gap-2 border-t border-border pt-2 sm:pt-3">
        <ResponsiveIcon icon={Clock} smSize={10} mdSize={12} className="text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="text-[9px] sm:text-[11px] text-foreground/70 leading-tight truncate">{trendLabel}</p>
          <p className="text-[9px] sm:text-[11px] text-foreground/70 mt-0.5 truncate">{subLabel}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────
interface ChartTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  dataTab: DataTab;
}

function ChartTooltip({ active, payload, label, dataTab }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const value = payload?.[0]?.value;
  if (value == null) return null;

  const unit = dataTab === "Tickets" ? "tickets" : "usuarios";

  return (
    <div className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-border bg-popover/90 backdrop-blur-md text-[10px] sm:text-xs text-popover-foreground shadow-lg">
      {label && <p className="text-foreground/70 mb-0.5 sm:mb-1">{label}</p>}
      <p className="font-semibold text-foreground">{value} {unit}</p>
    </div>
  );
}

// ─── Main view ─────────────────────────────────────────────────────────
export function MetricasView() {
  const supabase = useMemo(() => createClient(), []);
  const { user } = useUser();
  const { resolvedTheme } = useTheme();

  const [range, setRange] = useState<RangeKey>(90);
  const [dataTab, setDataTab] = useState<DataTab>("Tickets");
  const [totalTickets, setTotalTickets] = useState(0);
  const [pendingTickets, setPendingTickets] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("team_id")
          .eq("email", user.email)
          .single();

        if (userError) {
          console.error("Error fetching user team:", userError.message);
          setError("No se pudo cargar el equipo del usuario");
          return;
        }

        if (!userData) {
          setError("Usuario no encontrado");
          return;
        }

        const isAdmin = user.role === "admin";
        const currentTeamId = isAdmin ? undefined : Number(userData.team_id);

        const ticketsMetrics = await fetchTicketsMetrics(supabase, isAdmin, currentTeamId);
        setTotalTickets(ticketsMetrics.total);
        setPendingTickets(ticketsMetrics.pending);

        const usersCount = await fetchUsersMetrics(supabase, isAdmin, currentTeamId);
        setTotalUsers(usersCount);

        const chartDataResult = await generateChartDataFromDB(
          supabase,
          isAdmin,
          currentTeamId,
          range,
          dataTab
        );
        setChartData(chartDataResult);
      } catch (err) {
        console.error("Error loading metrics:", err);
        setError("Error al cargar las métricas. Revisa la consola.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      loadData();
    }
  }, [user?.email, range, dataTab]);

  if (user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen px-4">
        <div className="rounded-lg border border-border bg-card p-6 sm:p-8 text-center max-w-md">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Acceso denegado</h2>
          <p className="text-foreground/70 text-sm mt-2">
            No tienes permisos suficientes para ver las métricas.
          </p>
        </div>
      </div>
    );
  }

  const isDark = (resolvedTheme ?? "dark") === "dark";
  const strokeColor = isDark ? "#ffffff" : "#111827";
  const tickColor = isDark ? "#a1a1aa" : "#4b5563";
  const cursorColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";
  const gridStroke = isDark ? "#18181b" : "#e5e7eb";

  const RANGE_LABELS: Record<RangeKey, string> = {
    90: "90 días",
    30: "30 días",
    7: "7 días",
  };

  const RANGE_LABELS_FULL: Record<RangeKey, string> = {
    90: "Últimos 90 días",
    30: "Últimos 30 días",
    7: "Últimos 7 días",
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header - h-16 matches sidebar logo height */}
      <div className="h-16 flex items-center justify-center sm:justify-start px-3 sm:px-4 md:px-8 border-b border-border/50 shrink-0">
        <h1 className="text-foreground text-base sm:text-lg md:text-xl font-semibold text-center sm:text-left">Métricas</h1>
      </div>

      {/* Content */}
      <div className="flex-1 px-3 sm:px-4 md:px-8 py-4 sm:py-6 flex flex-col gap-3 sm:gap-5 overflow-auto">
        {/* Error message */}
        {error && (
          <div className="p-3 sm:p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-xs sm:text-sm">
            {error}
          </div>
        )}

        {/* KPI cards row - responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          <KpiCard
            title="Total de Tickets"
            value={`${totalTickets}`}
            icon={<Ticket size={22} />}
            trend={3.2}
            trendLabel="Dentro del promedio"
            subLabel="5 más que el mes pasado"
          />
          <KpiCard
            title="Tickets pendientes"
            value={`${pendingTickets}`}
            icon={<Ticket size={22} />}
            trend={-5}
            trendLabel="Mas bajo del mes"
            subLabel="10 menos que el mes pasado"
          />
          <KpiCard
            title="Total de Usuarios"
            value={`${totalUsers}`}
            icon={<Users size={22} />}
            trend={15}
            trendLabel="Mas alto del mes"
            subLabel="20 usuarios nuevos"
          />
        </div>

        {/* Chart card */}
        <div className="rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-6 flex flex-col gap-3 sm:gap-4 min-h-87.5 sm:min-h-112.5">
          {/* Header section - responsive */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-foreground font-semibold text-sm sm:text-base wrap-break-word">
                {dataTab === "Tickets" 
                  ? "Total de Tickets Pendientes" 
                  : "Total de Usuarios Registrados"}
              </h2>
              <p className="text-foreground/70 text-xs sm:text-sm mt-1">
                Total de los últimos{" "}
                {range === 90 ? "3 meses" : range === 30 ? "30 días" : "7 días"}
              </p>
            </div>

            {/* Range buttons - responsive */}
            <div className="flex items-center gap-0.5 bg-muted border border-border rounded-lg sm:rounded-xl p-0.5 shrink-0 w-full sm:w-auto">
              {([90, 30, 7] as RangeKey[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    "px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap flex-1 sm:flex-auto",
                    range === r
                      ? "bg-background text-foreground border border-border"
                      : "text-foreground/70 hover:text-foreground",
                  )}
                  title={RANGE_LABELS_FULL[r]}
                >
                  {RANGE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Chart container - CORREGIDO */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-foreground/70 text-sm">Cargando gráfico...</span>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-foreground/70 text-sm">Sin datos disponibles</span>
            </div>
          ) : (
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
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
                    tick={{ fill: tickColor, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: tickColor, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip 
                    content={<ChartTooltip dataTab={dataTab} />} 
                    cursor={{ stroke: cursorColor, strokeWidth: 1 }} 
                  />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={strokeColor}
                    strokeWidth={2}
                    fill="url(#ticketGradient)"
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: strokeColor,
                      stroke: gridStroke,
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Data tabs - responsive */}
        <div className="flex gap-1 bg-muted border border-border rounded-lg p-0.5 w-full sm:w-auto">
          {(["Tickets", "Usuarios"] as DataTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setDataTab(t)}
              className={cn(
                "px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex-1 sm:flex-auto",
                dataTab === t
                  ? "bg-background text-foreground border border-border"
                  : "text-foreground/70 hover:text-foreground",
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